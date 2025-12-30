const auth = firebase.auth();
const db = firebase.firestore();

/* ================= LOGIN ================= */

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "/near-app/app.html";
    })
    .catch(err => {
      document.getElementById("error").innerText = err.message;
    });
}

/* ============ AUTH STATE ============ */

auth.onAuthStateChanged(user => {
  if (window.location.pathname.endsWith("app.html")) {
    if (!user) {
      window.location.href = "/near-app/index.html";
      return;
    }

    document.getElementById("user-email").innerText = user.email;
    getLocation(user);
  }
});

/* ============ LOCATION ============ */

function getLocation(user) {
  if (!navigator.geolocation) {
    document.getElementById("status").innerText = "❌ Location not supported";
    return;
  }

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
        `📍 Location saved (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    },
    err => {
      document.getElementById("status").innerText =
        "❌ Location denied or unavailable";
    }
  );
}

/* ============ LOGOUT ============ */

function logout() {
  auth.signOut().then(() => {
    window.location.href = "/near-app/index.html";
  });
}
