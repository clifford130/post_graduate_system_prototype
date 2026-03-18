import mongoose, { Schema, Model } from "mongoose";
//  Schema
const UserSchema = new Schema({
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
export const UserModel = mongoose.models.user ||
    mongoose.model("user", UserSchema);
//# sourceMappingURL=user.model.js.map