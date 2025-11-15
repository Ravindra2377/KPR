import express from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User, { IUser } from "../models/User";

const router = express.Router();

const jwtSecret: Secret = process.env.JWT_SECRET || "secret";
const jwtExpires = (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d";
const jwtOptions: SignOptions = { expiresIn: jwtExpires };

const signToken = (id: string) => jwt.sign({ id }, jwtSecret, jwtOptions);

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, skills, bio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

  const user = (await User.create({ name, email, password, skills, bio })) as IUser;
  const token = signToken(user.id);

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
  const user = (await User.findOne({ email })) as IUser | null;
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken(user.id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

export default router;
