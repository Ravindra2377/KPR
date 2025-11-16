import express from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import RoomMessage from "../models/RoomMessage";
import Room from "../models/Room";
import { emitEventToUser } from "../utils/notifications-emitter";

const router = express.Router();

router.post("/mark-read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.body || {};
    if (!roomId) return res.status(400).json({ message: "roomId required" });
    const userId = req.userId;
    const roomObjectId = new mongoose.Types.ObjectId(String(roomId));
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    const result = await RoomMessage.updateMany(
      { room: roomObjectId, readBy: { $ne: userObjectId }, author: { $ne: userObjectId } },
      { $addToSet: { readBy: userObjectId } }
    );

    const room = await Room.findById(roomObjectId).select("members");
    room?.members?.forEach((memberId) => {
      const id = memberId?.toString?.();
      if (id) {
        emitEventToUser(id, "dmReadReceipt", { roomId, readerId: userId });
        emitEventToUser(id, "dmListUpdated", { roomId });
      }
    });

    res.json({ ok: true, modified: result.modifiedCount });
  } catch (err) {
    console.error("mark read error", err);
    res.status(500).json({ message: "Unable to mark messages read" });
  }
});

export default router;
