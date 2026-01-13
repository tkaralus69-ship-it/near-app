// Near — offline/self-contained prototype (no external services)

const app = document.getElementById("app");
const cardsEl = document.getElementById("cards");
const countText = document.getElementById("countText");
const statusText = document.getElementById("statusText");

const overlay = document.getElementById("modalOverlay");
const waveBtn = document.getElementById("waveBtn");
const modalClose = document.getElementById("modalClose");
const laterBtn = document.getElementById("laterBtn");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");

// Privacy: distances shown with minimum of 1km
const MIN_KM = 1.0;

// Fake people data (replace later with real backend)
const PEOPLE = [
  { name: "Sam", age: 54, blurb: "Out for a walk", km: 0.4 },
  { name: "Jade", age: 31, blurb: "Coffee nearby", km: 1.2 },
  { name: "Michael", age: 42, blurb: "Taking it slow", km: 3.4 },
  { name: "Elena", age: 27, blurb: "Beach breeze", km: 0.8 },
  { name: "David", age: 61, blurb: "Just chillin", km: 4.9 },
];

function fmtDistance(km){
  // Enforce privacy minimum
  const safe = Math.max(MIN_KM, km);

  // Make it feel human: "within 1 km away" when at minimum, otherwise "~x.x km away"
  if (safe <= MIN_KM + 0.0001) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

function renderPeople(){
  cardsEl.innerHTML = "";
  PEOPLE.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div class="cardMain">
        <div class="nameRow">
          <div class="name">${p.name}, ${p.age}</div>
        </div>
        <div class="blurb">${p.blurb}</div>
        <div class="dist">${fmtDistance(p.km)}</div>
      </div>
    `;
    cardsEl.appendChild(card);
  });

  countText.textContent = `${PEOPLE.length} people near you`;
  statusText.textContent = "Finding people near you…";
  // After a short moment, switch to “ready”
  setTimeout(() => {
    statusText.textContent = "Up to date";
  }, 700);
}

function setTheme(theme){
  app.setAttribute("data-theme", theme);

  // pills active state
  document.querySelectorAll(".pill").forEach(btn => {
    const isActive = btn.dataset.theme === theme;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function openModal(){
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  messageInput.value = "";
  charCount.textContent = "0 / 250";
  sendBtn.disabled = true;
  setTimeout(() => messageInput.focus(), 50);
}

function closeModal(){
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function updateCounter(){
  const n = messageInput.value.length;
  charCount.textContent = `${n} / 250`;
  // “Minimum protects intention.” — set your minimum here
  const MIN_CHARS = 25; // tweak later (mockup showed "minimum", but keep it realistic)
  sendBtn.disabled = n < MIN_CHARS;
}

// Theme buttons
document.querySelectorAll(".pill").forEach(btn => {
  btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

// Wave -> modal
waveBtn.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
laterBtn.addEventListener("click", closeModal);

// Close on tapping outside modal
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

messageInput.addEventListener("input", updateCounter);

// Send (demo)
sendBtn.addEventListener("click", () => {
  const msg = messageInput.value.trim();
  if (!msg) return;

  // Demo: simple “sent” toast
  closeModal();
  waveBtn.textContent = "Sent ✅";
  waveBtn.disabled = true;
  setTimeout(() => {
    waveBtn.disabled = false;
    waveBtn.textContent = "Wave 👋";
  }, 1400);
});

// Init
setTheme("city");
renderPeople();

// Optional: if geolocation available, we can show “Location on” without sending anywhere
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    () => { /* ok */ },
    () => { /* ignore */ },
    { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
  );
    }
