// script.js (ES module) — FULL FILE
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
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   1) YOUR FIREBASE CONFIG
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===== UI refs ===== */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");

const peopleList = document.getElementById("people");
const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));

const waveBtn = document.getElementById("waveBtn");

const modalRoot = document.getElementById("waveModal");
const backdrop = modalRoot?.querySelector(".modalBackdrop");

const waveText = document.getElementById("waveText");
const count = document.getElementById("count");

const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

const wavesFeed = document.getElementById("wavesFeed");
const wavesHint = document.getElementById("wavesHint");

/* ===== Helpers ===== */
function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

function setPill(text) {
  if (pillStatus) pillStatus.textContent = text;
}

function safeAlert(msg) {
  // keep alerts short on mobile
  alert(msg);
}

function activeTheme() {
  return (
    vibeButtons.find((b) => b.classList.contains("active"))?.dataset.theme ||
    "city"
  );
}

/* ===== Theme packs ===== */
const THEMES = {
  city: { bg1: "#2e3a3f", bg2: "#0b0f12", a1: "#6ee7b7", a2: "#7dd3fc" },
  beach: { bg1: "#2b6b73", bg2: "#08161b", a1: "#fcd34d", a2: "#f59e0b" },
  forest: { bg1: "#2f5a43", bg2: "#06130c", a1: "#86efac", a2: "#34d399" },
  space: { bg1: "#3a2f5a", bg2: "#05030a", a1: "#c4b5fd", a2: "#a78bfa" }
};

function setTheme(key) {
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

/* vibe button clicks */
vibeButtons.forEach((btn) => {
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

/* ===== People list (demo) ===== */
function kmMin1(km) {
  if (!Number.is
