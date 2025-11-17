import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "profile");
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const authReq = req as AuthRequest;
    const name = `u-${authReq.userId || "anon"}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 } });

router.post("/banner", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const publicPath = `/uploads/profile/${req.file.filename}`;
    await User.findByIdAndUpdate(req.userId, { banner: publicPath });

    res.json({ bannerUrl: publicPath });
  } catch (err) {
    console.error("upload banner err", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/portfolio", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();
    const link = (req.body.link || "").trim();

    const mediaUrl = `/uploads/profile/${req.file.filename}`;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.portfolio = user.portfolio || [];
    user.portfolio.push({ mediaUrl, title, description, link, createdAt: new Date() } as any);
    await user.save();
    const savedItem = user.portfolio[user.portfolio.length - 1];
    res.json({
      id: savedItem._id,
      url: savedItem.mediaUrl,
      title: savedItem.title,
      description: savedItem.description,
      link: savedItem.link,
      createdAt: savedItem.createdAt
    });
  } catch (err) {
    console.error("upload portfolio err", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/portfolio/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const key = req.params.id;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.portfolio = user.portfolio || [];

    const pos = user.portfolio.findIndex((p: any) => String(p._id) === String(key));
    let removed = null;
    if (pos >= 0) removed = user.portfolio.splice(pos, 1)[0];

    if (!removed) return res.status(404).json({ message: "Portfolio item not found" });

    await user.save();
    const filePath = path.join(process.cwd(), removed.mediaUrl.replace(/^\//, ""));
    fs.remove(filePath).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error("delete portfolio err", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
