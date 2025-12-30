const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("email").innerText = user.email;
  saveLocation(user);
});

function saveLocation(user) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      db.collection("users").doc(user.uid).set({
        email: user.email,
        lat,
        lng,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      document.getElementById("status").innerText =
        `📍 Location saved: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    },
    () => {
      document.getElementById("status").innerText =
        "❌ Location permission denied";
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
