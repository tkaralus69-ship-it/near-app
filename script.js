// ✅ PUT YOUR FIREBASE CONFIG HERE (same one you already had)
const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
  // etc...
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let myLocation = null;
let watchId = null;

const statusEl = document.getElementById("status");
const userEl = document.getElementById("user-email");
const locEl = document.getElementById("loc-status");
const listEl = document.getElementById("nearby-users");

/* ---------- AUTH ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    statusEl.textContent = "Signing in…";
    try {
      await auth.signInAnonymously();
    } catch (err) {
      statusEl.textContent = "❌ Auth error: " + err.message;
    }
    return;
  }

  currentUser = user;
  userEl.textContent = user.email || "anonymous";
  statusEl.textContent = "Signed in ✅";

  startLocationWatch();
});

/* ---------- LOCATION (reliable) ---------- */
function startLocationWatch() {
  if (!navigator.geolocation) {
    statusEl.textContent = "❌ Geolocation not supported";
    return;
  }

  // Stop previous watch (if any)
  if (watchId) navigator.geolocation.clearWatch(watchId);

  statusEl.textContent = "Getting location…";

  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      myLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      locEl.textContent = `${myLocation.lat.toFixed(5)}, ${myLocation.lng.toFixed(5)}`;
      statusEl.textContent = "Location acquired ✅";

      // Save user location
      await db.collection("users").doc(currentUser.uid).set(
        {
          uid: currentUser.uid,
          email: currentUser.email || "anonymous",
          location: myLocation,
        },
        { merge: true }
      );

      loadNearbyUsers();
    },
    (err) => {
      statusEl.textContent = "❌ Location error: " + err.message;
      locEl.textContent = "blocked/denied";
      listEl.innerHTML = "<li>Location blocked. Allow location for this site.</li>";
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    }
  );
}

/* ---------- DISTANCE ---------- */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ---------- NEARBY USERS ---------- */
async function loadNearbyUsers() {
  if (!myLocation) return;

  listEl.innerHTML = "";

  const snapshot = await db.collection("users").get();
  snapshot.forEach((doc) => {
    if (doc.id === currentUser.uid) return;

    const data = doc.data();
    if (!data.location) return;

    const d = distanceKm(
      myLocation.lat,
      myLocation.lng,
      data.location.lat,
      data.location.lng
    );

    if (d <= 5) {
      const li = document.createElement("li");
      li.textContent = `${data.email} — ${d.toFixed(2)} km away`;
      listEl.appendChild(li);
    }
  });

  if (!listEl.children.length) {
    listEl.innerHTML = "<li>No nearby users yet</li>";
  }
}

/* ---------- LOGOUT ---------- */
function logout() {
  if (watchId) navigator.geolocation.clearWatch(watchId);
  auth.signOut();
}
window.logout = logout;
