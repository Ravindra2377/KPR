import express from "express";
import Room from "../models/Room";
import RoomMessage from "../models/RoomMessage";
import { requireAuth, AuthRequest } from "../middleware/auth";

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

export default router;
