document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    let response = await fetch("http://localhost:5000/api/islogged", {
      method: "POST",
      credentials: "include"
    })
    if (response.status === 401) {
      window.location.href = "../login/login.html"
    }
  })()
  let userName = document.querySelector(".profile-name").innerHTML = JSON.parse(localStorage.getItem("postgraduate_user")).fullName || "Student"
  // ===== STATE =====
  let currentStatus = 'ACTIVE';
  const statuses = ['ACTIVE', 'DEFERRED', 'RESUMED', 'GRADUATED'];
  let currentStage = 3; // 1-indexed, active stage
  let clearanceGranted = false;
  let reportSubmitted = false;

  const stageData = [
    { label: 'Admission &\nEnrolment', phase: 1, approver: 'Registry', next: 'Complete orientation' },
    { label: 'Concept Paper\nApproval', phase: 1, approver: 'Supervisor + School Board', next: 'Submit proposal draft' },
    { label: 'Data Collection\n& Fieldwork', phase: 1, approver: 'Supervisor + Dean', next: 'Submit Progress Report Q3' },
    { label: 'Proposal\nDefence', phase: 1, approver: 'Proposal Panel', next: 'Prepare defence presentation' },
    { label: 'Research\nPermit (NACOSTI)', phase: 1, approver: 'NACOSTI Board', next: 'Upload NACOSTI docs' },
    { label: 'Data Analysis\n& Write-up', phase: 2, approver: 'Supervisor', next: 'Submit draft thesis chapters' },
    { label: 'Internal\nSeminar', phase: 2, approver: 'School Seminar Panel', next: 'Register for seminar' },
    { label: 'Thesis\nSubmission', phase: 2, approver: 'SGS Dean + Finance', next: 'Upload thesis documents' },
    { label: 'Oral Examination\n(Viva)', phase: 2, approver: 'External Examiners', next: 'Book viva date' },
    { label: 'Graduation\n& Conferment', phase: 2, approver: 'Senate', next: 'Apply for graduation' },
  ];

  // ===== NAVIGATION =====
  window.navigate = function(target, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const section = document.getElementById('section-' + target);
    if (section) section.classList.add('active');
    if (el) el.classList.add('active');

    const titles = {
      profile: ['My Profile', 'Student academic particulars & status'],
      pipeline: ['Research Pipeline', '10-Stage postgraduate research tracker'],
      reports: ['Quarterly Reports', 'Submit and track progress reports'],
      compliance: ['Compliance Center', 'NACOSTI uploads & thesis submission portal'],
      scheduling: ['Scheduling & Corrections', 'Presentation booking & AI correction checklist'],
      finance: ['ERP Finance', 'Student finance clearance & account status'],
    };
    const pageTitle = document.getElementById('page-title');
    const pageSub = document.getElementById('page-sub');
    if (pageTitle) pageTitle.textContent = titles[target][0];
    if (pageSub) pageSub.textContent = titles[target][1];
  }

  // ===== MODULE 1: STATUS =====
  const statusConfig = {
    ACTIVE: { cls: 'badge-active', label: '● ACTIVE', btn: 'btn-danger', btnText: 'Request Deferral', showAlert: false },
    DEFERRED: { cls: 'badge-deferred', label: '⏸ DEFERRED', btn: 'btn-outline', btnText: 'Request Reinstatement', showAlert: true },
    RESUMED: { cls: 'badge-resumed', label: '▶ RESUMED', btn: 'btn-danger', btnText: 'Request Deferral', showAlert: false },
    GRADUATED: { cls: 'badge-graduated', label: '🎓 GRADUATED', btn: 'btn-ghost', btnText: 'View Certificate', showAlert: false },
  };

  function updateStatusUI() {
    const cfg = statusConfig[currentStatus];
    ['status-badge', 'status-badge-2'].forEach(id => {
      const el = document.getElementById(id);
      el.className = 'badge ' + cfg.cls;
      el.textContent = cfg.label;
    });
    const btn = document.getElementById('defer-btn');
    btn.className = 'btn btn-sm ' + cfg.btn;
    btn.textContent = cfg.btnText;
    document.getElementById('deferral-alert').style.display = cfg.showAlert ? 'block' : 'none';

    // Lock pipeline if deferred
    const pipelineMsg = document.getElementById('pipeline-locked-msg');
    const gateBtn = document.getElementById('gate-btn');
    if (currentStatus === 'DEFERRED') {
      pipelineMsg.style.display = 'flex';
      gateBtn.disabled = true;
    } else {
      pipelineMsg.style.display = 'none';
      gateBtn.disabled = (currentStage > 10);
    }
  }

  function requestDeferral() {
    currentStatus = currentStatus === 'DEFERRED' ? 'RESUMED' : 'DEFERRED';
    updateStatusUI();
  }

  function cycleStatus() {
    const idx = statuses.indexOf(currentStatus);
    currentStatus = statuses[(idx + 1) % statuses.length];
    updateStatusUI();
  }

  // ===== MODULE 2: PIPELINE =====
  function renderPipeline() {
    const p1El = document.getElementById('pipeline-p1');
    const p2El = document.getElementById('pipeline-p2');
    p1El.innerHTML = ''; p2El.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
      const s = stageData[i - 1];
      let state = i < currentStage ? 'completed' : i === currentStage ? 'active' : 'locked';
      const el = document.createElement('div');
      el.className = 'pipeline-step ' + state;
      el.innerHTML = `
      <div class="step-circle ${state}">
        ${state === 'completed' ? '✓' : i}
      </div>
      <div class="step-label ${state === 'active' ? 'active-label' : state === 'completed' ? 'completed-label' : ''}">
        ${s.label.replace('\n', '<br>')}
      </div>`;
      if (s.phase === 1) p1El.appendChild(el);
      else p2El.appendChild(el);
    }

    // Update badges & meta
    const pct = Math.round(((currentStage - 1) / 10) * 100);
    const progressFill = document.getElementById('pipeline-progress-fill');
    const progressText = document.getElementById('pipeline-progress-text');
    const currentBadge = document.getElementById('pipeline-current-badge');
    const bossStageNum = document.getElementById('boss-stage-num');
    const gateBtn = document.getElementById('gate-btn');
    
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.innerHTML =
      `<strong>Stage ${Math.min(currentStage, 10)} of 10</strong> — ${stageData[Math.min(currentStage, 10) - 1].label.replace('\n', ' ')}`;
    if (currentBadge) currentBadge.textContent =
      currentStage > 10 ? '🎓 Completed' : `Stage ${currentStage} — Active`;

    const sd = stageData[Math.min(currentStage, 10) - 1];
    const sdCurrent = document.getElementById('sd-current');
    const sdApprover = document.getElementById('sd-approver');
    const sdPhase = document.getElementById('sd-phase');
    const sdNext = document.getElementById('sd-next');
    
    if (sdCurrent) sdCurrent.textContent = `Stage ${Math.min(currentStage, 10)}: ${sd.label.replace('\n', ' ')}`;
    if (sdApprover) sdApprover.textContent = sd.approver;
    if (sdPhase) sdPhase.textContent = sd.phase === 1 ? 'Phase 1 — Foundation' : 'Phase 2 — Research & Completion';
    if (sdNext) sdNext.textContent = sd.next;

    if (bossStageNum) bossStageNum.textContent = currentStage;
    checkBossLevel();

    if (gateBtn) {
      gateBtn.disabled = (currentStage > 10) || currentStatus === 'DEFERRED';
      if (currentStage > 10) gateBtn.textContent = '🎓 All Stages Complete';
    }
  }

  function advancePipeline() {
    if (currentStage >= 11 || currentStatus === 'DEFERRED') return;
    currentStage++;
    renderPipeline();
  }

  function checkBossLevel() {
    const locked = document.getElementById('boss-locked-overlay');
    const unlocked = document.getElementById('boss-unlocked');
    const icon = document.getElementById('boss-lock-icon');
    const sub = document.getElementById('boss-sub');
    const nacostiBadge = document.getElementById('nacosti-badge');
    
    if (currentStage >= 8) {
      if (locked) locked.style.display = 'none';
      if (unlocked) unlocked.style.display = 'block';
      if (icon) icon.textContent = '🔓';
      if (sub) sub.textContent = 'Stage 8 Unlocked — Upload all three required documents to proceed';
      if (nacostiBadge) {
        nacostiBadge.textContent = '✓';
        nacostiBadge.className = 'nav-badge';
      }
    } else {
      if (locked) locked.style.display = 'block';
      if (unlocked) unlocked.style.display = 'none';
      if (icon) icon.textContent = '🔒';
      if (sub) sub.innerHTML = `Unlocks at Pipeline Stage 8 — Currently at Stage <span id="boss-stage-num">${currentStage}</span>`;
      if (nacostiBadge) {
        nacostiBadge.textContent = 'S8';
        nacostiBadge.className = 'nav-badge locked';
      }
    }
  }

  // ===== MODULE 3: REPORTS =====
  function submitReport() {
    reportSubmitted = true;
    const steps = [
      { id: 'wf-1', s: 'wf-1-s', cls: 'wf-active', status: 'Under Review', delay: 0 },
      { id: 'wf-1', s: 'wf-1-s', cls: 'wf-complete', status: 'Approved ✓', delay: 1200 },
      { id: 'wf-2', s: 'wf-2-s', cls: 'wf-active', status: 'Under Review', delay: 1400 },
      { id: 'wf-2', s: 'wf-2-s', cls: 'wf-complete', status: 'Approved ✓', delay: 2600 },
      { id: 'wf-3', s: 'wf-3-s', cls: 'wf-active', status: 'Processing…', delay: 2800 },
      { id: 'wf-3', s: 'wf-3-s', cls: 'wf-complete', status: 'Archived ✓', delay: 4000 },
    ];
    steps.forEach(step => {
      setTimeout(() => {
        const el = document.getElementById(step.id);
        el.className = 'wf-step ' + step.cls;
        document.getElementById(step.s).textContent = step.status;
      }, step.delay);
    });
  }

  // ===== MODULE 4: COMPLIANCE UPLOAD =====
  function toggleUpload(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('uploaded');
    const statusEl = el.querySelector('.upload-status');
    const iconEl = el.querySelector('.upload-icon');
    if (el.classList.contains('uploaded')) {
      statusEl.textContent = 'Uploaded — ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      iconEl.textContent = '✅';
    } else {
      statusEl.textContent = 'Click to upload';
      iconEl.textContent = el.id.includes('thesis') ? '📕' : el.id.includes('intent') ? '📝' : el.id.includes('mentor') ? '🤝' : '📄';
    }
  }

  // ===== MODULE 5: CHECKLIST =====
  function toggleCheck(itemEl) {
    if (!itemEl.classList.contains('check-item')) return;
    const cb = itemEl.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    itemEl.classList.toggle('checked', cb.checked);
    updateCheckCount();
  }

  function updateCheckCount() {
    const total = document.querySelectorAll('.check-item').length;
    const checked = document.querySelectorAll('.check-item.checked').length;
    document.getElementById('check-count').textContent = checked;
    const btn = document.getElementById('signoff-btn');
    btn.disabled = (checked < total);
  }

  function requestSignoff() {
    document.getElementById('signoff-alert').style.display = 'block';
    document.getElementById('signoff-btn').disabled = true;
    document.getElementById('signoff-btn').textContent = '✅ Sign-off Requested';
  }

  function bookPresentation() {
    const date = document.getElementById('pres-date').value;
    if (!date) { alert('Please select a preferred presentation date.'); return; }
    alert('✅ Booking request submitted for ' + new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '. You will receive confirmation within 3 working days.');
  }

  // ===== MODULE 6: FINANCE =====
  function toggleClearance() {
    clearanceGranted = !clearanceGranted;
    const display = document.getElementById('clearance-display');
    const statusVal = document.getElementById('erp-status-val');
    const finRow = document.getElementById('finance-row');
    const finBadge = document.getElementById('finance-row-badge');
    const finNavBadge = document.getElementById('finance-badge');
    if (clearanceGranted) {
      display.className = 'clearance-card clearance-granted';
      display.innerHTML = `
      <div class="clearance-icon">✅</div>
      <div class="clearance-status" style="color:var(--green);">Clearance Granted</div>
      <div class="clearance-message" style="color:#065F46;">
        Your student finance account has been fully cleared. You are eligible to proceed with examination registration, thesis submission, and graduation application.
      </div>
      <div class="alert alert-success" style="width:100%; text-align:left;">
        <span class="alert-icon">📋</span>
        <div>Clearance certificate is available for download from the Finance Office or via the ERP Student Self-Service portal.</div>
      </div>`;
      statusVal.innerHTML = '✅ Granted';
      finRow.style.background = 'var(--green-light)';
      finBadge.className = 'badge badge-active';
      finBadge.textContent = 'Cleared';
      finNavBadge.style.display = 'none';
    } else {
      display.className = 'clearance-card clearance-pending';
      display.innerHTML = `
      <div class="clearance-icon">⏳</div>
      <div class="clearance-status" style="color:var(--amber);">Clearance Pending</div>
      <div class="clearance-message" style="color:#92400E;">
        Clearance is pending due to an outstanding balance on your student account.
        Please contact the Finance Office to resolve this matter before your clearance can be granted.
      </div>
      <div class="alert alert-error" style="width:100%; text-align:left;">
        <span class="alert-icon">📧</span>
        <div>Contact Finance: <a href="mailto:finance@university.edu">finance@university.edu</a> — reference your registration number when writing.</div>
      </div>`;
      statusVal.innerHTML = '⏳ Pending';
      finRow.style.background = 'var(--red-light)';
      finBadge.className = 'badge badge-deferred';
      finBadge.textContent = 'Pending';
      finNavBadge.style.display = 'inline-flex';
    }
  }

  // ===== INIT =====
  renderPipeline();
  updateStatusUI();
})