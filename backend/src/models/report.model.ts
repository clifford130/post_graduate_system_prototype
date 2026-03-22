import mongoose, { Model } from "mongoose";
interface ReportsStructure {
  owner: string;
  reportUrl: string;
  reportingQuarter: string;
  researchActivities: string;
  challengesEncountered: string;
  plannedActivities: string;
}
let ReportSchema = new mongoose.Schema<ReportsStructure>({
  owner: String,
  reportUrl: String,
  reportingQuarter: String,
  researchActivities: String,
  challengesEncountered: String,
  plannedActivities: String,
});
export let ReportModel =
  (mongoose.models.reports as Model<ReportsStructure>) ||
  mongoose.model<ReportsStructure>("reports", ReportSchema);
