import express from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Huddle, { IHuddle } from "../models/Huddle";
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

    res.json({ huddleId: huddle._id, roomId, roomName, url });
  } catch (err) {
    console.error("create huddle error", err);
    res.status(500).json({ message: "Unable to start huddle" });
  }
});

router.post("/:id/end", requireAuth, async (req: AuthRequest, res) => {
  try {
  const huddle = (await Huddle.findById(req.params.id)) as IHuddle | null;
    if (!huddle) return res.status(404).json({ message: "Huddle not found" });
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const participantIds = (huddle.participants || [])
      .map((p) => p?.toString?.())
      .filter(Boolean) as string[];
    if (!participantIds.includes(req.userId)) {
      return res.status(403).json({ message: "Not part of this huddle" });
    }

    if (huddle.endedAt) {
      return res.json({ ok: true });
    }

    huddle.endedAt = new Date();
    await huddle.save();

    const payload = {
      huddleId: String(huddle._id),
      roomId: huddle.roomId,
      roomName: huddle.roomName,
      endedBy: req.userId
    };

    await Promise.all(
      participantIds.map(async (participantId) => {
        emitEventToUser(participantId, "huddleEnded", payload);
      })
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("end huddle error", err);
    res.status(500).json({ message: "Unable to end huddle" });
  }
});

export default router;
