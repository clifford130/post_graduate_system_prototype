import mongoose, { Schema, Model } from "mongoose";

// TypeScript Interface
export interface IUser {
  fullName: string;
  userNumber: string;
  password: string;
  role: string;
  isVerified: boolean;
  programme: string;
  department: string;
  status: string;
  stage?: string;
  atRisk?: boolean;
  notes?: string[];
  financialClearance?: boolean;
  supervisors?: {
    sup1?: string;
    sup2?: string;
    sup3?: string;
  };
  documents?: {
    conceptNote?: string; // status: "pending", "approved", "rejected"
    proposal?: string;
    thesis?: string;
  };
}

//  Schema
const UserSchema = new Schema<IUser>({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  userNumber: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    default: "student123",
    type: String,
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
  department: {
    type: String,
    required: true,
    lowercase: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  stage: {
    type: String,
    default: "Coursework",
  },
  atRisk: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: [String],
    default: [],
  },
  financialClearance: {
    type: Boolean,
    default: false,
  },
  supervisors: {
    sup1: { type: String, default: "" },
    sup2: { type: String, default: "" },
    sup3: { type: String, default: "" },
  },
  documents: {
    conceptNote: { type: String, default: "pending" },
    proposal: { type: String, default: "pending" },
    thesis: { type: String, default: "pending" },
  },
});

//  Model
export const UserModel =
  (mongoose.models.user as Model<IUser>) ||
  mongoose.model<IUser>("user", UserSchema);
