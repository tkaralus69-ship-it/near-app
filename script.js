const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").textContent = user.email;
  getLocation();
});

function getLocation() {
  const el = document.getElementById("location");

  if (!navigator.geolocation) {
    el.textContent = "❌ Geolocation not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);
      el.textContent = `📍 Location: ${lat}, ${lon}`;
      console.log("Location OK:", lat, lon);
    },
    error => {
      console.error(error);
      el.textContent = "❌ Location failed";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
