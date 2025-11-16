import express from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Huddle from "../models/Huddle";
import Notification from "../models/Notification";
import User from "../models/User";
import { emitEventToUser, emitNotificationToUser } from "../utils/notifications-emitter";

const router = express.Router();

router.post("/create", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { roomId, participants = [], type = "dm" } = req.body || {};
    if (!roomId) return res.status(400).json({ message: "roomId required" });
    if (!participants.length) return res.status(400).json({ message: "participants required" });

  const allParticipants = Array.from(new Set([req.userId, ...participants.map((id: string) => String(id))])).filter(Boolean) as string[];
    const roomName = `kpr-${type}-${roomId}-${Date.now()}`;

    const huddle = await Huddle.create({
      creator: req.userId,
      roomId,
      roomName,
      participants: allParticipants.map((id) => new mongoose.Types.ObjectId(String(id)))
    });

    const actor = await User.findById(req.userId).select("name");
    const url = `https://meet.jit.si/${roomName}`;
    const notificationPayload = {
      type: "huddle_invite",
      message: `${actor?.name || "Someone"} started a huddle`,
      meta: { huddleId: huddle._id, roomId, roomName, url }
    };

    await Promise.all(
      allParticipants.map(async (participantId) => {
        if (String(participantId) === req.userId) return;
        const notification = await Notification.create({
          user: participantId,
          ...notificationPayload
        });
        emitNotificationToUser(String(participantId), notification);
        emitEventToUser(String(participantId), "huddleStarted", notification.meta);
      })
    );

    res.json({ huddleId: huddle._id, roomName, url });
  } catch (err) {
    console.error("create huddle error", err);
    res.status(500).json({ message: "Unable to start huddle" });
  }
});

export default router;
