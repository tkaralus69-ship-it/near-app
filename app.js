const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Show logged-in user's email
  const emailEl = document.getElementById("user-email");
  if (emailEl) {
    emailEl.innerText = user.email;
  }

  requestLocation();
});

function requestLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);

      const locationEl = document.getElementById("location");
      const timeEl = document.getElementById("location-time");

      if (locationEl) {
        locationEl.innerText = `${lat}, ${lng}`;
      }

      if (timeEl) {
        timeEl.innerText = "just now";
      }
    },
    () => {
      alert("Location permission denied");
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
