const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
  getAndSaveLocation(user);
});

function getAndSaveLocation(user) {
  if (!navigator.geolocation) {
    document.getElementById("status").innerText = "Geolocation not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      db.collection("users").doc(user.uid).set({
        email: user.email,
        lat: lat,
        lng: lng,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      document.getElementById("status").innerText =
        `📍 Location saved: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    },
    () => {
      document.getElementById("status").innerText = "Location permission denied";
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
