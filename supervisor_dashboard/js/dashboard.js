import { qs, qsa, getSupervisorSession, escapeHtml, toast, openModal, STAGES } from './main.js';
import { api } from './api.js';

export function initDashboard() {
  const session = getSupervisorSession();
  const root = qs("#page-content");
  if (!root) return;

  fetchAndRenderDashboard(session.id);
}

async function fetchAndRenderDashboard(supervisorId) {
  const root = qs("#page-content");
  try {
    const students = await api.getAssignedStudents(supervisorId);
    const summary = await api.getDashboardSummary(supervisorId);

    renderDashboard(summary, students, supervisorId);
  } catch (error) {
    console.error(error);
    root.innerHTML = `
      <div class="p-12 text-center text-red-500 font-bold bg-white rounded-3xl animate-in shadow-xl">
        <div class="text-4xl mb-4">⚠️</div>
        <div>Error connecting to RU Database: ${error.message}</div>
      </div>
    `;
  }
}

function renderDashboard(summary, students, supervisorId) {
  const root = qs("#page-content");
  
  root.innerHTML = `
    <div class="space-y-12 animate-in pb-20">
      <!-- Title -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div>
          <div class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Institutional Overview</div>
          <h2 class="text-3xl sm:text-5xl font-black text-rongo-dark -tracking-tighter">My Supervision Control</h2>
        </div>
        <div class="flex gap-3">
          <div class="px-6 py-4 bg-[#1e293b] rounded-2xl flex flex-col justify-center border-l-4 border-[#f2c335] shadow-xl">
            <div class="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none">Status</div>
            <div class="text-lg font-bold text-white leading-none mt-2">Active Official</div>
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${renderStatCard("Total Managed", summary.total, "👥", "bg-white", "text-rongo-dark")}
        ${renderStatCard("Pending Action", summary.pendingApproval, "⏳", "bg-[#14b5d9]", "text-white shadow-xl shadow-[#14b5d9]/40")}
        ${renderStatCard("Active Research", summary.active, "👩‍🎓", "bg-white", "text-rongo-dark border-l-4 border-emerald-500")}
        ${renderStatCard("Deferred/OnHold", summary.deferred, "⏸️", "bg-white", "text-rongo-dark border-l-4 border-red-500")}
      </div>

      <!-- Student Pipeline Section -->
      <div class="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
         <div class="px-8 py-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
               <div class="text-2xl font-black text-rongo-dark">Student Pipeline</div>
               <div class="text-sm text-slate-400 font-bold">Real-time supervision & approval monitoring</div>
            </div>
            <div class="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
               <input type="text" placeholder="Search ID or Name" class="px-4 py-2 text-sm font-bold bg-transparent outline-none w-48 focus:w-64 transition-all">
               <button class="bg-rongo-dark text-white rounded-lg px-4 py-2 font-bold text-sm tracking-wide">Filter</button>
            </div>
         </div>

         <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
               <thead>
                  <tr class="text-[10px] uppercase font-black tracking-widest text-[#194973]/50 bg-slate-50">
                     <th class="px-8 py-4">Student Identity</th>
                     <th class="px-8 py-4">Programme / Dept</th>
                     <th class="px-8 py-4">Current Stage</th>
                     <th class="px-8 py-4">Status & Health</th>
                     <th class="px-8 py-4">Progress</th>
                     <th class="px-8 py-4">Action Center</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-50">
                  ${students.length ? students.map(s => renderStudentRow(s, supervisorId)).join('') : `
                    <tr><td colspan="6" class="px-8 py-20 text-center text-slate-400 font-bold text-lg uppercase tracking-widest">No assigned students found</td></tr>
                  `}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  `;

  setupDashboardEvents(students, supervisorId);
}

function renderStatCard(label, val, icon, bgClass, textClass) {
  return `
    <div class="${bgClass} ${textClass} p-8 rounded-3xl flex flex-col justify-between border border-transparent shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[11px] font-black uppercase tracking-wider opacity-60">${label}</div>
        <div class="text-2xl">${icon}</div>
      </div>
      <div class="text-5xl font-black -tracking-tighter">${val}</div>
    </div>
  `;
}

