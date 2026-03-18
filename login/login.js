document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("messageBox");

    // Function to show messages
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";

        // Auto-hide after 4 seconds
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000);
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter both email and password.", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(
                    "Login successful! Redirecting...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "/dashboard.html";
                }, 1500);
            } else {
                showMessage(result.message || "Login failed", "error");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            showMessage("Server error. Try again later.", "error");
        }
    });
});