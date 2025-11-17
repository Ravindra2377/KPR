import express from "express";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { s3, buildPublicUrl, createPresignedPutUrl } from "../utils/s3-client";

const router = express.Router();
const MAX_PORTFOLIO = 12;
const SIGN_TTL = Number(process.env.S3_SIGN_URL_TTL || 900);

const deleteKey = async (key?: string) => {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
  } catch (err) {
    console.warn("s3 delete failed", err);
  }
};

const ensureUser = async (req: AuthRequest) => {
  const user = await User.findById(req.userId);
  if (!user) throw new Error("User not found");
  return user;
};

const sanitizeString = (value?: string) => (value || "").trim();

router.post("/banner/presign", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) return res.status(400).json({ message: "fileName and contentType are required" });
    const ext = fileName.split(".").pop() || "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const keyParts = [String(req.userId), "banner", safeName];
    const presign = await createPresignedPutUrl(keyParts, contentType, SIGN_TTL);
    return res.json(presign);
  } catch (err) {
    console.error("banner presign", err);
    return res.status(500).json({ message: "Could not create presign URL" });
  }
});

router.post("/banner/complete", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key, meta, altText } = req.body;
    if (!key) return res.status(400).json({ message: "key is required" });
    const user = await ensureUser(req);
    await deleteKey(user.banner?.key);

    user.banner = {
      key,
      url: buildPublicUrl(key),
      altText: sanitizeString(altText),
      meta: meta ? { width: meta.width, height: meta.height } : undefined,
      uploadedAt: new Date()
    } as any;
    await user.save();
    return res.json({ banner: user.banner });
  } catch (err) {
    console.error("banner complete", err);
    return res.status(500).json({ message: "Could not finalize banner" });
  }
});

router.post("/portfolio/presign", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) return res.status(400).json({ message: "fileName and contentType are required" });
    const ext = fileName.split(".").pop() || "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const keyParts = [String(req.userId), "portfolio", safeName];
    const presign = await createPresignedPutUrl(keyParts, contentType, SIGN_TTL);
    return res.json(presign);
  } catch (err) {
    console.error("portfolio presign", err);
    return res.status(500).json({ message: "Could not create presign URL" });
  }
});

router.post("/portfolio/complete", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key, meta } = req.body;
    if (!key) return res.status(400).json({ message: "key is required" });
    const user = await ensureUser(req);
    user.portfolio = user.portfolio || [];
    if (user.portfolio.length >= MAX_PORTFOLIO) return res.status(400).json({ message: "Maximum 12 portfolio items allowed" });

    const entry = {
      key,
      url: buildPublicUrl(key),
      type: meta?.type === "video" ? "video" : "image",
      title: sanitizeString(meta?.title),
      description: sanitizeString(meta?.description),
      link: sanitizeString(meta?.link),
      createdAt: new Date(),
      meta: meta ? { width: meta.width, height: meta.height } : undefined
    };

  user.portfolio.push(entry as any);
  user.portfolioOrder = user.portfolio.map((item) => item._id);
    await user.save();
    return res.json({ item: user.portfolio[user.portfolio.length - 1], portfolio: user.portfolio });
  } catch (err) {
    console.error("portfolio complete", err);
    return res.status(500).json({ message: "Could not add portfolio item" });
  }
});

router.post("/portfolio/reorder", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ message: "Order array required" });
    const user = await ensureUser(req);
    const validIds = user.portfolio?.map((item) => String(item._id)) || [];
    if (order.length !== validIds.length || order.some((id: string) => !validIds.includes(String(id)))) {
      return res.status(400).json({ message: "Invalid order" });
    }
    user.portfolioOrder = order.map((id: string) => new mongoose.Types.ObjectId(id));
    await user.save();
    return res.json({ ok: true, portfolioOrder: user.portfolioOrder });
  } catch (err) {
    console.error("portfolio reorder", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/portfolio/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { itemId } = req.params;
    const user = await ensureUser(req);
    user.portfolio = user.portfolio || [];
    const idx = user.portfolio.findIndex((p) => String(p._id) === String(itemId));
    if (idx === -1) return res.status(404).json({ message: "Portfolio item not found" });

    const [removed] = user.portfolio.splice(idx, 1);
    user.portfolioOrder = (user.portfolioOrder || []).filter((id) => String(id) !== String(itemId));
    await deleteKey(removed?.key);
    await user.save();
    return res.json({ ok: true, portfolio: user.portfolio });
  } catch (err) {
    console.error("delete portfolio", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
