// NEAR — fundamentals build
// Create = blank form EVERY time
// Me = load your latest saved profile
// Nearby = profiles within 5 km (client-side distance)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase init OK:", firebaseConfig.projectId);

// ---------------------------
// UI elements
// ---------------------------
const authStatusEl = document.getElementById("authStatus");
const locStatusEl  = document.getElementById("locStatus");
const pillStatusEl = document.getElementById("pillStatus");

const peopleListEl = document.getElementById("peopleList");
const nearCountEl  = document.getElementById("nearCount");

const btnRequestLocation = document.getElementById("btnRequestLocation");
const btnCreate = document.getElementById("btnCreate");
const btnMe = document.getElementById("btnMe");

const profileOverlay = document.getElementById("profileOverlay");
const profileSubtitle = document.getElementById("profileSubtitle");
const profileHint = document.getElementById("profileHint");

const nameInput = document.getElementById("nameInput");
const ageInput = document.getElementById("ageInput");
const bioInput = document.getElementById("bioInput");
const townInput = document.getElementById("townInput");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");

const btnBack = document.getElementById("btnBack");
const btnSave = document.getElementById("btnSave");

// vibe buttons
document.querySelectorAll(".btn.vibe").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn.vibe").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const vibe = btn.dataset.vibe || null;
    pillStatusEl.textContent = vibe ? `Vibe: ${vibe}` : "Up to date";
    selectedVibe = vibe;
  });
});

// placeholder buttons
document.getElementById("btnChooseNear").addEventListener("click", () => alert("Soon: pick someone nearby and open their profile."));
document.getElementById("btnWave").addEventListener("click", () => alert("Soon: send a wave 👋"));
document.getElementById("btnLiveWaves").addEventListener("click", () => alert("Soon: live waves feed 🌊"));

// ---------------------------
// App state
// ---------------------------
let currentUser = null;
let myLat = null;
let myLng = null;
let selectedVibe = null;

// ---------------------------
// Helpers
// ---------------------------
function showOverlay() {
  profileOverlay.classList.add("show");
  profileOverlay.setAttribute("aria-hidden", "false");
}
function hideOverlay() {
  profileOverlay.classList.remove("show");
  profileOverlay.setAttribute("aria-hidden", "true");
}

