import { qs, qsa, getSupervisorSession, escapeHtml, toast, openModal, STAGES, COLORS } from './main.js';
import { api } from './api.js';

export async function initStudentDetails() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('id');
  const session = getSupervisorSession();
  const root = qs("#page-content");
  if (!root || !studentId) return;

  try {
    const students = await api.getAssignedStudents(session.id);
    const detail = students.find(s => s._id === studentId);

    if (!detail) throw new Error("Student not found or not assigned to you");

    renderStudentDetail(detail, session.id);
  } catch (err) {
    root.innerHTML = `<div class="p-12 text-center text-red-500 font-bold bg-white rounded-3xl animate-in shadow-xl">
        <div class="text-4xl mb-4">❌</div>
        <div>Error loading student profile: ${err.message}</div>
      </div>`;
  }
}

function renderStudentDetail(student, supervisorId) {
  const root = qs("#page-content");
  const stageIndex = STAGES.indexOf(student.stage || "Coursework");
  const progressPercent = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  root.innerHTML = `
    <div class="space-y-8 animate-in pb-20">
      <!-- Top Row: Student Header -->
      <div class="flex flex-col lg:flex-row gap-8 lg:items-center justify-between px-1">
        <div class="flex items-center gap-6">
          <div class="h-20 w-20 rounded-[2rem] bg-rongo-dark text-white grid place-items-center font-black text-3xl shadow-xl shadow-rongo-dark/20 relative">
             ${student.fullName.substring(0, 1)}
             <div class="absolute -right-2 -bottom-2 h-8 w-8 rounded-full bg-[#f2c335] border-4 border-[#f2f2f2] grid place-items-center text-[10px] font-black text-[#194973]">AI</div>
          </div>
          <div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Academic Profile & Supervision</div>
            <h2 class="text-3xl sm:text-5xl font-black text-rongo-dark -tracking-tighter">${student.fullName}</h2>
            <div class="flex items-center gap-3 mt-2 text-sm font-bold text-slate-500">
               <span>ID: ${student.userNumber}</span>
               <span class="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
               <span>${student.department?.toUpperCase()} • ${student.programme?.toUpperCase()}</span>
               ${student.atRisk ? '<span class="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-black uppercase tracking-widest">At Risk</span>' : ''}
            </div>
          </div>
        </div>
        <div class="flex gap-4">
           <button class="bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-2 btn-message-templates">
              <span>✉️</span> Message Student
           </button>
           <button class="bg-[#14b5d9] hover:bg-[#119dbb] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#14b5d9]/40 transition btn-action-center" data-id="${student._id}">Supervision Action</button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Requirements & Documents & chain -->
        <div class="lg:col-span-2 space-y-8">
           
           <!-- AI Recommendations & Smart Prereqs -->
           <div class="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 shadow-sm">
              <div class="flex items-center justify-between mb-6">
                 <div class="text-xl font-black text-emerald-900 flex items-center gap-2">
                    <span>✨</span> AI Supervision Assistant
                 </div>
                 <button class="bg-emerald-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl hover:bg-emerald-700 transition btn-run-ai">Run Prerequisite Engine</button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="bg-white/60 p-6 rounded-2xl border border-emerald-200">
                    <div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Suggested Next Stage</div>
                    <div class="text-lg font-black text-emerald-900">${student.automation?.suggestedStage || "System Analysis Required"}</div>
                 </div>
                 <div class="bg-white/60 p-6 rounded-2xl border border-emerald-200">
                    <div class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Milestone Health</div>
                    <ul class="text-xs font-bold text-emerald-800 space-y-1">
                       ${(student.automation?.aiFlags || []).length ? student.automation.aiFlags.map(f => `<li>• ${f}</li>`).join('') : '<li>• No immediate bottlenecks detected</li>'}
                    </ul>
                 </div>
              </div>
           </div>

           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-2xl font-black text-rongo-dark mb-6 flex items-center gap-3">
                 <span class="text-2xl">📁</span>
                 Documents & Prerequisites
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 ${renderRequirement("Concept Note", student.documents?.conceptNote)}
                 ${renderRequirement("Proposal Document", student.documents?.proposal)}
                 ${renderRequirement("Thesis Draft", student.documents?.thesis)}
                 ${renderRequirement("NACOSTI Permit", student.documents?.nacosti)}
                 ${renderRequirement("Journal Paper", student.documents?.journalPaper)}
                 ${renderRequirement("Mentorship Form", student.documents?.mentorship)}
              </div>
           </div>

           <!-- Quarterly Reports Monitoring -->
           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-2xl font-black text-rongo-dark mb-6 flex items-center gap-3">
                 <span class="text-2xl">📋</span>
                 Quarterly Progress Reports
              </div>
              <div class="space-y-4">
                 ${renderReports(student.quarterlyReports)}
              </div>
           </div>
        </div>

        <!-- Right: Academic Timeline & Approval Chain -->
        <div class="space-y-8">
           
           <!-- Approval Chain Visualization -->
           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-xl font-black text-rongo-dark mb-8">Active Approval Chain</div>
              <div class="relative space-y-10 pl-6 border-l-2 border-slate-100 ml-4">
                 ${renderApprovalChain(student.quarterlyReports?.[0]?.approvals)}
              </div>
           </div>

           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-xl font-black text-rongo-dark mb-6 flex items-center justify-between">
                 <span>Corrections Log</span>
                 <span class="text-[10px] font-black uppercase bg-[#14b5d9] text-white px-2 py-1 rounded">Smart Checker</span>
              </div>
              <div class="space-y-4">
                 ${renderCorrections(student.corrections)}
              </div>
              <button class="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-bold text-sm hover:border-slate-300 hover:text-slate-500 transition btn-add-correction">+ Manual Correction Entry</button>
           </div>

           <div class="bg-[#194973] rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden group">
              <div class="relative z-10">
                 <div class="text-xl font-black mb-2 uppercase tracking-tight">Supervision Log</div>
                 <textarea class="w-full bg-white/10 rounded-2xl p-4 text-sm placeholder:text-white/30 border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#14b5d9] transition-all" rows="4" placeholder="Confidential supervision remarks..."></textarea>
                 <button class="w-full mt-4 bg-[#f2c335] text-[#194973] py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-white transition shadow-lg">Commit to Records</button>
              </div>
              <div class="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#14b5d9]/20 group-hover:scale-110 transition duration-700"></div>
           </div>

        </div>
      </div>
    </div>
  `;

  setupDetailEvents(student);
}

