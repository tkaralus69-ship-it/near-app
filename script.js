<script type="module">
/* ---------------- STATE ---------------- */
const list = document.getElementById("list");
const count = document.getElementById("count");
const sheet = document.getElementById("profileSheet");

let myUid = null;
let myLat = null;
let myLng = null;

let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

/* ---------------- DISTANCE (TRUTH) ---------------- */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------- RENDER SELF ---------------- */
function renderMe() {
  const c = document.createElement("div");
  c.className = "card me";
  c.innerHTML = `
    <div class="avatar"></div>
    <div class="info">
      <div class="name">${profile.name || "You"} ${profile.age || ""}</div>
      <div class="now">${profile.now || "Tap to add presence"}</div>
    </div>
  `;
  c.oncontextmenu = e => {
    e.preventDefault();
    openProfile();
  };
  list.appendChild(c);
}

/* ---------------- PROFILE ---------------- */
function openProfile() {
  sheet.classList.add("open");
  pName.value = profile.name || "";
  pAge.value = profile.age || "";
  pNow.value = profile.now || "";
}

window.saveProfile = () => {
  profile = {
    name: pName.value.trim(),
    age: pAge.value.trim(),
    now: pNow.value.trim()
  };
  localStorage.setItem("nearProfile", JSON.stringify(profile));
  sheet.classList.remove("open");
  if (myUid) updateFirestore();
};

/* ---------------- FIREBASE ---------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

signInAnonymously(auth).then(res => {
  myUid = res.user.uid;

  navigator.geolocation.watchPosition(pos => {
    myLat = pos.coords.latitude;
    myLng = pos.coords.longitude;
    updateFirestore(myLat, myLng);
  });

  listen();
});

/* ---------------- UPDATE ---------------- */
function updateFirestore(lat, lng) {
  setDoc(
    doc(db, "users", myUid),
    {
      ...profile,
      lat,
      lng,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

/* ---------------- LISTEN ---------------- */
function listen() {
  onSnapshot(collection(db, "users"), snap => {
    refresh(snap);
  });
}

/* ---------------- REFRESH ---------------- */
function refresh(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;
  if (!snap || myLat === null) {
    count.textContent = "Finding people…";
    return;
  }

  snap.forEach(docu => {
    if (docu.id === myUid) return;

    const u = docu.data();
    if (!u.lat || !u.lng) return;

    const dKm = distanceKm(myLat, myLng, u.lat, u.lng);
    if (dKm > 5) return; // Near = intentional

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="now">${u.now || ""}</div>
        <div class="distance">${dKm.toFixed(1)} km away</div>
      </div>
    `;
    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}
</script>
