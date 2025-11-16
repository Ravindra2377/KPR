import mongoose, { Schema, Document } from "mongoose";

export interface ITask {
  title: string;
  description?: string;
  status: "todo" | "inprogress" | "done";
  assignee?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoleApplicant {
  user: mongoose.Types.ObjectId;
  message?: string;
  createdAt?: Date;
}

export interface IPodRole {
  id: string;
  title: string;
  slots: number;
  filled: number;
  skills: string[];
  applicants: IRoleApplicant[];
}

export interface IPod extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  tasks: ITask[];
  roles: IPodRole[];
  skills: string[];
  tags: string[];
  visibility: "public" | "private" | "invite";
  location?: {
    country?: string;
    city?: string;
  };
  coverImage?: string;
  boosted?: boolean;
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

const RoleApplicantSchema = new Schema<IRoleApplicant>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: String
  },
  { timestamps: true }
);

const RoleSchema = new Schema<IPodRole>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    slots: { type: Number, default: 1 },
    filled: { type: Number, default: 0 },
    skills: [String],
    applicants: [RoleApplicantSchema]
  },
  { _id: false }
);

const PodSchema = new Schema<IPod>(
  {
    name: { type: String, required: true },
    description: String,
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  tasks: { type: [TaskSchema], default: [] },
  roles: { type: [RoleSchema], default: [] },
  skills: { type: [String], default: [] },
  tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["public", "private", "invite"], default: "public" },
    location: {
      country: String,
      city: String
    },
    coverImage: String,
    boosted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

PodSchema.index({ skills: 1 });
PodSchema.index({ tags: 1 });
PodSchema.index({ visibility: 1 });
PodSchema.index({ updatedAt: -1 });

export default mongoose.model<IPod>("Pod", PodSchema);
