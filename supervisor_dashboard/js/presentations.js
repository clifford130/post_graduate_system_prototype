import { qs, qsa, getSupervisorSession, escapeHtml, toast } from './main.js';
import { api } from './api.js';

export async function initPresentations() {
    const session = getSupervisorSession();
    const root = qs("#section-generic");
    if (!root) return;

    root.innerHTML = `
        <div class="p-8">
            <div class="flex-between mb-8">
                <div>
                    <h2 class="text-3xl font-black text-navy">Board Room Assignments</h2>
                    <p class="text-sm text-muted">Manage your upcoming and past seminar panel sessions</p>
                </div>
                <button class="btn btn-primary btn-sm" id="refresh-panels">Refresh Schedule</button>
            </div>
            <div id="panels-list" class="grid-2">
                <div class="col-span-2 p-20 text-center animate-pulse">
                    <div class="text-4xl mb-4">🔮</div>
                    <div class="font-bold text-muted uppercase tracking-widest text-xs">Synchronizing board schedule...</div>
                </div>
            </div>
        </div>
    `;

    loadPanels(session.id); 
    qs("#refresh-panels").onclick = () => loadPanels(session.id);
}

async function loadPanels(userId) {
    const list = qs("#panels-list");
    try {
        const panels = await api.getMyPanelAssignments(userId);
        
        if (!panels || panels.length === 0) {
            list.innerHTML = `
                <div class="col-span-2 p-20 text-center bg-white rounded-3xl border border-dashed border-grey-200">
                    <div class="text-6xl mb-6 opacity-20">📅</div>
                    <h3 class="text-xl font-bold text-navy">No Board Assignments</h3>
                    <p class="text-sm text-muted mt-2">You are not currently assigned to any upcoming presentation panels.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = panels.map(p => `
            <div class="card hover-up transition-all group overflow-hidden">
                <div class="flex justify-between items-start mb-6">
                    <div class="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner border border-white">
                        ${p.stage.includes('Thesis') ? '🎓' : '📋'}
                    </div>
                    <span class="badge ${p.role === 'chair' ? 'badge-active' : 'badge-pending'}" style="text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.05em;">
                        ${p.role} Role
                    </span>
                </div>
                
                <div class="mb-6">
                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">${p.stage} Presentation</div>
                    <h3 class="text-lg font-black text-navy leading-tight mb-2">${p.studentName || 'Research Candidate'}</h3>
                    <div class="text-xs font-bold text-muted uppercase tracking-tighter">Reg No: ${p.studentReg || 'Pending'}</div>
                </div>

                <div class="flex items-center gap-4 py-4 border-y border-slate-50 mb-6 bg-slate-50/30 -mx-8 px-8">
                    <div class="flex-1">
                        <div class="text-[9px] font-black text-slate-400 uppercase">Scheduled Date</div>
                        <div class="text-sm font-bold text-navy">${new Date(p.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div class="flex-1 text-right">
                        <div class="text-[9px] font-black text-slate-400 uppercase">Verification Status</div>
                        <div class="text-sm font-bold text-green-500">Board Ready ✓</div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <button class="btn btn-primary w-full shadow-lg shadow-rongo-blue/20" onclick="window.location.href='/panel dashboard/index.html?panelId=${p._id}'">
                        Enter Board Room
                    </button>
                </div>

                ${p.role === 'chair' ? `
                    <div class="mt-4 pt-4 border-t border-slate-50 text-center">
                        <p class="text-[10px] font-bold text-amber-600 uppercase italic">⚠️ Administrative Authority: Panel Chair privileges enabled</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div class="col-span-2 alert alert-error">${err.message}</div>`;
    }
}
