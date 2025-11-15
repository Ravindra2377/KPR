import express from "express";
import Idea from "../models/Idea";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";

const router = express.Router();

/**
 * Create Idea
 * Body: { title: string, description?: string, tags?: string[] }
 */
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ message: "Title is required (min 3 chars)" });
    }

    const idea = await Idea.create({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      author: req.userId
    });

    // populate author for immediate client use
    const populated = await idea.populate("author", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create idea error:", err);
    res.status(500).json({ message: "Server error", err });
  }
});

// List Ideas (existing)
router.get("/", async (_, res) => {
  const ideas = await Idea.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("author", "name");
  res.json(ideas);
});

// Get Idea by ID (existing)
router.get("/:id", async (req, res) => {
  const idea = await Idea.findById(req.params.id).populate("author", "name");
  if (!idea) return res.status(404).json({ message: "Not found" });
  res.json(idea);
});

// Appreciate idea (existing)
router.post("/:id/appreciate", requireAuth, async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).json({ message: "Not found" });

  idea.appreciationCount++;
  await idea.save();

  res.json({ appreciationCount: idea.appreciationCount });
});

export default router;
