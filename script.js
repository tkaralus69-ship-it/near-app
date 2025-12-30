const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").textContent = user.email;

  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById("location").textContent =
        `📍 ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    },
    () => {
      document.getElementById("location").textContent = "❌ Location blocked";
    }
  );
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
