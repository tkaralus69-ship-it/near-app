console.log("✅ script.js loaded");

const auth = firebase.auth();
const db = firebase.firestore();

const statusEl = document.getElementById("status");
const emailEl = document.getElementById("user-email");

// AUTH STATE
auth.onAuthStateChanged(user => {
  if (!user) {
    console.log("❌ No user, redirecting");
    window.location.href = "login.html"; // or remove if not used
    return;
  }

  console.log("✅ Logged in:", user.email);
  emailEl.textContent = user.email;

  getLocation(user.uid);
});

// LOCATION
function getLocation(uid) {
  if (!navigator.geolocation) {
    statusEl.textContent = "❌ Geolocation not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;

      console.log("📍 Location:", latitude, longitude);
      statusEl.textContent = "✅ Location acquired";

      db.collection("users").doc(uid).set({
        lat: latitude,
        lng: longitude,
        updated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    },
    err => {
      console.error("❌ Location error:", err);
      statusEl.textContent = "❌ Location permission denied";
    },
    { enableHighAccuracy: true }
  );
}

// LOGOUT
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
