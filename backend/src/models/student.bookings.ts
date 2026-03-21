import mongoose, { Model } from "mongoose";
interface Bookings {
  owner: string;
  ownerId: string;
  additionalNotes?: string;
  preferredDate: string;
  preferredTime: string;
  presentationType: string;
  venue: string;
}
let BookingSchema = new mongoose.Schema<Bookings>({
  owner: String,
  ownerId: String,
  additionalNotes: {
    type: String,
    required: false,
  },
  preferredDate: String,
  preferredTime: String,
  presentationType: String,
  venue: String,
});
export let bookingsModel =
  (mongoose.models.bookings as Model<Bookings>) ||
  mongoose.model<Bookings>("bookings", BookingSchema);
