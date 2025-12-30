const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
  saveLocation(user.uid);
});

function saveLocation(uid) {
  if (!navigator.geolocation) {
    document.getElementById("status").innerText = "❌ Geolocation not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      db.collection("locations").doc(uid).set({
        lat,
        lng,
        updated: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        document.getElementById("status").innerText =
          `📍 Location saved: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      });
    },
    () => {
      document.getElementById("status").innerText = "❌ Location permission denied";
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
