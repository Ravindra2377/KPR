import express from "express";
import Room from "../models/Room";
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

export default router;
