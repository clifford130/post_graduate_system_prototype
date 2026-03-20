import mongoose, { Model } from "mongoose";
interface Bookings {
  additionalNotes?: string;
  preferredDate: string;
  preferredTime: string;
  presentationType: string;
  timestamp: Date;
  venue: string;
}
let BookingSchema = new mongoose.Schema<Bookings>({
  additionalNotes: {
    type: String,
    required: false,
    default: "",
  },
  preferredDate: String,
  preferredTime: String,
  presentationType: String,
  timestamp: Date,
  venue: String,
});
export let bookingsModel =
  (mongoose.models.bookings as Model<Bookings>) ||
  mongoose.model<Bookings>("bookings", BookingSchema);
