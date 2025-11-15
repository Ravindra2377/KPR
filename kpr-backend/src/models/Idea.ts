import mongoose, { Schema, Document } from "mongoose";

export interface IIdea extends Document {
  title: string;
  description?: string;
  author: mongoose.Types.ObjectId;
  tags?: string[];
  appreciationCount?: number;
  collaborators?: mongoose.Types.ObjectId[];
  growthStage?: number;
}

const IdeaSchema: Schema<IIdea> = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],
    appreciationCount: { type: Number, default: 0 },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    growthStage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IIdea>("Idea", IdeaSchema);
