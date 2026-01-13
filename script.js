// script.js — CLEAN, WORKING, MOBILE-SAFE

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (REAL)
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXX",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.appspot.com",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===========================
   UI REFERENCES
   =========================== */
const statusLine = document.getElementById("statusLine");
const waveBtn = document.getElementById("waveBtn");
const modal = document.getElementById("modal");
const waveText = document.getElementById("waveText");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ===========================
   AUTH — ANONYMOUS (REQUIRED)
   =========================== */
statusLine.textContent = "Signing in…";

signInAnonymously(auth).catch(err => {
  alert("Auth failed: " + err.message);
  console.error(err);
});

onAuthStateChanged(auth, async user => {
  if (!user) return;

  statusLine.textContent = "Up to date";

  // Ensure user document exists
  await setDoc(
    doc(db, "users", user.uid),
    {
      lastSeen: serverTimestamp()
    },
    { merge: true }
  );
});

/* ===========================
   MODAL CONTROLS
   =========================== */
waveBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  waveText.focus();
});

laterBtn.addEventListener("click", closeModal);
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.add("hidden");
  waveText.value = "";
  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}

/* ===========================
   SEND WAVE (🔥 THIS WAS FAILING)
   =========================== */
sendBtn.addEventListener("click", async () => {
  const text = waveText.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Not signed in");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try {
    await addDoc(collection(db, "waves"), {
      uid: user.uid,
      message: text,
      createdAt: serverTimestamp()
    });

    closeModal();
  } catch (err) {
    alert("Send failed: " + err.message);
    console.error(err);
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});
