// NEAR – simple Firebase auth (clean + reliable)

const auth = firebase.auth();

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const status = document.getElementById("status");

// -------- SIGN UP --------
window.signup = async function () {
  if (!emailInput || !passwordInput) return;

  status.textContent = "Creating account…";

  try {
    await auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    status.textContent = "✅ Account created";
  } catch (err) {
    status.textContent = "❌ " + err.message;
  }
};

// -------- LOGIN --------
window.login = async function () {
  if (!emailInput || !passwordInput) return;

  status.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    window.location.href = "app.html";
  } catch (err) {
    status.textContent = "❌ " + err.message;
  }
};

// -------- LOGOUT --------
window.logout = async function () {
  await auth.signOut();
  window.location.href = "index.html";
};

// -------- SESSION CHECK --------
auth.onAuthStateChanged(user => {
  if (document.body.id === "app-page") {
    if (!user) {
      window.location.href = "index.html";
    } else {
      document.getElementById("user-email").textContent = user.email;
    }
  }
});
