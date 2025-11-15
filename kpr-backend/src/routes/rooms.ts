import express, { Request, Response } from "express";
import Room from "../models/Room";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Create room
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const room = new Room({ name, description, type, members: [req.userId] });
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// List rooms
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rooms = await Room.find().limit(100);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
