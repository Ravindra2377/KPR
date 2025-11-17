import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface PortfolioItem {
  _id: mongoose.Types.ObjectId;
  key?: string;
  url: string;
  type: "image" | "video";
  title?: string;
  description?: string;
  link?: string;
  createdAt: Date;
  uploadedAt?: Date;
  meta?: {
    width?: number;
    height?: number;
  };
  thumbs?: Record<string, string>;
}

export interface BannerAsset {
  url: string;
  key?: string;
  altText?: string;
  blurhash?: string | null;
  meta?: {
    width?: number;
    height?: number;
  };
  uploadedAt?: Date;
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
  banner?: BannerAsset | null;
  collaborators?: mongoose.Types.ObjectId[];
  avatar?: string;
  portfolio?: PortfolioItem[];
  portfolioOrder?: mongoose.Types.ObjectId[];
  social?: SocialLinks;
  comparePassword(candidate: string): Promise<boolean>;
}

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
    banner: {
      key: String,
      url: { type: String, default: null },
      altText: String,
      blurhash: { type: String, default: null },
      meta: {
        width: Number,
        height: Number
      },
      uploadedAt: Date
    },
    avatar: String,
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    portfolio: [
      new Schema(
        {
          key: String,
          url: { type: String, required: true },
          type: { type: String, enum: ["image", "video"], default: "image" },
          title: String,
          description: String,
          link: String,
          createdAt: { type: Date, default: Date.now },
          uploadedAt: Date,
          meta: {
            width: Number,
            height: Number
          },
          thumbs: Schema.Types.Mixed
        },
        { _id: true }
      )
    ],
    portfolioOrder: [{ type: Schema.Types.ObjectId }],
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
