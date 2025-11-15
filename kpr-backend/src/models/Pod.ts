import mongoose, { Schema, Document } from "mongoose";

export interface ITask {
  title: string;
  description?: string;
  status: "todo" | "inprogress" | "done";
  assignee?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPod extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  tasks: ITask[];
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ["todo", "inprogress", "done"], default: "todo" },
    assignee: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const PodSchema = new Schema<IPod>(
  {
    name: { type: String, required: true },
    description: String,
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tasks: [TaskSchema]
  },
  { timestamps: true }
);

export default mongoose.model<IPod>("Pod", PodSchema);
