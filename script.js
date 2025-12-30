// 🔐 AUTH STATE LISTENER (runs on every page)
firebase.auth().onAuthStateChanged(user => {

  // If on login page and already logged in → go to app
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "/near-app/app.html";
  }

  // If on app page and NOT logged in → go to login
  if (!user && window.location.pathname.endsWith("app.html")) {
    window.location.href = "/near-app/index.html";
  }

  // Show user email if logged in
  if (user && document.getElementById("user")) {
    document.getElementById("user").innerText =
      "✅ Logged in as " + user.email;
  }
});

function signup() {
  const email = email.value;
  const password = password.value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "/near-app/app.html";
    })
    .catch(err => status.innerText = err.message);
}

function login() {
  const email = email.value;
  const password = password.value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "/near-app/app.html";
    })
    .catch(err => status.innerText = err.message);
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = "/near-app/index.html";
    });
}
