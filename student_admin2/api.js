const STUDENT_API_BASE = "http://localhost:5000/api";

async function studentRequest(path, options = {}) {
  const { method = "GET", body, headers } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${STUDENT_API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
}

window.StudentApi = {
  getSession() {
    return studentRequest("/is-logged");
  },
  submitDeferralRequest(payload) {
    return studentRequest("/students/me/deferral-request", {
      method: "POST",
      body: payload,
    });
  },
  submitResumptionRequest() {
    return studentRequest("/students/me/resumption-request", {
      method: "POST",
      body: {},
    });
  },
};
