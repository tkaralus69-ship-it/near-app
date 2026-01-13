// script.js
// Near — Phase 2 UI (Themes + People Near + Wave Gate)
// No backend yet. Mock people now; Firebase/Firestore later.

const els = {
  statusText: document.getElementById("statusText"),
  nearCount: document.getElementById("nearCount"),
  peopleList: document.getElementById("peopleList"),
  waveBtn: document.getElementById("waveBtn"),
  tabs: Array.from(document.querySelectorAll(".tab")),

  overlay: document.getElementById("gateOverlay"),
  gateInput: document.getElementById("gateInput"),
  gateCounter: document.getElementById("gateCounter"),
  gateSend: document.getElementById("gateSend"),
  gateLater: document.getElementById("gateLater"),

  toast: document.getElementById("toast"),
};

// ---------------------------
// Config
// ---------------------------
const PRIVACY_MIN_KM = 1;      // minimum distance shown
const MAX_DISTANCE_KM = 5;     // current demo range
const MAX_MESSAGE_LEN = 250;

// “Minimum protects intention.”
// If you want a real minimum, set this to e.g. 20.
// In your mock, it reads like a principle, not a forced limit.
const MIN_MESSAGE_LEN = 0;

// ---------------------------
// State
// ---------------------------
let theme = "city";
let people = [];
let selectedPerson = null;
let waved = false;

// ---------------------------
// Helpers
// ---------------------------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDistanceKm(kmRaw) {
  // privacy: always show at least 1km
  const km = Math.max(PRIVACY_MIN_KM, kmRaw);

  // If it clamps to 1km, show "within 1 km away"
  if (km === PRIVACY_MIN_KM) return "within 1 km away";

  // Otherwise show "~X.X km away"
  return `~${km.toFixed(1)} km away`;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function setTheme(nextTheme) {
  theme = nextTheme;
  document.body.setAttribute("data-theme", theme);

  // Tabs UI
  els.tabs.forEach((t) => {
    const isActive = t.dataset.theme === theme;
    t.classList.toggle("is-active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });

  // Optional: small status text vibe
  const vibeCopy = {
    city: "Finding people near you…",
    beach: "Finding beach souls near you…",
    forest: "Finding quiet minds near you…",
    space: "Finding signals near you…",
  };
  els.statusText.textContent = vibeCopy[theme] || "Finding people near you…";
}

// Simple toast
let toastTimer = null;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove("is-hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add("is-hidden"), 1800);
}

// ---------------------------
// Mock data
// ---------------------------
function mockPeople(count = 5) {
  // Inclusive, welcoming names & ages (not “insta model” vibe)
  const names = [
    "Sam", "Jade", "Michael", "Elena", "David", "Priya", "Lena", "Hannah",
    "Omar", "Tess", "Kim", "Noah", "Alex", "Mina", "Jordan", "Rosa",
    "Chris", "Aisha", "Ben", "Maya", "Sophie", "Nate", "Amir", "Grace",
  ];

  const notesByTheme = {
    city: ["Out for a walk", "Coffee nearby", "Taking it slow", "Just chillin", "Night air", "Late snack mission"],
    beach: ["Beach breeze", "Sunset stroll", "Salt air", "Ocean calm", "Sand between toes", "Cold drink"],
    forest: ["Quiet walk", "Fresh air", "Nature reset", "Slow morning", "Birdsong", "Green calm"],
    space: ["Techy mood", "Signal check", "Stargazing", "Night thinker", "Calm focus", "Curious mind"],
  };

  const notes = notesByTheme[theme] || notesByTheme.city;

  // Generate
  const out = [];
  for (let i = 0; i < count; i++) {
    const age = Math.floor(randBetween(22, 66