function renderRequirement(name, status) {
  const s = String(status || "pending").toLowerCase();
  const tones = {
     approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
     rejected: "bg-rose-50 text-rose-700 border-rose-100",
     pending: "bg-slate-50 text-slate-400 border-slate-100"
  };
  const tone = tones[s] || tones.pending;
  const icon = s === "approved" ? "✅" : (s === "rejected" ? "❌" : "⏳");
  
  return `
    <div class="p-6 rounded-2xl border ${tone} flex items-center justify-between group cursor-pointer hover:shadow-md transition shadow-sm">
       <div class="min-w-0">
          <div class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">${s}</div>
          <div class="text-sm font-black truncate">${name}</div>
       </div>
       <div class="text-xl shrink-0 group-hover:scale-125 transition duration-300">${icon}</div>
    </div>
  `;
}

function renderReports(reports = []) {
  if (!reports.length) return `<div class="p-6 py-10 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting first submission</div>`;
  
  return reports.map(r => `
    <div class="p-6 rounded-2xl border border-slate-100 bg-white flex items-center justify-between hover:border-[#14b5d9]/20 transition shadow-sm">
       <div class="flex items-center gap-4">
          <div class="h-10 w-10 bg-[#194973] text-white rounded-xl flex items-center justify-center font-bold text-xs uppercase">Q${r.quarter}</div>
          <div class="min-w-0">
             <div class="text-sm font-black text-rongo-dark">Quarter ${r.quarter} - ${r.year}</div>
             <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Submitted: ${new Date(r.submittedAt).toLocaleDateString()}</div>
          </div>
       </div>
       <div class="flex items-center gap-4">
          <div class="text-[10px] font-bold uppercase tracking-widest ${r.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'} bg-slate-50 px-3 py-1 rounded-full">${r.status}</div>
          ${r.status === 'pending' ? `<button class="bg-[#14b5d9] text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl btn-review-report" data-id="${r.id}">Verify</button>` : ''}
       </div>
    </div>
  `).join('');
}

function renderApprovalChain(approvals = {}) {
  const steps = [
    { key: "sup1", label: "Principal Supervisor" },
    { key: "sup2", label: "Second Supervisor" },
    { key: "sup3", label: "Third Supervisor" },
    { key: "dean", label: "Dean of School" },
    { key: "finance", label: "Finance Officer" }
  ];

  return steps.map(s => {
    const status = (approvals[s.key] || "pending").toLowerCase();
    const isApproved = status === "approved";
    return `
      <div class="relative flex items-center gap-6">
         <div class="absolute -left-[31px] h-4 w-4 rounded-full border-4 border-white ${isApproved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}"></div>
         <div>
            <div class="text-xs font-black text-rongo-dark uppercase tracking-wide leading-none">${s.label}</div>
            <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">${status}</div>
         </div>
      </div>
    `;
  }).join('');
}

function renderCorrections(corrections = []) {
  if (!corrections.length) return `<div class="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 font-black uppercase tracking-widest text-xs">No entries</div>`;
  
  return corrections.map(c => `
    <div class="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-3 group">
       <input type="checkbox" ${c.completed ? 'checked' : ''} class="mt-1 h-4 w-4 rounded border-slate-300 text-[#14b5d9] focus:ring-[#14b5d9] btn-check-correction" data-id="${c.id}">
       <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-800 font-bold ${c.completed ? 'line-through opacity-40' : ''}">${escapeHtml(c.text)}</div>
          <div class="text-[8px] font-black text-[#14b5d9] uppercase tracking-widest mt-1">${c.source} Flagged</div>
       </div>
    </div>
  `).join('');
}

