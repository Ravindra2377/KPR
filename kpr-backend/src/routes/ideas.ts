import express from "express";
import Idea from "../models/Idea";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    const idea = await Idea.create({
      title,
      description,
      author: req.userId
    });
    res.json(idea);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.get("/", async (_req, res) => {
  const ideas = await Idea.find().sort({ createdAt: -1 }).limit(100).populate("author", "name");
  res.json(ideas);
});

router.get("/:id", async (req, res) => {
  const idea = await Idea.findById(req.params.id).populate("author", "name");
  if (!idea) return res.status(404).json({ message: "Not found" });
  res.json(idea);
});

router.post("/:id/appreciate", requireAuth, async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).json({ message: "Not found" });

  idea.appreciationCount++;
  await idea.save();

  res.json({ appreciationCount: idea.appreciationCount });
});

export default router;
