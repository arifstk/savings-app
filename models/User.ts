import mongoose, { Schema, models, model, Document } from "mongoose";

export type UserRole = "admin" | "user";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile?: string;
  password?: string; // optional because Google sign-in users have no password
  image?: string;
  role: UserRole;
  provider: "credentials" | "google";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: undefined,
    },
    password: {
      type: String,
      select: false, // never return password by default
    },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Sparse unique index so multiple users can have no mobile, but no two users
// can share the same mobile number once it's set.
UserSchema.index({ mobile: 1 }, { unique: true, sparse: true });

const User = models.User || model<IUser>("User", UserSchema);

export default User as mongoose.Model<IUser>;
