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
    const analytics = await api.getAnalytics(supervisorId);

    renderDashboard(summary, students, supervisorId, analytics);
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

function renderDashboard(summary, students, supervisorId, analytics) {
  const root = qs("#page-content");
  
  root.innerHTML = `
    <div class="space-y-12 animate-in pb-20">
      <!-- Title & Controls -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div>
          <div class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Institutional Intelligence</div>
          <h2 class="text-3xl sm:text-5xl font-black text-rongo-dark -tracking-tighter">Supervisor Command Center</h2>
        </div>
        <div class="flex gap-3">
           <button class="bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-2 btn-bulk-message">
              <span>📩</span> Bulk Message
           </button>
           <button class="bg-[#f2c335] px-6 py-4 rounded-2xl text-sm font-black text-[#194973] hover:bg-[#e0b22a] transition shadow-xl shadow-[#f2c335]/20 flex items-center gap-2 btn-smart-sync">
              <span>⚡</span> Smart Sync
           </button>
        </div>
      </div>

      <!-- Analytics & Workload Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            ${renderStatCard("Workload Capacity", `${analytics.totalManaged}/8`, "📊", "bg-white", "text-rongo-dark")}
            ${renderStatCard("Pending Clearances", summary.pendingApproval, "⏳", "bg-[#14b5d9]", "text-white shadow-xl shadow-[#14b5d9]/40")}
            ${renderStatCard("At-Risk Students", analytics.bottlenecks, "🚩", "bg-white", "text-rose-500 border-l-4 border-rose-500")}
            ${renderStatCard("Q-Report Deadlines", analytics.pendingQReports, "📋", "bg-white", "text-rongo-dark border-l-4 border-[#f2c335]")}
         </div>
         
         <!-- Workload Distribution Mini-Chart -->
         <div class="bg-[#194973] p-8 rounded-[2rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div class="relative z-10">
               <div class="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Stage Distribution</div>
               <div class="space-y-4">
                  ${renderDistributionLines(analytics.stageDistribution)}
               </div>
            </div>
            <div class="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[#14b5d9]/10"></div>
         </div>
      </div>

      <!-- Student Pipeline Section -->
      <div class="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
         <div class="px-8 py-8 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/50">
            <div>
               <div class="text-2xl font-black text-rongo-dark">Active Supervision Pipeline</div>
               <div class="text-sm text-slate-400 font-bold">Automated milestone tracking & validation</div>
            </div>
            <div class="flex flex-wrap gap-3">
               <div class="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  <input type="text" placeholder="Search ID or Name" class="px-4 py-2 text-sm font-bold bg-transparent outline-none w-48 focus:w-64 transition-all search-input">
               </div>
               <select class="px-6 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none hover:bg-slate-50 filter-stage">
                  <option value="">All Stages</option>
                  ${STAGES.map(s => `<option value="${s}">${s}</option>`).join('')}
               </select>
               <select class="px-6 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none hover:bg-slate-50 filter-status">
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Deferred">Deferred</option>
                  <option value="Resumed">Resumed</option>
               </select>
            </div>
         </div>

         <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
               <thead>
                  <tr class="text-[10px] uppercase font-black tracking-widest text-[#194973]/50 bg-slate-50">
                     <th class="px-8 py-4">Student Identity</th>
                     <th class="px-8 py-4">Level / Dept</th>
                     <th class="px-8 py-4">Smart Progress Indicator</th>
                     <th class="px-8 py-4">Stage Health</th>
                     <th class="px-8 py-4">Document Vault</th>
                     <th class="px-8 py-4">Supervisor Action</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-slate-50 student-table-body">
                  ${students.length ? students.map(s => renderStudentRow(s, supervisorId)).join('') : `
                    <tr><td colspan="6" class="px-8 py-20 text-center text-slate-400 font-bold text-lg uppercase tracking-widest">No matching students found</td></tr>
                  `}
               </tbody>
            </table>
         </div>
      </div>

      <!-- AI Recommendations Quick Panel -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
            <div class="flex items-center justify-between mb-8">
               <div class="text-xl font-black text-rongo-dark">Smart Prerequisite Check</div>
               <div class="text-[10px] font-black uppercase text-[#14b5d9] bg-[#14b5d9]/10 px-3 py-1 rounded-full">Automated</div>
            </div>
            <div class="space-y-4">
               ${renderAutoSuggestions(students)}
            </div>
         </div>

         <div class="bg-[#14b5d9] p-8 rounded-[2rem] text-[#194973] shadow-xl relative overflow-hidden group">
            <div class="relative z-10">
               <div class="text-xl font-black mb-2">Director Notification Hub</div>
               <div class="text-sm font-bold opacity-70 mb-6 leading-relaxed">System-wide synchronization enabled. All approvals and rejections are transmitted to Graduate School real-time.</div>
               <div class="flex gap-4">
                  <div class="h-12 w-12 rounded-2xl bg-white/20 grid place-items-center text-xl">📡</div>
                  <div class="text-xs font-black uppercase tracking-widest self-center text-[#194973]">Uptime: 99.9% Integrated</div>
               </div>
            </div>
            <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 group-hover:scale-110 transition duration-1000"></div>
         </div>
      </div>
    </div>
  `;

  setupDashboardEvents(students, supervisorId);
}

