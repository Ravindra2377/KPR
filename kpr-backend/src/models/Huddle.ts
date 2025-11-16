import mongoose, { Schema, Document } from "mongoose";

export interface IHuddle extends Document {
  creator: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId | string;
  roomName: string;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const HuddleSchema = new Schema<IHuddle>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: Schema.Types.Mixed },
    roomName: { type: String, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model<IHuddle>("Huddle", HuddleSchema);
