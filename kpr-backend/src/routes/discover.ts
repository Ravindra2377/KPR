import express from "express";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

/*
 * GET /api/discover?search=&skills=skill1,skill2
 * Filters by search term and skill chips, then sorts by shared skills with the current user.
 */
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const search = req.query.search?.toString().trim() || "";
    const skillQueryRaw = req.query.skills?.toString().trim() || "";
    const skillQuery = skillQueryRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const baseQuery: Record<string, unknown> = {
      _id: { $ne: req.userId }
    };

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } }
      ];
    }

    if (skillQuery.length > 0) {
      baseQuery.skills = { $in: skillQuery };
    }

    const users = await User.find(baseQuery)
      .select("name bio avatar skills createdAt")
      .limit(200)
      .lean();

    const me = req.userId ? await User.findById(req.userId).select("skills").lean() : null;
    const mySkills: string[] = Array.isArray(me?.skills) ? (me!.skills as string[]) : [];

    const scored = users.map((u: any) => {
      const overlaps = Array.isArray(u.skills)
        ? u.skills.filter((s: string) => mySkills.includes(s)).length
        : 0;

      return {
        ...u,
        score: overlaps
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json(scored);
  } catch (err) {
    console.error("discover route error", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
