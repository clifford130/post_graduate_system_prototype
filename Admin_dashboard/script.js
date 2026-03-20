/* ═══════════════════════════════════════════════════════════════════ */
/* MOCK DATA                                                          */
/* ═══════════════════════════════════════════════════════════════════ */
const students = [
    {name:'Abigail Otieno',          id:'PHD/002/2021', prog:'PhD',    dept:'CMJ',  stage:'Stage 4',  full:'Stage 4 — Proposal Defence',        days:12,  status:'active'   },
    {name:'Brian Wekesa Ayieko',     id:'MA/008/2022',  prog:'Masters',dept:'IHRS', stage:'Stage 3',  full:'Stage 3 — Progress Seminar',         days:45,  status:'active'   },
    {name:'Caroline Namukhula',      id:'PHD/017/2020', prog:'PhD',    dept:'IHRS', stage:'Stage 7',  full:'Stage 7 — Pre-Viva Review',          days:8,   status:'active'   },
    {name:'David Mwangi Kamau',      id:'MSC/033/2021', prog:'Masters',dept:'CMJ',  stage:'Stage 6',  full:'Stage 6 — Draft Submission',         days:61,  status:'active'   },
    {name:'Esther Akinyi Oloo',      id:'PHD/015/2022', prog:'PhD',    dept:'CMJ',  stage:'Stage 4',  full:'Stage 4 — Proposal Defence',         days:30,  status:'active'   },
    {name:'Faith Nekesa Wangila',    id:'PHD/014/2021', prog:'PhD',    dept:'CMJ',  stage:'Stage 3',  full:'Stage 3 — Progress Seminar',         days:220, status:'deferred'  },
    {name:'George Ochieng Ouma',     id:'MA/007/2022',  prog:'Masters',dept:'IHRS', stage:'Stage 5a', full:'Stage 5a — Ethics Clearance',        days:290, status:'deferred'  },
    {name:'Hannah Chebet Bett',      id:'PHD/003/2020', prog:'PhD',    dept:'CMJ',  stage:'Stage 6',  full:'Stage 6 — Draft Submission',         days:55,  status:'deferred'  },
    {name:'Isaac Wanyama Barasa',    id:'PHD/001/2019', prog:'PhD',    dept:'CMJ',  stage:'Stage 9',  full:'Stage 9 — Thesis Correction',        days:95,  status:'active'   },
    {name:'Janet Cheruto Kiprop',    id:'MSC/040/2022', prog:'Masters',dept:'IHRS', stage:'Stage 8',  full:'Stage 8 — Viva Voce',                days:5,   status:'active'   },
    {name:'Kenneth Juma Odinga',     id:'PHD/011/2022', prog:'PhD',    dept:'IHRS', stage:'Stage 5b', full:'Stage 5b — NACOSTI & Field Work',    days:35,  status:'active'   },
    {name:'Lilian Wanjiru Mwangi',   id:'MSC/004/2023', prog:'Masters',dept:'CMJ',  stage:'Stage 5b', full:'Stage 5b — NACOSTI & Field Work',    days:28,  status:'active'   },
    {name:'Michael Simiyu Wafula',   id:'PHD/028/2021', prog:'PhD',    dept:'IHRS', stage:'Stage 5b', full:'Stage 5b — NACOSTI & Field Work',    days:40,  status:'active'   },
    {name:'Nancy Atieno Adhiambo',   id:'MA/016/2022',  prog:'Masters',dept:'CMJ',  stage:'Stage 5b', full:'Stage 5b — Field Work',              days:22,  status:'active'   },
    {name:'Oliver Mutua Ndambuki',   id:'PHD/019/2023', prog:'PhD',    dept:'CMJ',  stage:'Stage 2',  full:'Stage 2 — Concept Paper',            days:17,  status:'active'   },
    {name:'Patricia Njeri Kamande',  id:'MSC/027/2021', prog:'Masters',dept:'IHRS', stage:'Stage 10', full:'Stage 10 — Graduation Clearance',    days:6,   status:'graduated' },
    {name:'Quentin Onyango Ochieng', id:'PHD/044/2020', prog:'PhD',    dept:'IHRS', stage:'Stage 8',  full:'Stage 8 — Viva Voce',                days:120, status:'active'   },
    {name:'Rachel Auma Siaya',       id:'MSC/012/2023', prog:'Masters',dept:'CMJ',  stage:'Stage 1',  full:'Stage 1 — Registration & Induction', days:4,   status:'active'   },
    {name:'Simon Kipkemoi Bett',     id:'PHD/036/2022', prog:'PhD',    dept:'CMJ',  stage:'Stage 5a', full:'Stage 5a — Ethics Clearance',        days:75,  status:'active'   },
    {name:'Teresa Wacera Njoroge',   id:'MA/009/2022',  prog:'Masters',dept:'IHRS', stage:'Stage 6',  full:'Stage 6 — Draft Submission',         days:88,  status:'resumed'   },
    {name:'Uriah Nabwire Makokha',   id:'PHD/022/2021', prog:'PhD',    dept:'CMJ',  stage:'Stage 7',  full:'Stage 7 — Pre-Viva Review',          days:14,  status:'active'   },
    {name:'Violet Anyango Odera',    id:'MSC/031/2023', prog:'Masters',dept:'IHRS', stage:'Stage 2',  full:'Stage 2 — Concept Paper',            days:9,   status:'active'   },
    {name:'Walter Mukhwana Likhayo', id:'PHD/006/2020', prog:'PhD',    dept:'IHRS', stage:'Stage 9',  full:'Stage 9 — Thesis Correction',        days:102, status:'active'   },
    {name:'Xenia Nabatta Wesonga',   id:'MSC/048/2021', prog:'Masters',dept:'CMJ',  stage:'Stage 7',  full:'Stage 7 — Pre-Viva Review',          days:50,  status:'active'   },
  ];
  
  /* ═══════════════════════════════════════════════════════════════════ */
  /* PIPELINE TABLE RENDER                                              */
  /* ═══════════════════════════════════════════════════════════════════ */
  function dayClass(days, status) {
    if (status === 'deferred' || status === 'graduated') return '';
    if (days > 90) return 'crit';
    if (days > 45) return 'warn';
    return '';
  }
  function renderRow(s) {
    const dc = dayClass(s.days, s.status);
    return `<tr data-name="${s.name.toLowerCase()}" data-id="${s.id.toLowerCase()}" data-prog="${s.prog}" data-dept="${s.dept}">
      <td><div class="s-name">${s.name}</div><div class="s-id">${s.id}</div></td>
      <td><span class="prog-pill ${s.prog==='PhD'?'phd':'msc'}">${s.prog}</span><div class="dept-tag">${s.dept}</div></td>
      <td><span class="stage-badge">${s.stage}</span><div style="font-size:10.5px;color:var(--text-3);margin-top:2px;">${s.full}</div></td>
      <td><span class="days-val ${dc}">${s.days}d</span></td>
      <td><span class="status ${s.status}">${s.status.toUpperCase()}</span></td>
      <td><div class="btn-gap">
        <button class="btn btn-ghost btn-sm" onclick="alert('Opening full profile for ${s.name.replace(/'/g,"\\'")}')">View</button>
        <button class="btn btn-outline btn-sm" onclick="alert('Advancing pipeline stage for ${s.name.replace(/'/g,"\\'")}')">Advance</button>
      </div></td>
    </tr>`;
  }
  function renderAll() {
    document.getElementById('pipelineBody').innerHTML = students.map(renderRow).join('');
    updateCount();
  }
  function updateCount() {
    const rows = document.querySelectorAll('#pipelineBody tr');
    let v = 0;
    rows.forEach(r => { if (r.style.display !== 'none') v++; });
    document.getElementById('rowCount').textContent = `Showing ${v} of ${students.length} students`;
  }
  
  /* ═══════════════════════════════════════════════════════════════════ */
  /* FILTER LOGIC                                                       */
  /* ═══════════════════════════════════════════════════════════════════ */
  function applyFilters() {
    const q    = document.getElementById('searchInput').value.toLowerCase().trim();
    const prog = document.getElementById('progFilter').value;
    const dept = document.getElementById('deptFilter').value;
    let vis = 0;
    document.querySelectorAll('#pipelineBody tr').forEach(row => {
      const ok = (!q    || row.dataset.name.includes(q) || row.dataset.id.includes(q))
              && (!prog || row.dataset.prog === prog)
              && (!dept || row.dataset.dept === dept);
      row.style.display = ok ? '' : 'none';
      if (ok) vis++;
    });
    document.getElementById('rowCount').textContent = `Showing ${vis} of ${students.length} students`;
  }
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('progFilter').addEventListener('change', applyFilters);
  document.getElementById('deptFilter').addEventListener('change', applyFilters);
  
  /* ═══════════════════════════════════════════════════════════════════ */
  /* SPA NAVIGATION                                                     */
  /* ═══════════════════════════════════════════════════════════════════ */
  const titles = {
    pipeline:'Global Pipeline Dashboard',
    enrollment:'Enrollment & Status Management',
    deferrals:'Deferral Tracking Registry',
    calendar:'Seminar Calendar Management',
    nacosti:'NACOSTI Compliance Tracking'
  };
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const v = item.dataset.view;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(s => s.classList.remove('active'));
      document.getElementById('view-' + v).classList.add('active');
      document.getElementById('topbarTitle').innerHTML =
        titles[v] + '<span>Rongo University</span>';
    });
  });
  
  /* ═══════════════════════════════════════════════════════════════════ */
  /* FORM HANDLERS                                                      */
  /* ═══════════════════════════════════════════════════════════════════ */
  function handleEnrollment() {
    const name = document.getElementById('enroll-name').value.trim();
    const reg  = document.getElementById('enroll-reg').value.trim();
    const prog = document.getElementById('enroll-prog').value;
    const dept = document.getElementById('enroll-dept').value;
    if (!name || !reg || !prog || !dept) {
      alert('⚠️  Please complete all required fields:\n• Full Name\n• Registration Number\n• Programme\n• Department');
      return;
    }
    alert(`✅  Registration Successful!\n\nStudent: ${name}\nReg No: ${reg}\nProgramme: ${prog}\nDepartment: ${dept}\n\nEnrolled at Stage 1. Welcome email dispatched to student and assigned supervisor.`);
    clearEnrollForm();
  }
  function clearEnrollForm() {
    ['enroll-name','enroll-reg','enroll-sup','enroll-date','enroll-title'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('enroll-prog').value = '';
    document.getElementById('enroll-dept').value = '';
  }
  
  /* Status search */
  document.getElementById('status-search').addEventListener('input', function() {
    const q = this.value.toLowerCase().trim();
    const resEl = document.getElementById('status-results');
    if (q.length < 2) { resEl.style.display = 'none'; return; }
    const found = students.find(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    if (found) {
      resEl.style.display = 'block';
      document.getElementById('status-found-name').textContent = found.name;
      document.getElementById('status-found-meta').textContent = `${found.id} · ${found.prog} · ${found.dept} · ${found.stage}`;
      const sc = document.getElementById('status-current');
      sc.className = 'status ' + found.status;
      sc.textContent = found.status.toUpperCase();
    } else {
      resEl.style.display = 'none';
    }
  });
  function handleStatusUpdate() {
    const q = document.getElementById('status-search').value.trim();
    if (!q) { alert('⚠️  Please search for a student first.'); return; }
    const found = students.find(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()));
    if (!found) { alert('⚠️  No student found. Please refine your search.'); return; }
    const ns = document.getElementById('new-status').value;
    const dt = document.getElementById('status-date').value || 'Today';
    alert(`✅  Status Updated Successfully!\n\nStudent: ${found.name}\nNew Status: ${ns}\nEffective Date: ${dt}\n\nA notification has been sent to the student and supervisor.`);
  }
  
  function processResumption(name) {
    if (confirm(`Process resumption for ${name}?\n\nThis will:\n• Change status: DEFERRED → RESUMED\n• Restore frozen pipeline stage\n• Notify student and supervisor\n\nProceed?`)) {
      alert(`✅  Resumption processed for ${name}.\n\nStatus set to RESUMED. Pipeline stage restored and supervisor notified.`);
    }
  }
  
  function addSlot() {
    const date  = document.getElementById('slot-date').value;
    const start = document.getElementById('slot-start').value;
    const end   = document.getElementById('slot-end').value;
    const level = document.getElementById('slot-level').value;
    const venue = document.getElementById('slot-venue').value || 'TBC';
    if (!date || !start || !end) { alert('⚠️  Please provide Date, Start Time, and End Time.'); return; }
    const d   = new Date(date);
    const day = String(d.getDate()).padStart(2,'0');
    const mon = d.toLocaleString('default', {month:'short'});
    const html = `<div class="slot-item">
      <div class="slot-date-blk"><div class="slot-day">${day}</div><div class="slot-mon">${mon}</div></div>
      <div class="slot-info"><div class="slot-time">${start} – ${end}</div><div class="slot-level">${level} Seminar</div><div class="slot-venue">${venue}</div></div>
      <span class="status active">Open</span>
    </div>`;
    document.getElementById('slotList').insertAdjacentHTML('afterbegin', html);
    alert(`✅  Seminar slot added!\n\n${level} Seminar\nDate: ${date} | ${start} – ${end}\nVenue: ${venue}`);
    clearSlotForm();
  }
  function clearSlotForm() {
    ['slot-date','slot-start','slot-end','slot-venue','slot-max'].forEach(id => document.getElementById(id).value = '');
  }
  
  function verifyUpload(name) {
    alert(`✅  Permit Verified for ${name}!\n\nNACOSTI document has been verified and marked compliant.\nStudent may proceed with field data collection.`);
  }
  function markNotRequired(name) {
    if (confirm(`Grant NACOSTI exemption for ${name}?\n\nThis should only apply to desk-based or documentary research.\nThis action is logged with your credentials and timestamp.\n\nProceed?`)) {
      alert(`✅  Exemption granted for ${name}.\n\nStatus updated to "Not Required". Action logged.`);
    }
  }
  
  /* ═══════════════════════════════════════════════════════════════════ */
  /* TOPBAR DATE                                                        */
  /* ═══════════════════════════════════════════════════════════════════ */
  (function(){
    const d = new Date();
    document.getElementById('topbarDate').textContent =
      d.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  })();
  
  /* INIT */
  renderAll();