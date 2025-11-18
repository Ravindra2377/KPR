import mongoose, { Schema, Document } from "mongoose";

export interface IRoleSlot {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  requiredSkills?: string[];
  slots?: number;
  filledBy?: mongoose.Types.ObjectId | null;
  open: boolean;
}

export interface IPodMember {
  user: mongoose.Types.ObjectId;
  role?: string;
  joinedAt?: Date;
  accepted?: boolean;
}

export interface IPodApplicant {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  message?: string;
  roleName?: string;
  roleId?: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPodInvite {
  user: mongoose.Types.ObjectId;
  roleName?: string;
  roleId?: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  invitedBy: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface IPodActivity {
  _id?: mongoose.Types.ObjectId;
  type: string;
  user: mongoose.Types.ObjectId;
  meta?: any;
  createdAt?: Date;
}

export interface IPod extends Document {
  name: string;
  subtitle?: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  cover?: {
    url?: string;
    alt?: string;
  };
  tags: string[];
  visibility: "public" | "unlisted" | "private";
  roles: IRoleSlot[];
  members: IPodMember[];
  applicants: IPodApplicant[];
  invites: IPodInvite[];
  activity: IPodActivity[];
  skills: string[];
  location?: { city?: string; country?: string };
  boosted?: {
    active: boolean;
    endsAt?: Date;
    meta?: any;
  };
  activityCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSlotSchema = new Schema<IRoleSlot>(
  {
    title: { type: String, required: true },
    description: String,
    requiredSkills: [{ type: String }],
    slots: { type: Number, default: 1 },
    filledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    open: { type: Boolean, default: true }
  },
  { _id: true }
);

const MemberSchema = new Schema<IPodMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String },
    joinedAt: { type: Date, default: Date.now },
    accepted: { type: Boolean, default: true }
  },
  { _id: false }
);

const ApplicantSchema = new Schema<IPodApplicant>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: String,
    roleName: String,
    roleId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled"], default: "pending" }
  },
  { timestamps: true }
);

const InviteSchema = new Schema<IPodInvite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleName: String,
    roleId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const ActivitySchema = new Schema<IPodActivity>(
  {
    type: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    meta: Schema.Types.Mixed
  },
  { timestamps: true }
);

const PodSchema = new Schema<IPod>(
  {
    name: { type: String, required: true },
    subtitle: String,
    description: String,
    cover: {
      url: String,
      alt: String
    },
    tags: [{ type: String }],
    visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] },
    applicants: { type: [ApplicantSchema], default: [] },
    invites: { type: [InviteSchema], default: [] },
    roles: { type: [RoleSlotSchema], default: [] },
    activity: { type: [ActivitySchema], default: [] },
    activityCount: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    location: { city: String, country: String },
    boosted: {
      active: { type: Boolean, default: false },
      endsAt: Date,
      meta: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

PodSchema.index({ name: "text", description: "text" });
PodSchema.index({ tags: 1 });
PodSchema.index({ "roles.title": 1 });
PodSchema.index({ visibility: 1 });

export default mongoose.model<IPod>("Pod", PodSchema);
