import { Router, type Request, type Response } from "express";
import { UserModel } from "../models/user.model.js";

export const SupervisorRouter = Router();

// 1. Fetch assigned students
// GET /supervisor/:id/students
SupervisorRouter.get("/supervisor/:id/students", async (req: Request, res: Response) => {
  try {
    const supervisorId = req.params.id;
    // Find students where this supervisor is sup1, sup2, or sup3
    const students = await UserModel.find({
      $or: [
        { "supervisors.sup1": supervisorId },
        { "supervisors.sup2": supervisorId },
        { "supervisors.sup3": supervisorId }
      ],
      role: "student"
    } as any);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned students", error });
  }
});

// 2. Accept / Reject student assignment
// POST /students/:id/assign
SupervisorRouter.post("/students/:id/assign", async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    const { supervisorId, action } = req.body; // action: "accepted" | "rejected"
    
    // Determine which slot this supervisor is in
    const student = await UserModel.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let slot = "";
    if (student.supervisors?.sup1 === supervisorId) slot = "sup1";
    else if (student.supervisors?.sup2 === supervisorId) slot = "sup2";
    else if (student.supervisors?.sup3 === supervisorId) slot = "sup3";

    if (!slot) return res.status(403).json({ message: "Supervisor not assigned to this student" });

    const update: any = {};
    update[`assignmentStatus.${slot}`] = action;

    const updatedStudent = await UserModel.findByIdAndUpdate(studentId, { $set: update }, { new: true });
    res.json({ message: `Assignment ${action}`, student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment status", error });
  }
});

// 3. Approve / Return pipeline stages
// POST /students/:id/stage/:stageName/approve
SupervisorRouter.post("/students/:id/stage/:stageName/approve", async (req: Request, res: Response) => {
  try {
    const { id, stageName } = req.params;
    const { action, comment } = req.body; // action: "approved" | "returned"

    // Check if documents are complete (for Thesis/Draft)
    // Simplified: update status in the documents map
    const fieldMapping: any = {
      "conceptNote": "documents.conceptNote",
      "proposal": "documents.proposal",
      "thesis": "documents.thesis"
    };

    const targetField = (fieldMapping as any)[stageName as string];
    const update: any = {};
    if (targetField) update[targetField] = action === "approved" ? "approved" : "rejected";

    // If approved, maybe advance stage?
    // In this system, advance is usually done by Director, but let's allow supervisor small steps
    const student = await UserModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    res.json({ message: `Stage ${action}`, student });
  } catch (error) {
    res.status(500).json({ message: "Error approving stage", error });
  }
});

// 4. Fetch/Update corrections
// GET /students/:id/corrections
SupervisorRouter.get("/students/:id/corrections", async (req: Request, res: Response) => {
  try {
    const student = await UserModel.findById(req.params.id);
    res.json(student?.corrections || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching corrections", error });
  }
});

// POST /students/:id/corrections
SupervisorRouter.post("/students/:id/corrections", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { correctionId, completed, validation, text, source } = req.body;

    if (correctionId) {
      // Update existing
      await UserModel.updateOne(
        { _id: id, "corrections.id": correctionId },
        { 
          $set: { 
            "corrections.$.completed": completed,
            "corrections.$.validation": validation,
            "corrections.$.updatedAt": new Date()
          } 
        }
      );
    } else {
      // Add new
      await UserModel.findByIdAndUpdate(id, {
        $push: { 
          corrections: { 
            id: Math.random().toString(36).substr(2, 9),
            text, 
            source, 
            completed: false, 
            updatedAt: new Date() 
          } 
        }
      });
    }

    const student = await UserModel.findById(id);
    res.json({ message: "Corrections updated", student });
  } catch (error) {
    res.status(500).json({ message: "Error updating corrections", error });
  }
});

// 5. Documents / Quarterly Reports
SupervisorRouter.get("/students/:id/documents", async (req: Request, res: Response) => {
  try {
    const student = await UserModel.findById(req.params.id);
    res.json(student?.documents || {});
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents", error });
  }
});

SupervisorRouter.get("/students/:id/qreports", async (req: Request, res: Response) => {
  try {
    const student = await UserModel.findById(req.params.id);
    res.json(student?.quarterlyReports || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quarterly reports", error });
  }
});
