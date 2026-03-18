import mongoose, { Schema, Model } from "mongoose";

// TypeScript Interface
export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  programme: string;
}

//  Schema
const UserSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  role: {
    type: String,
    default: "student",
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  programme: {
    type: String,
    required: true,
    lowercase: true,
  },
});

//  Model
export const UserModel =
  (mongoose.models.user as Model<IUser>) ||
  mongoose.model<IUser>("user", UserSchema);
