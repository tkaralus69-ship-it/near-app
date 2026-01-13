// script.js (FULL)
// Visual Near UI + Firebase Auth + Location + People Near + Live Waves

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ====== Your Firebase config (from your console) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};

/* ====== Init ====== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ====== UI refs ====== */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");

const peopleEl = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const vibeBtns = [...document.querySelectorAll(".vibeBtn")];

const waveBtn = document.getElementById("waveBtn");
const waveModal = document.getElementById("waveModal");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");
const sendStatus = document.getElementById("sendStatus");

let uid = null;
let currentTheme = document.body.getAttribute("data-theme") || "city";
let lastPos = null;
let unsubUsers = null;

/* ====== Helpers ====== */
function setStatus(top, pill) {
  if (top != null) statusLine.textContent = top;
  if (pill != null) pillStatus.textContent = pill;
}

function safeNameFromUid(u) {
  return `User-${(u || "").slice(0, 4) || "anon"}`;
}

function kmDistance(aLat, aLng, bLat, bLng) {
  // Haversine
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((aLat * Math.PI) / 180) *
    Math.cos((bLat * Math.PI) / 180) *
    (Math.sin(dLng / 2) ** 2);
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return R * c;
}

function formatDistanceForPrivacy(km) {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return "within 1 km away";
  if (km < 2) return "~1.2 km away";
  const rounded = Math.round(km * 10) / 10;
  return `~${rounded} km away`;
}

function openModal() {
  waveModal.classList.remove("hidden");
  waveModal.setAttribute("aria-hidden", "false");
  waveText.focus();
}

function closeModal() {
  waveModal.classList.add("hidden");
  waveModal.setAttribute("aria-hidden", "true");
  sendStatus.textContent = "";
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute("data-theme", theme);

  vibeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

/* ====== Vibe buttons ====== */
vibeBtns.forEach(btn => {
  btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

/* ====== Modal events ====== */
waveBtn.addEventListener("click", () => {
  if (!uid) {
    alert("Not signed in yet — check console if this keeps happening.");
    return;
  }
  openModal();
});

waveModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "1" || e.target === document.querySelector(".modalBackdrop")) {
    closeModal();
  }
});

laterBtn.addEventListener("click", closeModal);

waveText.addEventListener("input", () => {
  countEl.textContent = String(waveText.value.length);
});

sendBtn.addEventListener("click", async () => {
  if (!uid) return alert("Not signed in");
  const msg = waveText.value.trim();
  if (!msg) return;

  try {
    sendBtn.disabled = true;
    sendStatus.textContent = "Sending…";

    const lat = lastPos?.coords?.latitude ?? null;
    const lng = lastPos?.coords?.longitude ?? null;

    await addDoc(collection(db, "waves"), {
      createdAt: serverTimestamp(),
      uid,
      theme: currentTheme,
      message: msg,
      lat,
      lng
    });

    waveText.value = "";
    countEl.textContent = "0";
    sendStatus.textContent = "Sent ✅";
    setTimeout(closeModal, 350);
  } catch (err) {
    console.error("Wave send failed:", err);
    alert("Send failed — check console");
    sendStatus.textContent = "Send failed — check console";
  } finally {
    sendBtn.disabled = false;
  }
});

/* ====== Auth ====== */
async function bootAuth() {
  setStatus("Signing in…", "Starting…");

  try {
    await signInAnonymously(auth);
  } catch (err) {
    console.error("Auth failed:", err);
    alert(`Auth failed: ${err?.message || err}`);
    setStatus("Sign-in failed — check console", "Sign-in failed");
  }

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      uid = null;
      setStatus("Not signed in", "Not signed in");
      return;
    }

    uid = user.uid;
    setStatus("Live", "Up to date");
    startLocation();
    startWavesFeed();
    startUsersFeed();
  });
}

