import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
export const UserLoginRouter = Router();
UserLoginRouter.post("/", async (req, res) => {
    try {
        if (!req.body) {
            res.status(400).json({ message: "Body is empty" });
            return;
        }
        const { email, password } = req.body;
        // 1. Validate input
        if (!email || !password) {
            res.status(400).json({
                message: "Email and password are required",
            });
            return;
        }
        let User = await UserModel.findOne({ email: email });
        if (!User) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        // 3. Compare password
        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch) {
            res.status(401).json({
                message: "Invalid credentials",
            });
            return;
        }
        const RawJwtSecret = process.env.JWT_SECRET;
        //   if (!RawJwtSecret) {
        //     throw Error("RawJWTSEcret not found");
        //   }
        // 4. Generate JWT
        const token = jwt.sign({
            id: User.id,
            email: User.email,
            role: User.role,
        }, RawJwtSecret, { expiresIn: "1d" });
        res.cookie("userToken", token);
        // 5. Send response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: User.id,
                email: User.email,
                role: User.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Server error on Login",
            error,
        });
        console.log(error);
    }
});
//# sourceMappingURL=login.js.map