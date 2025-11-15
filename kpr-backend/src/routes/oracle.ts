import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/oracle/refine
 * Input: { idea: string }
 * Output: refined idea suggestions
 */
router.post("/refine", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { idea } = req.body;

    if (!idea || idea.trim().length < 5) {
      return res.status(400).json({ message: "Idea text is too short." });
    }

    const prompt = `
You are ORACLE — a calm, wise creative mentor from the KPR Sanctuary.
Your job is to refine the user's idea.

User Idea:
"${idea}"

Provide:
1. Refined Concept (2–3 sentences)
2. Expansion Suggestions (3 bullet points)
3. Potential Improvements (3 bullet points)
4. A Creative Aura Score (1–10) with a short justification

Keep it warm, supportive, magical.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const output = completion.choices[0].message.content;

    res.json({ oracle: output });
  } catch (err) {
    console.log("Oracle error:", err);
    res.status(500).json({ message: "Oracle is meditating right now." });
  }
});

export default router;
