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

function normalizeReports(raw) {
  const root = raw?.data || raw;
  if (Array.isArray(root)) return { reports: root };
  if (Array.isArray(root?.reports)) return root;
  if (Array.isArray(root?.items)) return { reports: root.items, total: root.total };
  return { reports: [] };
}

function toneForStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("approved")) return "green";
  if (s.includes("missing") || s.includes("overdue")) return "red";
  if (s.includes("returned") || s.includes("rejected")) return "red";
  if (s.includes("pending") || s.includes("submitted")) return "yellow";
  return "slate";
}

function chainViz(chain) {
  const steps = Array.isArray(chain) && chain.length ? chain : ["Sup1", "Sup2", "Sup3", "Director", "Finance"];
  return `
    <div class="flex flex-wrap items-center gap-1.5">
      ${steps
        .map((x, i) => {
          const role = x?.role || x?.name || x;
          const st = x?.status || "";
          const tone = String(st).toLowerCase().includes("approved")
            ? "green"
            : String(st).toLowerCase().includes("rejected")
              ? "red"
              : "slate";
          return `
            <span class="inline-flex items-center gap-1.5">
              ${badge({ label: role, tone })}
              ${i < steps.length - 1 ? `<span class="text-slate-400">→</span>` : ""}
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function filtersHtml() {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-lg font-semibold tracking-tight">Quarterly Reports</div>
          <div class="mt-1 text-sm text-slate-600">Full school visibility • approval progress • approve/reject actions</div>
        </div>
        <a href="./dashboard.html" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Dashboard</a>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600">Search</label>
          <input id="q" type="search" placeholder="Student / Reg No / Report period…" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600">Status</label>
          <select id="status" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400">
            <option value="">All</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending approval</option>
            <option value="Approved">Approved</option>
            <option value="Returned">Returned</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button id="apply" class="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">Apply</button>
          <button id="reset" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function tableShell() {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
        <div class="text-sm font-semibold">All reports</div>
        <div id="meta" class="text-xs text-slate-500">—</div>
      </div>
      <div class="overflow-auto app-scroll">
        <table class="min-w-[1100px] w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr class="text-xs font-semibold text-slate-600">
              <th class="px-4 py-3">Student</th>
              <th class="px-4 py-3">Report</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Approval progress</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody id="tbody" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
    </div>
  `;
}

function mount() {
  setPageMeta({
    title: "Quarterly Reports",
    subtitle: "Submitted • pending • returned • missing • approval chain visibility",
  });
  setPageContent(`<div class="space-y-4">${filtersHtml()}${tableShell()}</div>`);
}

function setMeta(text) {
  const el = document.getElementById("meta");
  if (el) el.textContent = text;
}

function reportRow(r) {
  const id = r?.id || r?._id || r?.reportId;
  const studentName = r?.student?.name || r?.studentName || "—";
  const studentId = r?.student?.id || r?.studentId || r?.registrationNumber || "—";
  const title = r?.title || r?.period || "Quarterly report";
  const status = r?.status || "Pending";
  const tone = toneForStatus(status);
  const canApprove = String(status).toLowerCase().includes("pending") || String(status).toLowerCase().includes("submitted");

  const profileHref =
    r?.student?.id || r?.studentId
      ? `./student-details.html?id=${encodeURIComponent(String(r?.student?.id || r?.studentId))}`
      : "";

  return `
    <tr>
      <td class="px-4 py-3">
        ${
          profileHref
            ? `<a class="font-semibold text-slate-900 hover:underline" href="${profileHref}">${escapeHtml(studentName)}</a>`
            : `<div class="font-semibold text-slate-900">${escapeHtml(studentName)}</div>`
        }
        <div class="text-xs text-slate-500">${escapeHtml(studentId)}</div>
      </td>
      <td class="px-4 py-3">
        <div class="text-sm font-semibold text-slate-900">${escapeHtml(title)}</div>
        <div class="text-xs text-slate-500">Submitted: ${escapeHtml(formatDate(r?.submittedAt || r?.date))}</div>
      </td>
      <td class="px-4 py-3">${badge({ label: status, tone })}</td>
      <td class="px-4 py-3">${chainViz(r?.approvalChain)}</td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap gap-2">
          <button data-act="approve" data-id="${escapeHtml(id)}" ${!canApprove ? "disabled" : ""} class="rounded-xl ${
            canApprove ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"
          } px-3 py-2 text-sm font-semibold transition">
            Approve
          </button>
          <button data-act="reject" data-id="${escapeHtml(id)}" ${!canApprove ? "disabled" : ""} class="rounded-xl ${
            canApprove ? "border border-slate-200 bg-white hover:bg-slate-50" : "bg-slate-200 text-slate-500 cursor-not-allowed"
          } px-3 py-2 text-sm font-semibold transition">
            Reject
          </button>
          <button data-act="override" data-id="${escapeHtml(id)}" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition">
            Override
          </button>
          <button data-act="remind" data-id="${escapeHtml(id)}" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">
            Remind
          </button>
        </div>
      </td>
    </tr>
  `;
}

function getFilters() {
  return {
    q: document.getElementById("q")?.value?.trim() || "",
    status: document.getElementById("status")?.value || "",
  };
}

async function doApprove(id) {
  if (!id) return;
  try {
    await api.approveReport(id);
    toast("Report approved", { tone: "green" });
    await load();
  } catch (e) {
    console.error(e);
    toast(e?.message || "Approve failed", { tone: "red" });
  }
}

async function doReject(id) {
  if (!id) return;
  const reason = window.prompt("Reason for rejection/return (optional):") || "";
  try {
    await api.rejectReport(id, { reason });
    toast("Report rejected/returned", { tone: "yellow" });
    await load();
  } catch (e) {
    console.error(e);
    toast(e?.message || "Reject failed", { tone: "red" });
  }
}

async function doOverride(id) {
  const modal = openModal({
    title: "Director override (Quarterly Report)",
    size: "md",
    bodyHtml: `
      <div class="space-y-3">
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Overrides should be audited. Use for emergency/demo cases.
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600">Override type</label>
          <select id="otype" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400">
            <option value="forceApprovalChain">Force approval chain completion</option>
            <option value="bypassMissingReport">Bypass missing approvals requirement</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600">Note</label>
          <input id="onote" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400" placeholder="Reason / audit note" />
        </div>
        <div class="flex gap-2">
          <button data-ok="1" class="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition">Apply override</button>
          <button data-cancel="1" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
        </div>
      </div>
    `,
  });

  modal.qs("[data-cancel='1']")?.addEventListener("click", modal.close);
  modal.qs("[data-ok='1']")?.addEventListener("click", async () => {
    try {
      const type = modal.qs("#otype")?.value;
      const note = modal.qs("#onote")?.value?.trim() || "Override applied by Director";
      const ok = await confirmModal({
        title: "Confirm override",
        message: "Apply this override now?",
        confirmText: "Override",
        tone: "yellow",
      });
      if (!ok) return;
      // Use report override endpoint if available; otherwise map to student override in backend later.
      await api.overrideStudent(id, { type, note }); // API-ready: backend can accept reportId routing or adapt later
      toast("Override applied", { tone: "yellow" });
      modal.close();
      await load();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Override failed (API not ready)", { tone: "red" });
    }
  });
}

async function doRemind(id) {
  try {
    await api.sendNotification({
      audience: "students",
      type: "reminder",
      message: "Reminder: your quarterly report approval is pending. Please follow up with supervisors/Director/Finance.",
      studentId: id,
    });
    toast("Reminder sent", { tone: "blue" });
  } catch (e) {
    console.error(e);
    toast(e?.message || "Reminder failed (API not ready)", { tone: "red" });
  }
}

async function load() {
  const tbody = document.getElementById("tbody");
  if (tbody) {
    tbody.innerHTML = Array.from({ length: 8 })
      .map(
        () => `
        <tr>
          <td class="px-4 py-3"><div class="h-4 w-48 rounded skeleton"></div><div class="mt-2 h-3 w-24 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-4 w-40 rounded skeleton"></div><div class="mt-2 h-3 w-28 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-5 w-20 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-6 w-72 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-9 w-40 rounded skeleton"></div></td>
        </tr>
      `
      )
      .join("");
  }
  setMeta("Loading…");

  try {
    const raw = await api.getReports(getFilters());
    const { reports, total } = normalizeReports(raw);
    const arr = Array.isArray(reports) ? reports : [];

    if (!arr.length) {
      setPageContent(
        `<div class="space-y-4">${filtersHtml()}${mountEmptyState({
          title: "No reports found",
          message: "No reports matched the filters returned by the API.",
          actionsHtml: `<a href="./pipeline.html" class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Open pipeline</a>`,
        })}</div>`
      );
      return;
    }

    mount();
    const tb = document.getElementById("tbody");
    if (tb) tb.innerHTML = arr.map(reportRow).join("");
    setMeta(`${arr.length}${typeof total === "number" ? ` of ${total}` : ""} reports`);
    wire();
  } catch (e) {
    console.error(e);
    toast(e?.message || "Failed to load reports", { tone: "red" });
    setPageContent(
      `<div class="space-y-4">${filtersHtml()}${mountEmptyState({
        title: "Reports data unavailable",
        message:
          "This page is wired to /api/reports and actions /api/reports/:id/approve. Start the backend and implement those endpoints.",
        actionsHtml: `<a href="./dashboard.html" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Back to dashboard</a>`,
      })}</div>`
    );
  }
}

function wire() {
  const apply = document.getElementById("apply");
  const reset = document.getElementById("reset");
  const q = document.getElementById("q");

  apply?.addEventListener("click", () => load());
  reset?.addEventListener("click", () => {
    if (q) q.value = "";
    const status = document.getElementById("status");
    if (status) status.value = "";
    load();
  });
  q?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") load();
  });

  document.getElementById("tbody")?.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "approve") doApprove(id);
    if (act === "reject") doReject(id);
    if (act === "override") doOverride(id);
    if (act === "remind") doRemind(id);
  });
}

mount();
wire();
load();

import { api } from "./api.js";
import {
  badge,
  escapeHtml,
  formatDate,
  mountEmptyState,
  setPageContent,
  setPageMeta,
  toast,
} from "./main.js";

function normalizeReports(raw) {
  const root = raw?.data || raw;
  if (Array.isArray(root)) return { reports: root };
  if (Array.isArray(root?.reports)) return root;
  if (Array.isArray(root?.items)) return { reports: root.items, total: root.total };
  return { reports: [] };
}

function toneForStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("approved")) return "green";
  if (s.includes("missing") || s.includes("overdue")) return "red";
  if (s.includes("returned") || s.includes("rejected")) return "red";
  if (s.includes("pending") || s.includes("submitted")) return "yellow";
  return "slate";
}

function chainViz(chain) {
  const steps = Array.isArray(chain) && chain.length ? chain : ["Sup1", "Sup2", "Sup3", "Director", "Finance"];
  return `
    <div class="flex flex-wrap items-center gap-1.5">
      ${steps
        .map((x, i) => {
          const role = x?.role || x?.name || x;
          const st = x?.status || "";
          const tone = String(st).toLowerCase().includes("approved")
            ? "green"
            : String(st).toLowerCase().includes("rejected")
              ? "red"
              : "slate";
          return `
            <span class="inline-flex items-center gap-1.5">
              ${badge({ label: role, tone })}
              ${i < steps.length - 1 ? `<span class="text-slate-400">→</span>` : ""}
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function filtersHtml() {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div class="text-lg font-semibold tracking-tight">Quarterly Reports</div>
          <div class="mt-1 text-sm text-slate-600">Full school visibility • approval progress • approve/reject actions</div>
        </div>
        <a href="./dashboard.html" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Dashboard</a>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="md:col-span-2">
          <label class="block text-xs font-semibold text-slate-600">Search</label>
          <input id="q" type="search" placeholder="Student / Reg No / Report period…" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600">Status</label>
          <select id="status" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400">
            <option value="">All</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending approval</option>
            <option value="Approved">Approved</option>
            <option value="Returned">Returned</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button id="apply" class="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">Apply</button>
          <button id="reset" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Reset</button>
        </div>
      </div>
    </div>
  `;
}

function tableShell() {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
        <div class="text-sm font-semibold">All reports</div>
        <div id="meta" class="text-xs text-slate-500">—</div>
      </div>
      <div class="overflow-auto app-scroll">
        <table class="min-w-[1100px] w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr class="text-xs font-semibold text-slate-600">
              <th class="px-4 py-3">Student</th>
              <th class="px-4 py-3">Report</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Approval progress</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody id="tbody" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
    </div>
  `;
}

function mount() {
  setPageMeta({
    title: "Quarterly Reports",
    subtitle: "Submitted • pending • returned • missing • approval chain visibility",
  });
  setPageContent(`<div class="space-y-4">${filtersHtml()}${tableShell()}</div>`);
}

function setMeta(text) {
  const el = document.getElementById("meta");
  if (el) el.textContent = text;
}

function reportRow(r) {
  const id = r?.id || r?._id || r?.reportId;
  const studentName = r?.student?.name || r?.studentName || "—";
  const studentId = r?.student?.id || r?.studentId || r?.registrationNumber || "—";
  const title = r?.title || r?.period || "Quarterly report";
  const status = r?.status || "Pending";
  const tone = toneForStatus(status);
  const canApprove = String(status).toLowerCase().includes("pending") || String(status).toLowerCase().includes("submitted");

  const profileHref = r?.student?.id || r?.studentId
    ? `./student-details.html?id=${encodeURIComponent(String(r?.student?.id || r?.studentId))}`
    : "";

  return `
    <tr>
      <td class="px-4 py-3">
        ${profileHref ? `<a class="font-semibold text-slate-900 hover:underline" href="${profileHref}">${escapeHtml(studentName)}</a>` : `<div class="font-semibold text-slate-900">${escapeHtml(studentName)}</div>`}
        <div class="text-xs text-slate-500">${escapeHtml(studentId)}</div>
      </td>
      <td class="px-4 py-3">
        <div class="text-sm font-semibold text-slate-900">${escapeHtml(title)}</div>
        <div class="text-xs text-slate-500">Submitted: ${escapeHtml(formatDate(r?.submittedAt || r?.date))}</div>
      </td>
      <td class="px-4 py-3">${badge({ label: status, tone })}</td>
      <td class="px-4 py-3">${chainViz(r?.approvalChain)}</td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap gap-2">
          <button data-act="approve" data-id="${escapeHtml(id)}" ${!canApprove ? "disabled" : ""} class="rounded-xl ${canApprove ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"} px-3 py-2 text-sm font-semibold transition">
            Approve
          </button>
          <button data-act="reject" data-id="${escapeHtml(id)}" ${!canApprove ? "disabled" : ""} class="rounded-xl ${canApprove ? "border border-slate-200 bg-white hover:bg-slate-50" : "bg-slate-200 text-slate-500 cursor-not-allowed"} px-3 py-2 text-sm font-semibold transition">
            Reject
          </button>
        </div>
      </td>
    </tr>
  `;
}

function getFilters() {
  return {
    q: document.getElementById("q")?.value?.trim() || "",
    status: document.getElementById("status")?.value || "",
  };
}

async function doApprove(id) {
  if (!id) return;
  try {
    await api.approveReport(id);
    toast("Report approved", { tone: "green" });
    await load();
  } catch (e) {
    console.error(e);
    toast(e?.message || "Approve failed", { tone: "red" });
  }
}

async function doReject(id) {
  if (!id) return;
  const reason = window.prompt("Reason for rejection/return (optional):") || "";
  try {
    await api.rejectReport(id, { reason });
    toast("Report rejected/returned", { tone: "yellow" });
    await load();
  } catch (e) {
    console.error(e);
    toast(e?.message || "Reject failed", { tone: "red" });
  }
}

async function load() {
  const tbody = document.getElementById("tbody");
  if (tbody) {
    tbody.innerHTML = Array.from({ length: 8 })
      .map(
        () => `
        <tr>
          <td class="px-4 py-3"><div class="h-4 w-48 rounded skeleton"></div><div class="mt-2 h-3 w-24 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-4 w-40 rounded skeleton"></div><div class="mt-2 h-3 w-28 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-5 w-20 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-6 w-72 rounded skeleton"></div></td>
          <td class="px-4 py-3"><div class="h-9 w-40 rounded skeleton"></div></td>
        </tr>
      `
      )
      .join("");
  }
  setMeta("Loading…");

  try {
    const raw = await api.getReports(getFilters());
    const { reports, total } = normalizeReports(raw);
    const arr = Array.isArray(reports) ? reports : [];

    if (!arr.length) {
      setPageContent(
        `<div class="space-y-4">${filtersHtml()}${mountEmptyState({
          title: "No reports found",
          message: "No reports matched the filters returned by the API.",
          actionsHtml: `<a href="./pipeline.html" class="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Open pipeline</a>`,
        })}</div>`
      );
      return;
    }

    mount();
    const tb = document.getElementById("tbody");
    if (tb) tb.innerHTML = arr.map(reportRow).join("");
    setMeta(`${arr.length}${typeof total === "number" ? ` of ${total}` : ""} reports`);
    wire(); // re-wire after re-mount
  } catch (e) {
    console.error(e);
    toast(e?.message || "Failed to load reports", { tone: "red" });
    setPageContent(
      `<div class="space-y-4">${filtersHtml()}${mountEmptyState({
        title: "Reports data unavailable",
        message:
          "This page is wired to /api/reports and actions /api/reports/:id/approve. Start the backend and implement those endpoints.",
        actionsHtml: `<a href="./dashboard.html" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 transition">Back to dashboard</a>`,
      })}</div>`
    );
  }
}

function wire() {
  const apply = document.getElementById("apply");
  const reset = document.getElementById("reset");
  const q = document.getElementById("q");

  apply?.addEventListener("click", () => load());
  reset?.addEventListener("click", () => {
    if (q) q.value = "";
    const status = document.getElementById("status");
    if (status) status.value = "";
    load();
  });
  q?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") load();
  });

  document.getElementById("tbody")?.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "approve") doApprove(id);
    if (act === "reject") doReject(id);
  });
}

mount();
wire();
load();