function renderStatCard(label, val, icon, bgClass, textClass) {
  return `
    <div class="${bgClass} ${textClass} p-8 rounded-3xl flex flex-col justify-between border border-transparent shadow-sm hover:translate-y-[-4px] transition duration-300">
      <div class="flex items-center justify-between mb-4">
        <div class="text-[11px] font-black uppercase tracking-wider opacity-60">${label}</div>
        <div class="text-2xl">${icon}</div>
      </div>
      <div class="text-5xl font-black -tracking-tighter">${val}</div>
    </div>
  `;
}

function renderDistributionLines(dist) {
  const keys = Object.keys(dist);
  const total = keys.reduce((acc, k) => acc + dist[k], 0);
  if (!total) return `<div class="text-xs font-bold opacity-30 italic">No stage data available</div>`;

  return keys.slice(0, 4).map(k => {
    const p = Math.round((dist[k] / total) * 100);
    return `
      <div>
         <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
            <span class="truncate pr-4">${k}</span>
            <span>${dist[k]}</span>
         </div>
         <div class="h-1 w-full bg-white/10 rounded-full">
            <div class="h-full bg-[#f2c335] rounded-full" style="width: ${p}%"></div>
         </div>
      </div>
    `;
  }).join('');
}

function renderStudentRow(student, supervisorId) {
  const slot = student.supervisors.sup1 === supervisorId ? "sup1" : (student.supervisors.sup2 === supervisorId ? "sup2" : "sup3");
  const isPending = student.assignmentStatus?.[slot] === "pending";
  const statusColor = student.status === "Active" ? "bg-[#14b5d9]" : (student.status === "Deferred" ? "bg-amber-500" : "bg-slate-400");
  const stageIndex = STAGES.indexOf(student.stage || "Coursework");
  const progressPercent = Math.round(((stageIndex + 1) / STAGES.length) * 100);

  // Smart Indicators
  const qReportStatus = student.quarterlyReports?.some(r => r.status === "pending") ? "🔴" : "🟢";
  const docStatus = Object.values(student.documents || {}).some(d => d === "pending") ? "📂" : "📁";

  return `
    <tr class="hover:bg-slate-50 group transition-all cursor-pointer ${isPending ? 'pulse-assignment border-l-4 border-[#14b5d9]' : ''} ${student.atRisk ? 'bg-rose-50/30' : ''}" data-student-id="${student._id}">
      <td class="px-8 py-6">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-xl bg-rongo-dark text-white grid place-items-center font-bold text-xs shrink-0">${student.fullName.substring(0, 1)} ${student.atRisk ? '<span class="absolute -top-1 -right-1">🚩</span>' : ''}</div>
          <div class="min-w-0 pointer-events-none">
            <div class="font-black text-rongo-dark truncate leading-none mb-1">${student.fullName}</div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REG: ${student.userNumber}</div>
          </div>
        </div>
      </td>
      <td class="px-8 py-6">
        <div class="text-sm font-black text-slate-700">${student.programme?.toUpperCase() || "PHD"}</div>
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${student.department} • Postgraduate</div>
      </td>
      <td class="px-8 py-6">
         <div class="flex items-center gap-3">
            <div class="relative w-24">
               <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div class="h-full bg-rongo-dark rounded-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
               </div>
            </div>
            <div class="text-[10px] font-black text-rongo-dark">${progressPercent}%</div>
         </div>
      </td>
      <td class="px-8 py-6">
         <div class="inline-flex flex-col">
            <div class="flex items-center gap-2 mb-1">
               <span class="h-2 w-2 rounded-full ${statusColor}"></span>
               <span class="text-xs font-black text-slate-600 uppercase tracking-tighter">${student.status}</span>
            </div>
            <div class="text-[9px] font-bold text-slate-400 truncate uppercase w-28">${student.stage || "Coursework"}</div>
         </div>
      </td>
      <td class="px-8 py-6 text-center">
         <div class="flex items-center justify-center gap-3 text-lg">
            <span title="Quarterly Reports Status">${qReportStatus}</span>
            <span title="Document Upload Status">${docStatus}</span>
            <span title="Journal Submissions" class="opacity-10">📖</span>
         </div>
      </td>
      <td class="px-8 py-6">
         <div class="flex items-center gap-2">
            ${isPending ? `
              <button class="bg-[#14b5d9] hover:bg-[#119dbb] text-white text-[10px] px-3 py-2 rounded-xl font-bold uppercase tracking-widest btn-accept shadow-md" data-id="${student._id}">Accept</button>
              <button class="bg-[#bf8c2c] hover:bg-[#a67a26] text-white text-[10px] px-3 py-2 rounded-xl font-bold uppercase tracking-widest btn-reject shadow-md" data-id="${student._id}">Reject</button>
            ` : `
               <button class="bg-rongo-dark text-white text-[10px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:translate-y-[-2px] hover:shadow-[#194973]/20 transition btn-manage" data-id="${student._id}">Supervise</button>
            `}
         </div>
      </td>
    </tr>
  `;
}

