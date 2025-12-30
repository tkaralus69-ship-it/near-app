const auth = firebase.auth();

/* AUTO REDIRECT IF LOGGED IN */
auth.onAuthStateChanged(user => {
  if (user && window.location.pathname.endsWith("index.html")) {
    window.location.href = "app.html";
  }
});

/* LOGIN FUNCTION */
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.innerText = "";

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "app.html";
    })
    .catch(err => {
      errorEl.innerText = err.message;
    });
}
