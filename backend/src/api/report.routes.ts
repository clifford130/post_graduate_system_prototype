import { Router, type Request, type Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import { ReportModel } from "../models/report.model.js";
import multer from "multer";

export const reportRouter = Router();

// ===== AWS S3 Configuration =====
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// ===== Multer Configuration (Memory Storage) =====
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ===== SUBMIT QUARTERLY REPORT =====
reportRouter.post(
  "/reports/submit",
  upload.single("reportFile"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Cast 'req' to 'any' to avoid strict Multer/Express interface conflicts
      const mReq = req as any;
      const accessToken = req.cookies?.userToken;
      const jwtSecret = process.env.JWT_SECRET;

      if (!accessToken || !jwtSecret) {
         res.status(401).json({ success: false, message: "Unauthorized access" });
         return;
      }

      const { reportingQuarter, reportingYear, researchActivities, challengesEncountered, plannedActivities } = req.body;

      if (!mReq.file) {
        res.status(400).json({ error: "Invalid file type. Please upload only PDF files." });
        return;
      }

      const file: any = mReq.file;

      // --- Upload to AWS S3 ---
      const fileName = `${Date.now()}-${file.originalname}`;
      const bucketName = process.env.AWS_S3_BUCKET_NAME || "postgraduate-reports";

      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: `reports/${fileName}`,
        Body: file.buffer,
        ContentType: "application/pdf",
      });

      await s3Client.send(uploadCommand);
      const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/reports/${fileName}`;

      // --- Verify JWT and Save in DB ---
      jwt.verify(accessToken, jwtSecret, async (err: any, load: any) => {
        if (err) {
          res.status(401).json({ message: "Unauthorized token" });
          return;
        }

        try {
          await ReportModel.create({
            owner: load.userNumber,
            reportUrl: publicUrl,
            reportingQuarter: parseInt(reportingQuarter),
            reportingYear: parseInt(reportingYear || new Date().getFullYear().toString()),
            researchActivities,
            challengesEncountered,
            plannedActivities,
            status: "pending",
            approvals: {
              sup1: "pending",
              sup2: "pending",
              sup3: "pending",
              dean: "pending",
              finance: "pending",
            }
          });

          res.status(201).json({
            success: true,
            message: "Report submitted successfully to AWS S3",
            reportUrl: publicUrl,
          });
        } catch (dbError: any) {
          res.status(500).json({ success: false, message: "DB Error: " + dbError.message });
        }
      });

    } catch (error: any) {
      console.error("Error submitting report:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error during file upload",
      });
    }
  },
);
