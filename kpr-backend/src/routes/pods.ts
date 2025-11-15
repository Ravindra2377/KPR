import express from "express";
import Pod from "../models/Pod";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

/**
 * Create a new Pod (Collaboration Chamber)
 * Body: { name, description, members?: [userId] }
 */
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, members } = req.body;
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!name || name.trim().length < 3) return res.status(400).json({ message: "Pod name required" });

    const pod = await Pod.create({
      name: name.trim(),
      description,
  owner: userId,
  members: [userId, ...(Array.isArray(members) ? members : [])]
    });

    const populated = await Pod.findById(pod._id).populate("members", "name email").populate("owner", "name email");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create pod error:", err);
    res.status(500).json({ message: "Server error", err });
  }
});

/** List pods the user is a member of */
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const pods = await Pod.find({ members: userId }).populate("members", "name").populate("owner", "name");
    res.json(pods);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Get pod by ID */
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id).populate("members", "name email").populate("owner", "name email");
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  if (!pod.members.map((m: any) => String(m._id || m)).includes(userId)) return res.status(403).json({ message: "Not a member" });
    res.json(pod);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Add member */
router.post("/:id/members", requireAuth, async (req: AuthRequest, res) => {
  try {
  const requesterId = req.userId;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const { userId } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  const isMember = pod.members.some((m: any) => String(m) === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    if (userId && !pod.members.some((m: any) => String(m) === userId)) {
      pod.members.push(userId);
      await pod.save();
    }

    const populated = await pod.populate("members", "name email");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Remove member */
router.delete("/:id/members/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
  const requesterId = req.userId;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  const isMember = pod.members.some((m: any) => String(m) === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    pod.members = pod.members.filter((m: any) => String(m) !== req.params.userId);
    await pod.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Create task */
router.post("/:id/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
  const requesterId = req.userId;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  const isMember = pod.members.some((m: any) => String(m) === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const { title, description, assignee } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title required" });

    const task = { title: title.trim(), description, status: "todo", assignee };
    pod.tasks.push(task as any);
    await pod.save();

    const populated = await Pod.findById(pod._id)
      .populate("tasks.assignee", "name")
      .populate("members", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Update task */
router.patch("/:id/tasks/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
  const requesterId = req.userId;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const { title, description, status, assignee } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  const isMember = pod.members.some((m: any) => String(m) === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const t = (pod.tasks as any).id(req.params.taskId);
    if (!t) return res.status(404).json({ message: "Task not found" });

    if (title !== undefined) t.title = title;
    if (description !== undefined) t.description = description;
    if (status !== undefined) t.status = status;
    if (assignee !== undefined) t.assignee = assignee;

    await pod.save();
    const populated = await Pod.findById(pod._id)
      .populate("tasks.assignee", "name")
      .populate("members", "name");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

/** Delete task */
router.delete("/:id/tasks/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
  const requesterId = req.userId;
  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
  const isMember = pod.members.some((m: any) => String(m) === requesterId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const taskDoc = (pod.tasks as any).id(req.params.taskId);
    taskDoc?.deleteOne();
    await pod.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
