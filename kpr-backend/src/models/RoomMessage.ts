import mongoose, { Schema, Document } from "mongoose";

export interface IRoomMessage extends Document {
  room: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomMessageSchema: Schema<IRoomMessage> = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 1000 },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }]
  },
  { timestamps: true }
);

export default mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
