import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  type?: string;
  isDM?: boolean;
}

const RoomSchema: Schema<IRoom> = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, default: "general" },
    isDM: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IRoom>("Room", RoomSchema);
