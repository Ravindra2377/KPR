import express from "express";
import mongoose from "mongoose";
import Pod from "../models/Pod";
import PodActivity from "../models/PodActivity";
import Notification from "../models/Notification";
import Room from "../models/Room";
import User from "../models/User";
import { AuthRequest, requireAuth } from "../middleware/auth";
import {
  emitDmListUpdated,
  emitEventToUser,
  emitNotificationToUser
} from "../utils/notifications-emitter";
import { canApplyToPod, canInviteToPod } from "../utils/pod-rate-limit";

const router = express.Router();

const toIdString = (value?: any): string => (value ? value.toString() : "");
const toObjectId = (value?: any) => (value ? new mongoose.Types.ObjectId(value) : undefined);
const parseList = (value?: string) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getOwnerId = (pod: any) => toIdString((pod?.owner && pod.owner._id) || pod?.owner);
const isMember = (pod: any, userId?: string) =>
  Boolean(userId && Array.isArray(pod?.members) && pod.members.some((member: any) => toIdString(member.user) === userId));
const isInvited = (pod: any, userId?: string) =>
  Boolean(userId && Array.isArray(pod?.invites) && pod.invites.some((invite: any) => toIdString(invite.user) === userId));
const canViewPod = (pod: any, userId?: string) => {
  if (!pod) return false;
  if (pod.visibility === "public") return true;
  if (isMember(pod, userId)) return true;
  if (getOwnerId(pod) && getOwnerId(pod) === userId) return true;
  if (pod.visibility === "unlisted" && isInvited(pod, userId)) return true;
  return false;
};

const buildPreview = (pod: any) => ({
  id: toIdString(pod._id),
  name: pod.name,
  subtitle: pod.subtitle,
  coverUrl: pod.cover?.url,
  description: pod.description,
  tags: pod.tags || [],
  visibility: pod.visibility,
  boosted: Boolean(pod.boosted?.active),
  roles: (pod.roles || []).map((role: any) => ({
    id: toIdString(role._id),
    title: role.title,
    open: role.open,
    slots: role.slots,
    filledBy: toIdString(role.filledBy)
  })),
  owner: pod.owner ? { id: toIdString(pod.owner._id), name: pod.owner.name, avatar: pod.owner.avatar } : null,
  membersCount: pod.members?.length || 0,
  applicantsCount: pod.applicants?.filter((a: any) => a.status === "pending").length || 0,
  updatedAt: pod.updatedAt
});

const pushActivityEntry = (pod: any, actorId: string, verb: string, meta: any = {}) => {
  const entry = {
    type: verb,
    user: new mongoose.Types.ObjectId(actorId),
    meta,
    createdAt: new Date()
  };
  pod.activity = pod.activity || [];
  pod.activity.push(entry);
  pod.activityCount = (pod.activityCount || 0) + 1;
  return entry;
};

const persistActivityRecord = async (pod: any, entry: any) => {
  await PodActivity.create({ pod: pod._id, actor: entry.user, verb: entry.type, meta: entry.meta });
};

