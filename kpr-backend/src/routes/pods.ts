import express from "express";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import Pod from "../models/Pod";
import Notification from "../models/Notification";
import Room from "../models/Room";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { emitEventToUser, emitNotificationToUser } from "../utils/notifications-emitter";

const router = express.Router();

const createDefaultRole = () => ({
  id: randomUUID(),
  title: "Contributor",
  slots: 4,
  filled: 0,
  skills: [],
  applicants: []
});

const pickVisibilityFilter = (visibility?: string) => {
  if (!visibility) return { visibility: "public" };
  const list = visibility
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!list.length) return { visibility: "public" };
  if (list.length === 1) return { visibility: list[0] };
  return { visibility: { $in: list } };
};

const isOwner = (pod: any, userId?: string) => Boolean(userId && pod && String(pod.owner) === userId);
const isMember = (pod: any, userId?: string) =>
  Boolean(userId && pod && Array.isArray(pod.members) && pod.members.some((member: any) => String(member) === userId));

const buildRoleSummary = (role: any) => ({
  id: role.id,
  title: role.title,
  openSlots: Math.max((role.slots || 0) - (role.filled || 0), 0),
  skills: role.skills || []
});

const decorateDiscoverItem = (pod: any, userSkills: string[]) => {
  const roles = (pod.roles || []).map(buildRoleSummary).filter((role: ReturnType<typeof buildRoleSummary>) => role.openSlots > 0);
  const sharedSkillsCount = userSkills.filter((skill) => (pod.skills || []).includes(skill)).length;
  const membersCount = Array.isArray(pod.members) ? pod.members.length : 0;
  const matchingScore = sharedSkillsCount * 3 + (pod.boosted ? 5 : 0);
  return {
    id: pod._id,
    name: pod.name,
    shortDescription: pod.description,
    owner: pod.owner ? { _id: pod.owner._id, name: pod.owner.name, avatar: pod.owner.avatar, skills: pod.owner.skills || [] } : undefined,
    roles: roles.slice(0, 3),
    skills: pod.skills || [],
    tags: pod.tags || [],
    membersCount,
    boosted: Boolean(pod.boosted),
    visibility: pod.visibility,
    lastActivity: pod.updatedAt,
    matchingScore,
    sharedSkillsCount
  };
};

