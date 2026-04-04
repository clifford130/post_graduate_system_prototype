import { Router, type Request, type Response } from "express";
import { PanelEventModel, PanelMemberModel, PanelEvaluationModel, PanelResultModel } from "../models/panel.model.js";
import { UserModel } from "../models/user.model.js";

export const PanelRouter = Router();

const STAGES = [
  "Coursework", "Concept Note (Department)", "Concept Note (School)", 
  "Proposal (Department)", "Proposal (School)", "PG Approval", 
  "Fieldwork", "Thesis Development", "External Examination", "Defense", "Graduation"
];

// 1. Create Panel Event (Director Only)
// POST /api/panels
PanelRouter.post("/panels", async (req: Request, res: Response) => {
  try {
    const { studentId, stage, scheduledDate, panelists, createdBy, chairEmail } = req.body;

    // Rules Enforcement: Min 3 members
    if (!panelists || panelists.length < 3) {
      return res.status(400).json({ message: "Formal rule: Panels must consist of at least 3 members (Chair + 2 Members)." });
    }

    // --- Panelist Conflict Detection ---
    const newDate = new Date(scheduledDate);
    const windowStart = new Date(newDate.getTime() - (2 * 60 * 60 * 1000));
    const windowEnd = new Date(newDate.getTime() + (2 * 60 * 60 * 1000));

    const overlappingMembers = await PanelMemberModel.find({
      email: { $in: panelists.map((p: any) => p.email) }
    }).populate("panelId");

    const conflicts = overlappingMembers.filter((m: any) => {
      const panel = m.panelId;
      if (!panel) return false;
      const pDate = new Date(panel.scheduledDate);
      return pDate >= windowStart && pDate <= windowEnd;
    });

    if (conflicts.length > 0) {
      const conflictList = conflicts.map((m: any) => m.email).join(", ");
      return res.status(409).json({ 
        message: "Conflict Detected: One or more panelists are already booked for another session at this time.", 
        conflicts: conflictList 
      });
    }

    // Create the Panel Event
    const panelEvent = new PanelEventModel({
      studentId,
      stage,
      scheduledDate,
      status: "pending",
      createdBy,
      corrections: [] // Initialize empty checklist
    });
    await panelEvent.save();

    // Create Panel Members
    const memberPromises = panelists.map((p: any) => {
      // Logic: If this panelist matches the chairEmail, assign role 'chair'
      const isChair = p.email === chairEmail;
      
      return new PanelMemberModel({
        panelId: panelEvent._id,
        userId: p.userId || null,
        email: p.email,
        type: p.type, // "internal" | "external"
        role: isChair ? "chair" : "member",
        hasSubmitted: false,
        assignedBy: createdBy, // Metadata for audit
        assignedAt: new Date(),
        status: "active"
      }).save();
    });

    await Promise.all(memberPromises);

    res.status(201).json({ message: "Panel created successfully with formal roles", panelEvent });
  } catch (error) {
    res.status(500).json({ message: "Error creating panel", error });
  }
});

// GET all panels (Director)
PanelRouter.get("/panels", async (req: Request, res: Response) => {
  try {
    const panels = await PanelEventModel.find()
      .populate("studentId", "fullName userNumber programme stage")
      .sort({ createdAt: -1 });
    
    // For each panel, fetch members to show progress
    const panelsWithProgress = await Promise.all(panels.map(async (p) => {
      const members = await PanelMemberModel.find({ panelId: p._id });
      return {
        ...p.toObject(),
        members: members.map(m => ({
          _id: m._id,
          type: m.type,
          role: m.role,
          status: m.status,
          hasSubmitted: m.hasSubmitted,
          email: m.email
        }))
      };
    }));

    res.json(panelsWithProgress);
  } catch (error) {
    res.status(500).json({ message: "Error fetching panels", error });
  }
});

