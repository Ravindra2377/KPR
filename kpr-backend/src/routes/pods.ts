import express from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "../middleware/auth";
import Pod from "../models/Pod";
import User from "../models/User";
import Notification from "../models/Notification";
import Room from "../models/Room";
import { emitEventToUser } from "../utils/notifications-emitter";

const router = express.Router();
const toId = (v: any) => new mongoose.Types.ObjectId(v);

/**
 * GET /api/pods/discover
 * query: ?q=&tags=foo,bar&roles=designer,dev&visibility=public&page=1&limit=20
 */
router.get("/discover", requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const tags = (req.query.tags as string)?.split(",")?.filter(Boolean) || [];
    const roles = (req.query.roles as string)?.split(",")?.filter(Boolean) || [];
    const visibility = req.query.visibility || undefined;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(Math.max(10, parseInt(String(req.query.limit || "20"), 10)), 100);

    const filter: any = {};
    if (q) filter.$or = [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
    if (tags.length) filter.tags = { $in: tags };
    if (roles.length) filter["roles.name"] = { $in: roles };
    if (visibility) filter.visibility = visibility;

    const pods = await Pod.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title subtitle tags banner owner members roles createdAt updatedAt visibility activityCount")
      .populate("owner", "name avatar");

    res.json({ data: pods, page, limit });
  } catch (err) {
    console.error("pods/discover", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/pods/:id
 * returns full pod detail including members, applicants, invites
 */
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate("owner", "name avatar bio")
      .populate("members.user", "name avatar skills")
      .populate("applicants.user", "name avatar skills")
      .populate("invites.user", "name avatar");

    if (!pod) return res.status(404).json({ message: "Not found" });
    res.json(pod);
  } catch (err) {
    console.error("pods/:id", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/pods/owner
 * returns pods owned by current user with applicants count & membership summary
 */
router.get("/owner", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pods = await Pod.find({ owner: req.userId })
      .sort({ updatedAt: -1 })
      .populate("members.user", "name avatar")
      .populate("applicants.user", "name avatar");
    // map to compact owner dashboard view
    const result = pods.map((p: any) => ({
      _id: p._id,
      title: p.title,
      subtitle: p.subtitle,
      applicantsCount: (p.applicants || []).filter((a: any) => a.status === "pending").length,
      membersCount: (p.members || []).length,
      updatedAt: p.updatedAt,
    }));
    res.json({ data: result });
  } catch (err) {
    console.error("pods/owner", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods - create pod
 */
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, subtitle, description, tags = [], roles = [], visibility = "public", banner } = req.body;
    const pod = await Pod.create({
      title,
      subtitle,
      description,
      tags,
      roles,
      visibility,
      banner,
      owner: req.userId,
      members: [{ user: req.userId, role: "owner", joinedAt: new Date() }],
    });
    res.status(201).json(pod);
  } catch (err) {
    console.error("create pod", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/apply
 * body: { roleName, message }
 */
router.post("/:id/apply", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });

    if (pod.applicants?.some((a: any) => String(a.user) === req.userId && a.roleName === req.body.roleName && a.status === "pending")) {
      return res.status(409).json({ message: "Already applied" });
    }

  const applicant = { user: toId(req.userId), roleName: req.body.roleName, message: req.body.message || "", status: "pending" as const, createdAt: new Date() } as any;
    pod.applicants = pod.applicants || [];
    pod.applicants.push(applicant);
    await pod.save();

    // notify owner(s)
    const actor = await User.findById(req.userId).select("name");
    await Notification.create({
      user: String(pod.owner),
      type: "pod_application",
      message: `${actor?.name || "Someone"} applied to ${pod.name}`,
      meta: { podId: pod._id },
    });
    emitEventToUser(String(pod.owner), "podApplication", { podId: pod._id, applicant: req.userId });

    res.json({ ok: true });
  } catch (err) {
    console.error("apply", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/applicants/:applicantId/approve
 */
router.post("/:id/applicants/:applicantId/approve", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });
    if (String(pod.owner) !== req.userId) return res.status(403).json({ message: "Only owner can approve" });

    const app = pod.applicants.find((a: any) => String(a._id) === req.params.applicantId);
    if (!app) return res.status(404).json({ message: "Applicant not found" });
    if (app.status !== "pending") return res.status(400).json({ message: "Invalid status" });

    app.status = "accepted";
    pod.members = pod.members || [];
    pod.members.push({ user: app.user, role: app.roleName, joinedAt: new Date() });

    // add activity
    pod.activity = pod.activity || [];
    pod.activity.unshift({ type: "applicant_accepted", user: app.user, meta: { role: app.roleName }, createdAt: new Date() });
    pod.activityCount = (pod.activityCount || 0) + 1;

    await pod.save();

    // create DM room between owner and new member if not exists
    let dm = await Room.findOne({ isDM: true, members: { $all: [pod.owner, app.user], $size: 2 } });
    if (!dm) dm = await Room.create({ name: `DM:${pod._id}:${app.user}`, isDM: true, members: [pod.owner, app.user] });

    await Notification.create({
      user: String(app.user),
      type: "pod_application_accepted",
      message: `${pod.name}: Your application was accepted`,
      meta: { podId: pod._id, dmRoomId: dm._id },
    });
    emitEventToUser(String(app.user), "podApplicationAccepted", { podId: pod._id, dmRoomId: dm._id });

    res.json({ ok: true, dmRoomId: dm._id });
  } catch (err) {
    console.error("approve applicant", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/applicants/:applicantId/reject
 */
router.post("/:id/applicants/:applicantId/reject", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });
    if (String(pod.owner) !== req.userId) return res.status(403).json({ message: "Only owner can reject" });

    const app = pod.applicants.find((a: any) => String(a._id) === req.params.applicantId);
    if (!app) return res.status(404).json({ message: "Applicant not found" });
    if (app.status !== "pending") return res.status(400).json({ message: "Invalid status" });

    app.status = "rejected";
    pod.activity = pod.activity || [];
    pod.activity.unshift({ type: "applicant_rejected", user: app.user, meta: { role: app.roleName, reason: req.body.reason || null }, createdAt: new Date() });
    pod.activityCount = (pod.activityCount || 0) + 1;

    await pod.save();

    await Notification.create({
      user: String(app.user),
      type: "pod_application_rejected",
      message: `${pod.name}: Your application was not accepted`,
      meta: { podId: pod._id, reason: req.body.reason || null },
    });
    emitEventToUser(String(app.user), "podApplicationRejected", { podId: pod._id });

    res.json({ ok: true });
  } catch (err) {
    console.error("reject applicant", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/invite - owner invites a user
 * body: { userId, roleName }
 */
router.post("/:id/invite", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, roleName } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });
    if (String(pod.owner) !== req.userId) return res.status(403).json({ message: "Only owner" });

    pod.invites = pod.invites || [];
  pod.invites.push({ user: toId(userId), roleName, createdAt: new Date(), status: "pending", invitedBy: toId(req.userId) });
    await pod.save();

    await Notification.create({
      user: userId,
      type: "pod_invite",
      message: `${pod.name}: You were invited`,
      meta: { podId: pod._id },
    });
    emitEventToUser(userId, "podInvite", { podId: pod._id });

    res.json({ ok: true });
  } catch (err) {
    console.error("invite", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/invites/:inviteId/accept
 */
router.post("/:id/invites/:inviteId/accept", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });

    const inv = pod.invites.find((i: any) => String(i._id) === req.params.inviteId);
    if (!inv) return res.status(404).json({ message: "Invite not found" });
    if (String(inv.user) !== req.userId) return res.status(403).json({ message: "Not allowed" });

    inv.status = "accepted";
    pod.members = pod.members || [];
    pod.members.push({ user: inv.user, role: inv.roleName, joinedAt: new Date() });

    pod.activity = pod.activity || [];
    pod.activity.unshift({ type: "invite_accepted", user: inv.user, meta: { role: inv.roleName }, createdAt: new Date() });
    pod.activityCount = (pod.activityCount || 0) + 1;

    await pod.save();

  emitEventToUser(String(pod.owner), "podInviteAccepted", { podId: pod._id, user: inv.user });
    res.json({ ok: true });
  } catch (err) {
    console.error("accept invite", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/pods/:id/members/:memberId/remove - owner remove member
 */
router.post("/:id/members/:memberId/remove", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Not found" });
    if (String(pod.owner) !== req.userId) return res.status(403).json({ message: "Only owner can remove members" });

    const idx = pod.members.findIndex((m: any) => String(m._id) === req.params.memberId);
    if (idx === -1) return res.status(404).json({ message: "Member not found" });

    const removed = pod.members.splice(idx, 1)[0];
    pod.activity = pod.activity || [];
    pod.activity.unshift({ type: "member_removed", user: removed.user, meta: { role: removed.role }, createdAt: new Date() });
    pod.activityCount = (pod.activityCount || 0) + 1;

    await pod.save();

  emitEventToUser(String(removed.user), "podMemberRemoved", { podId: pod._id });
    res.json({ ok: true });
  } catch (err) {
    console.error("remove member", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/pods/:id/activity - returns recent activity feed
 */
router.get("/:id/activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pod = await Pod.findById(req.params.id).populate("activity.user", "name avatar");
    if (!pod) return res.status(404).json({ message: "Not found" });
    res.json(pod.activity || []);
  } catch (err) {
    console.error("activity", err);
    res.status(500).json({ message: "Server error" });
  }


});

export default router;
