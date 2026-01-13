// script.js (ES module) — Near (clean + working)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (yours)
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
const pillStatus = document.getElementById("pillStatus");
const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const waveBtn = document.getElementById("waveBtn");
const modal = document.getElementById("modal");
const waveText = document.getElementById("waveText");
const count = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* Theme packs (4 only) */
const THEMES = {
  city:  { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  beach: { bg1:"#2b6b73", bg2:"#08161b", a1:"#fcd34d", a2:"#f59e0b" },
  forest:{ bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  space: { bg1:"#3a2f5a", bg2:"#05030a", a1:"#c4b5fd", a2:"#a78bfa" }
};

function setTheme(key){
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

vibeButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    vibeButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    setTheme(btn.dataset.theme);
  }, { passive:true });
});
setTheme("city");

/* Geolocation (optional) */
let lastGeo = null;
function startGeo(){
  if (!("geolocation" in navigator)) return;
  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (pillStatus) pillStatus.textContent = "Up to date";
    },
    ()=>{
      if (pillStatus) pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* Modal */
function openModal(){
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  waveText.focus({ preventScroll:true });
}
function closeModal(){
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  waveText.value = "";
  count.textContent = "0";
}

waveText.addEventListener("input", ()=>{
  count.textContent = String(waveText.value.length);
});

waveBtn.addEventListener("click", openModal, { passive:true });
laterBtn.addEventListener("click", closeModal, { passive:true });
modal.addEventListener("click", (e)=>{
  if (e.target === modal) closeModal();
});

/* Auth + user doc */
async function ensureUserDoc(uid){
  const ref = doc(db, "users", uid);
  const payload = {
    lastSeen: serverTimestamp(),
    name: "User"
  };
  if (lastGeo) { payload.lat = lastGeo.lat; payload.lng = lastGeo.lng; }
  await setDoc(ref, payload, { merge:true });
}

let signedInUser = null;

async function boot(){
  try{
    if (pillStatus) pillStatus.textContent = "Signing in...";
    startGeo();

    const cred = await signInAnonymously(auth);
    signedInUser = cred.user;

    await ensureUserDoc(signedInUser.uid);

    if (pillStatus) pillStatus.textContent = "Up to date";
  }catch(err){
    console.error("Auth failed:", err);
    alert("Auth failed: " + (err?.message || err));
    if (pillStatus) pillStatus.textContent = "Sign-in failed";
  }
}
boot();

/* Send wave */
sendBtn.addEventListener("click", async ()=>{
  const text = waveText.value.trim();
  if (!text) return;

  if (!signedInUser || !auth.currentUser){
    alert("Not signed in");
    return;
  }

  sendBtn.disabled = true;
  const oldLabel = sendBtn.textContent;
  sendBtn.textContent = "Sending…";

  try{
    await addDoc(collection(db, "waves"), {
      uid: auth.currentUser.uid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme: vibeButtons.find(b=>b.classList.contains("active"))?.dataset.theme || "city"
    });
    closeModal();
  }catch(err){
    console.error("Send failed:", err);
    alert("Send failed — check console");
  }finally{
    sendBtn.disabled = false;
    sendBtn.textContent = oldLabel;
  }
});
