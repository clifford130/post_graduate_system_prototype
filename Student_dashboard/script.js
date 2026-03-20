document.addEventListener("DOMContentLoaded", () => {
  // ===== PRESENTATION BOOKING HANDLER =====
  class PresentationBookingHandler {
    constructor() {
      this.apiBaseUrl = 'http://localhost:5000/api';
      this.initializeEventListeners();
    }

    initializeEventListeners() {
      // Find the booking button in the scheduling section
      const bookingButton = document.querySelector('#section-scheduling .btn-primary');
      if (bookingButton) {
        // Remove existing onclick to avoid duplicates
        const newButton = bookingButton.cloneNode(true);
        bookingButton.parentNode.replaceChild(newButton, bookingButton);
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleBooking();
        });
      }
    }

    async handleBooking() {
      try {
        // Get form data from the scheduling section
        const bookingData = this.collectBookingData();

        // Validate form data
        const validation = this.validateBookingData(bookingData);
        if (!validation.isValid) {
          this.showNotification(validation.message, 'error');
          return;
        }

        // Get user data from localStorage
        const userData = this.getUserData();
        if (!userData) {
          this.showNotification('Please login to book a presentation', 'error');
          window.location.href = '../login/login.html';
          return;
        }

        // Show loading state
        this.showLoadingState(true);

        // Submit booking to server
        const response = await this.submitBooking(bookingData, userData);

        // Handle response
        if (response.success) {
          this.showNotification('Presentation request submitted successfully! You will receive a confirmation email within 3 working days.', 'success');
          this.resetForm();
          this.trackBookingAnalytics(bookingData);
        } else {
          this.showNotification(response.message || 'Failed to submit booking request', 'error');
        }

      } catch (error) {
        console.error('Booking error:', error);
        this.showNotification(error.message || 'Network error. Please check your connection and try again.', 'error');
      } finally {
        this.showLoadingState(false);
      }
    }

    collectBookingData() {
      // Get form elements from the scheduling section
      const section = document.getElementById('section-scheduling');

      const presentationType = section.querySelector('.form-group:first-child select')?.value || '';
      const preferredDate = section.querySelector('#pres-date')?.value || '';
      const preferredTime = section.querySelector('.form-group:nth-child(3) select')?.value || '';
      const venue = section.querySelector('.form-group:nth-child(4) select')?.value || '';
      const additionalNotes = section.querySelector('.form-group:last-child textarea')?.value || '';

      return {
        presentationType,
        preferredDate,
        preferredTime,
        venue,
        additionalNotes,
        timestamp: new Date().toISOString()
      };
    }

    validateBookingData(data) {
      if (!data.presentationType) {
        return { isValid: false, message: 'Please select a presentation type' };
      }

      if (!data.preferredDate) {
        return { isValid: false, message: 'Please select a preferred date' };
      }

      // Validate date is not in the past
      const selectedDate = new Date(data.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { isValid: false, message: 'Please select a future date' };
      }

      // Check if date is within allowed range (next 90 days)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      if (selectedDate > maxDate) {
        return { isValid: false, message: 'Please select a date within the next 90 days' };
      }

      if (!data.preferredTime) {
        return { isValid: false, message: 'Please select a preferred time' };
      }

      if (!data.venue) {
        return { isValid: false, message: 'Please select a venue' };
      }

      // Additional notes length check
      if (data.additionalNotes && data.additionalNotes.length > 500) {
        return { isValid: false, message: 'Additional notes cannot exceed 500 characters' };
      }

      return { isValid: true, message: '' };
    }

    getUserData() {
      try {
        const rawData = localStorage.getItem('postgraduate_user');
        if (!rawData) return null;

        const userData = JSON.parse(rawData);
        return {
          id: userData.id || userData._id,
          fullName: userData.fullName || userData.name,
          email: userData.email,
          role: userData.role,
          token: userData.token,
          userNumber: userData.userNumber || userData.studentId
        };
      } catch (error) {
        console.error('Error getting user data:', error);
        return null;
      }
    }

    async submitBooking(bookingData, userData) {
      console.log(bookingData,userData);
      
      // Prepare request payload
      const payload = {
        presentationType: bookingData.presentationType,
        preferredDate: bookingData.preferredDate,
        preferredTime: bookingData.preferredTime,
        venue: bookingData.venue,
        additionalNotes: bookingData.additionalNotes,
        studentId: userData.id,
        studentName: userData.fullName,
        studentEmail: userData.email,
        studentNumber: userData.userNumber
      };

      // Make API request
      const response = await fetch(`${this.apiBaseUrl}/presentations/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
          'X-Request-ID': this.generateRequestId()
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    }

    showNotification(message, type = 'info') {
      // Create notification element if it doesn't exist
      let notification = document.getElementById('booking-notification');
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'booking-notification';
        notification.className = 'booking-notification';
        document.body.appendChild(notification);

        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
          .booking-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          .booking-notification.success {
            background: #10b981;
            color: white;
            border-left: 4px solid #059669;
          }
          
          .booking-notification.error {
            background: #ef4444;
            color: white;
            border-left: 4px solid #dc2626;
          }
          
          .booking-notification.info {
            background: #3b82f6;
            color: white;
            border-left: 4px solid #2563eb;
          }
          
          .booking-notification.warning {
            background: #f59e0b;
            color: white;
            border-left: 4px solid #d97706;
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Set notification content and style
      notification.textContent = message;
      notification.className = `booking-notification ${type}`;
      notification.style.display = 'block';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.style.display = 'none';
          notification.style.animation = '';
        }, 300);
      }, 5000);
    }

    showLoadingState(isLoading) {
      const button = document.querySelector('#section-scheduling .btn-primary');
      if (!button) return;

      if (isLoading) {
        // Save original text
        button.setAttribute('data-original-text', button.textContent);
        button.textContent = '⏳ Submitting...';
        button.disabled = true;
        button.style.opacity = '0.7';
      } else {
        // Restore original text
        const originalText = button.getAttribute('data-original-text') || '📅 Request Booking';
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
      }
    }

    resetForm() {
      const section = document.getElementById('section-scheduling');

      // Reset select fields
      const selects = section.querySelectorAll('select');
      selects.forEach(select => {
        if (select.options.length > 0) {
          select.selectedIndex = 0;
        }
      });

      // Reset date input
      const dateInput = section.querySelector('#pres-date');
      if (dateInput) {
        dateInput.value = '';
        // Set min date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
      }

      // Reset textarea
      const textarea = section.querySelector('textarea');
      if (textarea) {
        textarea.value = '';
      }
    }

    generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async trackBookingAnalytics(bookingData) {
      try {
        // Optional: Send analytics to server
        const analytics = {
          event: 'presentation_booking',
          data: {
            type: bookingData.presentationType,
            venue: bookingData.venue,
            timestamp: new Date().toISOString(),
            userId: this.getUserData()?.id
          }
        };

        // Send to analytics endpoint if available
        await fetch(`${this.apiBaseUrl}/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analytics),
          keepalive: true
        }).catch(() => { }); // Silent fail for analytics
      } catch (error) {
        // Don't block booking for analytics errors
        console.debug('Analytics error:', error);
      }
    }

    checkExistingBookings() {
      // Optional: Check if student already has pending bookings
      const userData = this.getUserData();
      if (!userData) return;

      fetch(`${this.apiBaseUrl}/presentations/my-presentations`, {
        headers: { 'Authorization': `Bearer ${userData.token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.data && data.data.upcoming && data.data.upcoming.length > 0) {
            const pending = data.data.upcoming.filter(p => p.status === 'pending');
            if (pending.length > 0) {
              this.showNotification(
                `You have ${pending.length} pending booking request(s). Please wait for them to be processed before booking new ones.`,
                'warning'
              );
            }
          }
        })
        .catch(() => { });
    }
  }

  // ===== MAIN APPLICATION CODE =====
  (async () => {
    // Helper function to handle user data storage
    const updateUserStorage = (userData) => {
      try {
        if (userData && userData.id) {
          localStorage.setItem("postgraduate_user", JSON.stringify(userData));
          console.log("User data stored successfully");
        } else {
          console.warn("Invalid user data, not storing");
        }
      } catch (error) {
        console.error("Failed to store user data:", error);
      }
    };

    // Helper function to clear user data
    const clearUserData = () => {
      try {
        localStorage.removeItem("postgraduate_user");
        sessionStorage.removeItem("postgraduate_user");
        console.log("User data cleared");
      } catch (error) {
        console.error("Failed to clear user data:", error);
      }
    };

    // Get stored user data
    let usersData = null;
    try {
      const storedData = localStorage.getItem("postgraduate_user");
      usersData = storedData ? JSON.parse(storedData) : null;
      console.log("Stored user data:", usersData);
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      clearUserData();
    }

    // Check if user is logged in with server
    try {
      const result = await fetch("http://localhost:5000/api/islogged", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      // Handle response based on status
      if (result.status === 401 || !result.ok || usersData === null) {
        console.log("User not authenticated, redirecting to login");
        clearUserData();
        window.location.href = "../login/login.html";
        return;
      }

      if (result.status === 200) {
        // Parse the response
        let responseData;
        try {
          responseData = await result.json();
          console.log("Server response:", responseData);
        } catch (parseError) {
          console.error("Failed to parse server response:", parseError);
          clearUserData();
          window.location.href = "../login/login.html";
          return;
        }

        // Check if we have valid user data
        if (responseData && responseData.user) {
          // Prepare user data for storage
          const userData = {
            id: responseData.user.id || responseData.user._id,
            fullName: responseData.user.fullName || responseData.user.name || responseData.user.firstName + " " + responseData.user.lastName || "User",
            programme: responseData.user.programme || responseData.user.program || "Not specified",
            department: responseData.user.department || "Not specified",
            userNumber: responseData.user.userNumber || responseData.user.studentId || responseData.user.id,
            role: responseData.user.role || "student",
            supervisor: responseData.user.supervisor || null,
            email: responseData.user.email,
            token: responseData.token || null,
            lastLogin: new Date().toISOString()
          };

          // Store updated user data
          updateUserStorage(userData);
          usersData = userData;
          console.log("User data updated successfully");
        } else if (responseData && responseData.id) {
          // Handle case where user data is at root level
          const userData = {
            id: responseData.id,
            fullName: responseData.fullName || responseData.name || "User",
            programme: responseData.programme || "Not specified",
            department: responseData.department || "Not specified",
            userNumber: responseData.userNumber || responseData.id,
            role: responseData.role || "student",
            supervisor: responseData.supervisor || null,
            email: responseData.email,
            token: responseData.token || null,
            lastLogin: new Date().toISOString()
          };
          updateUserStorage(userData);
          usersData = userData;
        } else {
          console.error("Invalid response format from server:", responseData);
          // Don't redirect if we have local data, but log error
          if (!usersData) {
            clearUserData();
            window.location.href = "../login/login.html";
            return;
          }
        }
      }
    } catch (fetchError) {
      console.error("Network error checking login status:", fetchError);

      // If we have local user data and it's not expired, use it
      if (usersData && usersData.lastLogin) {
        const lastLoginDate = new Date(usersData.lastLogin);
        const now = new Date();
        const hoursSinceLogin = (now - lastLoginDate) / (1000 * 60 * 60);

        // Allow offline mode for up to 24 hours
        if (hoursSinceLogin < 24) {
          console.log("Using cached user data (offline mode)");
          // Continue with cached data
        } else {
          console.log("Cached user data expired, redirecting to login");
          clearUserData();
          window.location.href = "../login/login.html";
          return;
        }
      } else {
        console.log("No cached user data available, redirecting to login");
        window.location.href = "../login/login.html";
        return;
      }
    }

    // Safely get the latest user data after all operations
    let currentUserData = null;
    try {
      const storedData = localStorage.getItem("postgraduate_user");
      currentUserData = storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error("Error getting final user data:", error);
    }

    // Update UI with user name if element exists
    const profileNameElement = document.querySelector(".profile-name");
    if (profileNameElement && currentUserData) {
      profileNameElement.innerHTML = currentUserData.fullName || "Student";
    } else if (profileNameElement) {
      profileNameElement.innerHTML = "Student";
    }

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
    window.navigate = function (target, el) {
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
        if (el) {
          el.className = 'badge ' + cfg.cls;
          el.textContent = cfg.label;
        }
      });
      const btn = document.getElementById('defer-btn');
      if (btn) {
        btn.className = 'btn btn-sm ' + cfg.btn;
        btn.textContent = cfg.btnText;
      }
      const alertEl = document.getElementById('deferral-alert');
      if (alertEl) alertEl.style.display = cfg.showAlert ? 'block' : 'none';

      // Lock pipeline if deferred
      const pipelineMsg = document.getElementById('pipeline-locked-msg');
      const gateBtn = document.getElementById('gate-btn');
      if (pipelineMsg && gateBtn) {
        if (currentStatus === 'DEFERRED') {
          pipelineMsg.style.display = 'flex';
          gateBtn.disabled = true;
        } else {
          pipelineMsg.style.display = 'none';
          gateBtn.disabled = (currentStage > 10);
        }
      }
    }

    function requestDeferral() {
      currentStatus = currentStatus === 'DEFERRED' ? 'RESUMED' : 'DEFERRED';
      updateStatusUI();
    }

    // ===== MODULE 2: PIPELINE =====
    function renderPipeline() {
      const p1El = document.getElementById('pipeline-p1');
      const p2El = document.getElementById('pipeline-p2');
      if (!p1El || !p2El) return;

      p1El.innerHTML = '';
      p2El.innerHTML = '';

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
          if (el) el.className = 'wf-step ' + step.cls;
          const statusEl = document.getElementById(step.s);
          if (statusEl) statusEl.textContent = step.status;
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
        if (statusEl) statusEl.textContent = 'Uploaded — ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (iconEl) iconEl.textContent = '✅';
      } else {
        if (statusEl) statusEl.textContent = 'Click to upload';
        if (iconEl) iconEl.textContent = el.id.includes('thesis') ? '📕' : el.id.includes('intent') ? '📝' : el.id.includes('mentor') ? '🤝' : '📄';
      }
    }

    // ===== MODULE 5: CHECKLIST =====
    function toggleCheck(itemEl) {
      if (!itemEl.classList.contains('check-item')) return;
      const cb = itemEl.querySelector('input[type="checkbox"]');
      if (cb) {
        cb.checked = !cb.checked;
        itemEl.classList.toggle('checked', cb.checked);
        updateCheckCount();
      }
    }

    function updateCheckCount() {
      const total = document.querySelectorAll('.check-item').length;
      const checked = document.querySelectorAll('.check-item.checked').length;
      const countEl = document.getElementById('check-count');
      if (countEl) countEl.textContent = checked;
      const btn = document.getElementById('signoff-btn');
      if (btn) btn.disabled = (checked < total);
    }

    function requestSignoff() {
      const alertEl = document.getElementById('signoff-alert');
      const btn = document.getElementById('signoff-btn');
      if (alertEl) alertEl.style.display = 'block';
      if (btn) {
        btn.disabled = true;
        btn.textContent = '✅ Sign-off Requested';
      }
    }

    // ===== MODULE 6: FINANCE =====
    function toggleClearance() {
      clearanceGranted = !clearanceGranted;
      const display = document.getElementById('clearance-display');
      const statusVal = document.getElementById('erp-status-val');
      const finRow = document.getElementById('finance-row');
      const finBadge = document.getElementById('finance-row-badge');
      const finNavBadge = document.getElementById('finance-badge');

      if (!display || !statusVal) return;

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
        if (finRow) finRow.style.background = 'var(--green-light)';
        if (finBadge) {
          finBadge.className = 'badge badge-active';
          finBadge.textContent = 'Cleared';
        }
        if (finNavBadge) finNavBadge.style.display = 'none';
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
        if (finRow) finRow.style.background = 'var(--red-light)';
        if (finBadge) {
          finBadge.className = 'badge badge-deferred';
          finBadge.textContent = 'Pending';
        }
        if (finNavBadge) finNavBadge.style.display = 'inline-flex';
      }
    }

    // ===== INIT =====
    renderPipeline();
    updateStatusUI();

    // Initialize Presentation Booking Handler
    const bookingHandler = new PresentationBookingHandler();

    // Check existing bookings after user data is loaded
    setTimeout(() => {
      bookingHandler.checkExistingBookings();
    }, 2000);

    // Export functions to global scope for HTML onclick handlers
    window.requestDeferral = requestDeferral;
    window.advancePipeline = advancePipeline;
    window.submitReport = submitReport;
    window.toggleUpload = toggleUpload;
    window.toggleCheck = toggleCheck;
    window.requestSignoff = requestSignoff;
    window.toggleClearance = toggleClearance;
    // Note: bookPresentation is replaced by the handler class, so we don't export it
  })();
});