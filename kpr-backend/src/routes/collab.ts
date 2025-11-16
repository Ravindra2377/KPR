import express from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import CollabRequest from "../models/CollabRequest";
import Notification from "../models/Notification";
import User from "../models/User";
import Room from "../models/Room";
import Pod from "../models/Pod";
import { emitNotificationToUser } from "../utils/notifications-emitter";
import { canSendRequest, canSendToTarget } from "../utils/rateLimitMem";

const router = express.Router();

router.post("/send", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { to, message } = req.body;
    const fromUser = req.userId;
    if (!fromUser) return res.status(401).json({ message: "Unauthorized" });
    if (!to) return res.status(400).json({ message: "Recipient required" });
    if (to === fromUser) return res.status(400).json({ message: "Cannot send request to yourself" });

    const existingPending = await CollabRequest.findOne({ from: fromUser, to, status: "pending" });
    if (existingPending) {
      return res.status(409).json({ message: "Request already pending" });
    }

    const existingAccepted = await CollabRequest.findOne({ from: fromUser, to, status: "accepted" });
    if (existingAccepted) {
      return res.status(409).json({ message: "You're already collaborators" });
    }

    if (!canSendRequest(fromUser)) {
      return res.status(429).json({ message: "Too many collaboration requests. Try again later." });
    }

    if (!canSendToTarget(fromUser, to)) {
      return res.status(429).json({ message: "You recently reached out to this creator. Please wait a moment." });
    }

    const requestDoc = await CollabRequest.create({ from: fromUser, to, message });

    const actor = await User.findById(fromUser).select("name");
    const notif = await Notification.create({
      user: to,
      type: "collab_request",
      message: `${actor?.name || "Someone"} wants to collaborate with you`,
      meta: { collabRequestId: requestDoc._id, from: fromUser }
    });

    emitNotificationToUser(String(to), notif);

    res.status(201).json(requestDoc);
  } catch (err) {
    console.error("collab send error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/cancel/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const request = await CollabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!req.userId || String(request.from) !== req.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be cancelled" });
    }

    request.status = "cancelled";
    await request.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/incoming", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const list = await CollabRequest.find({ to: req.userId })
      .populate("from", "name avatar skills bio")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/outgoing", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const list = await CollabRequest.find({ from: req.userId })
      .populate("to", "name avatar skills bio")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/accept", requireAuth, async (req: AuthRequest, res) => {
  try {
    const request = await CollabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!req.userId || String(request.to) !== req.userId) return res.status(403).json({ message: "Not allowed" });
    if (request.status !== "pending") return res.status(400).json({ message: "Invalid status" });

    const { createPod, podName } = req.body || {};

    request.status = "accepted";
    await request.save();

    const receiver = await User.findById(req.userId);
    const sender = await User.findById(request.from);
    if (!receiver || !sender) return res.status(404).json({ message: "Users not found" });

    const receiverCollabs = receiver.collaborators || ([] as mongoose.Types.ObjectId[]);
    const senderCollabs = sender.collaborators || ([] as mongoose.Types.ObjectId[]);
    receiver.collaborators = receiverCollabs;
    sender.collaborators = senderCollabs;

    if (!receiverCollabs.find((id) => String(id) === String(request.from))) {
      receiverCollabs.push(request.from as mongoose.Types.ObjectId);
    }
    if (!senderCollabs.find((id) => String(id) === String(req.userId))) {
      senderCollabs.push(new mongoose.Types.ObjectId(req.userId));
    }

    await receiver.save();
    await sender.save();

    let dmRoom = await Room.findOne({ isDM: true, members: { $all: [request.from, req.userId] } });
    if (!dmRoom) {
      dmRoom = await Room.create({
        name: `DM:${request.from}-${req.userId}`,
        isDM: true,
        type: "dm",
        members: [request.from, req.userId]
      });
    }

    const actor = await User.findById(req.userId).select("name");
    const notif = await Notification.create({
      user: request.from,
      type: "collab_accepted",
      message: `${actor?.name || "Someone"} accepted your collaboration request`,
      meta: { collabRequestId: request._id, roomId: dmRoom._id }
    });
    emitNotificationToUser(String(request.from), notif);

    let podCreated = null;
    if (createPod) {
      podCreated = await Pod.create({
        name: podName?.trim?.() ? podName.trim() : `Collab: ${receiver.name} & ${sender.name}`,
        description: "Auto-created collaboration pod",
        owner: req.userId,
        members: [req.userId, request.from]
      });

      const podNotif = await Notification.create({
        user: request.from,
        type: "pod_created",
        message: `${actor?.name || "Someone"} started a pod: ${podCreated.name}`,
        meta: { podId: podCreated._id }
      });
      emitNotificationToUser(String(request.from), podNotif);
    }

    res.json({ ok: true, roomId: dmRoom._id, pod: podCreated });
  } catch (err) {
    console.error("collab accept error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/reject", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const request = await CollabRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!req.userId || String(request.to) !== req.userId) return res.status(403).json({ message: "Not allowed" });
    if (request.status !== "pending") return res.status(400).json({ message: "Invalid status" });

    request.status = "rejected";
    await request.save();

    const actor = await User.findById(req.userId).select("name");
    const notif = await Notification.create({
      user: request.from,
      type: "collab_rejected",
      message: `${actor?.name || "Someone"} declined your collaboration request${reason ? `: ${reason}` : ""}`,
      meta: { collabRequestId: request._id, reason }
    });
    emitNotificationToUser(String(request.from), notif);

    res.json({ ok: true });
  } catch (err) {
    console.error("collab reject error", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
