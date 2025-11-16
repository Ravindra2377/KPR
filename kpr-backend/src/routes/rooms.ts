import express from "express";
import mongoose from "mongoose";
import Room, { IRoom } from "../models/Room";
import RoomMessage from "../models/RoomMessage";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { isUserOnline } from "../utils/notifications-emitter";

const router = express.Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { name, description, type } = req.body;
  const room = await Room.create({
    name,
    description,
    type,
    members: [req.userId]
  });

  res.json(room);
});

router.get("/", async (_req, res) => {
  const rooms = await Room.find().limit(100);
  res.json(rooms);
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const messages = await RoomMessage.find({ room: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    console.error("Fetch room messages error", err);
    res.status(500).json({ message: "Unable to fetch messages" });
  }
});

router.post("/dm", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    let room = await Room.findOne({ isDM: true, members: { $all: [req.userId, userId] } });
    if (!room) {
      room = await Room.create({
        name: `DM:${req.userId}-${userId}`,
        description: "Direct message",
        type: "dm",
        isDM: true,
        members: [req.userId, userId]
      });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Unable to create DM", err });
  }
});

type RoomWithTimestamps = IRoom & { createdAt?: Date; updatedAt?: Date };

router.get("/dm/list", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const currentUserObjectId = new mongoose.Types.ObjectId(String(req.userId));

    const rooms = (await Room.find({ isDM: true, members: req.userId }).sort({ updatedAt: -1 }).lean()) as unknown as RoomWithTimestamps[];
    if (!rooms.length) return res.json([]);

    const roomObjectIds = rooms.map((room) => new mongoose.Types.ObjectId(String(room._id)));

    const lastMessages = await RoomMessage.aggregate([
      { $match: { room: { $in: roomObjectIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$room",
          message: { $first: "$$ROOT" }
        }
      }
    ]);

    const lastMessageMap = new Map(
      lastMessages.map((entry) => [
        entry._id.toString(),
        {
          _id: entry.message?._id,
          content: entry.message?.content,
          author: entry.message?.author,
          authorName: entry.message?.authorName,
          createdAt: entry.message?.createdAt
        }
      ])
    );

    const unreadCounts = await RoomMessage.aggregate([
      { $match: { room: { $in: roomObjectIds }, readBy: { $ne: currentUserObjectId }, author: { $ne: currentUserObjectId } } },
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(unreadCounts.map((entry) => [entry._id.toString(), entry.count]));

    const otherUserIds = Array.from(
      new Set(
        rooms
          .map((room) =>
            (room.members || [])
              .map((member) => member?.toString?.() || String(member))
              .find((memberId) => memberId !== req.userId)
          )
          .filter(Boolean) as string[]
      )
    );

    const users = otherUserIds.length
      ? await User.find({ _id: { $in: otherUserIds } }).select("_id name avatar skills bio").lean()
      : [];
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const payload = rooms.map((room) => {
      const otherId = (room.members || [])
        .map((member) => member?.toString?.() || String(member))
        .find((memberId) => memberId !== req.userId);
      const roomKey = String(room._id);
      const lastMessage = lastMessageMap.get(roomKey) || null;
      const lastAt = lastMessage?.createdAt || room.updatedAt || room.createdAt;
      const memberIds = (room.members || []).map((member) => member?.toString?.() || String(member));
      return {
        roomId: roomKey,
        room: {
          _id: roomKey,
          name: room.name,
          description: room.description,
          type: room.type,
          isDM: room.isDM,
          members: memberIds
        },
        other: otherId ? userMap.get(otherId) || null : null,
        online: otherId ? isUserOnline(otherId) : false,
        lastMessage,
        lastAt,
        unreadCount: unreadMap.get(roomKey) || 0
      };
    });

    payload.sort((a, b) => {
      const aTime = a.lastAt ? new Date(a.lastAt).getTime() : 0;
      const bTime = b.lastAt ? new Date(b.lastAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json(payload);
  } catch (err) {
    console.error("dm list error", err);
    res.status(500).json({ message: "Unable to load DM inbox" });
  }
});

export default router;
