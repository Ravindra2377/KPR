import mongoose, { Schema, Document } from "mongoose";

export interface IPodActivity extends Document {
  pod: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  verb: string;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PodActivitySchema = new Schema<IPodActivity>(
  {
    pod: { type: Schema.Types.ObjectId, ref: "Pod", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verb: { type: String, required: true },
    meta: Schema.Types.Mixed
  },
  { timestamps: true }
);

export default mongoose.model<IPodActivity>("PodActivity", PodActivitySchema);
