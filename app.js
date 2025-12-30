const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  console.log("USER:", user.email);

  const emailEl = document.getElementById("user-email");
  if (emailEl) {
    emailEl.textContent = user.email;
  } else {
    console.error("user-email element not found");
  }
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
