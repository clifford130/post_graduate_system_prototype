(() => {
  const API_BASE = "http://localhost:5000/api";
  const LOGIN_URL = "../login/login.html";
  const sidebarRoot = document.getElementById("appSidebar");
  if (!sidebarRoot) return;

  const sidebarPage = document.body.dataset.sidebarPage || "";
  const sidebarTag = document.body.dataset.sidebarTag || "Student";
  const sidebarTagId = document.body.dataset.sidebarTagId || "";

  const navItems = [
    { section: "DASHBOARD", icon: "fa-user", label: "My Profile", href: "profile.html", key: "profile" },
    { icon: "fa-flask", label: "Research Progress", href: "research.html", key: "research" },
    { section: "ACADEMIC", icon: "fa-file-alt", label: "Quarterly Reports", href: "qr.html", key: "qr" },
    { icon: "fa-shield-alt", label: "Compliance Center", href: "compliance.html", key: "compliance" },
    { icon: "fa-calendar-alt", label: "Scheduling", href: "booking.html", key: "booking" },
    { section: "ADMINISTRATION", icon: "fa-university", label: "ERP Finance", action: "finance" },
    { section: "ACCOUNT", icon: "fa-sign-out-alt", label: "Logout", action: "logout" },
  ];

  const navHtml = navItems
    .map((item) => {
      const labelHtml = item.section
        ? `<div class="nav-label" style="margin-top: 15px">${item.section}</div>`
        : "";
      const isActive = item.key === sidebarPage ? " active" : "";
      const attrs = item.href
        ? `href="${item.href}"`
        : `href="javascript:void(0)" data-sidebar-action="${item.action}"`;

      return `${labelHtml}<a ${attrs} class="nav-item${isActive}"><i class="fas ${item.icon}"></i> ${item.label}</a>`;
    })
    .join("");

  const tagAttr = sidebarTagId ? ` id="${sidebarTagId}"` : "";

  sidebarRoot.innerHTML = `
    <div class="sidebar">
      <div class="logo-container">
        <h2>RONGO UNIVERSITY</h2>
        <p>STUDENT PROFILE</p>
      </div>
      <div class="nav-section">${navHtml}</div>
      <div class="user-bottom">
        <div class="user-avatar-small">EM</div>
        <div class="user-info">
          <p>Enos Mulongo</p>
          <span${tagAttr}>${sidebarTag}</span>
        </div>
      </div>
    </div>
  `;

  window.showSidebarNotice = function showSidebarNotice(message) {
    alert(message);
  };

  async function logoutStudent() {
    try {
      await fetch(`${API_BASE}/user/login/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("postgraduate_user");
      localStorage.removeItem("auth_token");
      window.location.replace(LOGIN_URL);
    }
  }

  sidebarRoot.querySelectorAll("[data-sidebar-action]").forEach((link) => {
    link.addEventListener("click", async () => {
      const action = link.dataset.sidebarAction;

      if (action === "finance") {
        window.showSidebarNotice("ERP Finance page is not available yet.");
        return;
      }

      if (action === "logout") {
        await logoutStudent();
      }
    });
  });
})();
