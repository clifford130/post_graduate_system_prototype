(function () {
  const LOGIN_URL = "../login/login.html";
  const SESSION_URL = "http://localhost:5000/api/is-logged";

  document.documentElement.style.visibility = "hidden";

  fetch(SESSION_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.isLoggedIn || payload?.user?.role !== "student") {
        window.location.replace(LOGIN_URL);
        return;
      }

      window.StudentSession = payload.user;
      document.documentElement.style.visibility = "";
    })
    .catch(() => {
      window.location.replace(LOGIN_URL);
    });
})();
