const auth = firebase.auth();

/* TEST POINT (Sydney CBD – replace later with other users) */
const TARGET_LAT = -33.8688;
const TARGET_LNG = 151.2093;

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
  requestLocation();
});

function requestLocation() {
  navigator.geolocation.getCurrentPosition(
    position => {
      const myLat = position.coords.latitude;
      const myLng = position.coords.longitude;

      const distanceKm = calculateDistance(
        myLat,
        myLng,
        TARGET_LAT,
        TARGET_LNG
      );

      document.getElementById("card").innerHTML = `
        <p>📍 Your location:</p>
        <p>${myLat.toFixed(5)}, ${myLng.toFixed(5)}</p>
        <p>📏 Distance to test point:</p>
        <p><strong>${distanceKm.toFixed(2)} km</strong></p>
      `;
    },
    () => alert("Location permission denied")
  );
}

/* Haversine Formula */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
