import { qs, getSupervisorSession, toast, escapeHtml } from './main.js';
import { api } from './api.js';

function statusBadge(status) {
  const value = String(status || "").toLowerCase();
  const cls = value === "approved"
    ? "badge-active"
    : value === "returned"
      ? "badge-deferred"
      : "badge-pending";
  return `<span class="badge ${cls}">${escapeHtml(status || "-")}</span>`;
}

function renderBoard(reports) {
  const root = qs("#section-qreports");
  if (!root) return;

  root.innerHTML = `
    <div class="card p-0 animate-in">
      <div class="p-8 border-b border-grey-100 flex-between">
        <div>
          <div class="card-title">Quarterly Reports Board</div>
          <div class="card-sub">Submitted student quarterly reports awaiting supervisor review</div>
        </div>
        <div class="flex-row">
          <input id="qreports-search" placeholder="Search student or summary..." class="form-input btn-sm" style="width:220px;">
          <select id="qreports-status" class="form-input btn-sm" style="width:180px;">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="pending_dean">Pending director</option>
            <option value="approved">Approved</option>
            <option value="returned">Returned</option>
          </select>
          <button class="btn btn-primary btn-sm" id="qreports-apply">Apply</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="w-full">
          <thead>
            <tr style="background:var(--grey-50);">
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">Student</th>
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">Quarter</th>
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">Summary</th>
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">My Slot</th>
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">Status</th>
              <th class="text-left p-4 text-xs uppercase tracking-widest text-muted">Actions</th>
            </tr>
          </thead>
          <tbody id="qreports-tbody">
            ${reports.length ? reports.map(rowHtml).join("") : `
              <tr>
                <td colspan="6" class="p-16 text-center text-muted font-bold uppercase text-xs">No quarterly reports found</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  qs("#qreports-apply")?.addEventListener("click", loadQuarterlyReportsBoard);
}

function rowHtml(entry) {
  const report = entry.report || {};
  return `
    <tr style="border-top:1px solid var(--grey-100);">
      <td class="p-4">
        <div class="text-sm font-bold text-navy">${escapeHtml(entry.studentName || "-")}</div>
        <div class="text-[10px] font-bold text-muted uppercase mt-1">${escapeHtml(entry.studentNumber || "-")}</div>
        <div class="text-[10px] font-bold text-muted uppercase mt-1">${escapeHtml(entry.programme || "-")} | ${escapeHtml(entry.department || "-")}</div>
      </td>
      <td class="p-4">
        <div class="text-sm font-bold text-navy">Q${escapeHtml(String(report.quarter || "-"))} ${escapeHtml(String(report.year || "-"))}</div>
        <div class="text-[10px] font-bold text-muted uppercase mt-1">${report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "-"}</div>
      </td>
      <td class="p-4">
        <div class="text-xs font-medium text-grey-700">${escapeHtml(report.progressSummary || "-")}</div>
        <div class="text-[10px] text-muted mt-2">${escapeHtml(report.nextQuarterPlan || "-")}</div>
      </td>
      <td class="p-4">
        <div class="text-xs font-bold uppercase text-blue">${escapeHtml(entry.supervisorRole || "-")}</div>
        <div class="text-[10px] text-muted mt-1">${escapeHtml(report.approvals?.[entry.supervisorRole] || "-")}</div>
      </td>
      <td class="p-4">${statusBadge(report.status)}</td>
      <td class="p-4">
        ${entry.canReview ? `
          <div class="flex-row">
            <button class="btn btn-primary btn-sm btn-qreport-action" data-student="${entry.studentId}" data-report="${report.id}" data-role="${entry.supervisorRole}" data-action="approved">Approve</button>
            <button class="btn btn-outline btn-sm btn-qreport-action" data-student="${entry.studentId}" data-report="${report.id}" data-role="${entry.supervisorRole}" data-action="returned">Return</button>
          </div>
        ` : `<span class="text-[10px] font-bold uppercase text-muted">No action</span>`}
      </td>
    </tr>
  `;
}

export async function initQuarterlyReportsBoard() {
  await loadQuarterlyReportsBoard();
}

async function loadQuarterlyReportsBoard() {
  const root = qs("#section-qreports");
  if (!root) return;

  root.innerHTML = `<div class="card p-20 text-center text-muted font-bold uppercase text-xs animate-in">Loading quarterly reports...</div>`;

  try {
    const session = getSupervisorSession();
    const status = qs("#qreports-status")?.value || "";
    const q = qs("#qreports-search")?.value || "";
    const response = await api.getQuarterlyReportsBoard(session.id, { status, q });
    const reports = Array.isArray(response?.reports) ? response.reports : [];

    renderBoard(reports);
    wireActions();
    if (qs("#qreports-status")) qs("#qreports-status").value = status;
    if (qs("#qreports-search")) qs("#qreports-search").value = q;
  } catch (error) {
    root.innerHTML = `<div class="card p-20 text-center text-red-500 font-bold animate-in">Failed to load quarterly reports: ${escapeHtml(error.message || "Unknown error")}</div>`;
  }
}

function wireActions() {
  document.querySelectorAll(".btn-qreport-action").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const comment = action === "returned"
        ? window.prompt("Return comment", "Please revise and resubmit.") || ""
        : "Approved by supervisor";

      try {
        const session = getSupervisorSession();
        await api.approveQReport(btn.dataset.student, btn.dataset.report, {
          supervisorId: session.id,
          role: btn.dataset.role,
          action,
          comment,
        });
        toast(action === "approved" ? "Quarterly report approved" : "Quarterly report returned", {
          tone: action === "approved" ? "green" : "yellow",
        });
        loadQuarterlyReportsBoard();
      } catch (error) {
        toast(error.message || "Failed to review quarterly report", { tone: "red" });
      }
    });
  });
}
