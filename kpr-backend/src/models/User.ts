import mongoose, { Schema, Document, CallbackWithoutResultAndOptionalError } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role?: string;
  skills?: string[];
  bio?: string;
  comparePassword(candidate: string): Promise<boolean>;
  isModified(path?: string): boolean;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: "creator" },
    skills: [String],
    bio: { type: String }
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function handleHash(this: IUser, next: CallbackWithoutResultAndOptionalError): Promise<void> {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function comparePassword(this: IUser, candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
