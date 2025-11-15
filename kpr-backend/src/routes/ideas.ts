import express, { Request, Response } from "express";
import Idea from "../models/Idea";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Create idea
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, tags } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const idea = new Idea({ title, description, tags, author: req.userId });
    await idea.save();
    res.json(idea);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Get all ideas (paginated)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const ideas = await Idea.find().populate("author", "name email").sort({ createdAt: -1 }).limit(50);
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Get idea by id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const idea = await Idea.findById(req.params.id).populate("author", "name email");
    if (!idea) return res.status(404).json({ message: "Idea not found" });
    res.json(idea);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Appreciate idea (simple)
router.post("/:id/appreciate", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: "Idea not found" });
    idea.appreciationCount = (idea.appreciationCount || 0) + 1;
    await idea.save();
    res.json({ appreciationCount: idea.appreciationCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
