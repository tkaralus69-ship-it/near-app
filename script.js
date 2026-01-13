// script.js (ES module) — Near
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (YOUR PROJECT)
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("people");
const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));

const waveBtn = document.getElementById("waveBtn");
const waveModal = document.getElementById("waveModal");
const backdrop = waveModal?.querySelector(".modalBackdrop");
const sheet = waveModal?.querySelector(".modalSheet");
const waveText = document.getElementById("waveText");
const count = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

const wavesFeed = document.getElementById("wavesFeed");

/* Theme packs (4 only) */
const THEMES = {
  city: { bg1: "#2e3a3f", bg2: "#0b0f12", a1: "#6ee7b7", a2: "#7dd3fc" },
  beach: { bg1: "#2b6b73", bg2: "#08161b", a1: "#fcd34d", a2: "#f59e0b" },
  forest: { bg1: "#2f5a43", bg2: "#06130c", a1: "#86efac", a2: "#34d399" },
  space: { bg1: "#3a2f5a", bg2: "#05030a", a1: "#c4b5fd", a2: "#a78bfa" },
};

function setTheme(key) {
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

/* Vibes */
vibeButtons.forEach((btn) => {
  btn.type = "button";
  btn.addEventListener(
    "click",
    () => {
      vibeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setTheme(btn.dataset.theme);
    },
    { passive: true }
  );
});
setTheme("city");

/* People list (demo) */
function kmMin1(km) {
  if (!Number.isFinite(km)) return "within 1 km away";
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

const DEMO_PEOPLE = [
  { name: "Sam", age: 54, bio: "Out for a walk", km: 0.3 },
  { name: "Jade", age: 31, bio: "Coffee nearby", km: 1.2 },
  { name: "Michael", age: 42, bio: "Taking it slow", km: 3.4 },
  { name: "Elena", age: 27, bio: "Beach breeze", km: 0.7 },
  { name: "David", age: 61, bio: "Just chillin", km: 4.9 },
];

function renderPeople(arr) {
  peopleList.innerHTML = "";
  arr.slice(0, 5).forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div class="pName">${escapeHtml(p.name)}, ${escapeHtml(String(p.age))}</div>
        <div class="pSub">${escapeHtml(p.bio)}</div>
        <div class="pDist">${escapeHtml(kmMin1(p.km))}</div>
      </div>
    `;
    peopleList.appendChild(li);
  });
}
renderPeople(DEMO_PEOPLE);

/* Modal */
function openModal() {
  waveModal.classList.remove("hidden");
  waveModal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => waveText?.focus({ preventScroll: true }));
}
function closeModal() {
  waveModal.classList.add("hidden");
  waveModal.setAttribute("aria-hidden", "true");
  if (waveText) waveText.value = "";
  if (count) count.textContent = "0";
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
}

waveBtn.type = "button";
waveBtn.addEventListener("click", openModal, { passive: true });

laterBtn.type = "button";
laterBtn.addEventListener("click", closeModal, { passive: true });

backdrop?.addEventListener("click", closeModal, { passive: true });

// Safety: if user taps outside sheet (rare), close
waveModal?.addEventListener(
  "click",
  (e) => {
    if (e.target === waveModal) closeModal();
  },
  { passive: true }
);

waveText?.addEventListener("input", () => {
  if (count) count.textContent = String(waveText.value.length);
});

/* Geolocation (optional) */
let lastGeo = null;

function startGeo() {
  if (!("geolocation" in navigator)) {
    pillStatus.textContent = "No GPS";
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus.textContent = "Up to date";
    },
    () => {
      pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
  );
}

/* Firestore: user doc */
async function ensureUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const payload = {
    lastSeen: serverTimestamp(),
    name: "User",
  };
  if (lastGeo) {
    payload.lat = lastGeo.lat;
    payload.lng = lastGeo.lng;
  }
  await setDoc(ref, payload, { merge: true });
}

/* Waves feed */
function renderWaves(docs) {
  if (!wavesFeed) return;
  wavesFeed.innerHTML = "";
  docs.forEach((d) => {
    const data = d.data() || {};
    const li = document.createElement("li");
    const msg = typeof data.message === "string" ? data.message : "";
    const theme = typeof data.theme === "string" ? data.theme : "city";
    li.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div class="pName">${escapeHtml(themeLabel(theme))}</div>
        <div class="pSub">${escapeHtml(msg)}</div>
      </div>
    `;
    wavesFeed.appendChild(li);
  });
}

function startWavesFeed() {
  const q = query(collection(db, "waves"), orderBy("createdAt", "desc"), limit(20));
  onSnapshot(
    q,
    (snap) => {
      renderWaves(snap.docs);
    },
    (err) => {
      console.error("wavesFeed error:", err);
    }
  );
}

/* Send wave */
sendBtn.type = "button";
sendBtn.addEventListener("click", async () => {
  const text = (waveText?.value || "").trim();
  if (!text) return;

  const u = auth.currentUser;
  if (!u) {
    alert("Not signed in");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try {
    await addDoc(collection(db, "waves"), {
      uid: u.uid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme:
        vibeButtons.find((b) => b.classList.contains("active"))?.dataset.theme ||
        "city",
    });
    closeModal();
  } catch (err) {
    console.error("send wave error:", err);
    alert("Send failed — check console");
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

/* Auth boot */
function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

async function boot() {
  try {
    setStatus("Signing in…");
    pillStatus.textContent = "Starting…";
    startGeo();
    await signInAnonymously(auth);
  } catch (err) {
    console.error("auth error:", err);
    setStatus("Sign-in failed");
    pillStatus.textContent = "Error";
    alert(`Auth failed: ${err?.message || err}`);
  }
}

onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) return;
    setStatus("Live");
    await ensureUserDoc(user.uid);
    startWavesFeed();
  } catch (err) {
    console.error("post-auth error:", err);
  }
});

boot();

/* Helpers */
function themeLabel(theme) {
  switch (theme) {
    case "city":
      return "City (Night)";
    case "beach":
      return "Beach";
    case "forest":
      return "Forest";
    case "space":
      return "Space";
    default:
      return "Near";
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
