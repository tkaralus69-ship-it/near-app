// --------------------
// Near — Script v8A
// 7-day free trial logic
// --------------------

const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");

// ---- CONFIG ----
const TRIAL_DAYS = 7;
const TRIAL_KEY = "near_trial_start";

// ---- TRIAL LOGIC ----
function getTrialInfo() {
  let start = localStorage.getItem(TRIAL_KEY);

  if (!start) {
    start = Date.now();
    localStorage.setItem(TRIAL_KEY, start);
  }

  const now = Date.now();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const remaining = TRIAL_DAYS - elapsedDays;

  return {
    active: remaining > 0,
    remaining: Math.max(0, remaining)
  };
}

const trial = getTrialInfo();

// ---- STATUS BAR ----
if (trial.active) {
  statusEl.textContent = `Free trial: ${trial.remaining} day${trial.remaining !== 1 ? "s" : ""} left`;
  statusEl.style.background = "#2bb0ff";
  statusEl.style.color = "#000";
} else {
  statusEl.textContent = "Trial ended — subscribe to keep chatting";
  statusEl.style.background = "#ff5c5c";
  statusEl.style.color = "#000";
}

// ---- GEOLOCATION ----
if (!navigator.geolocation) {
  statusEl.textContent = "Location not supported";
} else {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      renderUsers(latitude, longitude);
    },
    () => {
      statusEl.textContent = "Location permission denied";
    },
    { enableHighAccuracy: true }
  );
}

// ---- MOCK NEARBY USERS (safe + predictable for now) ----
function renderUsers(lat, lng) {
  usersEl.innerHTML = "";

  const fakeUsers = [
    { name: "Someone nearby", distance: "2.64 km" },
    { name: "Someone nearby", distance: "3.13 km" }
  ];

  fakeUsers.forEach((u) => {
    const div = document.createElement("div");
    div.className = "user";

    div.innerHTML = `
      <strong>${u.name}</strong>
      <div class="distance">${u.distance} away</div>
      ${
        trial.active
          ? `<button class="chat-btn">Chat</button>`
          : `<button class="chat-btn" disabled style="opacity:.5">Subscribe</button>`
      }
    `;

    usersEl.appendChild(div);
  });

  // ---- CHAT BUTTON HANDLING ----
  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!trial.active) {
        alert("Your free trial has ended.\nSubscribe to continue chatting.");
        return;
      }
      alert("Chat opening… (next step)");
    });
  });
}
