const auth = firebase.auth();

/* AUTH STATE */
auth.onAuthStateChanged(user => {
  const onApp = location.pathname.includes("app.html");

  if (user && !onApp) {
    location.replace("app.html");
  }

  if (!user && onApp) {
    location.replace("index.html");
  }

  const userEl = document.getElementById("user");
  if (user && userEl) {
    userEl.textContent = "Logged in as: " + user.email;
  }
});

/* LOGIN */
window.login = async function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  if (!email || !password || !status) return;

  status.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(email.value, password.value);
  } catch (e) {
    status.textContent = e.message;
  }
};

/* SIGNUP */
window.signup = async function () {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  if (!email || !password || !status) return;

  status.textContent = "Creating account…";

  try {
    await auth.createUserWithEmailAndPassword(email.value, password.value);
  } catch (e) {
    status.textContent = e.message;
  }
};

/* LOGOUT */
window.logout = async function () {
  await auth.signOut();
};