/* ====== Location ====== */
function startLocation() {
  if (!("geolocation" in navigator)) {
    setStatus("Location not supported on this device.", "No location");
    return;
  }

  setStatus("Live", "Finding…");

  navigator.geolocation.watchPosition(
    async (pos) => {
      lastPos = pos;
      setStatus("Live", "Up to date");

      // Update my user doc
      try {
        const ref = doc(db, "users", uid);
        await setDoc(ref, {
          uid,
          name: safeNameFromUid(uid),
          lastSeen: serverTimestamp(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }, { merge: true });
      } catch (err) {
        console.error("User update failed:", err);
      }
    },
    (err) => {
      console.error("Geo error:", err);
      setStatus("Location blocked — allow location to go live.", "No location");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000
    }
  );
}

/* ====== People Near ======
   Simple client-side proximity filtering:
   Reads users and filters by distance (OK for MVP/testing).
*/
function startUsersFeed() {
  if (unsubUsers) unsubUsers();

  unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
    const items = [];
    const myLat = lastPos?.coords?.latitude;
    const myLng = lastPos?.coords?.longitude;

    snap.forEach((d) => {
      const u = d.data();
      if (!u || u.uid === uid) return;
      if (!Number.isFinite(u.lat) || !Number.isFinite(u.lng)) return;

      let distKm = null;
      if (Number.isFinite(myLat) && Number.isFinite(myLng)) {
        distKm = kmDistance(myLat, myLng, u.lat, u.lng);
      }
      items.push({ ...u, _distKm: distKm });
    });

    // Prefer nearest; hide far users (MVP range)
    items.sort((a, b) => (a._distKm ?? 999) - (b._distKm ?? 999));
    const filtered = items.filter(x => (x._distKm == null ? true : x._distKm <= 5));

    renderPeople(filtered);
  }, (err) => {
    console.error("Users feed error:", err);
  });
}

function renderPeople(users) {
  peopleEl.innerHTML = "";

  if (!users.length) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="pName">No one nearby yet</div>
        <div class="pSub">Leave Near open for a bit.</div>
        <div class="pDist">Your phone will show the location icon when live.</div>
      </div>
    `;
    peopleEl.appendChild(li);
    return;
  }

  users.slice(0, 12).forEach((u) => {
    const li = document.createElement("li");
    const name = u.name || safeNameFromUid(u.uid);

    const distText = (u._distKm == null)
      ? "…"
      : formatDistanceForPrivacy(u._distKm);

    li.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="pName">${escapeHtml(name)}</div>
        <div class="pSub">Out in the world</div>
        <div class="pDist">${escapeHtml(distText)}</div>
        <div class="pMeta">${escapeHtml(u.uid?.slice(0, 8) || "")}</div>
      </div>
    `;
    peopleEl.appendChild(li);
  });
}

/* ====== Live Waves ====== */
function startWavesFeed() {
  const q = query(collection(db, "waves"), orderBy("createdAt", "desc"), limit(20));

  onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    renderWaves(arr.reverse()); // show oldest → newest
  }, (err) => {
    console.error("Waves feed error:", err);
  });
}

function renderWaves(waves) {
  wavesFeed.innerHTML = "";

  if (!waves.length) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="msg">No waves yet</div>
        <div class="tinyLine">Be the first to say something real.</div>
      </div>
    `;
    wavesFeed.appendChild(li);
    return;
  }

  waves.slice(-12).forEach((w) => {
    const li = document.createElement("li");
    const theme = w.theme || "city";
    const who = w.uid ? safeNameFromUid(w.uid) : "Someone";

    li.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="msg">${escapeHtml(w.message || "")}</div>
        <div class="tinyLine">${escapeHtml(themeLabel(theme))} • ${escapeHtml(who)}</div>
      </div>
    `;
    wavesFeed.appendChild(li);
  });
}

function themeLabel(t) {
  if (t === "city") return "City (Night)";
  if (t === "beach") return "Beach";
  if (t === "forest") return "Forest";
  if (t === "space") return "Space";
  return t;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ====== Kickoff ====== */
setTheme(currentTheme);
bootAuth();
