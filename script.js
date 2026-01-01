// --------------------
// Near — Script v8C
// Trial + Review Bonus + Payment Structure (NO REAL PAYMENTS)
// --------------------

const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");

// ---- CONFIG ----
const BASE_TRIAL_DAYS = 7;
const BONUS_DAYS = 7;

const START_KEY = "near_trial_start";
const BONUS_KEY = "near_review_bonus";

// ---- TRIAL LOGIC ----
function getTrialInfo() {
  let start = localStorage.getItem(START_KEY);
  if (!start) {
    start = Date.now();
    localStorage.setItem(START_KEY, start);
  }

  const bonusUsed = localStorage.getItem(BONUS_KEY) === "true";
  const totalDays = BASE_TRIAL_DAYS + (bonusUsed ? BONUS_DAYS : 0);

  const elapsedDays = Math.floor(
    (Date.now() - start) / (1000 * 60 * 60 * 24)
  );

  const remaining = totalDays - elapsedDays;

  return {
    active: remaining > 0,
    remaining,
    bonusUsed
  };
}

let trial = getTrialInfo();

// ---- STATUS BAR ----
function updateStatus() {
  if (trial.active) {
    const label = trial.bonusUsed ? "Bonus trial" : "Free trial";
    statusEl.textContent = `${label}: ${trial.remaining} day${trial.remaining !== 1 ? "s" : ""} left`;
    statusEl.style.background = "#2bb0ff";
    statusEl.style.color = "#000";
  } else {
    statusEl.textContent = "Trial ended — choose a plan to keep chatting";
    statusEl.style.background = "#ff5c5c";
    statusEl.style.color = "#000";
  }
}

updateStatus();

// ---- GEOLOCATION ----
if (!navigator.geolocation) {
  statusEl.textContent = "Location not supported";
} else {
  navigator.geolocation.getCurrentPosition(
    () => renderUsers(),
    () => (statusEl.textContent = "Location permission denied"),
    { enableHighAccuracy: true }
  );
}

// ---- USERS ----
function renderUsers() {
  usersEl.innerHTML = "";

  const fakeUsers = [
    { name: "Someone nearby", distance: "2.64 km" },
    { name: "Someone nearby", distance: "3.13 km" }
  ];

  fakeUsers.forEach((u) => {
    const div = document.createElement("div");
    div.className = "user";

    let buttonHTML = "";

    if (trial.active) {
      buttonHTML = `<button class="chat-btn">Chat</button>`;
    } else if (!trial.bonusUsed) {
      buttonHTML = `<button class="review-btn">Leave review (+7 days)</button>`;
    } else {
      buttonHTML = `<button class="subscribe-btn">Subscribe</button>`;
    }

    div.innerHTML = `
      <strong>${u.name}</strong>
      <div class="distance">${u.distance} away</div>
      ${buttonHTML}
    `;

    usersEl.appendChild(div);
  });

  bindButtons();
}

// ---- BUTTON HANDLERS ----
function bindButtons() {
  document.querySelectorAll(".chat-btn").forEach((btn) => {
    btn.onclick = () => alert("Chat opening… (next step)");
  });

  document.querySelectorAll(".review-btn").forEach((btn) => {
    btn.onclick = () => {
      const ok = confirm(
        "Thanks for supporting Near ❤️\n\nLeave a review and get +7 days free?"
      );
      if (!ok) return;

      localStorage.setItem(BONUS_KEY, "true");
      trial = getTrialInfo();
      updateStatus();
      renderUsers();

      alert("🎉 Bonus access unlocked!");
    };
  });

  document.querySelectorAll(".subscribe-btn").forEach((btn) => {
    btn.onclick = () => showPlans();
  });
}

// ---- PAYMENT STRUCTURE (STUB ONLY) ----
function showPlans() {
  alert(
    "Choose your plan:\n\n" +
    "• $5 / month\n" +
    "• $50 / year (best value)\n\n" +
    "No ads. Cancel anytime.\n\n" +
    "Subscriptions coming very soon."
  );
}
