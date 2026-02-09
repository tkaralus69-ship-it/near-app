// create.js
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// UI
const nameInput  = document.getElementById("nameInput");
const ageInput   = document.getElementById("ageInput");
const townInput  = document.getElementById("townInput");
const photoInput = document.getElementById("photoInput");
const bioInput   = document.getElementById("bioInput");
const statusEl   = document.getElementById("status");
const btnSave    = document.getElementById("btnSave");

let currentUser = null;

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ✅ Always blank on load
function clearForm() {
  nameInput.value = "";
  ageInput.value = "";
  townInput.value = "";
  photoInput.value = "";
  bioInput.value = "";
}
clearForm();

// Auth gate
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html?next=create.html";
    return;
  }
  currentUser = user;
});

// Save
btnSave.addEventListener("click", async () => {
  if (!currentUser) return;

  const name = (nameInput.value || "").trim();
  const age  = ageInput.value ? clamp(Number(ageInput.value), 18, 99) : null;
  const town = (townInput.value || "").trim();
  const photoURL = (photoInput.value || "").trim();
  const bio  = (bioInput.value || "").trim();

  if (bio.length < 10) {
    setStatus("Bio is too short (10+ characters).");
    return;
  }

  setStatus("Saving…");

  try {
    await addDoc(collection(db, "profiles"), {
      ownerUid: currentUser.uid,
      email: currentUser.email || "",
      name: name || "Anonymous",
      age,
      town,
      photoURL,
      bio,
      vibe: localStorage.getItem("near_vibe") || null,
      updatedAt: serverTimestamp()
    });

    setStatus("Saved ✅");
    clearForm(); // ✅ after save, blank again
  } catch (e) {
    console.error(e);
    setStatus("Save failed (check Firestore rules).");
  }
});
