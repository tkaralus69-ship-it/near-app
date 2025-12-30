// NEAR – auth logic
const auth = firebase.auth();

// Detect which page we're on
const isLoginPage = document.getElementById("login-page");
const isAppPage = document.getElementById("app-page");

// AUTH STATE
auth.onAuthStateChanged(user => {
  if (isLoginPage && user) {
    window.location.href = "app.html";
  }

  if (isAppPage && !user) {
    window.location.href = "index.html";
  }

  if (isAppPage && user) {
    document.getElementById("user-email").textContent = user.email;
  }
});

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    status.textContent = e.message;
  }
};

// SIGN UP
window.signup = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  try {
    await auth.createUserWithEmailAndPassword(email, password);
  } catch (e) {
    status.textContent = e.message;
  }
};

// LOGOUT
window.logout = async function () {
  await auth.signOut();
};
