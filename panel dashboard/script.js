/* ── Backend Integration ────────────────────────────────────── */
const API_BASE = "http://localhost:5000/api";

let panels = [];
let activePanelIndex = -1;
let verdict = null;

async function init() {
  const userRaw = localStorage.getItem("postgraduate_user");
  if (!userRaw) {
    window.location.href = "../login/login.html";
    return;
  }
  const user = JSON.parse(userRaw);
  const userId = user._id || user.id;

  try {
    const res = await fetch(`${API_BASE}/panels/my/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch assigned panels");
    panels = await res.json();
    renderQueue();

    // Check for deep link to specific panel
    const params = new URLSearchParams(window.location.search);
    const deepPanelId = params.get('panelId');

    if (deepPanelId) {
      const idx = panels.findIndex(p => p._id === deepPanelId);
      if (idx !== -1) {
        loadPanel(idx);
        return;
      }
    }

    if (panels.length > 0) {
      loadPanel(0);
    } else {
      document.getElementById('assessmentWorkspace').style.display = 'none';
      document.getElementById('welcomeState').style.display = 'flex';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderQueue() {
  const sidebar = document.querySelector('.sidebar');
  const title = sidebar.querySelector('.sidebar-title');
  const titleHtml = title ? title.outerHTML : '<div class="sidebar-title">Boards Queue</div>';
  sidebar.innerHTML = titleHtml;

  panels.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = `queue-item ${idx === activePanelIndex ? 'active' : ''}`;
    div.id = `qi-${idx}`;
    div.onclick = () => loadPanel(idx);
    
    const date = new Date(p.scheduledDate);
    div.innerHTML = `
      <div class="q-meta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        <span class="q-dot"></span>${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div class="q-name">${p.studentId?.fullName || 'Unknown'}</div>
      <div class="q-stage">${p.stage}</div>
      <div style="margin-top:8px">${p.hasSubmitted ? '<span style="color:var(--green);font-size:10px;font-weight:bold;">✓ SUBMITTED</span>' : `<button class="btn-assess" onclick="event.stopPropagation();loadPanel(${idx})">Assess Now →</button>`}</div>
    `;
    sidebar.appendChild(div);
  });
}

function loadPanel(idx) {
  activePanelIndex = idx;
  const p = panels[idx];
  const s = p.studentId || {};
  
  document.getElementById('assessmentWorkspace').style.display = 'block';
  document.getElementById('welcomeState').style.display = 'none';
  
  document.getElementById('studentAvatar').textContent = (s.fullName || 'U').substring(0, 1);
  document.getElementById('studentName').textContent   = s.fullName || 'Unknown';
  document.getElementById('studentReg').textContent    = s.userNumber || 'N/A';
  document.getElementById('studentUniv').textContent   = 'Institutional Portal'; // Placeholder
  document.getElementById('studentStage').textContent  = p.stage;
  
  document.querySelectorAll('.queue-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  resetForm();
  
  // Disable form if already submitted or revoked
  const submitBtn = document.querySelector('.btn-primary');
  const isRevoked = p.membershipStatus === 'revoked';

  if (p.hasSubmitted || isRevoked) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.textContent = isRevoked ? 'Privileges Revoked' : 'Already Submitted';
    
    // Disable all inputs in the form
    document.querySelectorAll('#assessmentWorkspace input, #assessmentWorkspace textarea, #assessmentWorkspace select').forEach(el => el.disabled = true);
  } else {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.textContent = 'Submit Assessment';
    document.querySelectorAll('#assessmentWorkspace input, #assessmentWorkspace textarea, #assessmentWorkspace select').forEach(el => el.disabled = false);
  }

  // --- Formal Role Logic ---
  const roleBadge = document.getElementById('myRoleBadge');
  const aiPortal = document.getElementById('aiPortalCard');
  const mobileAiBtn = document.getElementById('mbn-ai');

  if (isRevoked) {
    roleBadge.textContent = 'PRIVILEGES REVOKED';
    roleBadge.style.background = '#fee2e2';
    roleBadge.style.color = '#991b1b';
    roleBadge.style.borderColor = '#991b1b';
    if (aiPortal) aiPortal.style.display = 'none';
    if (mobileAiBtn) mobileAiBtn.style.display = 'none';
    showToast(`Access to this board has been revoked or expired.`, 'error');
  } else if (p.role === 'chair') {
    roleBadge.textContent = 'PANEL CHAIR';
    roleBadge.style.background = '#dcfce7';
    roleBadge.style.color = '#166534';
    roleBadge.style.borderColor = '#166534';
    if (aiPortal) aiPortal.style.display = 'block';
    if (mobileAiBtn) mobileAiBtn.style.display = 'flex';
    showToast(`You are the CHAIR for this session`, 'success');
  } else {
    roleBadge.textContent = 'PANEL MEMBER';
    roleBadge.style.background = 'var(--blue-light)';
    roleBadge.style.color = 'var(--blue)';
    roleBadge.style.borderColor = 'var(--blue)';
    if (aiPortal) aiPortal.style.display = 'none';
    if (mobileAiBtn) mobileAiBtn.style.display = 'none';
    showToast(`Loaded: ${s.fullName}`, 'success');
  }
}

/* ── Auto-scoring ──────────────────────────────────────── */
function calcScore() {
  ['lit1', 'lit2', 'meth1', 'meth2', 'prob', 'obj', 'pres'].forEach(id => {
    const el = document.getElementById('s_' + id);
    if (el) document.getElementById('v_' + id).textContent = el.value;
  });

  const probScore = +document.getElementById('s_prob').value * 10; // Scale to 100
  const objScore = +document.getElementById('s_obj').value * 10;
  const presScore = +document.getElementById('s_pres').value * 10;

  const litSlider = (+document.getElementById('s_lit1').value + +document.getElementById('s_lit2').value) / 2;
  const methSlider = (+document.getElementById('s_meth1').value + +document.getElementById('s_meth2').value) / 2;

  let litCheck = 0, methCheck = 0;
  document.querySelectorAll('#litChecks input[type=checkbox]:checked').forEach(cb => litCheck += +cb.dataset.pts);
  document.querySelectorAll('#methChecks input[type=checkbox]:checked').forEach(cb => methCheck += +cb.dataset.pts);

  const litRaw = litSlider + litCheck;
  const methRaw = methSlider + methCheck;
  const litPct = Math.round((litRaw / 30) * 100);
  const methPct = Math.round((methRaw / 30) * 100);
  
  const total = Math.round((probScore + objScore + litPct + methPct + presScore) / 5);

  document.getElementById('scorePct').textContent = total + '%';
  document.getElementById('barLit').style.width = litPct + '%';
  document.getElementById('barMeth').style.width = methPct + '%';
  document.getElementById('litPct').textContent = litPct + '%';
  document.getElementById('methPct').textContent = methPct + '%';

  const circle = document.getElementById('scoreCircle');
  const pctEl = document.getElementById('scorePct');
  let col = total >= 70 ? 'var(--green)' : (total >= 50 ? 'var(--amber)' : 'var(--red)');
  circle.style.borderColor = col;
  pctEl.style.color = col;
}

function setVerdict(v) {
  verdict = v;
  document.getElementById('btnPass').classList.toggle('active', v === 'pass');
  document.getElementById('btnFail').classList.toggle('active', v === 'fail');
  document.getElementById('verdictNote').textContent = v === 'pass' ? 'Student recommended for advancement.' : 'Student recommended for revision.';
}

async function submitAssessment() {
  if (!verdict) { showToast('Please select Pass or Fail before submitting.', 'error'); return; }
  
  const p = panels[activePanelIndex];
  const litPct = parseInt(document.getElementById('litPct').textContent);
  const methPct = parseInt(document.getElementById('methPct').textContent);
  const probScore = +document.getElementById('s_prob').value * 10;
  const objScore = +document.getElementById('s_obj').value * 10;
  const presScore = +document.getElementById('s_pres').value * 10;
  
  const payload = {
    memberId: p.memberId,
    scores: {
      problemScore: probScore,
      objectivesScore: objScore,
      literatureScore: litPct,
      methodologyScore: methPct,
      presentationScore: presScore
    },
    structuredFeedback: {
      criticalIssues: document.getElementById('crit_issues').value || "",
      minorIssues: document.getElementById('minor_issues').value || "",
      recommendations: document.getElementById('recom_remarks').value || ""
    },
    verdict: verdict === 'pass' ? 'pass' : 'revise'
  };

  try {
    const res = await fetch(`${API_BASE}/panels/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to submit evaluation");
    
    showToast(`Assessment submitted successfully!`, 'success');
    init(); // Refresh data
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function resetForm() {
  ['s_lit1', 's_lit2', 's_meth1', 's_meth2', 'prob', 'obj', 'pres'].forEach(id => {
    const el = document.getElementById('s_' + id);
    if (el) el.value = 0;
  });
  document.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  ['crit_issues', 'minor_issues', 'recom_remarks'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Also clear the individual criteria textareas if needed
  document.querySelectorAll('.rubric-criteria .comment-area').forEach(ta => ta.value = '');
  verdict = null;
  document.getElementById('btnPass').classList.remove('active');
  document.getElementById('btnFail').classList.remove('active');
  document.getElementById('verdictNote').textContent = '';
  calcScore();
}

/* ── UI Helpers & Mobile Logic ──────────────────────────── */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
  document.getElementById('hamburgerBtn').classList.toggle('open');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.getElementById('hamburgerBtn').classList.remove('open');
}

/* ── AI Transcript & Corrections Logic (Chair Only) ── */
let currentSuggestedCorrections = [];

async function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const panel = panels[activePanelIndex];
  if (panel.role !== 'chair') {
    showToast("Error: Only the Panel Chair can upload transcripts.", "error");
    return;
  }

  showToast("Uploading & Processing with AI...", "info");
  document.getElementById('uploadZone').style.opacity = '0.5';

  try {
    const res = await fetch(`${API_BASE}/panels/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panelId: panel._id, fileName: file.name })
    });
    if (!res.ok) throw new Error("AI processing failed");
    
    const data = await res.json();
    currentSuggestedCorrections = data.suggestedCorrections;
    
    renderCorrections(data.suggestedCorrections);
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('uploadStatus').style.display = 'flex';
    document.getElementById('correctionsSection').style.display = 'block';
    showToast("AI Extraction Complete", "success");
  } catch (err) {
    showToast(err.message, "error");
    document.getElementById('uploadZone').style.opacity = '1';
  }
}

function renderCorrections(corrections) {
  const containers = {
    critical: document.getElementById('corrections-critical'),
    major: document.getElementById('corrections-major'),
    minor: document.getElementById('corrections-minor')
  };

  // Clear existing
  Object.values(containers).forEach(c => c.innerHTML = '');

  corrections.forEach(cor => {
    const div = document.createElement('div');
    div.className = 'correction-item';
    div.style = 'background:#fff; border:1px solid #eee; padding:10px; border-radius:8px; margin-bottom:8px; font-size:13px; color:#555; position:relative;';
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <span>${cor.description}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">&times;</button>
      </div>
    `;
    containers[cor.category].appendChild(div);
  });
}

async function publishCorrections() {
  const panel = panels[activePanelIndex];
  
  // Collect final list from UI (allowing Chair for minor edits/deletes)
  const finalCorrections = [];
  ['critical', 'major', 'minor'].forEach(cat => {
    document.getElementById(`corrections-${cat}`).querySelectorAll('.correction-item').forEach(el => {
      finalCorrections.push({ category: cat, description: el.innerText.replace('×', '').trim() });
    });
  });

  if (finalCorrections.length === 0) {
    showToast("Please provide at least one correction item.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/panels/${panel._id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corrections: finalCorrections })
    });
    if (!res.ok) throw new Error("Failed to publish checklist");
    
    showToast("Formal Checklist Published!", "success");
    document.getElementById('correctionsSection').innerHTML = `
      <div style="padding:40px; text-align:center; color:var(--green);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <h3>Checklist Finalized</h3>
        <p>The student has been notified to start revisions.</p>
      </div>
    `;
  } catch (err) {
    showToast(err.message, "error");
  }
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.className = 'toast' + (type ? ' ' + type : '');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// Mobile tab logic
function mobileTab(tab) {
  document.querySelectorAll('.mbn-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mbn-' + tab).classList.add('active');
  // ... similar visibility logic as original ...
}

window.calcScore = calcScore;
window.setVerdict = setVerdict;
window.submitAssessment = submitAssessment;
window.resetForm = resetForm;
window.loadPanel = loadPanel;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.handleUpload = handleUpload;
window.publishCorrections = publishCorrections;

// Initial Call
document.addEventListener("DOMContentLoaded", init);