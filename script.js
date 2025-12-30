// NEAR auth logic

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const statusText = document.getElementById("status");

// SIGN UP
async function signup() {
  if (!emailInput || !passwordInput) return;

  statusText.textContent = "Creating account…";

  try {
    await auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    statusText.textContent = "✅ Account created";
  } catch (err) {
    statusText.textContent = "❌ " + err.message;
  }
}

// LOGIN
async function login() {
  if (!emailInput || !passwordInput) return;

  statusText.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );

    // redirect after login
    window.location.href = "app.html";
  } catch (err) {
    statusText.textContent = "❌ " + err.message;
  }
}

// LOGOUT (used on app.html)
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

// SESSION CHECK (runs on app.html)
auth.onAuthStateChanged(user => {
  const userEl = document.getElementById("user");

  if (user && userEl) {
    userEl.textContent = "✅ Logged in as " + user.email;
  }

  if (!user && window.location.pathname.includes("app.html")) {
    window.location.href = "index.html";
  }
});