// 2. Fetch Panels for User
// GET /api/panels/my/:userId
PanelRouter.get("/panels/my/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById(userId);
    const email = user?.userNumber || ""; // Assuming userNumber or some field is used for email mapping

    // Find memberships by userId or email (for external if they use the same system)
    const memberships = await PanelMemberModel.find({
      $or: [{ userId: userId }, { email: email }]
    });

    const panelIds = memberships.map(m => m.panelId);
    
    // Fetch panel events and populate student info
    const panels = await PanelEventModel.find({ _id: { $in: panelIds } })
      .populate("studentId", "fullName userNumber programme stage")
      .sort({ scheduledDate: 1 });

    // Combine with submission status
    const result = panels.map(p => {
      const membership = memberships.find(m => m.panelId.toString() === p._id.toString());
      return {
        ...p.toObject(),
        hasSubmitted: membership?.hasSubmitted || false,
        memberId: membership?._id,
        role: membership?.role || "member", // Dynamic role per presentation
        membershipStatus: membership?.status || "active" // Gating field
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user panels", error });
  }
});

// NEW: GET Eligible Panelists (Supervisors, Directors, PG Faculty)
PanelRouter.get("/users/eligible-panelists", async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find({
      role: { $in: ["supervisor", "director", "pg_dean", "faculty", "admin"] }
    }).select("fullName userNumber role department isVerified");
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching eligible panelists", error });
  }
});

// NEW: Reassign Panelist
PanelRouter.post("/panels/:panelId/reassign", async (req: Request, res: Response) => {
  try {
    const { panelId } = req.params;
    const { oldMemberId, newMember, role, assignedBy } = req.body; 
    // newMember payload: { userId, email, type }

    // 1. Revoke old member if provided
    if (oldMemberId) {
      await PanelMemberModel.findByIdAndUpdate(oldMemberId, { 
        status: "revoked", 
        revokedAt: new Date() 
      });
    }

    // 2. Create new membership
    const membership = new PanelMemberModel({
      panelId,
      userId: newMember.userId || null,
      email: newMember.email,
      type: newMember.type,
      role: role || "member",
      hasSubmitted: false,
      assignedBy: assignedBy,
      assignedAt: new Date(),
      status: "active"
    });
    await membership.save();

    res.json({ message: "Panelist reassigned successfully", membership });
  } catch (error) {
    console.error("Reassign error:", error);
    res.status(500).json({ message: "Error reassigning panelist", error });
  }
});

// NEW: Manually Revoke Panelist
PanelRouter.post("/panels/:panelId/revoke", async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    await PanelMemberModel.findByIdAndUpdate(memberId, { 
      status: "revoked", 
      revokedAt: new Date() 
    });
    res.json({ message: "Panelist privileges revoked" });
  } catch (error) {
    console.error("Revoke error:", error);
    res.status(500).json({ message: "Error revoking privileges", error });
  }
});

// GET Panel History for a specific Student
PanelRouter.get("/panels/student/:studentId", async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const panels = await PanelEventModel.find({ studentId })
      .populate("studentId", "fullName userNumber programme stage")
      .sort({ createdAt: -1 });

    const panelsWithResults = await Promise.all(panels.map(async (p) => {
      const result = await PanelResultModel.findOne({ panelId: p._id });
      return { ...p.toObject(), result };
    }));

    res.json(panelsWithResults);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student panel history", error });
  }
});

// 3. Submit Evaluation
// POST /api/panels/evaluate
PanelRouter.post("/panels/evaluate", async (req: Request, res: Response) => {
  try {
    const { memberId, scores, structuredFeedback, verdict } = req.body;

    // 0. Status & Duplicate Check
    const existingMember = await PanelMemberModel.findById(memberId).populate("panelId");
    if (!existingMember) return res.status(404).json({ message: "Member not found" });
    
    const panel = existingMember.panelId as any;
    if (panel.status === "completed") {
      return res.status(403).json({ message: "Board session is closed. No further evaluations can be submitted." });
    }

    if (existingMember.hasSubmitted) {
      return res.status(400).json({ message: "Evaluation already submitted for this panelist." });
    }

    // 1. Save Evaluation
    const evaluation = new PanelEvaluationModel({
      panelMemberId: memberId,
      problemScore: scores.problemScore,
      objectivesScore: scores.objectivesScore,
      literatureScore: scores.literatureScore,
      methodologyScore: scores.methodologyScore,
      presentationScore: scores.presentationScore,
      criticalIssues: structuredFeedback.criticalIssues,
      minorIssues: structuredFeedback.minorIssues,
      recommendations: structuredFeedback.recommendations,
      verdict
    });
    await evaluation.save();

    // 2. Update Member Status & Event Status
    const member = await PanelMemberModel.findByIdAndUpdate(memberId, { hasSubmitted: true }, { new: true });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const panelId = member.panelId;
    await PanelEventModel.findByIdAndUpdate(panelId, { status: "ongoing" });

    // 3. Check for Aggregation
    const allMembers = await PanelMemberModel.find({ panelId });
    const allSubmitted = allMembers.every(m => m.hasSubmitted);

    if (allSubmitted) {
      await aggregatePanelResults(panelId);
    }

    res.json({ message: "Evaluation submitted successfully", evaluation });
  } catch (error) {
    res.status(500).json({ message: "Error submitting evaluation", error });
  }
});

