const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
  requestLocation();
});

function requestLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      const card = document.getElementById("card");
      card.innerHTML = `<p>📍 Your location:</p><p>${lat}, ${lng}</p>`;
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
