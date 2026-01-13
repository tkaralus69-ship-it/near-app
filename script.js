import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* 1) FIREBASE CONFIG (yours already inserted) */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXX",
  authDomain: "near-app.firebaseapp.com",
  projectId: "near-app",
  storageBucket: "near-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI refs */
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("peopleList");
const waveBtn = document.getElementById("waveBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const waveModal = document.getElementById("waveModal");
const waveText = document.getElementById("waveText");
const countNow = document.getElementById("countNow");
const sendWaveBtn = document.getElementById("sendWaveBtn");
const laterBtn = document.getElementById("laterBtn");

const vibeButtons = Array.from(document.querySelectorAll(".vibe-btn"));
const dots = Array.from(document.querySelectorAll(".dot"));

/* Theme map */
const THEME_CLASS = {
  city: "theme-city",
  beach: "theme-beach",
  forest: "theme-forest",
  space: "theme-space"
};

function setTheme(themeKey) {
  const root = document.documentElement;
  root.classList.remove(...Object.values(THEME_CLASS));
  root.classList.add(THEME_CLASS[themeKey] || THEME_CLASS.city);

  vibeButtons.forEach((b) => {
    const active = b.dataset.theme === themeKey;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });

  const idx = vibeButtons.findIndex((b) => b.dataset.theme === themeKey);
  dots.forEach((d, i) => d.classList.toggle("active", i === idx));
}

/* People list (clean demo) */
const DEMO_PEOPLE = [
  { name: "Sam", age: 54, note: "Out for a walk", dist: "within 1 km away" },
  { name: "Jade", age: 31, note: "Coffee nearby", dist: "~1.2 km away" },
  { name: "Michael", age: 42, note: "Taking it slow", dist: "~3.4 km away" },
  { name: "Elena", age: 27, note: "Beach breeze", dist: "within 1 km away" }
];

function renderPeople() {
  peopleList.innerHTML = "";
  DEMO_PEOPLE.forEach((p) => {
    const row = document.createElement("div");
    row.className = "person";
    row.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <p class="name">${p.name}, ${p.age}</p>
        <p class="note">${p.note}</p>
        <p class="dist">${p.dist}</p>
      </div>
    `;
    peopleList.appendChild(row);
  });
}

/* Modal helpers */
function openModal() {
  modalBackdrop.classList.remove("hidden");
  waveModal.classList.remove("hidden");
  modalBackdrop.setAttribute("aria-hidden", "false");
  waveText.focus();
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  waveModal.classList.add("hidden");
  modalBackdrop.setAttribute("aria-hidden", "true");
  waveText.value = "";
  countNow.textContent = "0";
}

/* Events */
vibeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

waveBtn.addEventListener("click", openModal);
laterBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

waveText.addEventListener("input", () => {
  countNow.textContent = String(waveText.value.length);
});

/* Auth + Firestore */
pillStatus.textContent = "Signing in…";

signInAnonymously(auth).catch(() => {
  pillStatus.textContent = "Sign-in failed";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  pillStatus.textContent = "Up to date";

  // Create/update own user doc (safe with your rules)
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (_) {}

  // Enable send
  sendWaveBtn.disabled = false;
});

/* Send Wave */
sendWaveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const msg = waveText.value.trim();
  if (!msg) return;

  try {
    await addDoc(collection(db, "waves"), {
      uid: user.uid,
      message: msg,
      createdAt: serverTimestamp()
    });
    closeModal();
  } catch (_) {}
});

/* Boot */
setTheme("city");
renderPeople();