function renderAutoSuggestions(students) {
  const suggestions = students.filter(s => s.automation?.suggestedStage && s.automation.suggestedStage !== s.stage).slice(0, 3);
  if (!suggestions.length) return `<div class="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting student milestone completion</div>`;

  return suggestions.map(s => `
    <div class="p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-[#14b5d9]/40 transition group cursor-pointer" onclick="window.location.href='./student-details.html?id=${s._id}'">
       <div class="flex items-center gap-4">
          <div class="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">✨</div>
          <div>
             <div class="text-sm font-black text-rongo-dark">${s.fullName}</div>
             <div class="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Suggested: ${s.automation.suggestedStage}</div>
          </div>
       </div>
       <div class="text-xs font-black text-slate-300 group-hover:text-[#14b5d9] transition">Review →</div>
    </div>
  `).join('');
}

function setupDashboardEvents(students, supervisorId) {
  // Search logic
  qs(".search-input").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    qsa(".student-table-body tr").forEach(tr => {
      const text = tr.innerText.toLowerCase();
      tr.style.display = text.includes(q) ? "" : "none";
    });
  };

  // Filters
  const applyFilters = () => {
    const stage = qs(".filter-stage").value;
    const status = qs(".filter-status").value;
    qsa(".student-table-body tr").forEach(tr => {
      const trText = tr.innerText;
      const matchesStage = stage === "" || trText.includes(stage);
      const matchesStatus = status === "" || trText.includes(status);
      tr.style.display = matchesStage && matchesStatus ? "" : "none";
    });
  };

  qs(".filter-stage").onchange = applyFilters;
  qs(".filter-status").onchange = applyFilters;

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

  qs(".btn-smart-sync").onclick = async () => {
     toast("Synchronizing prerequisites with Graduate School...", { tone: "blue" });
     // Trigger auto-check for all students in parallel for demo
     for (const s of students) {
        try { await api.triggerAutoCheck(s._id); } catch(e) {}
     }
     toast("Prerequisite Intelligence Updated", { tone: "green" });
     fetchAndRenderDashboard(supervisorId);
  };
}

async function handleAssignment(studentId, supervisorId, action) {
  try {
    await api.updateAssignmentStatus(studentId, supervisorId, action);
    toast(`Successfully ${action} student assignment. Director notified.`, { tone: action === "accepted" ? "green" : "red" });
    fetchAndRenderDashboard(supervisorId);
  } catch (err) {
    toast(`Error: ${err.message}`, { tone: "red" });
  }
}
