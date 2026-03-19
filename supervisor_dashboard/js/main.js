export const STAGES = [
  "Coursework",
  "Concept Note (Department)",
  "Concept Note (School)",
  "Proposal (Department)",
  "Proposal (School)",
  "PG Approval",
  "Fieldwork",
  "Thesis Development",
  "External Examination",
  "Defense",
  "Graduation",
];

export const DEPARTMENTS = ["CJM", "IHRS", "SST"];
export const PROGRAMMES = ["MSc", "PhD"];
export const STATUSES = ["Active", "Deferred", "Resumed", "Graduated"];

export const COLORS = {
  primary: "#194973",
  secondary: "#14b5d9",
  yellow: "#f2c335",
  brown: "#bf8c2c",
  bg: "#f2f2f2"
};

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Utilities */
export function toast(message, { tone = "blue", timeoutMs = 3000 } = {}) {
  const hostId = "toast-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.className = "fixed top-4 right-4 z-[200] space-y-2 pointer-events-none";
    document.body.appendChild(host);
  }
  const tones = {
    blue: "bg-[#14b5d9] text-white",
    green: "bg-emerald-500 text-white",
    red: "bg-[#bf8c2c] text-white",
    dark: "bg-[#194973] text-white"
  };
  const el = document.createElement("div");
  el.className = `px-6 py-4 rounded-2xl shadow-2xl transition transform translate-x-12 opacity-0 pointer-events-auto font-bold border-b-4 border-black/10 ${tones[tone] || tones.blue}`;
  el.innerHTML = escapeHtml(message);
  host.appendChild(el);
  
  window.requestAnimationFrame(() => {
    el.classList.remove("translate-x-12", "opacity-0");
  });

  setTimeout(() => {
    el.classList.add("translate-x-12", "opacity-0");
    setTimeout(() => el.remove(), 400);
  }, timeoutMs);
}

export function openModal({ title, bodyHtml, footerHtml, size = "md" } = {}) {
  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-5xl" };
  const host = qs("#modal-container");
  if (!host) {
    const fresh = document.createElement("div");
    fresh.id = "modal-container";
    document.body.appendChild(fresh);
  }

  const container = qs("#modal-container");
  container.innerHTML = `
    <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#194973]/40 backdrop-blur-sm" data-modal-close="1"></div>
      <div class="w-full ${sizes[size] || sizes.md} bg-white rounded-3xl shadow-2xl overflow-hidden glass z-10 animate-in">
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <div class="text-xl font-bold text-rongo-dark">${escapeHtml(title || "Supervisor Action")}</div>
          <button class="bg-[#f2f2f2] px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition" data-modal-close="1">Close</button>
        </div>
        <div class="p-8 max-h-[75vh] overflow-auto app-scroll scroll-smooth">
          ${bodyHtml || ""}
        </div>
        ${footerHtml ? `<div class="px-8 py-6 bg-[#f2f2f2]/50 border-t border-slate-100">${footerHtml}</div>` : ""}
      </div>
    </div>
  `;

  const close = () => { container.innerHTML = ""; };
  container.querySelectorAll("[data-modal-close='1']").forEach(el => el.addEventListener("click", close));
  return { host: container, close, qs: (sel) => container.querySelector(sel) };
}

/* Hardcoded Supervisor Session Info (Mocking Auth) */
export function getSupervisorSession() {
  return {
    id: "S001",
    name: "Dr. Omondi Richards",
    role: "Supervisor",
    department: "CJM",
    assignedCount: 5
  };
}

export function initShell() {
  const navKey = document.body.dataset.nav;
  const app = qs("#app");
  if (!app) return;

  const session = getSupervisorSession();

  const nav = [
    { key: "dashboard", label: "Overview", icon: "📊", href: "./index.html" },
    { key: "students", label: "My Students", icon: "👩‍🎓", href: "./pipeline.html" },
    { key: "notifications", label: "Notifications", icon: "🔔", href: "./notifications.html", badge: 3 },
    { key: "settings", label: "Profile Settings", icon: "⚙️", href: "./settings.html" },
  ];

  app.innerHTML = `
    <div class="min-h-screen flex flex-col md:flex-row bg-[#f2f2f2]">
      <!-- Sidebar -->
      <aside class="hidden md:flex flex-col w-72 bg-[#194973] shrink-0 border-r border-white/5">
        <div class="p-8 border-b border-white/10 flex items-center gap-4">
          <div class="h-12 w-12 rounded-2xl bg-[#14b5d9] grid place-items-center text-white font-bold text-2xl shadow-lg shadow-black/20">🎓</div>
          <div>
            <div class="text-xs font-black text-white tracking-widest uppercase mb-0.5">RU PGOS</div>
            <div class="text-[8px] text-white/40 font-black uppercase tracking-widest">Supervisor Integrated</div>
          </div>
        </div>
        
        <nav class="flex-1 px-4 py-8 space-y-2">
          ${nav.map(n => {
            const active = n.key === navKey;
            return `
              <a href="${n.href}" class="${active ? 'bg-[#14b5d9] border-[#f2c335]' : 'text-white/70 hover:bg-white/5 border-transparent'} group flex items-center justify-between gap-4 px-6 py-4 rounded-2xl transition-all border-l-4">
                <div class="flex items-center gap-4">
                   <span class="text-xl group-hover:scale-110 transition shrink-0">${n.icon}</span>
                   <span class="font-bold tracking-wide">${n.label}</span>
                </div>
                ${n.badge ? `<span class="bg-[#bf8c2c] text-[#194973] text-[9px] font-black px-2 py-0.5 rounded-full pulse-ai">${n.badge}</span>` : ''}
              </a>
            `;
          }).join('')}
        </nav>

        <div class="p-4">
          <div class="bg-black/20 rounded-3xl p-6 border border-white/5">
            <div class="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Support Contact</div>
            <div class="text-xs font-bold text-white mb-1">PG Office</div>
            <div class="text-xs text-white/70">pg-office@rongo.ac.ke</div>
          </div>
        </div>
      </aside>

      <!-- Main Section -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <header class="h-20 bg-white border-b border-slate-200 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40">
           <div class="flex items-center gap-4 md:hidden">
              <div class="h-10 w-10 rounded-xl bg-rongo-dark grid place-items-center text-white text-xl">🎓</div>
              <div class="text-sm font-black text-rongo-dark">RU Supervisor</div>
           </div>

           <div class="hidden sm:block">
              <div id="page-title" class="text-lg font-black text-rongo-dark uppercase tracking-wide">Rongo University Postgraduate Portal</div>
           </div>

           <div class="flex items-center gap-4">
              <div class="text-right hidden sm:block">
                 <div class="text-sm font-bold text-rongo-dark">${session.name}</div>
                 <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${session.department} • Supervisor</div>
              </div>
              <div class="h-12 w-12 rounded-2xl bg-[#f2f2f2] border border-slate-200 grid place-items-center cursor-pointer hover:bg-slate-100 transition shadow-sm overflow-hidden">
                 <div class="text-xl font-bold text-[#14b5d9]">⚡</div>
              </div>
           </div>
        </header>

        <!-- Content Area -->
        <div id="page-content" class="p-6 sm:p-12 overflow-auto app-scroll scroll-smooth">
           <!-- Dynamically Loaded -->
           <div class="animate-in text-center py-20">
              <div class="text-3xl font-black text-rongo-dark mb-2">Connecting to Knowledge...</div>
              <div class="text-slate-400 font-bold uppercase tracking-widest text-sm">Synchronizing with RU Database</div>
           </div>
        </div>
      </main>
    </div>
  `;
}
