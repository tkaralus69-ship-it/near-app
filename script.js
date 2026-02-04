// ---------------------------
// NEAR — fundamentals build
// Two actions:
//   Create = blank form (always)
//   Me     = load most recent saved profile for this user
// Nearby list = profiles within 5 km (client-side distance)
// ---------------------------

// ✅ Firebase (modular CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut
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

// ---------------------------
// 1) Firebase config (PASTE YOURS)
// ---------------------------
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};

// ---------------------------
// 2) App state
// ---------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

let myLat = null;
let myLng = null;

let selectedVibe = null;

// profile screen state:
let profileMode = "create"; // "create" | "me"
let editingProfileDoc = null; // stores the doc data we loaded for Me (for display only)

// ---------------------------
// 3) UI elements
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
document.querySelectorAll(".vibeBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedVibe = btn.dataset.vibe || null;
    pillStatusEl.textContent = selectedVibe ? `Vibe: ${selectedVibe}` : "Up to date";
  });
});

// little placeholders buttons (future features)
document.getElementById("btnChooseNear").addEventListener("click", () => {
  alert("Soon: pick someone nearby and open their profile.");
});
document.getElementById("btnWave").addEventListener("click", () => {
  alert("Soon: send a wave 👋");
});
document.getElementById("btnLiveWaves").addEventListener("click", () => {
  alert("Soon: live waves feed 🌊");
});

// ---------------------------
// 4) Helpers
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
  // Haversine
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function safeMinDistanceKm(km) {
  // Privacy: never show less than 1 km
  return Math.max(1, km);
}

function clearProfileForm() {
  nameInput.value = "";
  ageInput.value = "";
  bioInput.value = "";
  townInput.value = "";
  photoInput.value = "";
  photoPreview.src = "";
  editingProfileDoc = null;
}

function fillProfileForm(data) {
  nameInput.value = data?.name || "";
  ageInput.value = data?.age ?? "";
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
    peopleListEl.innerHTML = `<div class="small muted">No nearby users yet</div>`;
    nearCountEl.textContent = "0 nearby";
    return;
  }

  nearCountEl.textContent = `${people.length} nearby`;

  for (const p of people) {
    const km = safeMinDistanceKm(p.distanceKm);
    const kmText = `${km.toFixed(2)} km away`;

    const img = p.photoURL ? p.photoURL : "";
    const name = `${p.name || "Anonymous"}${p.age ? `, ${p.age}` : ""}`;
    const bio = p.bio || "";
    const town = p.town ? p.town.toUpperCase() : "";

    const el = document.createElement("div");
    el.className = "person";
    el.innerHTML = `
      <img class="avatar" src="${img}" alt="" onerror="this.style.display='none'"/>
      <div class="meta">
        <p class="name">${escapeHtml(name)}</p>
        <p class="bio">${escapeHtml(bio)}</p>
        <div class="small muted">${escapeHtml(town)}</div>
      </div>
      <div class="right">${escapeHtml(kmText)}</div>
    `;
    peopleListEl.appendChild(el);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------------------------
// 5) Location
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
    (err) => {
      console.log(err);
      setLocationStatus("blocked / denied");
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

btnRequestLocation.addEventListener("click", () => {
  requestLocationOnce();
});

// ---------------------------
// 6) Auth + boot
// ---------------------------
async function ensureSignedIn() {
  // Keep it simple: always anonymous
  await signInAnonymously(auth);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setAuthStatus("Signing in…");
    try {
      await ensureSignedIn();
      return;
    } catch (e) {
      console.error(e);
      setAuthStatus("Sign-in failed");
      return;
    }
  }

  currentUser = user;
  setAuthStatus("Signed in");
  requestLocationOnce(); // try immediately

  // load nearby continuously-ish (simple polling)
  refreshNearby();
  setInterval(refreshNearby, 8000);
});

// ---------------------------
// 7) Profile screen logic
// ---------------------------
// Create = ALWAYS blank
btnCreate.addEventListener("click", () => {
  profileMode = "create";
  clearProfileForm();
  profileSubtitle.textContent = "Profile";
  profileHint.textContent = "Create starts blank every time. Save publishes a new profile.";
  btnSave.textContent = "Update profile";
  showOverlay();
});

// Me = load your most recent profile (if exists)
btnMe.addEventListener("click", async () => {
  profileMode = "me";
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
      const doc = snap.docs[0];
      editingProfileDoc = { id: doc.id, ...doc.data() };
      fillProfileForm(editingProfileDoc);
    }
  } catch (e) {
    console.error(e);
    profileHint.textContent = "Could not load your profile (check Firestore rules).";
  }

  btnSave.textContent = "Update profile";
  showOverlay();
});

btnBack.addEventListener("click", () => {
  hideOverlay();
});

// photo preview
photoInput.addEventListener("input", () => {
  const url = (photoInput.value || "").trim();
  photoPreview.src = url || "";
});

// Save logic
btnSave.addEventListener("click", async () => {
  if (!currentUser) return;

  // require location for publishing (keeps nearby meaningful)
  if (myLat == null || myLng == null) {
    alert("Please enable location first.");
    return;
  }

  const payload = getProfilePayload();

  // basic sanity so you don’t publish totally empty
  if (!payload.bio || payload.bio.trim().length < 10) {
    alert("Bio is too short. Write a little more (10+ characters).");
    return;
  }

  try {
    // IMPORTANT:
    // Create always makes a NEW profile document.
    // Me also makes a NEW profile document (latest wins). This keeps it simple
    // and makes your “most recent profile” always the one that shows on Me.
    await addDoc(collection(db, "profiles"), payload);

    hideOverlay();
    refreshNearby();
  } catch (e) {
    console.error(e);
    alert("Save failed. This is usually Firestore rules or missing indexes.");
  }
});

// Optional: quick reset for testing multiple anonymous users
// (Not wired to UI, but kept here as a tool)
async function hardResetUser() {
  await signOut(auth);
  await ensureSignedIn();
}

// ---------------------------
// 8) Nearby list
// ---------------------------
async function refreshNearby() {
  if (!currentUser) return;

  // show state
  if (myLat == null || myLng == null) {
    nearCountEl.textContent = "Waiting for location…";
    peopleListEl.innerHTML = `<div class="small muted">Waiting for location…</div>`;
    return;
  }

  try {
    // Pull profiles (simple v1 approach).
    // For scale later we’ll add geo queries or region filtering.
    const snap = await getDocs(collection(db, "profiles"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Reduce to "latest profile per ownerUid"
    const latestByOwner = new Map();
    for (const p of all) {
      const key = p.ownerUid || p.id;
      const existing = latestByOwner.get(key);
      // updatedAt is a Firestore timestamp; if missing, keep the first
      const pMillis = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : 0;
      const eMillis = existing?.updatedAt?.toMillis ? existing.updatedAt.toMillis() : 0;
      if (!existing || pMillis >= eMillis) latestByOwner.set(key, p);
    }

    const unique = Array.from(latestByOwner.values());

    // compute distance + filter
    const near = unique
      .filter(p => typeof p.lat === "number" && typeof p.lng === "number")
      .map(p => {
        const km = distanceKm(myLat, myLng, p.lat, p.lng);
        return { ...p, distanceKm: km };
      })
      .filter(p => p.distanceKm <= 5)
      .sort((a,b) => a.distanceKm - b.distanceKm);

    renderPeople(near);
  } catch (e) {
    console.error(e);
    nearCountEl.textContent = "Error loading nearby";
    peopleListEl.innerHTML = `<div class="small muted">Could not load nearby (check Firestore rules).</div>`;
  }
  }
