const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const emailEl = document.getElementById("user-email");
  if (emailEl) {
    emailEl.innerText = user.email;
  }
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
