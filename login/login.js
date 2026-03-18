document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".login-form");
    const submitBtn = document.querySelector(".login-btn");
    const userNumberInput = document.getElementById("userNumber");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("messageBox");

    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = "block";

        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000);
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.innerHTML = "Signing in...";

        const userNumber = userNumberInput.value.trim();
        const password = passwordInput.value;

        if (!userNumber || !password) {
            showMessage("Please enter credentials and password.", "error");

            submitBtn.disabled = false;
            submitBtn.innerHTML = "Sign In";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ userNumber, password }) // ✅ changed
            });

            const result = await response.json();

            if (response.ok) {
                showMessage("Login successful! Redirecting...", "success");

                // setTimeout(() => {
                //     window.location.href = "/dashboard.html";
                // }, 1500);
            } else {
                showMessage(result.message || "Login failed", "error");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            showMessage("Server error. Try again later.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Sign In";
        }
    });
});