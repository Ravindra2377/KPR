import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  type?: string;
}

const RoomSchema: Schema<IRoom> = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, default: "general" }
  },
  { timestamps: true }
);

export default mongoose.model<IRoom>("Room", RoomSchema);
