import { api } from "./api.js";
import {
  badge,
  confirmModal,
  escapeHtml,
  formatDate,
  mountEmptyState,
  openModal,
  setPageContent,
  setPageMeta,
  toast,
} from "./main.js";

function studentThesisCard(s) {
  const name = s?.name || s?.fullName || "Student";
  const id = s?.id || s?.regNo || s?.registrationNumber || "";
  const stage = s?.stage || "Unknown";
  const examiners = s?.examiners || [];
  
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-lg transition-all animate-in animate-in">
      <div class="flex items-start justify-between">
        <div class="min-w-0 flex-1 px-2">
          <div class="text-xs font-bold uppercase tracking-widest text-blue-500">${escapeHtml(stage)}</div>
          <div class="mt-1 text-lg font-bold text-slate-900 truncate">${escapeHtml(name)}</div>
          <div class="text-xs font-medium text-slate-500">${escapeHtml(id)}</div>
        </div>
        <div class="shrink-0">
          <button data-thesis-action="1" data-id="${s?.id}" class="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition shadow-sm">
             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          </button>
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3">
        <div class="rounded-xl bg-slate-50 p-3 border border-slate-100">
           <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Examiners</div>
           <div class="mt-1 flex items-center gap-2">
             ${badge({ label: "Verified", tone: "green" })}
             <span class="text-xs font-bold text-slate-700">Dr. Amos & Prof. Jane</span>
           </div>
        </div>
        <div class="rounded-xl bg-slate-50 p-3 border border-slate-100">
           <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Review</div>
           <div class="mt-1 flex items-center gap-2">
             ${badge({ label: "Nominated", tone: "yellow" })}
             <span class="text-xs font-bold text-slate-700">Waiting for reports</span>
           </div>
        </div>
      </div>

      <div class="mt-6 flex gap-2">
        <button class="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white uppercase tracking-widest hover:bg-slate-800 transition shadow-md">Schedule Defense</button>
        <button class="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 transition">
          <svg class="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>
        </button>
      </div>
    </div>
  `;
}

function buildShell() {
  setPageMeta({
    title: "Thesis & Defense Board",
    subtitle: "External examination • defense scheduling • result approvals",
  });

  setPageContent(`
    <div class="space-y-6">
      <div class="rounded-2xl dark-glass p-8 power-glow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="text-xs font-bold uppercase tracking-widest text-blue-400">Research Command</div>
          <div class="mt-2 text-2xl font-bold">Thesis Lifecycle Authority</div>
          <div class="mt-2 text-slate-300 max-w-xl text-sm">You are viewing all students in External Examination or Defense phase. You have authority to appoint examiners and override results.</div>
        </div>
        <div class="flex gap-3">
          <button id="assignAllExternal" class="rounded-xl bg-white text-slate-900 px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-slate-100 transition shadow-xl">Appoint Examiners Pool</button>
          <button class="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white uppercase tracking-widest hover:bg-white/10 transition backdrop-blur-md">Mass Remind Examiners</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">24</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">External Review</div>
        </div>
        <div class="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-center">
          <div class="text-2xl font-bold text-amber-600">8</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pending Defense</div>
        </div>
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <div class="text-2xl font-bold text-emerald-600">42</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Thesis Cleared</div>
        </div>
        <div class="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center">
          <div class="text-2xl font-bold text-rose-600">3</div>
          <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Resubmissions</div>
        </div>
      </div>

      <div id="thesisGrid" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Loaded dynamically -->
      </div>
    </div>
  `);
}

async function load() {
  buildShell();
  const grid = document.getElementById("thesisGrid");

  try {
    const students = [
      { id: "S101", name: "Kennedy Excels", regNo: "PG/IT/01/2021", stage: "External Examination" },
      { id: "S102", name: "Sarah Njeri", regNo: "PG/CS/12/2020", stage: "Defense" },
      { id: "S103", name: "Peter Otieno", regNo: "PG/SE/05/2022", stage: "External Examination" },
      { id: "S104", name: "Mary Anyango", regNo: "PG/IT/22/2021", stage: "External Examination" },
      { id: "S105", name: "David Mwangi", regNo: "PG/SE/08/2020", stage: "Defense" },
      { id: "S106", name: "Hellen Atieno", regNo: "PG/CS/03/2022", stage: "External Examination" },
    ];

    grid.innerHTML = students.map(studentThesisCard).join("");

  } catch (err) {
    grid.innerHTML = mountEmptyState({ title: "Thesis data unavailable", message: "Check /api/thesis" });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-thesis-action]");
    if (!btn) return;
    openThesisGovernanceModal(btn.dataset.id);
  });
}

function openThesisGovernanceModal(id) {
  openModal({
    title: `Thesis Governance Center — ${id}`,
    size: "lg",
    bodyHtml: `
      <div class="space-y-6 animate-in">
        <div class="rounded-2xl dark-glass p-6 power-glow">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-2xl bg-indigo-500 grid place-items-center text-white text-2xl">🎓</div>
            <div>
              <div class="text-lg font-bold">Research Milestone Approval</div>
              <div class="text-sm text-slate-300">Approve examiners, upload reports, or override status.</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-2xl border border-slate-200 p-5 space-y-4">
             <div class="text-sm font-bold text-slate-900 uppercase tracking-widest">External Examination</div>
             <div class="mt-4 space-y-2">
               <input class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium" placeholder="Assigned Examiner (Name/Email)" />
               <button class="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white uppercase tracking-widest shadow-lg">Nominate External Examiner</button>
               <button class="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-widest hover:bg-slate-50">Upload External Report</button>
             </div>
          </div>
          <div class="rounded-2xl border border-slate-200 p-5 space-y-4">
             <div class="text-sm font-bold text-slate-900 uppercase tracking-widest">Defense Result Center</div>
             <div class="mt-4 space-y-2">
               <select class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium">
                 <option>Pass (Minor Corrections)</option>
                 <option>Pass (Major Corrections)</option>
                 <option>Resubmission</option>
                 <option>Fail</option>
               </select>
               <button class="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white uppercase tracking-widest shadow-lg">Finalize Defense Result</button>
               <button class="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-700 uppercase tracking-widest">Mark Corrections as Done</button>
             </div>
          </div>
        </div>
      </div>
    `,
    footerHtml: `<button class="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white uppercase tracking-widest shadow-xl" data-modal-close="1">Close Governance Center</button>`
  });
}

load();
