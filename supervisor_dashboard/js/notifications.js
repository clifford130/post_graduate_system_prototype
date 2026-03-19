import { qs, qsa, getSupervisorSession, escapeHtml, toast, openModal } from './main.js';
import { api } from './api.js';

export async function initNotifications() {
  const session = getSupervisorSession();
  const root = qs("#page-content");
  if (!root) return;

  try {
    const students = await api.getAssignedStudents(session.id);
    const notifications = generateNotifications(students, session.id);
    renderNotifications(notifications);
  } catch (err) {
    root.innerHTML = `<div class="p-12 text-center text-red-500 font-bold bg-white rounded-3xl animate-in shadow-xl">
        <div class="text-4xl mb-4">🔔</div>
        <div>Error loading notifications: ${err.message}</div>
      </div>`;
  }
}

function generateNotifications(students, supervisorId) {
  const notifications = [];

  students.forEach(s => {
    const slot = s.supervisors.sup1 === supervisorId ? "sup1" : (s.supervisors.sup2 === supervisorId ? "sup2" : "sup3");
    
    // 1. New Assignment
    if (s.assignmentStatus[slot] === "pending") {
      notifications.push({
        type: "assignment",
        title: "New Student Assignment",
        message: `${s.fullName} (${s.userNumber}) has been assigned to you. Action required: Accept or Reject.`,
        date: new Date().toISOString(),
        priority: "high",
        studentId: s._id
      });
    }

    // 2. Pending Reports
    const pendingReports = s.quarterlyReports?.filter(r => r.status === "pending") || [];
    pendingReports.forEach(r => {
      notifications.push({
        type: "report",
        title: "Quarterly Report Pending",
        message: `${s.fullName} submitted Q${r.quarter} ${r.year} report for your approval.`,
        date: r.submittedAt,
        priority: "medium",
        studentId: s._id
      });
    });

    // 3. Document submissions (e.g. Thesis/Proposal)
    if (s.documents?.conceptNote === "pending" && s.stage?.includes("Concept")) {
      notifications.push({
        type: "document",
        title: "Concept Note for Review",
        message: `${s.fullName} uploaded a Concept Note. Please validate.`,
        date: new Date().toISOString(),
        priority: "medium",
        studentId: s._id
      });
    }
  });

  return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function renderNotifications(notifications) {
  const root = qs("#page-content");
  
  root.innerHTML = `
    <div class="space-y-12 animate-in pb-20">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div>
          <div class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Internal Alerts</div>
          <h2 class="text-3xl sm:text-5xl font-black text-rongo-dark -tracking-tighter">Communication Center</h2>
        </div>
      </div>

      <div class="max-w-4xl space-y-4">
        ${notifications.length ? notifications.map(n => renderNotificationCard(n)).join('') : `
          <div class="p-20 bg-white rounded-[2rem] shadow-xl text-center border border-slate-50">
             <div class="text-5xl mb-6">🥂</div>
             <div class="text-2xl font-black text-rongo-dark">All Caught Up!</div>
             <div class="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">No pending supervisor actions at the moment</div>
          </div>
        `}
      </div>
    </div>
  `;

  setupNotificationEvents();
}

function renderNotificationCard(n) {
  const icons = { assignment: "👩‍🎓", report: "📋", document: "📄" };
  const priorityColors = { high: "border-l-4 border-[#bf8c2c]", medium: "border-l-4 border-[#14b5d9]", low: "border-l-4 border-slate-200" };
  
  return `
    <div class="bg-white p-8 rounded-[2rem] shadow-xl flex items-start gap-6 group hover:translate-x-2 transition-all cursor-pointer ${priorityColors[n.priority]}" data-student-id="${n.studentId}">
       <div class="h-14 w-14 rounded-2xl bg-[#f2f2f2] grid place-items-center text-2xl group-hover:scale-110 transition shrink-0">${icons[n.type] || "🔔"}</div>
       <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-2">
             <div class="text-sm font-black text-rongo-dark uppercase tracking-tight">${n.title}</div>
             <div class="text-[10px] font-bold text-slate-400 uppercase">${new Date(n.date).toLocaleDateString()}</div>
          </div>
          <div class="text-sm text-slate-500 font-medium leading-relaxed">${escapeHtml(n.message)}</div>
          <div class="mt-4 flex items-center gap-4">
             <button class="text-[10px] font-black uppercase tracking-widest text-[#14b5d9] hover:underline">View Student File →</button>
             <button class="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500">Dismiss</button>
          </div>
       </div>
    </div>
  `;
}

function setupNotificationEvents() {
  qsa("[data-student-id]").forEach(el => {
    el.onclick = () => {
       window.location.href = `./student-details.html?id=${el.dataset.studentId}`;
    };
  });
}
