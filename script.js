// script.js (FULL END-GAME) — Near
// Works on GitHub Pages with Firebase Auth + Firestore.
// You only paste this whole file once.

// ---------- VIBE IMAGES ----------
const VIBE_IMAGES = {
  city:  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1800&q=60",
  beach: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=60",
  forest:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=60",
  space: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1800&q=60",
};

// ---------- UI HELPERS ----------
const $ = (id) => document.getElementById(id);

function setStatus(text, pill) {
  const statusLine = $("statusLine");
  const pillStatus = $("pillStatus");
  if (statusLine && text) statusLine.textContent = text;
  if (pillStatus && pill) pillStatus.textContent = pill;
}

function openModal() {
  $("waveModal")?.classList.remove("hidden");
  $("waveModal")?.setAttribute("aria-hidden", "false");
  $("waveText")?.focus();
}
function closeModal() {
  $("waveModal")?.classList.add("hidden");
  $("waveModal")?.setAttribute("aria-hidden", "true");
}

function clampDistanceKm(km) {
  // Privacy: show minimum of 1 km
  if (!isFinite(km)) return "within 1 km away";
  if (km < 1) return "within 1 km away";
  if (km < 10) return `~${km.toFixed(1)} km away`;
  return `~${Math.round(km)} km away`;
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * (Math.sin(dLng / 2) ** 2);
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
  return R * c;
}

// ---------- VIBE / BACKGROUND ----------
function applyVibe(theme) {
  const t = theme in VIBE_IMAGES ? theme : "city";
  const url = VIBE_IMAGES[t];

  const bg = document.querySelector(".bgVibe");
  if (bg) bg.style.backgroundImage = `url("${url}")`;

  // promo cards share the same image for cohesion
  document.querySelectorAll(".promoCard").forEach((card) => {
    card.style.setProperty("--promoImage", `url("${url}")`);
  });

  const chip = $("vibeChip");
  if (chip) chip.textContent = t.charAt(0).toUpperCase() + t.slice(1);
}

function wireVibeButtons() {
  const btns = document.querySelectorAll(".vibeBtn");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const theme = b.dataset.theme || "city";
      localStorage.setItem("near_theme", theme);
      applyVibe(theme);
    });
  });

  const saved = localStorage.getItem("near_theme") || "city";
  const defaultBtn = document.querySelector(`.vibeBtn[data-theme="${saved}"]`) || document.querySelector(".vibeBtn");
  if (defaultBtn) {
    btns.forEach(x => x.classList.remove("active"));
    defaultBtn.classList.add("active");
  }
  applyVibe(saved);
}

