import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  message: string;
  meta?: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: Schema.Types.Mixed,
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", NotificationSchema);
