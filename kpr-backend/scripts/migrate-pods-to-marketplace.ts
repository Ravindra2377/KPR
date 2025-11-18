import dotenv from "dotenv";
import { connectDB } from "../src/config/db";
import Pod from "../src/models/Pod";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI for pod migration");
  process.exit(1);
}

const normalizeRole = (role: any) => ({
  title: String(role?.title || role || "").trim(),
  description: role?.description ? String(role.description).trim() : undefined,
  requiredSkills: Array.isArray(role?.requiredSkills) ? role.requiredSkills : [],
  slots: Number(role?.slots || 1),
  open: role?.open !== undefined ? Boolean(role.open) : true,
  filledBy: role?.filledBy || null
});

const main = async () => {
  await connectDB(MONGO_URI!);
  const pods = await Pod.find().lean();
  let touched = 0;

  for (const rawPod of pods) {
    const pod = await Pod.findById(rawPod._id);
    if (!pod) continue;

    let changed = false;

    if (!Array.isArray(pod.tags)) {
      pod.tags = [];
      changed = true;
    }

    if (!Array.isArray(pod.roles)) {
      pod.roles = [];
      changed = true;
    }

    if (Array.isArray(pod.roles) && pod.roles.some((role: any) => typeof role === "string")) {
      pod.roles = pod.roles.map(normalizeRole);
      changed = true;
    } else if (Array.isArray(pod.roles)) {
      pod.roles = pod.roles.map((role: any) => normalizeRole(role));
      changed = true;
    }

    if (!Array.isArray(pod.activity)) {
      pod.activity = [];
      changed = true;
    }

    const activityCount = pod.activity?.length || 0;
    if (pod.activityCount !== activityCount) {
      pod.activityCount = activityCount;
      changed = true;
    }

    if (!Array.isArray(pod.members)) {
      pod.members = [];
      changed = true;
    }

    if (!Array.isArray(pod.applicants)) {
      pod.applicants = [];
      changed = true;
    } else {
      const normalizedApplicants = pod.applicants.map((app: any) => ({
        ...app,
        status: app.status || "pending",
        roleName: app.roleName || app.role || "",
        roleId: app.roleId || null
      }));
      pod.applicants = normalizedApplicants;
      changed = true;
    }

    if (!Array.isArray(pod.invites)) {
      pod.invites = [];
      changed = true;
    }

    if (pod.visibility === undefined) {
      pod.visibility = "public";
      changed = true;
    }

    if (changed) {
      await pod.save();
      touched += 1;
    }
  }

  console.log(`Normalized ${touched} pods to the marketplace schema.`);
  process.exit(0);
};

main().catch((err) => {
  console.error("Migration error", err);
  process.exit(1);
});
