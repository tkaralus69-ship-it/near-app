const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