function setupDetailEvents(student) {
  qs(".btn-action-center").onclick = () => { openActionCenter(student); };
  
  qs(".btn-message-templates")?.addEventListener("click", () => {
     openTemplatesModal(student);
  });

  qs(".btn-run-ai")?.addEventListener("click", async () => {
     toast("AI Engine: Analyzing prerequisites...", { tone: "blue" });
     try {
        await api.triggerAutoCheck(student._id);
        toast("Intelligence Update Complete", { tone: "green" });
        window.location.reload();
     } catch(e) { toast("Error: " + e.message, { tone: "red" }); }
  });

  qsa(".btn-review-report").forEach(btn => {
     btn.onclick = () => { openReportApprovalModal(student, btn.dataset.id); };
  });
}

function openTemplatesModal(student) {
   openModal({
      title: `Communication Templates: ${student.fullName}`,
      size: "sm",
      bodyHtml: `
         <div class="space-y-4">
            <button class="w-full text-left p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition btn-template" data-text="Dear ${student.fullName}, your Quarterly Report is overdue. Please submit via the portal immediately.">
               <div class="text-sm font-black text-rongo-dark">Report Overdue</div>
               <div class="text-[10px] text-slate-400 font-bold mt-1">Sends immediate reminder to student portal.</div>
            </button>
            <button class="w-full text-left p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition btn-template" data-text="Congratulations, your Concept Note has been approved. Please proceed to Proposal drafting.">
               <div class="text-sm font-black text-rongo-dark">Milestone Approval</div>
               <div class="text-[10px] text-slate-400 font-bold mt-1">Encouraging progress feedback.</div>
            </button>
            <button class="w-full text-left p-6 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
               Create Custom Template
            </button>
         </div>
      `
   });
   qsa(".btn-template").forEach(btn => {
      btn.onclick = () => { toast("Message queued for delivery", { tone: "green" }); };
   });
}

function openReportApprovalModal(student, reportId) {
   const session = getSupervisorSession();
   openModal({
      title: "Quarterly Report Verification",
      bodyHtml: `
         <div class="space-y-6">
            <div class="p-6 bg-[#194973] rounded-3xl text-white">
               <div class="text-[10px] font-black uppercase text-white/50 mb-2">Role Verification</div>
               <div class="text-lg font-black">${session.name} (Principal)</div>
            </div>
            <div>
               <label class="block text-[10px] font-black uppercase text-slate-400 mb-2">Review Remarks</label>
               <textarea id="report-comment" class="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-[#14b5d9] outline-none transition-all" rows="4" placeholder="Enter findings or required adjustments..."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <button class="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs btn-submit-report-approval" data-action="approved">Approve Report</button>
               <button class="py-4 bg-[#bf8c2c] text-white rounded-2xl font-black uppercase tracking-widest text-xs btn-submit-report-approval" data-action="returned">Return for Review</button>
            </div>
         </div>
      `
   });

   qsa(".btn-submit-report-approval").forEach(btn => {
      btn.onclick = async () => {
         try {
            await api.approveQReport(student._id, reportId, {
               supervisorId: session.id,
               role: "sup1",
               action: btn.dataset.action,
               comment: qs("#report-comment").value
            });
            toast("Report verification transmitted", { tone: "green" });
            window.location.reload();
         } catch(e) { toast("Error: " + e.message, { tone: "red" }); }
      };
   });
}

function openActionCenter(student) {
   openModal({
      title: `Authority Center - ${student.fullName}`,
      size: "md",
      bodyHtml: `
         <div class="space-y-6">
            <div class="p-8 bg-[#194973] rounded-[2.5rem] text-white shadow-xl">
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-6 bg-white/5 rounded-2xl border border-white/10">
                     <div class="text-3xl mb-2">💎</div>
                     <div class="text-sm font-black">Approve Stage</div>
                     <div class="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest">Permanent Milestone Approval</div>
                  </div>
                   <div class="p-6 bg-white/5 rounded-2xl border border-white/10 opacity-50">
                     <div class="text-3xl mb-2">🔄</div>
                     <div class="text-sm font-black">Request Transfer</div>
                     <div class="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest">Administrative Move</div>
                  </div>
               </div>
            </div>
            
            <div class="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <label class="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest leading-none">Formal Decision & Remarks</label>
               <textarea class="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-[#14b5d9] outline-none transition-all mb-4" rows="4" placeholder="Supervisor validation statement..."></textarea>
               <div class="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                  <input type="checkbox" id="confirm-authority" class="h-5 w-5 rounded border-slate-300 text-[#14b5d9]">
                  <label for="confirm-authority" class="text-xs font-bold text-slate-600">I confirm this action follows RU Postgrad Regulations</label>
               </div>
            </div>
         </div>
      `,
      footerHtml: `
         <div class="flex items-center justify-between">
            <button class="px-8 py-3 bg-[#f2f2f2] text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
            <button class="px-10 py-4 bg-[#194973] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#194973]/20 hover:bg-[#14b5d9] transition">Submit Decision</button>
         </div>
      `
   });
}
