import { Router, type Request, type Response } from "express";
import { handleIsLogged } from "../auth/is_logged.js";
import { bookingsModel } from "../models/student.bookings.js";
export let studentBookings = Router();
studentBookings.post(
  "/presentations/request",
  async (req: Request, res: Response) => {
    handleIsLogged(req, res);
    if (!req.body) {
      res.status(400).json({ message: "Invalid data" });
      return;
    }
    let {
      additionalNotes,
      preferredDate,
      preferredTime,
      presentationType,
      timestamp,
      venue,
    } = req.body;
    if (
      !additionalNotes ||
      !preferredDate ||
      !preferredTime ||
      !presentationType ||
      !timestamp ||
      !venue
    ) {
      res.status(400).json({ message: "Invalid inputs" });
      return;
    }
    await bookingsModel.create({});
  },
);
