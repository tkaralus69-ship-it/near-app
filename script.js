const auth = firebase.auth();

/* ---------- LOGIN PAGE ---------- */

function signup() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const status = document.getElementById("status");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => {
      if (status) status.innerText = err.message;
    });
}

function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const status = document.getElementById("status");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => {
      if (status) status.innerText = err.message;
    });
}

/* ---------- APP PAGE ---------- */

auth.onAuthStateChanged(user => {
  const emailEl = document.getElementById("user-email");

  if (emailEl) {
    if (!user) {
      window.location.href = "index.html";
    } else {
      emailEl.innerText = user.email;
    }
  }
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
