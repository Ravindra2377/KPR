import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface PortfolioItem {
  _id: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  mediaUrl: string;
  mimeType?: string;
  link?: string;
  createdAt: Date;
}

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  youtube?: string;
  dribbble?: string;
  behance?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  skills?: string[];
  bio?: string;
  about?: string;
  building?: string;
  lookingFor?: string;
  quote?: string;
  roles?: string[];
  banner?: string;
  collaborators?: mongoose.Types.ObjectId[];
  avatar?: string;
  portfolio?: PortfolioItem[];
  social?: SocialLinks;
  comparePassword(candidate: string): Promise<boolean>;
}

const PortfolioItemSchema = new Schema<PortfolioItem>(
  {
    title: String,
    description: String,
    mediaUrl: { type: String, required: true },
    mimeType: String,
    link: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const SocialSchema = new Schema<SocialLinks>(
  {
    instagram: String,
    linkedin: String,
    twitter: String,
    github: String,
    website: String,
    youtube: String,
    dribbble: String,
    behance: String
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    skills: [String],
    bio: String,
    about: String,
    building: String,
    lookingFor: String,
    quote: String,
    roles: [String],
    banner: String,
    avatar: String,
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    portfolio: [PortfolioItemSchema],
    social: SocialSchema
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
