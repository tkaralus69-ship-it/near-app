const auth = firebase.auth();

// runs on BOTH pages
auth.onAuthStateChanged(user => {
  const userEl = document.getElementById("user");

  if (userEl) {
    if (!user) {
      window.location.href = "index.html";
    } else {
      userEl.textContent = "Logged in as: " + user.email;
    }
  }
});

// LOGIN
window.login = async function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  if (!email || !password || !status) return;

  status.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(email.value, password.value);
    window.location.href = "app.html";
  } catch (e) {
    status.textContent = e.message;
  }
};

// SIGNUP
window.signup = async function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  if (!email || !password || !status) return;

  status.textContent = "Creating account…";

  try {
    await auth.createUserWithEmailAndPassword(email.value, password.value);
    window.location.href = "app.html";
  } catch (e) {
    status.textContent = e.message;
  }
};

// LOGOUT
window.logout = async function () {
  await auth.signOut();
  window.location.href = "index.html";
};
