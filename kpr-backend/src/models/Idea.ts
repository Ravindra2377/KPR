import mongoose, { Schema, Document } from "mongoose";

export interface IIdea extends Document {
  title: string;
  description?: string;
  author: mongoose.Types.ObjectId;
  appreciationCount: number;
  growthStage: number;
}

const IdeaSchema = new Schema<IIdea>(
  {
    title: { type: String, required: true },
    description: String,
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appreciationCount: { type: Number, default: 0 },
    growthStage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IIdea>("Idea", IdeaSchema);
