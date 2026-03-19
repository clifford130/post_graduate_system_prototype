import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
import { SupervisorAssignmentModel } from "../models/supervisor-action.model.js";

export const UserLoginRouter = Router();

UserLoginRouter.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body) {
        res.status(400).json({ message: "Body is empty" });
        return;
      }
      const { userNumber, password } = req.body;

      // 1. Validate input
      if (!userNumber || !password) {
        res.status(400).json({
          message: "userNumber and password are required",
        });
        return;
      }
      let User = await UserModel.findOne({ userNumber: userNumber });
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
      let supervisor = await SupervisorAssignmentModel.findOne({
        studentRegNo: userNumber,
      });

      const RawJwtSecret = process.env.JWT_SECRET;
      //   if (!RawJwtSecret) {
      //     throw Error("RawJWTSEcret not found");
      //   }
      // 4. Generate JWT
      const token = jwt.sign(
        {
          id: User.id,
          userNumber: User.userNumber,
          role: User.role,
        },
        RawJwtSecret as string,
        { expiresIn: "1d" },
      );
      res.cookie("userToken", token);
      // 5. Send response
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: User.id,
          supervisor: supervisor?.supervisorName,
          userNumber: User.userNumber,
          role: User.role,
          fullName: User.fullName,
          programme: User.programme,
          department: User.department,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error on Login",
        error,
      });
      console.log(error);
    }
  },
);
