// script.js (ES module)
window.onerror = function (msg, src, line, col, err) {
  alert(
    "JS ERROR:\n" +
    msg +
    "\nline: " + line +
    "\ncol: " + col +
    "\n" + (err?.message || "")
  );
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (PASTE YOURS)
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXX",
  authDomain: "near-app.firebaseapp.com",
  projectId: "near-app",
  storageBucket: "near-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("people");
const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));

const waveBtn = document.getElementById("waveBtn");
const modal = document.getElementById("modal");
const waveText = document.getElementById("waveText");
const count = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* State */
let lastGeo = null;
let ready = false;

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

/* People list (demo) */
function kmMin1(km){
  if (!Number.isFinite(km)) return "within 1 km away";
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}
const DEMO_PEOPLE = [
  { name:"Sam", age:54, bio:"Out for a walk", km:0.3 },
  { name:"Jade", age:31, bio:"Coffee nearby", km:1.2 },
  { name:"Michael", age:42, bio:"Taking it slow", km:3.4 },
  { name:"Elena", age:27, bio:"Beach breeze", km:0.7 },
  { name:"David", age:61, bio:"Just chillin", km:4.9 },
];

function renderPeople(arr){
  if (!peopleList) return;
  peopleList.innerHTML = "";
  arr.slice(0,5).forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div class="pName">${p.name}, ${p.age}</div>
        <div class="pSub">${p.bio}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
    `;
    peopleList.appendChild(li);
  });
}
renderPeople(DEMO_PEOPLE);

/* Geolocation (optional) */
function startGeo(){
  if (!("geolocation" in navigator)) {
    if (pillStatus) pillStatus.textContent = "Location unavailable";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (pillStatus) pillStatus.textContent = "Up to date";
      // update user doc quietly if signed in
      const u = auth.currentUser;
      if (u) {
        setDoc(doc(db,"users",u.uid), {
          lastSeen: serverTimestamp(),
          lat: lastGeo.lat,
          lng: lastGeo.lng
        }, { merge:true }).catch(()=>{});
      }
    },
    ()=>{
      if (pillStatus) pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* Modal */
function openModal(){
  if (!ready) return; // don't open until auth ready
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  if (waveText) waveText.focus({ preventScroll:true });
}
function closeModal(){
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  if (waveText) waveText.value = "";
  if (count) count.textContent = "0";
  if (sendBtn) {
    sendBtn.disabled = !ready;
    sendBtn.textContent = "Send";
  }
}

if (waveText && count) {
  waveText.addEventListener("input", ()=>{
    count.textContent = String(waveText.value.length);
  });
}

if (waveBtn) waveBtn.addEventListener("click", openModal);
if (laterBtn) laterBtn.addEventListener("click", closeModal);

if (modal) {
  modal.addEventListener("click", (e)=>{
    if (e.target === modal) closeModal();
  });
}

/* Auth bootstrap */
function setStatus(text){
  if (statusLine) statusLine.textContent = text;
}

async function ensureUserDoc(uid){
  const payload = {
    lastSeen: serverTimestamp(),
    name: "User"
  };
  if (lastGeo) {
    payload.lat = lastGeo.lat;
    payload.lng = lastGeo.lng;
  }
  await setDoc(doc(db,"users",uid), payload, { merge:true });
}

async function startAuth(){
  setStatus("Signing in...");
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.error(e);
    setStatus("Sign-in failed");
    alert("Sign-in failed — check console");
  }
}

onAuthStateChanged(auth, async (user)=>{
  if (!user) return;

  try {
    await ensureUserDoc(user.uid);
    ready = true;
    setStatus("Ready");
    if (sendBtn) sendBtn.disabled = false;
  } catch (e) {
    console.error(e);
    setStatus("Firestore error");
    alert("Firestore error — check console");
  }
});

/* Send wave */
if (sendBtn) {
  sendBtn.disabled = true; // IMPORTANT: enabled only when auth is ready

  sendBtn.addEventListener("click", async ()=>{
    const text = (waveText?.value || "").trim();
    if (!text) return;

    if (!ready || !auth.currentUser) {
      alert("Still signing in… try again in a second");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";

    try{
      const u = auth.currentUser;
      const activeTheme =
        vibeButtons.find(b=>b.classList.contains("active"))?.dataset.theme || "city";

      await addDoc(collection(db, "waves"), {
        uid: u.uid,
        message: text,
        createdAt: serverTimestamp(),
        lat: lastGeo?.lat ?? null,
        lng: lastGeo?.lng ?? null,
        theme: activeTheme
      });

      closeModal();
    }catch(err){
      console.error(err);
      alert("Send failed — check console");
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  });
}

/* Start */
startGeo();
startAuth();
