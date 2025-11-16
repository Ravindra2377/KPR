import express from "express";
import Notification from "../models/Notification";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const notifs = await Notification.find({ user: req.userId }).sort({ read: 1, createdAt: -1 }).limit(200);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.patch("/:id/markRead", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.patch("/markAllRead", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
