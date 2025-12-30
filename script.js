// Prove the script is loaded
alert("NEAR script loaded ✅");

// Grab elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const statusText = document.getElementById("status");

// Sign up button test
signupBtn.addEventListener("click", () => {
  statusText.textContent =
    "Sign Up clicked with email: " + emailInput.value;
});

// Login button test
loginBtn.addEventListener("click", () => {
  statusText.textContent =
    "Login clicked with email: " + emailInput.value;
});
