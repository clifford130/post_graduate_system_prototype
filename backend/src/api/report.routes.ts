import { Router, type Request, type Response } from "express";
import { StorageClient } from "@supabase/storage-js";
import jwt from "jsonwebtoken";
import { ReportModel } from "../models/report.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { readFile } from "fs/promises";

export const reportRouter = Router();

// ===== Multer Configuration =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ===== SUBMIT QUARTERLY REPORT =====
// @route   POST /api/reports/submit
// @desc    Submit a quarterly report with optional PDF attachment
// @access  Private (Student)
reportRouter.post(
  "/reports/submit",
  upload.single("reportFile"),
  async (req: Request, res: Response) => {
    try {
      // --- Authorization Check ---
      const accessToken = req.cookies?.userToken;
      const jwtSecret = process.env.JWT_SECRET;

      if (!accessToken || !jwtSecret) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      // --- Body Validation ---
      const {
        reportingQuarter,
        researchActivities,
        challengesEncountered,
        plannedActivities,
      } = req.body;

      if (!reportingQuarter || !researchActivities || !plannedActivities) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: reportingQuarter, researchActivities, plannedActivities",
        });
      }

      // --- Supabase Credentials Check ---
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const PROJECT_REF = process.env.SUPABASE_URL;

      if (!SERVICE_KEY || !PROJECT_REF) {
        return res.status(500).json({ error: "Missing Supabase credentials" });
      }

      // --- File Validation ---
      if (!req.file) {
        return res.status(400).json({
          error: "Invalid file type. Please upload only PDF files.",
        });
      }

      // --- Supabase Storage Setup ---
      const STORAGE_URL = `https://${PROJECT_REF}.supabase.co/storage/v1`;
      const storageClient = new StorageClient(STORAGE_URL, {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      });

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const fileBuffer = await readFile(req.file.path);

      // --- Upload File to Supabase ---
      const { error } = await storageClient
        .from("campusHub_PDF")
        .upload(fileName, fileBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        return res.status(500).json({
          error: "Failed to upload to Supabase",
          newError: error,
        });
      }

      // --- Delete Local File After Upload ---
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to delete local file:", unlinkError);
      }

      // --- Get Public URL ---
      const { data } = storageClient
        .from("campusHub_PDF")
        .getPublicUrl(fileName);
      //
      jwt.verify(accessToken, jwtSecret, async (err: any, load: any) => {
        if (err) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        // --- Save Report in DB ---
        await ReportModel.create({
          owner: load.userNumber,
          reportUrl: data.publicUrl,
          reportingQuarter,
          researchActivities,
          challengesEncountered,
          plannedActivities,
        });
      });

      return res.status(201).json({
        success: true,
        message: "Report submitted successfully",
        reportUrl: data.publicUrl,
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  },
);
