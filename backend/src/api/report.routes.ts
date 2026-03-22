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

// Helper function to get user from token (promise-based)
const getUserFromToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

// Define custom error type
interface MulterError extends Error {
  code?: string;
}

// ===== SUBMIT QUARTERLY REPORT =====
// @route   POST /api/reports/submit
// @desc    Submit a quarterly report with optional PDF attachment
// @access  Private (Student)
reportRouter.post(
  "/reports/submit",
  upload.single("reportFile"),
  async (req: Request, res: Response) => {
    let filePath: string | null = null;

    try {
      // --- Authorization Check ---
      const accessToken = req.cookies?.userToken;
      const jwtSecret = process.env.JWT_SECRET;

      if (!accessToken || !jwtSecret) {
        // Clean up uploaded file if exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
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
        // Clean up uploaded file if exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
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
        // Clean up uploaded file if exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          error: "Missing Supabase credentials",
        });
      }

      // --- File Validation ---
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded. Please upload a PDF file.",
        });
      }

      filePath = req.file.path;

      // --- Verify JWT and get user data ---
      let decoded;
      try {
        decoded = await getUserFromToken(accessToken, jwtSecret);
      } catch (jwtError) {
        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // --- Check for existing report (optional - prevent duplicates) ---
      const existingReport = await ReportModel.findOne({
        reportingQuarter: reportingQuarter,
        ownerId: decoded.id,
      });

      if (existingReport) {
        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          message: `You have already submitted a report for ${reportingQuarter}`,
        });
      }

      // --- Supabase Storage Setup ---
      const STORAGE_URL = `https://${PROJECT_REF}.supabase.co/storage/v1`;
      const storageClient = new StorageClient(STORAGE_URL, {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      });

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const fileBuffer = await readFile(filePath);

      // --- Upload File to Supabase ---
      const { error: uploadError } = await storageClient
        .from("campusHub_PDF")
        .upload(fileName, fileBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        // Clean up local file
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(500).json({
          success: false,
          error: "Failed to upload to Supabase",
          details: uploadError.message,
        });
      }

      // --- Delete Local File After Upload ---
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error("Failed to delete local file:", unlinkError);
      }

      // --- Get Public URL ---
      const { data } = storageClient
        .from("campusHub_PDF")
        .getPublicUrl(fileName);

      // --- Save Report in DB ---
      const newReport = await ReportModel.create({
        owner: decoded.userNumber || decoded.id,
        ownerId: decoded.id,
        reportUrl: data.publicUrl,
        reportingQuarter,
        researchActivities,
        challengesEncountered: challengesEncountered || "",
        plannedActivities,
      });

      return res.status(201).json({
        success: true,
        message: "Report submitted successfully",
        reportUrl: data.publicUrl,
      });
    } catch (error) {
      console.error("Error submitting report:", error);

      // Clean up local file if it exists
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      // Check if headers already sent
      if (res.headersSent) {
        console.log("Headers already sent, cannot send error response");
        return;
      }

      // Type guard to check if error is MulterError
      const isMulterError = (err: unknown): err is MulterError => {
        return err instanceof Error && "code" in err;
      };

      // Handle specific Multer errors
      if (isMulterError(error) && error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB.",
          });
        }
        if (error.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Only one file allowed.",
          });
        }
      }

      // Handle file type error
      if (
        error instanceof Error &&
        error.message === "Only PDF files are allowed"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Handle general errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  },
);

// Add error handling middleware for multer errors
reportRouter.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file allowed.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Please use "reportFile".',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err instanceof Error && err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});
