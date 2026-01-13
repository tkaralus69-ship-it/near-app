// =========================
// THEME PACKS + PRIVACY DISTANCE
// =========================

// Elements
const statusEl = document.getElementById("status");
const peopleList = document.getElementById("peopleList");
const waveBtn = document.getElementById("waveBtn");

const overlay = document.getElementById("textGateOverlay");
const input = document.getElementById("textGateInput");
const sendBtn = document.getElementById("textGateSend");
const cancelBtn = document.getElementById("textGateCancel");
const charCount = document.getElementById("charCount");

const MIN_CHARS = 250;
const MAX_CHARS = 600;

// Theme switching
const pills = Array.from(document.querySelectorAll(".pill"));
const THEME_KEY = "nearTheme";

function setTheme(themeClass) {
  document.body.classList.remove(
    "theme-city-night",
    "theme-beach-day",
    "theme-forest-day",
    "theme-space-night"
  );
  document.body.classList.add(themeClass);
  localStorage.setItem(THEME_KEY, themeClass);

  pills.forEach(p => p.classList.toggle("isActive", p.dataset.theme === themeClass));
}

pills.forEach(p => {
  p.addEventListener("click", () => setTheme(p.dataset.theme));
});

// Load saved theme
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) setTheme(savedTheme);

// =========================
// MOCK DATA (Replace with Firestore later)
// =========================
const people = [
  { id: "a1", name: "Sam", age: 54, now: "Out for a walk", km: 0.3 },
  { id: "b2", name: "Jade", age: 31, now: "Coffee nearby", km: 1.2 },
  { id: "c3", name: "Michael", age: 42, now: "Taking it slow", km: 3.4 },
  { id: "d4", name: "Elena", age: 27, now: "Beach breeze", km: 0.8 },
  { id: "e5", name: "David", age: 61, now: "Just chillin", km: 4.9 }
];

let selectedPersonId = people[0]?.id || null;

// =========================
// PRIVACY DISTANCE FORMAT
// Minimum shown distance is 1 km
// =========================
function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return "";
  if (km < 1) return "within 1 km";
  // round to 0.1km, but keep it soft
  const rounded = Math.round(km * 10) / 10;
  return `~${rounded} km`;
}

// =========================
// RENDER
// =========================
function renderList() {
  peopleList.innerHTML = "";

  if (!people.length) {
    statusEl.textContent = "No one near you right now";
    return;
  }

  statusEl.textContent = `${people.length} people near you`;

  people.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = p.id;

    card.innerHTML = `
      <div class="avatar"></div>
      <div class="meta">
        <div class="name">${p.name}, ${p.age}</div>
        <div class="sub">${p.now}</div>
        <div class="dist">${formatDistanceKm(p.km)} away</div>
      </div>
    `;

    // Tap to select who you're waving to
    card.addEventListener("click", () => {
      selectedPersonId = p.id;
      // subtle feedback
      pulseStatus(`Selected: ${p.name}`);
    });

    peopleList.appendChild(card);
  });
}

function pulseStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => {
    statusEl.textContent = `${people.length} people near you`;
  }, 900);
}

renderList();

// =========================
// WAVE + TEXT GATE
// =========================
function openGate() {
  overlay.classList.remove("hidden");
  input.value = "";
  updateCount();
  input.focus();
}

function closeGate(msg) {
  overlay.classList.add("hidden");
  if (msg) {
    statusEl.textContent = msg;
    setTimeout(() => {
      statusEl.textContent = `${people.length} people near you`;
    }, 1400);
  }
}

function updateCount() {
  const len = (input.value || "").length;
  const need = Math.max(MIN_CHARS - len, 0);
  charCount.textContent = need > 0 ? `${len} / ${MIN_CHARS}` : `${len} / ${MAX_CHARS}`;
  sendBtn.disabled = len < MIN_CHARS;
}

waveBtn.addEventListener("click", () => {
  if (!selectedPersonId) {
    pulseStatus("Tap a person first");
    return;
  }
  openGate();
});

input.addEventListener("input", updateCount);

cancelBtn.addEventListener("click", () => closeGate("Maybe later."));

sendBtn.addEventListener("click", () => {
  const msg = input.value.trim();
  if (msg.length < MIN_CHARS) return;

  const person = people.find(x => x.id === selectedPersonId);
  const who = person ? person.name : "them";

  // Placeholder for Firestore send later
  console.log("WAVE SENT TO:", selectedPersonId, "MESSAGE:", msg);

  closeGate(`Message sent to ${who}.`);
});

// Click outside card closes (soft)
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeGate();
});