router.get("/discover", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { search, skills, tags, visibility, page = "1", limit = "20", sort = "recent", recommended } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(5, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const userId = req.userId;
    const user = userId ? await User.findById(userId).select("skills").lean() : null;
    const userSkills = user?.skills || [];

    const filter: any = {
      ...pickVisibilityFilter(String(visibility || ""))
    };

    if (search) {
      const safe = String(search).trim();
      const regex = new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (skills) {
      const skillList = (String(skills) || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (skillList.length) {
        filter.skills = { $in: skillList };
      }
    }

    if (tags) {
      const tagList = (String(tags) || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (tagList.length) {
        filter.tags = { $in: tagList };
      }
    }

    const total = await Pod.countDocuments(filter);

    const pods = await Pod.find(filter)
      .sort(sort === "popular" ? { updatedAt: -1 } : { updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("owner", "name avatar skills")
      .lean();

    const decorated = pods.map((pod) => decorateDiscoverItem(pod, userSkills));
    let sorted = decorated;

    if (String(sort) === "matching" || String(recommended) === "true") {
      sorted = decorated
        .slice()
        .sort((a, b) => b.matchingScore - a.matchingScore || b.sharedSkillsCount - a.sharedSkillsCount || (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0));
    } else if (String(sort) === "popular") {
      sorted = decorated.slice().sort((a, b) => b.membersCount - a.membersCount || (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0));
    } else {
      sorted = decorated.slice().sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime());
    }

    res.json({ items: sorted, page: pageNum, limit: limitNum, total });
  } catch (err) {
    console.error("pods discover error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const { name, description, roles, skills, tags, visibility, coverImage, location } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Pod name required" });

    const normalizedRoles = Array.isArray(roles)
      ? roles.map((role: any) => ({
          id: role.id || randomUUID(),
          title: role.title || "Contributor",
          slots: Math.max(1, Number(role.slots) || 1),
          filled: Math.max(0, Number(role.filled) || 0),
          skills: Array.isArray(role.skills) ? role.skills : [],
          applicants: []
        }))
      : [createDefaultRole()];

    const pod = await Pod.create({
      name: name.trim(),
      description,
      owner: req.userId,
      members: [req.userId],
      roles: normalizedRoles,
      skills: Array.isArray(skills) ? skills : [],
      tags: Array.isArray(tags) ? tags : [],
      visibility: visibility || "public",
      coverImage,
      location,
      boosted: false
    });

    const populated = await Pod.findById(pod._id).populate("owner", "name avatar");
    res.status(201).json(populated);
  } catch (err) {
    console.error("pod create error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const pods = await Pod.find({ members: req.userId })
      .populate("owner", "name avatar")
      .populate("members", "name avatar")
      .lean();
    res.json(pods);
  } catch (err) {
    console.error("my pods error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id)
      .populate("owner", "name avatar skills")
      .populate("members", "name avatar skills")
      .populate("roles.applicants.user", "name avatar skills")
      .lean();

    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const owner = isOwner(pod, req.userId);
    const member = isMember(pod, req.userId);
    if (!member && !owner && pod.visibility !== "public") {
      return res.status(403).json({ message: "Pod not accessible" });
    }

    const roles = (pod.roles || []).map((role: any) => {
      const applicants = (role.applicants || []).map((entry: any) => ({
        userId: entry.user?._id || entry.user,
        name: entry.user?.name,
        avatar: entry.user?.avatar,
        message: entry.message,
        createdAt: entry.createdAt
      }));
      return {
        id: role.id,
        title: role.title,
        slots: role.slots,
        filled: role.filled,
        skills: role.skills,
        openSlots: Math.max((role.slots || 0) - (role.filled || 0), 0),
        applicants: owner ? applicants : [],
        applicantCount: applicants.length
      };
    });

    const userHasAppliedForRoleIds = (pod.roles || [])
      .filter((role: any) => (role.applicants || []).some((app: any) => String(app.user?._id || app.user) === req.userId))
      .map((role: any) => role.id);

    res.json({
      ...pod,
      membersCount: Array.isArray(pod.members) ? pod.members.length : 0,
      userIsOwner: owner,
      userIsMember: member,
      roles,
      userHasAppliedForRoleIds
    });
  } catch (err) {
    console.error("pod detail error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/apply", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { roleId, message } = req.body;
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.visibility === "private") return res.status(403).json({ message: "Pod not open for discovery" });

    const role = (pod.roles || []).find((roleEntry) => roleEntry.id === roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });
    if (role.applicants?.some((applicant: any) => String(applicant.user) === req.userId)) {
      return res.status(409).json({ message: "Already applied" });
    }

    if (pod.members.some((member) => String(member) === req.userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    if ((role.filled || 0) >= (role.slots || 0)) {
      return res.status(400).json({ message: "No slots available" });
    }

    role.applicants = role.applicants || [];
    role.applicants.push({ user: new mongoose.Types.ObjectId(req.userId), message });
    await pod.save();

    const applicant = await User.findById(req.userId).select("name");
    const ownerId = String(pod.owner);
    const notification = await Notification.create({
      user: ownerId,
      type: "pod_application",
      message: `${applicant?.name || "Someone"} applied to ${role.title} in ${pod.name}`,
      meta: { podId: pod._id, roleId }
    });

    emitNotificationToUser(ownerId, notification);
    emitEventToUser(ownerId, "podApplication", {
      podId: pod._id,
      roleId,
      applicantId: req.userId,
      message,
      podName: pod.name
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("pod apply error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/role/:roleId/applications", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const role = (pod.roles || []).find((roleEntry) => roleEntry.id === req.params.roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const applicantIndex = (role.applicants || []).findIndex((applicant: any) => String(applicant.user) === req.userId);
    if (applicantIndex === -1) return res.status(404).json({ message: "Application not found" });

    role.applicants.splice(applicantIndex, 1);
    await pod.save();

    const ownerId = String(pod.owner);
    const actor = await User.findById(req.userId).select("name");
    const notification = await Notification.create({
      user: ownerId,
      type: "pod_application_withdrawn",
      message: `${actor?.name || "Someone"} withdrew their application in ${pod.name}`,
      meta: { podId: pod._id, roleId: role.id }
    });

    emitNotificationToUser(ownerId, notification);
    emitEventToUser(ownerId, "podApplicationWithdrawn", { podId: pod._id, roleId: role.id, userId: req.userId });

    res.json({ ok: true });
  } catch (err) {
    console.error("pod withdraw application", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/role/:roleId/accept", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId: applicantId } = req.body;
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    if (!applicantId) return res.status(400).json({ message: "Applicant required" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isOwner(pod, req.userId)) return res.status(403).json({ message: "Only owner may accept" });

    const role = (pod.roles || []).find((roleEntry) => roleEntry.id === req.params.roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const applicantIndex = (role.applicants || []).findIndex((applicant: any) => String(applicant.user) === applicantId);
    if (applicantIndex === -1) return res.status(404).json({ message: "Application not found" });

    if ((role.filled || 0) >= (role.slots || 0)) return res.status(400).json({ message: "Role is full" });

    role.applicants.splice(applicantIndex, 1);
    role.filled = (role.filled || 0) + 1;

    if (!pod.members.some((member) => String(member) === applicantId)) {
      pod.members.push(new mongoose.Types.ObjectId(applicantId));
    }

    await pod.save();

    let dmRoom = await Room.findOne({ isDM: true, members: { $all: [applicantId, req.userId] } });
    if (!dmRoom) {
      dmRoom = await Room.create({
        name: `DM:${applicantId}:${req.userId}`,
        isDM: true,
        type: "dm",
        members: [applicantId, req.userId]
      });
    }

    const actor = await User.findById(req.userId).select("name");
    const notification = await Notification.create({
      user: applicantId,
      type: "pod_application_accepted",
      message: `${actor?.name || "Someone"} welcomed you to ${pod.name}`,
      meta: { podId: pod._id, roleId: role.id, roomId: dmRoom._id }
    });

    emitNotificationToUser(applicantId, notification);
    emitEventToUser(applicantId, "podJoinAccepted", { podId: pod._id, roleId: role.id, roomId: dmRoom._id });

    res.json({ ok: true, podId: pod._id, roleId: role.id, roomId: dmRoom._id });
  } catch (err) {
    console.error("pod accept", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/role/:roleId/reject", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId: applicantId, reason } = req.body;
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    if (!applicantId) return res.status(400).json({ message: "Applicant required" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isOwner(pod, req.userId)) return res.status(403).json({ message: "Only owner may reject" });

    const role = (pod.roles || []).find((roleEntry) => roleEntry.id === req.params.roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const applicantIndex = (role.applicants || []).findIndex((applicant: any) => String(applicant.user) === applicantId);
    if (applicantIndex === -1) return res.status(404).json({ message: "Application not found" });

    role.applicants.splice(applicantIndex, 1);
    await pod.save();

    const actor = await User.findById(req.userId).select("name");
    const notification = await Notification.create({
      user: applicantId,
      type: "pod_application_rejected",
      message: `${actor?.name || "Someone"} declined your application${reason ? `: ${reason}` : ""}`,
      meta: { podId: pod._id, roleId: role.id, reason }
    });

    emitNotificationToUser(applicantId, notification);

    res.json({ ok: true });
  } catch (err) {
    console.error("pod reject", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/applications", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id).populate("roles.applicants.user", "name avatar skills");
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isOwner(pod, req.userId)) return res.status(403).json({ message: "Only owner may view applications" });

    const payload = (pod.roles || []).map((role) => ({
      roleId: role.id,
      title: role.title,
      applicants: (role.applicants || []).map((entry) => {
        const entryUser = entry.user as any;
        return {
          userId: entryUser?._id || entryUser,
          name: entryUser?.name,
          avatar: entryUser?.avatar,
          message: entry.message,
          requestedAt: entry.createdAt
        };
      })
    }));

    res.json(payload);
  } catch (err) {
    console.error("pod applications", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/invite", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId: invitee } = req.body;
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    if (!invitee) return res.status(400).json({ message: "Invitee required" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isOwner(pod, req.userId)) return res.status(403).json({ message: "Only owner may invite" });

    if (!pod.members.some((member) => String(member) === invitee)) {
      pod.members.push(new mongoose.Types.ObjectId(invitee));
      await pod.save();
    }

    const actor = await User.findById(req.userId).select("name");
    const notification = await Notification.create({
      user: invitee,
      type: "pod_invite",
      message: `${actor?.name || "Someone"} invited you to ${pod.name}`,
      meta: { podId: pod._id }
    });
    emitNotificationToUser(invitee, notification);

    res.json({ ok: true });
  } catch (err) {
    console.error("pod invite", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/members", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const { userId } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isMember(pod, requesterId)) return res.status(403).json({ message: "Not a member" });

    if (userId && !pod.members.some((member) => String(member) === userId)) {
      pod.members.push(new mongoose.Types.ObjectId(userId));
      await pod.save();
    }

    const populated = await pod.populate("members", "name email");
    res.json(populated);
  } catch (err) {
    console.error("pod add member", err);
    res.status(500).json({ message: "Server error", err });
  }
});

router.delete("/:id/members/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isMember(pod, requesterId)) return res.status(403).json({ message: "Not a member" });

    pod.members = pod.members.filter((member) => String(member) !== req.params.userId);
    await pod.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("pod remove member", err);
    res.status(500).json({ message: "Server error", err });
  }
});

router.post("/:id/tasks", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isMember(pod, requesterId)) return res.status(403).json({ message: "Not a member" });

    const { title, description, assignee } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title required" });

    const task = { title: title.trim(), description, status: "todo", assignee };
    pod.tasks.push(task as any);
    await pod.save();

    const populated = await Pod.findById(pod._id)
      .populate("tasks.assignee", "name")
      .populate("members", "name");

    if (assignee && String(assignee) !== requesterId) {
      const notif = await Notification.create({
        user: assignee,
        type: "task_assigned",
        message: `Task "${title.trim()}" created in pod ${pod.name}`,
        meta: { podId: pod._id }
      });
      emitNotificationToUser(String(assignee), notif);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Server error", err });
  }
});

router.patch("/:id/tasks/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isMember(pod, requesterId)) return res.status(403).json({ message: "Not a member" });

    const { title, description, status, assignee } = req.body;
    const task = (pod.tasks as any).id(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const previousAssignee = String(task.assignee || "");
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignee !== undefined) task.assignee = assignee;

    await pod.save();
    const populated = await Pod.findById(pod._id)
      .populate("tasks.assignee", "name")
      .populate("members", "name");

    if (assignee && String(assignee) !== requesterId && String(assignee) !== previousAssignee) {
      const notif = await Notification.create({
        user: assignee,
        type: "task_assigned",
        message: `Task "${task.title}" assigned in pod ${pod.name}`,
        meta: { podId: pod._id }
      });
      emitNotificationToUser(String(assignee), notif);
    }

    res.json(populated);
  } catch (err) {
    console.error("Update task error", err);
    res.status(500).json({ message: "Server error", err });
  }
});

router.delete("/:id/tasks/:taskId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!isMember(pod, requesterId)) return res.status(403).json({ message: "Not a member" });

    const task = (pod.tasks as any).id(req.params.taskId);
    task?.deleteOne();
    await pod.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete task error", err);
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
