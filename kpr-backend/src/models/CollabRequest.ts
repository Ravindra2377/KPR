import mongoose, { Schema, Document } from "mongoose";

export type CollabStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface ICollabRequest extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  message?: string;
  status: CollabStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CollabRequestSchema = new Schema<ICollabRequest>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

CollabRequestSchema.index({ from: 1, to: 1, status: 1 });

export default mongoose.model<ICollabRequest>("CollabRequest", CollabRequestSchema);
