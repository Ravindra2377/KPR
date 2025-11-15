import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";

const router = express.Router();

/**
 * GET /api/users/me
 * Fetch the currently authenticated user's profile
 */
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/**
 * PATCH /api/users/me
 * Update name, bio, skills
 */
router.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, bio, skills } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.userId,
      {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(skills && Array.isArray(skills) ? { skills } : {})
      },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
