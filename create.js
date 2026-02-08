import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const nameInput = document.getElementById("nameInput");
const ageInput  = document.getElementById("ageInput");
const townInput = document.getElementById("townInput");
const photoInput= document.getElementById("photoInput");
const bioInput  = document.getElementById("bioInput");
const statusEl  = document.getElementById("status");
const btnSave   = document.getElementById("btnSave");

let currentUser = null;

function setStatus(msg){ statusEl.textContent = msg; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

// ✅ Always blank on load
function clearForm(){
  nameInput.value = "";
  ageInput.value = "";
  townInput.value = "";
  photoInput.value = "";
  bioInput.value = "";
}
clearForm();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html?redirect=create.html";
    return;
  }
  currentUser = user;
});

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
