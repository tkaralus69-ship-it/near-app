const auth = firebase.auth();

auth.onAuthStateChanged(user => {

  // LOGIN PAGE
  if (document.getElementById("login-page")) {
    if (user) {
      window.location.href = "app.html";
    }
  }

  // APP PAGE
  if (document.getElementById("app-page")) {
    if (!user) {
      window.location.href = "index.html";
    } else {
      document.getElementById("user").innerText =
        "✅ Logged in as " + user.email;
    }
  }
});

// AUTH ACTIONS
function signup() {
  auth.createUserWithEmailAndPassword(
    email.value,
    password.value
  ).catch(e => status.innerText = e.message);
}

function login() {
  auth.signInWithEmailAndPassword(
    email.value,
    password.value
  ).catch(e => status.innerText = e.message);
}

function logout() {
  auth.signOut();
}
