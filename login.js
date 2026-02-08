import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

const email = document.getElementById("email");
const password = document.getElementById("password");
const statusEl = document.getElementById("status");

function setStatus(msg){ statusEl.textContent = msg; }

function getRedirect(){
  const p = new URLSearchParams(location.search);
  return p.get("redirect") || "index.html";
}

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = getRedirect();
});

document.getElementById("btnSignup").addEventListener("click", async () => {
  setStatus("Creating account…");
  try {
    await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
    setStatus("Account created ✅");
    window.location.href = getRedirect();
  } catch (e) {
    setStatus(e.message);
  }
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  setStatus("Signing in…");
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    setStatus("Signed in ✅");
    window.location.href = getRedirect();
  } catch (e) {
    setStatus(e.message);
  }
});