router.get("/discover", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { search, tags, roles, visibility, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(5, parseInt(String(limit), 10) || 20));

    const filters: any = {};
    const accessFilters: any[] = [{ visibility: "public" }];
    if (req.userId) {
      accessFilters.push({ owner: req.userId });
      accessFilters.push({ "members.user": new mongoose.Types.ObjectId(req.userId) });
      accessFilters.push({ "invites.user": new mongoose.Types.ObjectId(req.userId) });
    }
    filters.$or = accessFilters;

    if (visibility && String(visibility).trim()) {
      filters.visibility = String(visibility).trim();
    }
    if (search && String(search).trim()) {
      filters.$text = { $search: String(search).trim() };
    }

    const tagList = parseList(tags as string | undefined);
    if (tagList.length) filters.tags = { $in: tagList };

    const roleList = parseList(roles as string | undefined);
    if (roleList.length) filters["roles.title"] = { $in: roleList };

    const total = await Pod.countDocuments(filters);
    const pods = await Pod.find(filters)
      .sort({ "boosted.active": -1, updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("owner", "name avatar")
      .lean();

    res.json({ data: pods.map(buildPreview), page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error("pods discover error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate("owner", "name avatar bio")
      .populate("members.user", "name avatar skills")
      .populate("applicants.user", "name avatar skills")
      .populate("invites.user", "name avatar skills");
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!canViewPod(pod, req.userId)) return res.status(403).json({ message: "Pod not accessible" });

    const ownerId = getOwnerId(pod);
    const member = isMember(pod, req.userId);
    const safeApplicants = Array.isArray(pod.applicants) ? pod.applicants : [];

    res.json({
      ...pod.toObject({ virtuals: true }),
      userIsOwner: req.userId === ownerId,
      userIsMember: member,
      applicants: req.userId === ownerId ? safeApplicants : safeApplicants.filter((app) => app.status === "accepted"),
      invites: req.userId === ownerId ? pod.invites : undefined
    });
  } catch (error) {
    console.error("pod detail error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!canViewPod(pod, req.userId)) return res.status(403).json({ message: "Access denied" });

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit || "20"), 10)));

    const activities = await PodActivity.find({ pod: pod._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actor", "name avatar");

    const total = await PodActivity.countDocuments({ pod: pod._id });
    res.json({ items: activities, total, page, limit });
  } catch (error) {
    console.error("pod activity error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/apply", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { roleId, roleName, message } = req.body;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.visibility === "private") return res.status(403).json({ message: "Pod is private" });
    if (isMember(pod, userId)) return res.status(400).json({ message: "Already a member" });
    if (!canApplyToPod(userId, pod._id?.toString() || "")) return res.status(429).json({ message: "Too many apply attempts" });

    if (pod.applicants?.some((app: any) => toIdString(app.user) === userId && app.status === "pending")) {
      return res.status(409).json({ message: "Application already pending" });
    }

    pod.applicants = pod.applicants || [];
    const applicant = {
      user: new mongoose.Types.ObjectId(userId),
      roleName: roleName || "",
      roleId: toObjectId(roleId),
      message: message || "",
      status: "pending",
      createdAt: new Date()
    } as any;
    pod.applicants.push(applicant);

    const activity = pushActivityEntry(pod, userId, "applied", { roleId, roleName, message });
    await pod.save();
    await persistActivityRecord(pod, activity);

    const ownerId = getOwnerId(pod);
    const actor = await User.findById(userId).select("name").lean();
    const notification = await Notification.create({
      user: ownerId,
      type: "pod_applicant",
      message: `${actor?.name || "Someone"} applied to ${pod.name}`,
      meta: { podId: pod._id, applicantId: userId, roleName, roleId }
    });
    emitNotificationToUser(ownerId, notification);
    emitEventToUser(ownerId, "podApplicant", {
      podId: pod._id,
      applicantId: userId,
      roleName,
      message
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("pod apply error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/applicants/:applicantId/approve", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const ownerId = getOwnerId(pod);
    if (req.userId !== ownerId) return res.status(403).json({ message: "Only owner can approve" });

    const applicant = pod.applicants?.find((app: any) => toIdString(app._id) === req.params.applicantId && app.status === "pending");
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    pod.members = pod.members || [];
    if (!pod.members.some((member: any) => toIdString(member.user) === toIdString(applicant.user))) {
      pod.members.push({
        user: applicant.user,
        role: applicant.roleName,
        joinedAt: new Date(),
        accepted: true
      });
    }

    if (applicant.roleId) {
      const roleSlot = pod.roles.find((role: any) => toIdString(role._id) === toIdString(applicant.roleId));
      if (roleSlot) {
        roleSlot.filledBy = applicant.user;
        if (typeof roleSlot.slots === "number") {
          roleSlot.slots = Math.max(0, roleSlot.slots - 1);
          roleSlot.open = roleSlot.slots > 0;
        } else {
          roleSlot.open = false;
        }
      }
    }

    pod.applicants = pod.applicants?.filter((app: any) => toIdString(app._id) !== req.params.applicantId) || [];
    const activity = pushActivityEntry(pod, req.userId!, "accepted", { userId: toIdString(applicant.user), roleName: applicant.roleName });
    await pod.save();
    await persistActivityRecord(pod, activity);

    const applicantObjectId = new mongoose.Types.ObjectId(req.params.applicantId);
    const ownerObjectId = new mongoose.Types.ObjectId(req.userId);
    let dmRoom = await Room.findOne({
      isDM: true,
      members: { $all: [applicantObjectId, ownerObjectId], $size: 2 }
    });
    if (!dmRoom) {
      dmRoom = await Room.create({
        name: `DM:${req.userId}:${req.params.applicantId}`,
        isDM: true,
        members: [applicantObjectId, ownerObjectId]
      });
    }

    const actor = await User.findById(req.userId).select("name").lean();
    const notification = await Notification.create({
      user: toIdString(applicant.user),
      type: "pod_member_joined",
      message: `${actor?.name || "Owner"} accepted you into ${pod.name}`,
      meta: { podId: pod._id, role: applicant.roleName, roomId: dmRoom._id }
    });
    emitNotificationToUser(toIdString(applicant.user), notification);
    emitEventToUser(toIdString(applicant.user), "podMemberJoined", { podId: pod._id, roomId: dmRoom._id });
    emitDmListUpdated(toIdString(dmRoom._id), { roomId: toIdString(dmRoom._id) });

    res.json({ ok: true, dmRoomId: dmRoom._id });
  } catch (error) {
    console.error("approve applicant error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/applicants/:applicantId/reject", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const ownerId = getOwnerId(pod);
    if (req.userId !== ownerId) return res.status(403).json({ message: "Only owner can reject" });

    const applicant = pod.applicants?.find((app: any) => toIdString(app._id) === req.params.applicantId && app.status === "pending");
    if (!applicant) return res.status(404).json({ message: "Applicant not found" });

    const reason = String(req.body.reason || "").trim();
    const activity = pushActivityEntry(pod, req.userId!, "rejected", { userId: toIdString(applicant.user), reason });
    pod.applicants = pod.applicants?.filter((app: any) => toIdString(app._id) !== req.params.applicantId) || [];
    await pod.save();
    await persistActivityRecord(pod, activity);

    const actor = await User.findById(req.userId).select("name").lean();
    const notification = await Notification.create({
      user: toIdString(applicant.user),
      type: "pod_application_rejected",
      message: `${actor?.name || "Owner"} rejected your request to ${pod.name}`,
      meta: { podId: pod._id, reason }
    });
    emitNotificationToUser(toIdString(applicant.user), notification);
    emitEventToUser(toIdString(applicant.user), "podApplicationRejected", { podId: pod._id, reason });

    res.json({ ok: true });
  } catch (error) {
    console.error("reject applicant error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/invite", requireAuth, async (req: AuthRequest, res) => {
  try {
    const inviterId = req.userId;
    const { userId, roleId, roleName, message } = req.body;
    if (!inviterId) return res.status(401).json({ message: "Unauthorized" });
    if (!userId) return res.status(400).json({ message: "Invitee required" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const ownerId = getOwnerId(pod);
    if (ownerId !== inviterId) return res.status(403).json({ message: "Only owner can invite" });
    if (!canInviteToPod(inviterId, pod._id?.toString() || "")) return res.status(429).json({ message: "Invite rate limit reached" });
    if (isMember(pod, userId)) return res.status(400).json({ message: "User already a member" });
    if (pod.invites?.some((invite: any) => toIdString(invite.user) === userId && invite.status === "pending")) {
      return res.status(409).json({ message: "Already invited" });
    }

    pod.invites = pod.invites || [];
    const invite = {
      user: new mongoose.Types.ObjectId(userId),
      roleName: roleName || "",
      roleId: toObjectId(roleId),
      invitedBy: new mongoose.Types.ObjectId(inviterId),
      status: "pending",
      createdAt: new Date()
    } as any;
    pod.invites.push(invite);

    const activity = pushActivityEntry(pod, inviterId, "invited", { userId, roleName, message });
    await pod.save();
    await persistActivityRecord(pod, activity);

    const actor = await User.findById(inviterId).select("name").lean();
    const notification = await Notification.create({
      user: userId,
      type: "pod_invite",
      message: `${actor?.name || "Owner"} invited you to join ${pod.name}`,
      meta: { podId: pod._id, inviteId: invite._id }
    });
    emitNotificationToUser(userId, notification);
    emitEventToUser(userId, "podInvite", { podId: pod._id, inviteId: invite._id, roleName, message });

    res.json({ ok: true });
  } catch (error) {
    console.error("pod invite error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/invites/:inviteId/accept", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const invite = pod.invites?.find((inv: any) => toIdString(inv._id) === req.params.inviteId && inv.status === "pending");
    if (!invite) return res.status(404).json({ message: "Invite not found" });
    if (toIdString(invite.user) !== userId) return res.status(403).json({ message: "Not the invitee" });

    pod.members = pod.members || [];
    if (!isMember(pod, userId)) {
      pod.members.push({ user: invite.user, role: invite.roleName, joinedAt: new Date(), accepted: true });
    }

    invite.status = "accepted";
    const activity = pushActivityEntry(pod, userId, "joined", { roleName: invite.roleName });
    await pod.save();
    await persistActivityRecord(pod, activity);

    const ownerId = getOwnerId(pod);
    const actor = await User.findById(userId).select("name").lean();
    const notification = await Notification.create({
      user: ownerId,
      type: "pod_invite_accepted",
      message: `${actor?.name || "Someone"} joined ${pod.name}`,
      meta: { podId: pod._id, userId }
    });
    emitNotificationToUser(ownerId, notification);
    emitEventToUser(ownerId, "podMemberJoined", { podId: pod._id, userId });

    res.json({ ok: true });
  } catch (error) {
    console.error("accept invite error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/join", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.visibility === "private") return res.status(403).json({ message: "Pod cannot be joined directly" });
    if (isMember(pod, userId)) return res.status(400).json({ message: "Already a member" });

    pod.members = pod.members || [];
    pod.members.push({ user: new mongoose.Types.ObjectId(userId), joinedAt: new Date(), accepted: true });
    const activity = pushActivityEntry(pod, userId, "joined", {});
    await pod.save();
    await persistActivityRecord(pod, activity);

    const ownerId = getOwnerId(pod);
    emitEventToUser(ownerId, "podMemberJoined", { podId: pod._id, userId });
    res.json({ ok: true });
  } catch (error) {
    console.error("join pod error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/roles", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { roles } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const ownerId = getOwnerId(pod);
    if (req.userId !== ownerId) return res.status(403).json({ message: "Only owner can update roles" });

    if (!Array.isArray(roles)) return res.status(400).json({ message: "Roles array required" });
    const normalized = roles
      .map((role: any) => ({
        title: String(role?.title || role || "").trim(),
        description: role?.description ? String(role.description).trim() : undefined,
        requiredSkills: Array.isArray(role?.requiredSkills) ? role.requiredSkills : [],
        slots: Number(role?.slots || 1),
        open: role?.open !== undefined ? Boolean(role.open) : true
      }))
      .filter((role: any) => role.title);

    pod.roles = normalized;
    const activity = pushActivityEntry(pod, ownerId, "roles_updated", { roles: normalized.map((r: any) => r.title) });
    await pod.save();
    await persistActivityRecord(pod, activity);

    emitEventToUser(ownerId, "podUpdated", { podId: pod._id, roles: normalized });
    res.json({ ok: true, roles: pod.roles });
  } catch (error) {
    console.error("roles update error", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/boost", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { durationMinutes = 60, metadata } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const ownerId = getOwnerId(pod);
    if (req.userId !== ownerId) return res.status(403).json({ message: "Only owner can boost" });

    pod.boosted = {
      active: true,
      endsAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      meta: metadata || {}
    };
    const activity = pushActivityEntry(pod, ownerId, "boosted", { durationMinutes, metadata });
    await pod.save();
    await persistActivityRecord(pod, activity);

    emitEventToUser(ownerId, "podActivity", { podId: pod._id, verb: "boosted" });
    res.json({ ok: true, boosted: pod.boosted });
  } catch (error) {
    console.error("boost pod error", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
