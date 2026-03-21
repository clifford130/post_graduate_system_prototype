import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { handleIsLogged } from "../auth/is_logged.js";
import { bookingsModel } from "../models/student.bookings.js";
export let studentBookings = Router();
studentBookings.post(
  "/presentations/request",
  async (req: Request, res: Response) => {
    let accessToken = req.cookies?.userToken;
    const jwtSecret = process.env.JWT_SECRET;
    if (!accessToken || !jwtSecret) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }
    if (!req.body) {
      res.status(400).json({ message: "Invalid data" });
      return;
    }
    let {
      additionalNotes,
      preferredDate,
      preferredTime,
      presentationType,
      venue,
    } = req.body;
    if (!preferredDate || !preferredTime || !presentationType || !venue) {
      //   res.status(400).json({ message: "Invalid inputs" });

      return;
    }
    let load = jwt.verify(
      accessToken,
      jwtSecret as string,
      async (err: any, load: any) => {
        if (err) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        try {
          await bookingsModel.create({
            owner: load.userNumber,
            ownerId: load.id,
            additionalNotes: additionalNotes,
            preferredDate: preferredDate,
            preferredTime: preferredTime,
            presentationType: presentationType,
            venue: venue,
          });
          res.status(200).json({ success: true });
          //   res.status(200).json({ success: true });
        } catch (error) {
          res.status(500).json({ success: false });
          console.log(error);
        }
      },
    );
  },
);
