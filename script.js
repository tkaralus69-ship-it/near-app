// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

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

function daysExpired(start, days) {
  return Date.now() - start > days * 86400000;
}

// ---------------- ACCOUNT ----------------
async function ensureAccount(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const data = {
      createdAt: Date.now(),
      status: "trial"
    };
    await setDoc(ref, data);
    return data;
  }

  const data = snap.data();

  if (data.status === "trial" && daysExpired(data.createdAt, 7)) {
    data.status = "free_limited";
    await setDoc(ref, data);
  }

  if (data.status === "bonus_trial" && daysExpired(data.bonusGrantedAt, 7)) {
    data.status = "free_limited";
    await setDoc(ref, data);
  }

  return data;
}

function getCapabilities(status) {
  const full = ["trial", "bonus_trial", "sub_month", "sub_year"];
  return {
    full: full.includes(status)
  };
}

// ---------------- TRIAL END FLOW ----------------
function showTrialEnd(account) {
  openModal(
    "Your free trial ended",
    "Get another 7 days of full access by supporting Near.",
    "Leave a review (+7 days)",
    async () => {
      account.status = "bonus_trial";
      account.bonusGrantedAt = Date.now();
      await setDoc(doc(db, "users", uid), account);
      showToast("🎉 7 bonus days unlocked");
      closeModal();
      render();
    }
  );
}

// ---------------- USERS ----------------
function renderUsers(capabilities) {
  usersDiv.innerHTML = "";

  const fakeUsers = [
    { name: "Someone nearby", km: 0.01 },
    { name: "Someone nearby", km: 1.2 }
  ];

  if (fakeUsers.length === 0) {
    usersDiv.innerHTML = `<div class="empty">No one nearby yet.</div>`;
    return;
  }

  fakeUsers.forEach(u => {
    const div = document.createElement("div");
    div.className = "user";
    div.innerHTML = `
      <strong>${u.name}</strong>
      <div class="distance">${u.km} km away</div>
      <button class="primary">Chat</button>
    `;
    div.querySelector("button").onclick = () => {
      if (!capabilities.full) {
        openModal(
          "Full access",
          "Unlimited chat is part of full access.",
          "See options",
          showSubscription
        );
      } else {
        alert("Chat opened (placeholder)");
      }
    };
    usersDiv.appendChild(div);
  });
}

// ---------------- SUBSCRIPTION ----------------
function showSubscription() {
  openModal(
    "Full access to Near",
    "• $5 / month\n• $50 / year (best value)\n\nCancel anytime.",
    "Subscribe monthly",
    () => subscribe("month")
  );
}

async function subscribe(plan) {
  const status = plan === "year" ? "sub_year" : "sub_month";
  await setDoc(doc(db, "users", uid), { status }, { merge: true });
  showToast("🎉 Full access unlocked");
  closeModal();
  render();
}

// ---------------- LOCATION ----------------
function resolveLocation() {
  let resolved = false;

  setTimeout(() => {
    if (!resolved) {
      showToast("Turn on location to see people near you.");
    }
  }, 8000);

  navigator.geolocation.getCurrentPosition(
    () => {
      resolved = true;
      showToast("Location enabled");
    },
    () => {
      showToast("Location required to continue.");
    }
  );
}

// ---------------- MAIN ----------------
let uid;

async function render() {
  const account = await ensureAccount(uid);
  const caps = getCapabilities(account.status);

  if (account.status === "free_limited" && !account.seenTrialEnd) {
    account.seenTrialEnd = true;
    await setDoc(doc(db, "users", uid), account);
    showTrialEnd(account);
  }

  renderUsers(caps);
}

signInAnonymously(auth).then(async res => {
  uid = res.user.uid;
  resolveLocation();
  render();
});