// 4. Fetch Panel Results
// GET /api/panels/:panelId/results
PanelRouter.get("/panels/:panelId/results", async (req: Request, res: Response) => {
  try {
    const result = await PanelResultModel.findOne({ panelId: req.params.panelId });
    if (!result) return res.status(404).json({ message: "Results not yet generated" });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results", error });
  }
});

// 5. CHAIR WORKFLOW: Upload Transcript & Extract Corrections
// POST /api/panels/transcript
PanelRouter.post("/panels/transcript", async (req: Request, res: Response) => {
  try {
    const { panelId, fileName } = req.body;
    
    // Simulate AI Extraction Logic (Level 2 intelligence)
    const suggestedCorrections = [
      { category: "critical", description: "Problem statement lacks alignment with methodology section." },
      { category: "major", description: "Literature review missing recent citations from 2023-2024." },
      { category: "minor", description: "Correct typographical errors on pages 12 and 45." }
    ];

    // Update panel with transcript reference
    await PanelEventModel.findByIdAndUpdate(panelId, { transcriptUrl: `uploads/${fileName}` });

    res.json({ message: "Transcript processed by AI", suggestedCorrections });
  } catch (error) {
    res.status(500).json({ message: "Error processing transcript", error });
  }
});

// 6. CHAIR WORKFLOW: Finalize & Publish Corrections Checklist
// POST /api/panels/:panelId/checklist
PanelRouter.post("/panels/:panelId/checklist", async (req: Request, res: Response) => {
  try {
    const { corrections } = req.body; // Array of {category, description}
    const panelId = req.params.panelId;

    const panel = await PanelEventModel.findById(panelId);
    if (!panel) return res.status(404).json({ message: "Panel not found" });

    if (panel.status === "completed") {
      return res.status(403).json({ message: "Board session is closed. Corrections checklist cannot be modified." });
    }

    // Store as formal trackable objects
    panel.corrections = corrections.map((c: any) => ({
      category: c.category,
      description: c.description,
      status: "pending",
      supervisorSignOff: false
    }));

    await panel.save();

    res.json({ message: "Formal Correction Checklist published to student portal", corrections: panel.corrections });
  } catch (error) {
    res.status(500).json({ message: "Error publishing checklist", error });
  }
});

// 7. STUDENT WORKFLOW: Mark Correction as Fixed
// PATCH /api/panels/:panelId/corrections/:correctionId/fix
PanelRouter.patch("/panels/:panelId/corrections/:correctionId/fix", async (req: Request, res: Response) => {
  try {
    const { panelId, correctionId } = req.params;
    const panel = await PanelEventModel.findById(panelId);
    if (!panel) return res.status(404).json({ message: "Panel not found" });

    const correction = panel.corrections.id(correctionId);
    if (!correction) return res.status(404).json({ message: "Correction item not found" });

    correction.status = "fixed";
    await panel.save();

    res.json({ message: "Correction marked as fixed. Pending supervisor review.", correction });
  } catch (error) {
    res.status(500).json({ message: "Error updating correction", error });
  }
});

