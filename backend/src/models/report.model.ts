import mongoose, { Model } from "mongoose";
interface ReportsStructure {
  owner: string; // student userNumber
  reportUrl: string;
  reportingQuarter: number;
  reportingYear: number;
  researchActivities: string;
  challengesEncountered: string;
  plannedActivities: string;
  status: string; // "pending", "approved", "returned"
  comment?: string;
  submittedAt: Date;
  approvals: {
    sup1: string; // "pending", "approved", "returned"
    sup2: string;
    sup3: string; // PhD only
    dean: string;
    finance: string;
  };
}
let ReportSchema = new mongoose.Schema<ReportsStructure>({
  owner: { type: String, required: true },
  reportUrl: { type: String, required: true },
  reportingQuarter: { type: Number, required: true },
  reportingYear: { type: Number, required: true },
  researchActivities: String,
  challengesEncountered: String,
  plannedActivities: String,
  status: { type: String, default: "pending" },
  comment: String,
  submittedAt: { type: Date, default: Date.now },
  approvals: {
    sup1: { type: String, default: "pending" },
    sup2: { type: String, default: "pending" },
    sup3: { type: String, default: "pending" },
    dean: { type: String, default: "pending" },
    finance: { type: String, default: "pending" },
  },
});
export let ReportModel =
  (mongoose.models.reports as Model<ReportsStructure>) ||
  mongoose.model<ReportsStructure>("reports", ReportSchema);
