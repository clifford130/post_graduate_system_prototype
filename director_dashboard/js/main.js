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

export const DEPARTMENTS = ["CJM", "IHRS"];
export const PROGRAMMES = ["MSc", "PhD"];
export const STATUSES = ["Active", "Deferred", "Resumed", "Graduated"];

export function qs(sel, root = document) {
  return root.querySelector(sel);
}
export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export function setLoading(el, isLoading) {
  if (!el) return;
  el.dataset.loading = isLoading ? "1" : "0";
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function badge({ label, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  const cls = tones[tone] || tones.slate;
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}">${escapeHtml(
    label
  )}</span>`;
}

export function toast(message, { tone = "slate", timeoutMs = 3200 } = {}) {
  const hostId = "app-toast-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.className =
      "fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] space-y-2";
    document.body.appendChild(host);
  }
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    yellow: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
  };
  const el = document.createElement("div");
  el.className = `rounded-xl border px-4 py-3 shadow-soft transition ${tones[tone] || tones.slate}`;
  el.innerHTML = `<div class="text-sm font-semibold">${escapeHtml(message)}</div>`;
  host.appendChild(el);
  window.setTimeout(() => {
    el.classList.add("opacity-0", "translate-y-1");
    window.setTimeout(() => el.remove(), 250);
  }, timeoutMs);
}

export function openModal({ title, bodyHtml, footerHtml, size = "md" } = {}) {
  const id = "app-modal-host";
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement("div");
    host.id = id;
    document.body.appendChild(host);
  }

  const sizes = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  };

  host.innerHTML = `
    <div class="fixed inset-0 z-[120]">
      <div class="absolute inset-0 bg-slate-900/40" data-modal-close="1"></div>
      <div class="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div class="w-full ${sizes[size] || sizes.md} rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-base font-semibold text-slate-900 truncate">${escapeHtml(title || "Action")}</div>
            </div>
            <button class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition" data-modal-close="1">Close</button>
          </div>
          <div class="p-5 max-h-[70vh] overflow-auto app-scroll">
            ${bodyHtml || ""}
          </div>
          ${
            footerHtml
              ? `<div class="px-5 py-4 border-t border-slate-200 bg-slate-50">${footerHtml}</div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  const close = () => {
    host.innerHTML = "";
  };
  host.querySelectorAll("[data-modal-close='1']").forEach((el) => el.addEventListener("click", close));
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") close();
    },
    { once: true }
  );

  return {
    host,
    close,
    qs: (sel) => host.querySelector(sel),
  };
}

export function confirmModal({ title, message, confirmText = "Confirm", tone = "blue" } = {}) {
  return new Promise((resolve) => {
    const tones = {
      blue: "bg-blue-600 hover:bg-blue-700",
      red: "bg-rose-600 hover:bg-rose-700",
      yellow: "bg-amber-600 hover:bg-amber-700",
      slate: "bg-slate-900 hover:bg-slate-800",
    };
    const m = openModal({
      title,
      bodyHtml: `<div class="text-sm text-slate-700">${escapeHtml(message || "Are you sure?")}</div>`,
      footerHtml: `
        <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button data-cancel="1" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
          <button data-ok="1" class="rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${tones[tone] || tones.blue}">${escapeHtml(confirmText)}</button>
        </div>
      `,
      size: "sm",
    });

    m.qs("[data-cancel='1']")?.addEventListener("click", () => {
      m.close();
      resolve(false);
    });
    m.qs("[data-ok='1']")?.addEventListener("click", () => {
      m.close();
      resolve(true);
    });
  });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "green";
  if (s === "deferred") return "yellow";
  if (s === "resumed") return "blue";
  if (s === "graduated") return "purple";
  return "slate";
}

export function issueTone(issue) {
  const v = String(issue || "").toLowerCase();
  if (v.includes("missing") || v.includes("overdue")) return "red";
  if (v.includes("fees") || v.includes("nacosti")) return "yellow";
  return "slate";
}

export function getActiveNavKey() {
  return document.body.dataset.nav || "";
}

export function initShell() {
  const navKey = getActiveNavKey();
  const app = qs("#app");
  if (!app) return;

  const nav = [
    { key: "dashboard", label: "Dashboard", href: "./dashboard.html" },
    { key: "pipeline", label: "Pipeline", href: "./pipeline.html" },
    { key: "students", label: "Students", href: "./students.html" },
    { key: "supervisors", label: "Supervisors", href: "./supervisors.html" },
    { key: "departments", label: "Departments", href: "./departments.html" },
    { key: "reports", label: "Quarterly Reports", href: "./reports.html" },
    { key: "thesis", label: "Thesis & Defense", href: "./thesis.html" },
    { key: "graduation", label: "Graduation", href: "./graduation.html" },
    { key: "analytics", label: "Analytics", href: "./analytics.html" },
    { key: "settings", label: "Settings", href: "./settings.html" },
  ];

  app.innerHTML = `
    <div class="min-h-screen flex bg-slate-50">
      <aside id="sidebar" class="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div class="p-5 flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white font-semibold">RU</div>
          <div>
            <div class="text-sm font-semibold leading-tight">Rongo University</div>
            <div class="text-xs text-slate-500">INFOCOMS • PG Director</div>
          </div>
        </div>
        <div class="px-4 pb-4">
          <div class="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div class="text-xs font-semibold text-slate-700">Control Center</div>
            <div class="mt-1 text-xs text-slate-600">Track students, stages, approvals, compliance, and intervene anytime.</div>
          </div>
        </div>
        <nav class="px-3 pb-5 space-y-1 overflow-auto app-scroll">
          ${nav
            .map((n) => {
              const active = n.key === navKey;
              return `
                <a href="${n.href}" class="${
                  active
                    ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                    : "text-slate-700 hover:bg-slate-50"
                } flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition">
                  <span class="h-2 w-2 rounded-full ${active ? "bg-blue-600" : "bg-slate-300"}"></span>
                  <span>${escapeHtml(n.label)}</span>
                </a>
              `;
            })
            .join("")}
        </nav>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div class="px-4 sm:px-6 py-3 flex items-center gap-3">
            <button id="mobileNavBtn" class="lg:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition">
              Menu
            </button>
            <div class="min-w-0 flex-1">
              <div id="pageTitle" class="text-sm sm:text-base font-semibold text-slate-900 truncate">Postgraduate Director Dashboard</div>
              <div id="pageSubtitle" class="text-xs text-slate-500 truncate">Full lifecycle governance • approvals • compliance • analytics</div>
            </div>
            <div class="hidden sm:flex items-center gap-2">
              <a href="./pipeline.html" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Pipeline</a>
              <a href="./reports.html" class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Reports</a>
            </div>
          </div>
        </header>

        <main class="px-4 sm:px-6 py-6">
          <div id="pageContent"></div>
        </main>
      </div>
    </div>

    <div id="mobileDrawer" class="lg:hidden fixed inset-0 z-50 hidden">
      <div class="absolute inset-0 bg-slate-900/40" data-close="1"></div>
      <div class="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-slate-200 shadow-soft">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white font-semibold">RU</div>
            <div>
              <div class="text-sm font-semibold leading-tight">Rongo University</div>
              <div class="text-xs text-slate-500">PG Director</div>
            </div>
          </div>
          <button class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" data-close="1">Close</button>
        </div>
        <nav class="px-3 pb-5 space-y-1 overflow-auto app-scroll">
          ${nav
            .map((n) => {
              const active = n.key === navKey;
              return `
                <a href="${n.href}" class="${
                  active
                    ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                    : "text-slate-700 hover:bg-slate-50"
                } flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition">
                  <span class="h-2 w-2 rounded-full ${active ? "bg-blue-600" : "bg-slate-300"}"></span>
                  <span>${escapeHtml(n.label)}</span>
                </a>
              `;
            })
            .join("")}
        </nav>
      </div>
    </div>
  `;

  const mobileDrawer = qs("#mobileDrawer");
  const openBtn = qs("#mobileNavBtn");
  const closeEls = qsa("[data-close='1']", mobileDrawer);
  const open = () => mobileDrawer?.classList.remove("hidden");
  const close = () => mobileDrawer?.classList.add("hidden");
  openBtn?.addEventListener("click", open);
  closeEls.forEach((el) => el.addEventListener("click", close));
}

export function setPageMeta({ title, subtitle } = {}) {
  const t = qs("#pageTitle");
  const s = qs("#pageSubtitle");
  if (t && title) t.textContent = title;
  if (s && subtitle) s.textContent = subtitle;
}

export function setPageContent(html) {
  const root = qs("#pageContent");
  if (!root) return;
  root.innerHTML = html;
}

export function mountEmptyState({ title, message, actionsHtml } = {}) {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div class="text-base font-semibold text-slate-900">${escapeHtml(title || "No data yet")}</div>
      <div class="mt-1 text-sm text-slate-600">${escapeHtml(
        message || "Waiting for the API response."
      )}</div>
      ${actionsHtml ? `<div class="mt-4 flex flex-wrap gap-2">${actionsHtml}</div>` : ""}
    </div>
  `;
}

export function chartBars(canvas, { labels, values, color = "#2563eb", gridColor = "#e2e8f0" }) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const w = canvas.clientWidth || 600;
  const h = canvas.clientHeight || 240;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);
  const pad = 28;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  const max = Math.max(1, ...values.map((v) => Number(v) || 0));

  // grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + chartW, y);
    ctx.stroke();
  }

  const barCount = values.length || 1;
  const gap = 8;
  const barW = Math.max(10, (chartW - gap * (barCount - 1)) / barCount);

  ctx.fillStyle = color;
  values.forEach((v, i) => {
    const val = Number(v) || 0;
    const bh = (val / max) * chartH;
    const x = pad + i * (barW + gap);
    const y = pad + (chartH - bh);
    roundRect(ctx, x, y, barW, bh, 10);
    ctx.fill();
  });

  // labels (lightweight)
  ctx.fillStyle = "#475569";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  labels.forEach((lbl, i) => {
    const x = pad + i * (barW + gap) + barW / 2;
    const y = h - 8;
    ctx.textAlign = "center";
    ctx.fillText(String(lbl).slice(0, 10), x, y);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