// ---------- PROMO CARDS JUMP ----------
function wirePromoCards() {
  document.querySelectorAll(".promoCard[data-jump]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "waveBtn") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.click(), 220);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ---------- PEOPLE (mock for now) ----------
function renderMockPeople(userLat, userLng) {
  const people = [
    { name:"Sam", age:54, line:"Out for a walk", lat:userLat + 0.006, lng:userLng + 0.004 },
    { name:"Jade", age:31, line:"Coffee nearby", lat:userLat + 0.010, lng:userLng + 0.002 },
    { name:"Michael", age:42, line:"Taking it slow", lat:userLat + 0.024, lng:userLng + 0.010 },
    { name:"Elena", age:27, line:"Beach breeze", lat:userLat + 0.008, lng:userLng - 0.012 },
    { name:"David", age:61, line:"Just chillin", lat:userLat + 0.044, lng:userLng - 0.020 },
  ];

  const ul = $("people");
  if (!ul) return;
  ul.innerHTML = "";

  people.forEach((p) => {
    const km = haversineKm(userLat, userLng, p.lat, p.lng);
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar"></div>
      <div>
        <div class="pName">${p.name}, ${p.age}</div>
        <div class="pSub">${p.line}</div>
        <div class="pDist">${clampDistanceKm(km)}</div>
      </div>
    `;
    ul.appendChild(li);
  });
}

// ---------- FIREBASE (MODULAR v12 CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// >>> YOUR FIREBASE CONFIG (KEEP AS IS) <<<
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

// ---------- AUTH ----------
async function signIn() {
  try {
    setStatus("Signing in…", "Starting…");
    await signInAnonymously(auth);
  } catch (e) {
    console.error(e);
    setStatus("Sign-in failed — check console", "Offline");
    alert(`Auth failed: ${e?.message || e}`);
  }
}

// ---------- LOCATION -> users/{uid} ----------
function startLocationWatch(uid) {
  if (!navigator.geolocation) {
    setStatus("Location not supported on this device", "No GPS");
    return;
  }

  setStatus("Getting location…", "Live");

  navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    try {
      await setDoc(doc(db, "users", uid), {
        lat,
        lng,
        lastSeen: serverTimestamp(),
        name: "User", // placeholder
      }, { merge: true });

      setStatus("Live", "Up to date");
      renderMockPeople(lat, lng);
    } catch (e) {
      console.error(e);
      setStatus("Location saved failed — check console", "Offline");
    }
  }, (err) => {
    console.error(err);
    setStatus("Location denied / unavailable", "No GPS");
  }, {
    enableHighAccuracy: true,
    maximumAge: 8000,
    timeout: 12000
  });
}

// ---------- WAVES ----------
function wireWaveModal(uid) {
  const waveBtn = $("waveBtn");
  const modal = $("waveModal");
  const backdrop = modal?.querySelector(".modalBackdrop");
  const laterBtn = $("laterBtn");
  const sendBtn = $("sendBtn");
  const waveText = $("waveText");
  const count = $("count");

  const updateCount = () => {
    if (!waveText || !count) return;
    count.textContent = String(waveText.value.length);
  };

  waveBtn?.addEventListener("click", openModal);
  laterBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  waveText?.addEventListener("input", updateCount);
  updateCount();

  sendBtn?.addEventListener("click", async () => {
    if (!uid) return;

    const msg = (waveText?.value || "").trim();
    if (!msg) {
      alert("Say something real 🙂");
      return;
    }

    const activeTheme = document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";

    // get last known coords from mock people renderer inputs:
    // we’ll read them from the user's doc by relying on last saved, but for speed we keep localStorage cached too
    let lat = Number(localStorage.getItem("near_lat"));
    let lng = Number(localStorage.getItem("near_lng"));

    try {
      // best effort: cache last geolocation each time watchPosition fires
      // (we store when rendering mock people)
      // fallback if not set: allow wave without coords
      await addDoc(collection(db, "waves"), {
        createdAt: serverTimestamp(),
        uid,
        message: msg,
        theme: activeTheme,
        lat: isFinite(lat) ? lat : null,
        lng: isFinite(lng) ? lng : null
      });

      waveText.value = "";
      updateCount();
      closeModal();
    } catch (e) {
      console.error(e);
      alert("Send failed — check console");
    }
  });
}

function listenWaves() {
  const ul = $("wavesFeed");
  if (!ul) return;

  const q = query(collection(db, "waves"), orderBy("createdAt", "desc"), limit(12));
  onSnapshot(q, (snap) => {
    ul.innerHTML = "";
    snap.forEach((docSnap) => {
      const w = docSnap.data() || {};
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="avatar"></div>
        <div>
          <div class="pName">${prettyTheme(w.theme)}</div>
          <div class="pSub">${escapeHtml(w.message || "")}</div>
        </div>
      `;
      ul.appendChild(li);
    });
  }, (err) => {
    console.error(err);
    $("wavesHint").textContent = "Feed offline";
  });
}

function prettyTheme(t) {
  if (t === "city") return "City (Night)";
  if (t === "beach") return "Beach";
  if (t === "forest") return "Forest";
  if (t === "space") return "Space";
  return "Near";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Patch: store location to localStorage whenever we render mock people
const _renderMockPeople = renderMockPeople;
renderMockPeople = function(lat, lng){
  localStorage.setItem("near_lat", String(lat));
  localStorage.setItem("near_lng", String(lng));
  return _renderMockPeople(lat, lng);
};

// ---------- BOOT ----------
document.addEventListener("DOMContentLoaded", () => {
  wirePromoCards();
  wireVibeButtons();
  listenWaves();
  signIn();

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    setStatus("Live", "Up to date");
    startLocationWatch(user.uid);
    wireWaveModal(user.uid);
  });
});
