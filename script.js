// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------------- UI ----------------
const statusDiv = document.getElementById("status");
const usersDiv = document.getElementById("users");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalPrimary = document.getElementById("modalPrimary");

// ---------------- STATE ----------------
let uid;
let appVisible = true;
let lastNearbyCount = null;
let nudgeShownThisSession = false;

// ---------------- VISIBILITY ----------------
document.addEventListener("visibilitychange", () => {
  appVisible = !document.hidden;
});

// ---------------- HELPERS ----------------
function showToast(msg) {
  statusDiv.textContent = msg;
}

function openModal(title, body, btnText, onClick) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalPrimary.textContent = btnText;
  modalPrimary.onclick = onClick;
  modal.classList.add("open");
}

window.closeModal = () => modal.classList.remove("open");

function expired(start, days) {
  return Date.now() - start > days * 86400000;
}

// ---------------- ACCOUNT ----------------
async function ensureAccount(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const data = { createdAt: Date.now(), status: "trial" };
    await setDoc(ref, data);
    return data;
  }

  const data = snap.data();

  if (data.status === "trial" && expired(data.createdAt, 7)) {
    data.status = "free_limited";
    await setDoc(ref, data);
  }

  if (data.status === "bonus_trial" && expired(data.bonusGrantedAt, 7)) {
    data.status = "free_limited";
    await setDoc(ref, data);
  }

  return data;
}

function getCapabilities(status) {
  const full = ["trial", "bonus_trial", "sub_month", "sub_year"];
  return { full: full.includes(status) };
}

// ---------------- TRIAL END ----------------
function showTrialEnd(account) {
  openModal(
    "Your free trial ended",
    "Get another 7 days of full access by supporting Near.",
    "Leave a review (+7 days)",
    async () => {
      account.status = "bonus_trial";
      account.bonusGrantedAt = Date.now();
      await setDoc(doc(db, "users", uid), account);
      showToast("🎉 Bonus access unlocked");
      closeModal();
      render();
    }
  );
}

// ---------------- SUBSCRIPTION ----------------
function showSubscription() {
  openModal(
    "Full access to Near",
    "• $5 / month\n• $50 / year (best value)\nCancel anytime.",
    "Subscribe monthly",
    () => subscribe("month")
  );
}

async function subscribe(plan) {
  await setDoc(
    doc(db, "users", uid),
    { status: plan === "year" ? "sub_year" : "sub_month" },
    { merge: true }
  );
  showToast("🎉 Full access unlocked");
  closeModal();
  render();
}

// ---------------- NEARBY USERS (MOCK) ----------------
function getNearbyUsers() {
  const count = Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => ({
    name: "Someone nearby",
    km: (Math.random() * 5).toFixed(2)
  }));
}

// ---------------- RENDER USERS ----------------
function renderUsers(users, caps) {
  usersDiv.innerHTML = "";

  if (users.length === 0) {
    usersDiv.innerHTML = `<div class="empty">No one nearby yet.</div>`;
    return;
  }

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "user";
    div.innerHTML = `
      <strong>${u.name}</strong>
      <div class="distance">${u.km} km away</div>
      <button class="primary">Chat</button>
    `;
    div.querySelector("button").onclick = () => {
      if (!caps.full) {
        showSubscription();
      } else {
        alert("Chat opened (placeholder)");
      }
    };
    usersDiv.appendChild(div);
  });
}

// ---------------- STEP 7B — GENTLE RE-ENTRY NUDGES ----------------
function maybeShowNudge(type) {
  if (nudgeShownThisSession) return;

  let message = "";

  if (type === "new_people") {
    message = "Someone new is nearby 👀";
  }

  if (type === "activity") {
    message = "More people nearby since your last visit";
  }

  if (!message) return;

  nudgeShownThisSession = true;
  showToast(message);
}

// ---------------- LIVE REFRESH (7A + 7B) ----------------
async function refreshNearby(caps) {
  if (!appVisible) return;

  const users = getNearbyUsers();
  const count = users.length;

  if (lastNearbyCount === null) {
    lastNearbyCount = count;
    return;
  }

  if (count !== lastNearbyCount) {
    if (count > lastNearbyCount) {
      maybeShowNudge("new_people");
    } else {
      statusDiv.textContent =
        count === 0 ? "No one nearby right now" : `${count} people nearby now`;
    }

    lastNearbyCount = count;
    renderUsers(users, caps);
  }
}

// ---------------- LOCATION ----------------
function resolveLocation() {
  let resolved = false;

  setTimeout(() => {
    if (!resolved) showToast("Turn on location to see people near you.");
  }, 8000);

  navigator.geolocation.getCurrentPosition(
    () => {
      resolved = true;
      showToast("Location enabled");
    },
    () => showToast("Location required to continue.")
  );
}

// ---------------- MAIN ----------------
async function render() {
  const account = await ensureAccount(uid);
  const caps = getCapabilities(account.status);

  if (account.status === "free_limited" && !account.seenTrialEnd) {
    account.seenTrialEnd = true;
    await setDoc(doc(db, "users", uid), account);
    showTrialEnd(account);
  }

  const users = getNearbyUsers();
  lastNearbyCount = users.length;
  renderUsers(users, caps);

  refreshNearby(caps);
  setInterval(() => refreshNearby(caps), 180000);
}

signInAnonymously(auth).then(res => {
  uid = res.user.uid;
  resolveLocation();
  render();
});
