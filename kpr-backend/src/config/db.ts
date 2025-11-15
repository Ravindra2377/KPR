import mongoose from "mongoose";

export const connectDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB Connection Error:", err);
    process.exit(1);
  }
};
