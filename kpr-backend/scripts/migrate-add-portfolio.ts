import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kpr");
  const users = await User.find({});
  for (const user of users) {
    if (!user.portfolio) user.portfolio = [];
    if (!user.portfolioOrder) user.portfolioOrder = [];
    await user.save();
  }
  console.log("Migration complete");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});