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

function buildShell() {
  setPageMeta({
    title: "System Control Settings",
    subtitle: "Algorithm thresholds • stage enablement • school-wide rules",
  });

  setPageContent(`
    <div class="space-y-6">
      <div class="rounded-2xl dark-glass p-8 power-glow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">Governance Configuration</div>
          <div class="mt-2 text-3xl font-bold tracking-tight">Postgraduate Rule Engine</div>
          <div class="mt-2 text-slate-300 max-w-xl text-sm font-medium">Modify the fundamental rules of the school's postgraduate system. Changes applied here affect all students and faculty globally.</div>
        </div>
        <button id="resetRules" class="rounded-xl border border-white/20 px-6 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/10 transition backdrop-blur-md">Reset to Defaults</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft animate-in">
           <div class="text-sm font-bold text-slate-900 uppercase tracking-widest">Academic Thresholds</div>
           <div class="mt-8 space-y-6">
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-600 uppercase">Minimum Proposal Score</label>
                  <span class="text-xs font-bold text-blue-600">60%</span>
                </div>
                <input type="range" min="40" max="80" value="60" class="mt-3 w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-600 uppercase">Supervisor Student Limit (Cap)</label>
                  <span class="text-xs font-bold text-blue-600">8 Students</span>
                </div>
                <input type="range" min="3" max="15" value="8" class="mt-3 w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-600 uppercase">External Report Weight</label>
                  <span class="text-xs font-bold text-blue-600">40%</span>
                </div>
                <input type="range" min="10" max="50" value="40" class="mt-3 w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
           </div>
           <div class="mt-8">
              <button id="saveThresholds" class="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white uppercase tracking-widest hover:bg-slate-800 transition">Save Engine Thresholds</button>
           </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft animate-in">
           <div class="text-sm font-bold text-slate-900 uppercase tracking-widest">Lifecycle Stage Access</div>
           <div class="mt-8 space-y-4">
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div class="text-xs font-bold text-slate-900 uppercase">Automatic Coursework Completion</div>
                  <div class="text-[10px] text-slate-500 font-medium">Auto-advance students after ERP verify</div>
                </div>
                <div class="h-6 w-10 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                  <div class="h-4 w-4 bg-white rounded-full absolute right-1"></div>
                </div>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div class="text-xs font-bold text-slate-900 uppercase">Supervisor Replacement Lockdown</div>
                  <div class="text-[10px] text-slate-500 font-medium">Prevent supervisor changes after Fieldwork</div>
                </div>
                <div class="h-6 w-10 bg-slate-300 rounded-full relative p-1 cursor-pointer">
                  <div class="h-4 w-4 bg-white rounded-full absolute left-1"></div>
                </div>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div class="text-xs font-bold text-slate-900 uppercase">External Examination Auto-Reminder</div>
                  <div class="text-[10px] text-slate-500 font-medium">Weekly notice to examiners after 60 days</div>
                </div>
                <div class="h-6 w-10 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                   <div class="h-4 w-4 bg-white rounded-full absolute right-1"></div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `);
}

async function load() {
  buildShell();
  
  document.getElementById("saveThresholds")?.addEventListener("click", async () => {
    const ok = await confirmModal({
       title: "Confirm Global Change",
       message: "Modifying the rule engine affects current and future postgraduate students. Proceed?",
       confirmText: "Execute Overwrite",
       tone: "blue"
    });
    if (ok) {
        toast("System guidelines updated successfully.", { tone: "green" });
    }
  });

  document.getElementById("resetRules")?.addEventListener("click", () => {
    toast("Settings restored to factory defaults.", { tone: "yellow" });
  });
}

load();
