// ==============================
// NEAR — FULL script.js
// ==============================

// Assumes firebase-app, firebase-auth, firebase-firestore are already loaded
// and firebase.initializeApp(firebaseConfig) is already called

const auth = firebase.auth();
const db = firebase.firestore();

/* ==============================
   AUTH STATE
============================== */
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const emailEl = document.getElementById("user-email");
  if (emailEl) {
    emailEl.innerText = user.email;
  }
});

/* ==============================
   LOGOUT
============================== */
function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

/* ==============================
   DISTANCE CALCULATION
============================== */
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ==============================
   SAVE LOCATION
============================== */
function saveLocation(lat, lng, email) {
  db.collection("users")
    .doc(auth.currentUser.uid)
    .set({
      email,
      lat,
      lng,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

/* ==============================
   LOAD USERS
============================== */
async function loadUsers() {
  const snapshot = await db.collection("users").get();
  const users = [];
  snapshot.forEach(doc => users.push(doc.data()));
  return users;
}

/* ==============================
   SHOW NEARBY USERS
============================== */
async function showNearby() {
  navigator.geolocation.getCurrentPosition(async pos => {
    const myLat = pos.coords.latitude;
    const myLng = pos.coords.longitude;
    const email = auth.currentUser.email;

    saveLocation(myLat, myLng, email);

    const users = await loadUsers();

    const nearby = users
      .filter(u => u.lat && u.lng)
      .map(u => ({
        email: u.email,
        distance: distanceInMeters(myLat, myLng, u.lat, u.lng)
      }))
      .sort((a, b) => a.distance - b.distance);

    const container = document.createElement("div");
    container.innerHTML = "<h3>Nearby users</h3>";

    nearby.forEach(u => {
      const div = document.createElement("div");
      div.textContent = `${u.email} — ${Math.round(u.distance)} meters away`;
      container.appendChild(div);
    });

    document.body.appendChild(container);
  });
}

/* ==============================
   START
============================== */
showNearby();
