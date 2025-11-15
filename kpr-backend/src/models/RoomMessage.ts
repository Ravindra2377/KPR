import mongoose, { Schema, Document } from "mongoose";

export interface IRoomMessage extends Document {
  room: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomMessageSchema: Schema<IRoomMessage> = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 1000 }
  },
  { timestamps: true }
);

export default mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
