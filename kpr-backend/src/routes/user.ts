import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../../uploads/profile");
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req: express.Request, _file: Express.Multer.File, cb) => cb(null, uploadDir),
  filename: (_req: express.Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname) || ".dat";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 12 * 1024 * 1024 } });

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

router.post("/me/banner", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file) {
      if (user.banner && user.banner.startsWith("/uploads/")) {
        const prev = path.resolve(__dirname, "../..", user.banner.slice(1));
        fs.remove(prev).catch(() => {});
      }
      user.banner = `/uploads/profile/${req.file.filename}`;
      await user.save();
      const sanitized = await User.findById(req.userId).select("-password");
      return res.json({ ok: true, banner: user.banner, user: sanitized });
    }

    const { bannerUrl } = (req.body || {}) as { bannerUrl?: string };
    if (typeof bannerUrl === "string") {
      user.banner = bannerUrl;
      await user.save();
      const sanitized = await User.findById(req.userId).select("-password");
      return res.json({ ok: true, banner: user.banner, user: sanitized });
    }

    res.status(400).json({ message: "No banner file or url provided" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.post("/me/portfolio", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const file = req.file;
    if (!file) return res.status(400).json({ message: "File required" });

    const newItem = {
      title: req.body?.title || "",
      description: req.body?.description || "",
      mediaUrl: `/uploads/profile/${file.filename}`,
      mimeType: file.mimetype,
      link: req.body?.link || ""
    };

    user.portfolio = user.portfolio || [];
    user.portfolio.push(newItem as any);
    await user.save();
    const savedItem = user.portfolio[user.portfolio.length - 1];
    res.status(201).json({ ok: true, item: savedItem });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.delete("/me/portfolio/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.portfolio = user.portfolio || [];
    const idx = user.portfolio.findIndex((p: any) => String(p._id) === req.params.itemId);
    if (idx === -1) return res.status(404).json({ message: "Portfolio item not found" });

    const [removed] = user.portfolio.splice(idx, 1);
    await user.save();

    if (removed?.mediaUrl?.startsWith("/uploads/")) {
      const filePath = path.resolve(__dirname, "../..", removed.mediaUrl.slice(1));
      fs.remove(filePath).catch(() => {});
    }

    res.json({ ok: true });
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
