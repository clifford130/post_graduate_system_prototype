// login.js

// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // prevent default form submission

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        // Prepare data to send
        const loginData = {
            email,
            password
        };

        try {
            const response = await fetch("http://localhost:5000/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include", // <-- important for cookies/session
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Login successful! Welcome " + result.user.fullName);
                // redirect to dashboard or another page
                window.location.href = "/dashboard.html";
            } else {
                alert("Login failed: " + result.message);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
});