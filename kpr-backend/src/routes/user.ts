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

router.patch("/me/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { about, building, lookingFor, quote, bio, roles, skills, name } = req.body || {};
    const payload: Record<string, any> = {};
    if (typeof about === "string") payload.about = about;
    if (typeof building === "string") payload.building = building;
    if (typeof lookingFor === "string") payload.lookingFor = lookingFor;
    if (typeof quote === "string") payload.quote = quote;
    if (typeof bio === "string") payload.bio = bio;
    if (typeof name === "string") payload.name = name;
    if (Array.isArray(skills)) payload.skills = skills.filter(Boolean);
    if (Array.isArray(roles)) payload.roles = roles.filter(Boolean);

    const updated = await User.findByIdAndUpdate(req.userId, payload, { new: true }).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.patch("/me/social", requireAuth, async (req: AuthRequest, res) => {
  try {
    const fields = ["instagram", "linkedin", "twitter", "github", "website", "youtube", "dribbble", "behance"] as const;
    const payload: Record<string, string> = {};
    const body = (req.body || {}) as Record<string, unknown>;
    fields.forEach((key) => {
      if (body[key] !== undefined) {
        const value = body[key];
        if (typeof value === "string") payload[key] = value;
        else if (value === null) payload[key] = "";
      }
    });

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { social: payload },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});


router.get("/:id/collaborators", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id).populate("collaborators", "name avatar skills bio");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.collaborators || []);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