// 8. SUPERVISOR WORKFLOW: Approve Correction
// PATCH /api/panels/:panelId/corrections/:correctionId/approve
PanelRouter.patch("/panels/:panelId/corrections/:correctionId/approve", async (req: Request, res: Response) => {
  try {
    const { panelId, correctionId } = req.params;
    const panel = await PanelEventModel.findById(panelId);
    if (!panel) return res.status(404).json({ message: "Panel not found" });

    const correction = panel.corrections.id(correctionId);
    if (!correction) return res.status(404).json({ message: "Correction item not found" });

    correction.status = "approved";
    correction.supervisorSignOff = true;
    await panel.save();

    // --- Finance ERP Integration Trigger ---
    // Rule: If all corrections for the latest panel are approved, trigger Finance Clearance request
    const allApproved = panel.corrections.every((c: any) => c.status === "approved");
    if (allApproved) {
      await UserModel.findByIdAndUpdate(panel.studentId, { 
        $set: { financialClearance: false } // Reset to false to trigger a new Finance review cycle
      });
      console.log(`[Finance ERP] Triggered clearance request for Student ID: ${panel.studentId}`);
    }

    res.json({ message: "Correction officially approved. Dynamic academic record updated.", correction, allApproved });
  } catch (error) {
    res.status(500).json({ message: "Error approving correction", error });
  }
});

// Helper: Aggregation Logic
async function aggregatePanelResults(panelId: any) {
  // Prevent duplicate result generation
  const existingResult = await PanelResultModel.findOne({ panelId });
  if (existingResult) return;

  const members = await PanelMemberModel.find({ panelId });
  const memberIds = members.map(m => m._id);
  
  const evaluations = await PanelEvaluationModel.find({ panelMemberId: { $in: memberIds } });
  if (evaluations.length === 0) return;

  // Calculate Average Score
  let totalScore = 0;
  evaluations.forEach(e => {
    totalScore += (e.problemScore + e.objectivesScore + e.literatureScore + e.methodologyScore + e.presentationScore) / 5;
  });
  const averageScore = totalScore / evaluations.length;

  // Calculate Majority Verdict
  const passCount = evaluations.filter(e => e.verdict === "pass").length;
  const reviseCount = evaluations.filter(e => e.verdict === "revise").length;
  const majorityVerdict = passCount >= reviseCount ? "pass" : "revise";

  // Hybrid Final Decision
  const finalVerdict = (averageScore >= 60 && majorityVerdict === "pass") ? "pass" : "revise";

  // Aggregate Structured Feedback
  const summaryFeedback = {
    critical: evaluations.map(e => e.criticalIssues).filter(Boolean),
    minor: evaluations.map(e => e.minorIssues).filter(Boolean),
    recommendations: evaluations.map(e => e.recommendations).filter(Boolean)
  };

  // Build Panelist Breakdown
  const panelistBreakdown = await Promise.all(evaluations.map(async (e) => {
    const mem = members.find(m => m._id.toString() === e.panelMemberId.toString());
    let name = mem?.email || "Unknown";
    if (mem?.userId) {
      const u = await UserModel.findById(mem.userId);
      if (u) name = u.fullName;
    }
    const score = (e.problemScore + e.objectivesScore + e.literatureScore + e.methodologyScore + e.presentationScore) / 5;
    return { name, type: mem?.type || "internal", score, verdict: e.verdict };
  }));

  // Save Panel Result
  const panelResult = new PanelResultModel({
    panelId,
    averageScore,
    finalVerdict,
    summaryFeedback,
    panelistBreakdown
  });
  await panelResult.save();

  // Update Panel Event status
  await PanelEventModel.findByIdAndUpdate(panelId, { status: "completed" });

  // --- AUTOMATIC ROLE REVOCATION (Section 5) ---
  // When a presentation completes, all panelist privileges are revoked for audit trail
  await PanelMemberModel.updateMany(
    { panelId },
    { $set: { status: "revoked", revokedAt: new Date() } }
  );

  // 5. TRIGGER SYSTEM INTEGRATION
  const panelEvent = await PanelEventModel.findById(panelId);
  if (panelEvent && finalVerdict === "pass") {
    const student = await UserModel.findById(panelEvent.studentId);
    if (student) {
      const currentIdx = STAGES.indexOf(student.stage || "Coursework");
      if (currentIdx !== -1 && currentIdx < STAGES.length - 1) {
        const nextStage = STAGES[currentIdx + 1];
        if (nextStage) {
          student.stage = nextStage;
          await student.save();
        }
      }
    }
  }
}
