import { qs, qsa, getSupervisorSession, escapeHtml, toast, openModal, STAGES, COLORS } from './main.js';
import { api } from './api.js';

export async function initStudentDetails() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('id');
  const session = getSupervisorSession();
  const root = qs("#page-content");
  if (!root || !studentId) return;

  try {
    const student = await api.getDocuments(studentId); // This returns the full student object actually
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
          <div class="h-20 w-20 rounded-[2rem] bg-rongo-dark text-white grid place-items-center font-black text-3xl shadow-xl shadow-rongo-dark/20">${student.fullName.substring(0, 1)}</div>
          <div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Academic Profile</div>
            <h2 class="text-3xl sm:text-5xl font-black text-rongo-dark -tracking-tighter">${student.fullName}</h2>
            <div class="flex items-center gap-3 mt-2 text-sm font-bold text-slate-500">
               <span>ID: ${student.userNumber}</span>
               <span class="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
               <span>${student.department?.toUpperCase()} • ${student.programme?.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-4">
           <div class="px-6 py-4 bg-white rounded-2xl flex flex-col justify-center border border-slate-100 shadow-sm">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Overall Progress</div>
              <div class="text-2xl font-black text-rongo-dark leading-none mt-2">${progressPercent}%</div>
           </div>
           <button class="bg-[#14b5d9] hover:bg-[#119dbb] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#14b5d9]/40 transition btn-action-center" data-id="${student._id}">Supervision Action</button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: Requirements & Documents -->
        <div class="lg:col-span-2 space-y-8">
           
           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-2xl font-black text-rongo-dark mb-6 flex items-center gap-3">
                 <span class="text-2xl">📁</span>
                 Documents & Requirements
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
              <button class="mt-8 text-rongo-dark font-black uppercase tracking-widest text-xs hover:underline">View Historical Archives →</button>
           </div>
        </div>

        <!-- Right: Academic Timeline & Corrections -->
        <div class="space-y-8">
           
           <div class="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-50">
              <div class="text-xl font-black text-rongo-dark mb-6 flex items-center justify-between">
                 <span>Corrections Log</span>
                 <span class="text-[10px] font-black uppercase bg-rongo-dark text-white px-2 py-1 rounded">Validation Required</span>
              </div>
              <div class="space-y-4">
                 ${renderCorrections(student.corrections)}
              </div>
              <button class="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-bold text-sm hover:border-slate-300 hover:text-slate-500 transition btn-add-correction">+ Manual Entry (Presentation)</button>
           </div>

           <div class="bg-[#194973] rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden group">
              <div class="relative z-10">
                 <div class="text-xl font-black mb-2 uppercase tracking-tight">Supervisor Note</div>
                 <div class="text-xs text-white/50 mb-6 font-bold uppercase tracking-widest leading-none">${student.programme} Supervision</div>
                 <textarea class="w-full bg-white/10 rounded-2xl p-4 text-sm placeholder:text-white/30 border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#14b5d9] transition-all" rows="4" placeholder="Type internal supervision note for local tracking..."></textarea>
                 <button class="w-full mt-4 bg-[#14b5d9] text-[#194973] py-3 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#f2f2f2] transition shadow-lg">Save Note Locally</button>
              </div>
              <!-- UI Ornament -->
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
          <div class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Status: ${s}</div>
          <div class="text-sm font-black truncate">${name}</div>
       </div>
       <div class="text-xl shrink-0 group-hover:scale-125 transition duration-300">${icon}</div>
    </div>
  `;
}

function renderReports(reports = []) {
  if (!reports.length) return `<div class="p-6 py-10 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold uppercase tracking-widest text-sm">No quarterly reports submitted</div>`;
  
  return reports.map(r => `
    <div class="p-6 rounded-2xl border border-slate-100 bg-white flex items-center justify-between hover:border-rongo-dark/20 transition shadow-sm">
       <div class="flex items-center gap-4">
          <div class="h-10 w-10 bg-rongo-dark text-white rounded-xl flex items-center justify-center font-bold text-xs uppercase">Q${r.quarter}</div>
          <div>
             <div class="text-sm font-black text-rongo-dark">Academic Year ${r.year}</div>
             <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${r.status === "approved" ? "✅ Approved" : (r.status === "returned" ? "❌ Returned" : "⏳ Under Review")}</div>
          </div>
       </div>
       <div class="flex items-center gap-2">
          ${r.status === 'pending' ? `<button class="text-[10px] font-black uppercase tracking-widest text-rongo-blue hover:underline btn-review-report" data-id="${r.id}">Review & Approve</button>` : `<div class="text-xs font-bold text-slate-300">Closed</div>`}
       </div>
    </div>
  `).join('');
}

function renderCorrections(corrections = []) {
  if (!corrections.length) return `<div class="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 font-black uppercase tracking-widest text-xs">No pending corrections</div>`;
  
  return corrections.map(c => `
    <div class="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-3">
       <input type="checkbox" ${c.completed ? 'checked' : ''} class="mt-1.5 h-4 w-4 rounded border-slate-300 text-rongo-blue focus:ring-rongo-blue btn-check-correction" data-id="${c.id}">
       <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-800 ${c.completed ? 'line-through opacity-50' : ''}">${escapeHtml(c.text)}</div>
          <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">${c.source} Submission</div>
       </div>
    </div>
  `).join('');
}

function setupDetailEvents(student) {
  qs(".btn-action-center").onclick = () => {
     openActionCenter(student);
  };
}

function openActionCenter(student) {
   openModal({
      title: `${student.fullName} - Supervision Action`,
      size: "md",
      bodyHtml: `
         <div class="space-y-6">
            <div class="p-6 bg-rongo-dark rounded-3xl text-white shadow-xl shadow-rongo-dark/20">
               <div class="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Available Stage Actions</div>
               <div class="text-xl font-black mb-4">Pipeline Authority Center</div>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button class="p-6 bg-white/10 rounded-2xl text-left border border-white/5 hover:bg-white/20 transition group">
                     <div class="text-xl mb-2 group-hover:scale-125 transition">📝</div>
                     <div class="text-sm font-black pr-4">Approve Quarterly Report</div>
                  </button>
                  <button class="p-6 bg-white/10 rounded-2xl text-left border border-white/5 hover:bg-white/20 transition group">
                     <div class="text-xl mb-2 group-hover:scale-125 transition">💎</div>
                     <div class="text-sm font-black pr-4">Approve Research Proposal</div>
                  </button>
                  <button class="p-6 bg-white/10 rounded-2xl text-left border border-white/5 hover:bg-white/20 transition group">
                     <div class="text-xl mb-2 group-hover:scale-125 transition">📜</div>
                     <div class="text-sm font-black pr-4">Sign-off Thesis Corrections</div>
                  </button>
                  <button class="p-6 bg-white/10 rounded-2xl text-left border border-white/5 hover:bg-white/20 transition group">
                     <div class="text-xl mb-2 group-hover:scale-125 transition">🚩</div>
                     <div class="text-sm font-black pr-4">Request Deferred Status</div>
                  </button>
               </div>
            </div>

            <div class="p-6 bg-slate-50 rounded-3xl">
               <div class="text-sm font-black text-rongo-dark mb-4">Direct Stage Override (Supervisor Approval)</div>
               <div class="space-y-4">
                  <div>
                     <label class="block text-[10px] font-black uppercase text-slate-500 mb-2">Target Action</label>
                     <select class="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-white focus:ring-2 focus:ring-rongo-blue outline-none transition-all">
                        <option>Approve Current Stage (Auto-Advance)</option>
                        <option>Return for Corrections</option>
                        <option>Endorse for Graduation Dept Review</option>
                     </select>
                  </div>
                  <div>
                     <label class="block text-[10px] font-black uppercase text-slate-500 mb-2">Validation Remarks</label>
                     <textarea class="w-full rounded-xl border border-slate-200 p-4 text-sm focus:ring-2 focus:ring-rongo-blue outline-none transition-all" rows="4" placeholder="Supervisor professional remarks..."></textarea>
                  </div>
               </div>
            </div>
         </div>
      `,
      footerHtml: `
         <div class="flex items-center justify-between">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor Sign-on required</div>
            <button class="bg-rongo-dark text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-rongo-dark/20 hover:bg-[#153a5b] transition btn-submit-action">Submit Authority Order</button>
         </div>
      `
   });
}
