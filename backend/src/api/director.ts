import { Router, type Request, type Response } from "express";
import { UserModel } from "../models/user.model.js";

export const DirectorRouter = Router();

// 1. GET /dashboard/stats
DirectorRouter.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const students = await UserModel.find({ role: "student" });
    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === "Active").length,
      stalledStudents: students.filter(s => s.atRisk).length,
      pendingClearances: students.filter(s => !s.financialClearance).length,
      departmentStats: {
        CJM: students.filter(s => s.department?.toUpperCase() === "CJM").length,
        IHRS: students.filter(s => s.department?.toUpperCase() === "IHRS").length,
      },
      stageDistribution: students.reduce((acc: any, s) => {
        const stage = s.stage || "Coursework";
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {})
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error });
  }
});

// 2. GET /students
DirectorRouter.get("/students", async (req: Request, res: Response) => {
  try {
    const { q, stage, department, status } = req.query;
    const filter: any = { role: "student" };
    
    if (q) filter.fullName = { $regex: q, $options: "i" };
    if (stage) filter.stage = stage;
    if (department) filter.department = department.toString().toLowerCase();
    if (status) filter.status = status;

    const students = await UserModel.find(filter);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error });
  }
});

// 3. GET /students/:id
DirectorRouter.get("/students/:id", async (req: Request, res: Response) => {
  try {
    const student = await UserModel.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student details", error });
  }
});

// 4. POST /students/:id/stage
DirectorRouter.post("/students/:id/stage", async (req: Request, res: Response) => {
  try {
    const { stage, mode, reason } = req.body;
    const update: any = { stage };
    if (reason) {
      // Logic for audit trail can be added here
    }
    const student = await UserModel.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ message: "Stage updated", student });
  } catch (error) {
    res.status(500).json({ message: "Error updating stage", error });
  }
});

// 5. POST /students/:id/supervisors
DirectorRouter.post("/students/:id/supervisors", async (req: Request, res: Response) => {
  try {
    const { sup1, sup2, sup3 } = req.body;
    const student = await UserModel.findByIdAndUpdate(req.params.id, {
      supervisors: { sup1, sup2, sup3 }
    }, { new: true });
    res.json({ message: "Supervisors assigned", student });
  } catch (error) {
    res.status(500).json({ message: "Error assigning supervisors", error });
  }
});

// 6. POST /students/:id/flag
DirectorRouter.post("/students/:id/flag", async (req: Request, res: Response) => {
  try {
    const { atRisk, note } = req.body;
    const student = await UserModel.findByIdAndUpdate(req.params.id, { 
      atRisk,
      $push: { notes: note }
    }, { new: true });
    res.json({ message: "Student flag updated", student });
  } catch (error) {
    res.status(500).json({ message: "Error flagging student", error });
  }
});

// 7. GET /pipeline
DirectorRouter.get("/pipeline", async (req: Request, res: Response) => {
  try {
    const students = await UserModel.find({ role: "student" });
    // Structure for the Kanban board
    const pipeline = students.map(s => ({
      id: s._id,
      name: s.fullName,
      regNo: s.userNumber,
      stage: s.stage || "Coursework",
      atRisk: s.atRisk,
      department: s.department
    }));
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pipeline", error });
  }
});