function setLocationStatus(text) {
  locStatusEl.textContent = `Location: ${text}`;
}
function setAuthStatus(text) {
  authStatusEl.textContent = text;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function safeMinDistanceKm(km) {
  return Math.max(1, km); // privacy minimum
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearProfileForm() {
  nameInput.value = "";
  ageInput.value = "";
  bioInput.value = "";
  townInput.value = "";
  photoInput.value = "";
  photoPreview.src = "";
}

function fillProfileForm(data) {
  nameInput.value = data?.name || "";
  ageInput.value = (data?.age ?? "") === null ? "" : (data?.age ?? "");
  bioInput.value = data?.bio || "";
  townInput.value = data?.town || "";
  photoInput.value = data?.photoURL || "";
  photoPreview.src = data?.photoURL || "";
}

function getProfilePayload() {
  const name = (nameInput.value || "").trim();
  const age = ageInput.value ? Number(ageInput.value) : null;
  const bio = (bioInput.value || "").trim();
  const town = (townInput.value || "").trim();
  const photoURL = (photoInput.value || "").trim();

  return {
    ownerUid: currentUser?.uid || null,
    name: name || "Anonymous",
    age: age ? clamp(age, 18, 99) : null,
    bio: bio || "",
    town: town || "",
    photoURL: photoURL || "",
    vibe: selectedVibe || null,
    lat: myLat,
    lng: myLng,
    updatedAt: serverTimestamp(),
  };
}

function renderPeople(people) {
  peopleListEl.innerHTML = "";

  if (!people.length) {
    peopleListEl.innerHTML = `<div class="smallMuted">No nearby users yet</div>`;
    nearCountEl.textContent = "0 nearby";
    return;
  }

  nearCountEl.textContent = `${people.length} nearby`;

  for (const p of people) {
    const km = safeMinDistanceKm(p.distanceKm);
    const kmText = `${km.toFixed(2)} km away`;

    const img = p.photoURL || "";
    const name = `${p.name || "Anonymous"}${p.age ? `, ${p.age}` : ""}`;
    const bio = p.bio || "";
    const town = p.town ? p.town.toUpperCase() : "";

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <img class="avatar" src="${escapeHtml(img)}" alt="" onerror="this.style.display='none'"/>
      <div>
        <p class="name">${escapeHtml(name)}</p>
        <p class="bio">${escapeHtml(bio)}</p>
        <div class="town">${escapeHtml(town)}</div>
      </div>
      <div class="right">${escapeHtml(kmText)}</div>
    `;
    peopleListEl.appendChild(el);
  }
}

// ---------------------------
// Location
// ---------------------------
function requestLocationOnce() {
  if (!navigator.geolocation) {
    setLocationStatus("not supported");
    return;
  }
  setLocationStatus("requesting…");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      myLat = pos.coords.latitude;
      myLng = pos.coords.longitude;
      setLocationStatus("acquired ✅");
      refreshNearby();
    },
    () => {
      setLocationStatus("blocked / denied");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

btnRequestLocation.addEventListener("click", requestLocationOnce);

// ---------------------------
// Auth + boot
// ---------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setAuthStatus("Signing in…");
    try {
      await signInAnonymously(auth);
      return;
    } catch (e) {
      console.error(e);
      setAuthStatus("Sign-in failed");
      return;
    }
  }

  currentUser = user;
  setAuthStatus("Signed in");
  requestLocationOnce();
  refreshNearby();
  setInterval(refreshNearby, 8000);
});

// ---------------------------
// Profile overlay logic
// ---------------------------

// ✅ Create ALWAYS starts blank
btnCreate.addEventListener("click", () => {
  clearProfileForm();
  profileSubtitle.textContent = "Profile";
  profileHint.textContent = "Create starts blank every time. Save publishes a new profile.";
  btnSave.textContent = "Update profile";
  showOverlay();
});

// ✅ Me loads your most recent saved profile
btnMe.addEventListener("click", async () => {
  clearProfileForm();
  profileSubtitle.textContent = "Profile";
  profileHint.textContent = "Me loads your latest saved profile.";

  try {
    const q = query(
      collection(db, "profiles"),
      where("ownerUid", "==", currentUser.uid),
      orderBy("updatedAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      profileHint.textContent = "No saved profile yet. Use Create to make one.";
    } else {
      fillProfileForm(snap.docs[0].data());
    }
  } catch (e) {
    console.error(e);
    profileHint.textContent = "Could not load your profile (Firestore rules / index).";
  }

  btnSave.textContent = "Update profile";
  showOverlay();
});

btnBack.addEventListener("click", hideOverlay);

// photo preview
photoInput.addEventListener("input", () => {
  const url = (photoInput.value || "").trim();
  photoPreview.src = url || "";
});

// Save => always writes a NEW doc (latest wins)
btnSave.addEventListener("click", async () => {
  if (!currentUser) return;

  if (myLat == null || myLng == null) {
    alert("Please enable location first.");
    return;
  }

  const payload = getProfilePayload();

  if (!payload.bio || payload.bio.trim().length < 10) {
    alert("Bio is too short. Write a little more (10+ characters).");
    return;
  }

  try {
    await addDoc(collection(db, "profiles"), payload);
    hideOverlay();
    refreshNearby();
  } catch (e) {
    console.error(e);
    alert("Save failed. Usually Firestore rules or missing index.");
  }
});

// ---------------------------
// Nearby list
// ---------------------------
async function refreshNearby() {
  if (!currentUser) return;

  if (myLat == null || myLng == null) {
    nearCountEl.textContent = "Waiting for location…";
    peopleListEl.innerHTML = `<div class="smallMuted">Waiting for location…</div>`;
    return;
  }

  try {
    const snap = await getDocs(collection(db, "profiles"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // latest profile per ownerUid
    const latestByOwner = new Map();
    for (const p of all) {
      const key = p.ownerUid || p.id;
      const existing = latestByOwner.get(key);
      const pMillis = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : 0;
      const eMillis = existing?.updatedAt?.toMillis ? existing.updatedAt.toMillis() : 0;
      if (!existing || pMillis >= eMillis) latestByOwner.set(key, p);
    }

    const unique = Array.from(latestByOwner.values());

    const near = unique
      .filter(p => typeof p.lat === "number" && typeof p.lng === "number")
      .map(p => ({ ...p, distanceKm: distanceKm(myLat, myLng, p.lat, p.lng) }))
      .filter(p => p.distanceKm <= 5)
      .sort((a,b) => a.distanceKm - b.distanceKm);

    renderPeople(near);
  } catch (e) {
    console.error(e);
    nearCountEl.textContent = "Error loading nearby";
    peopleListEl.innerHTML = `<div class="smallMuted">Could not load nearby (Firestore rules).</div>`;
  }
}