function renderStudentRow(student, supervisorId) {
  const slot = student.supervisors.sup1 === supervisorId ? "sup1" : (student.supervisors.sup2 === supervisorId ? "sup2" : "sup3");
  const isPending = student.assignmentStatus[slot] === "pending";
  const statusColor = student.status === "Active" ? "bg-[#14b5d9]" : (student.status === "Deferred" ? "bg-amber-500" : "bg-slate-400");
  const stageIndex = STAGES.indexOf(student.stage || "Coursework");
  const progressPercent = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  return `
    <tr class="hover:bg-slate-50 group transition-all cursor-pointer ${isPending ? 'pulse-assignment border-l-4 border-[#14b5d9]' : ''}" data-student-id="${student._id}">
      <td class="px-8 py-6">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-xl bg-rongo-dark text-white grid place-items-center font-bold text-xs shrink-0">${student.fullName.substring(0, 1)}</div>
          <div class="min-w-0">
            <div class="font-black text-rongo-dark truncate">${student.fullName}</div>
            <div class="text-[10px] font-bold text-slate-400 uppercase truncate">ID: ${student.userNumber}</div>
          </div>
        </div>
      </td>
      <td class="px-8 py-6">
        <div class="text-sm font-bold text-slate-700">${student.programme?.toUpperCase() || "N/A"}</div>
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${student.department}</div>
      </td>
      <td class="px-8 py-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
           <span class="h-1.5 w-1.5 rounded-full bg-rongo-dark"></span>
           <span class="text-[10px] font-black uppercase text-rongo-dark">${student.stage || "Coursework"}</span>
        </div>
      </td>
      <td class="px-8 py-6">
         <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full ${statusColor}"></span>
            <span class="text-xs font-bold text-slate-600">${student.status}</span>
         </div>
      </td>
      <td class="px-8 py-6">
         <div class="w-32">
            <div class="flex items-center justify-between text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">
               <span>Stage ${stageIndex + 1}</span>
               <span>${progressPercent}%</span>
            </div>
            <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full bg-rongo-dark transition-all duration-1000" style="width: ${progressPercent}%"></div>
            </div>
         </div>
      </td>
      <td class="px-8 py-6">
         <div class="flex items-center gap-2">
            ${isPending ? `
              <button class="bg-[#14b5d9] hover:bg-[#119dbb] text-white text-[10px] px-3 py-2 rounded-xl font-bold uppercase tracking-widest btn-accept" data-id="${student._id}">Accept</button>
              <button class="bg-[#bf8c2c] hover:bg-[#a67a26] text-white text-[10px] px-3 py-2 rounded-xl font-bold uppercase tracking-widest btn-reject" data-id="${student._id}">Reject</button>
            ` : `
               <button class="bg-rongo-dark text-white text-[10px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest shadow-md hover:bg-[#153a5b] transition btn-manage" data-id="${student._id}">Supervise</button>
            `}
         </div>
      </td>
    </tr>
  `;
}

function setupDashboardEvents(students, supervisorId) {
  qsa(".btn-accept").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handleAssignment(btn.dataset.id, supervisorId, "accepted");
    };
  });
  qsa(".btn-reject").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handleAssignment(btn.dataset.id, supervisorId, "rejected");
    };
  });
  qsa(".btn-manage").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.location.href = `./student-details.html?id=${btn.dataset.id}`;
    };
  });
  qsa("tr[data-student-id]").forEach(tr => {
    tr.onclick = () => {
       window.location.href = `./student-details.html?id=${tr.dataset.studentId}`;
    };
  });
}

async function handleAssignment(studentId, supervisorId, action) {
  try {
    const student = await api.updateAssignmentStatus(studentId, supervisorId, action);
    toast(`Successfully ${action} student assignment`, { tone: action === "accepted" ? "green" : "red" });
    fetchAndRenderDashboard(supervisorId);
  } catch (err) {
    toast(`Error: ${err.message}`, { tone: "red" });
  }
}
