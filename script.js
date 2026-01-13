// script.js — CLEAN / FINAL / WORKING
// fixes: stuck “Signing in…”, pill never updating, waves + auth reliable

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= UI ================= */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("people");
const vibeButtons = [...document.querySelectorAll(".vibeBtn")];

const waveBtn = document.getElementById("waveBtn");
const waveModal = document.getElementById("waveModal");
const backdrop = waveModal.querySelector(".modalBackdrop");
const waveText = document.getElementById("waveText");
const count = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");
const wavesFeed = document.getElementById("wavesFeed");

/* ================= THEMES ================= */
const THEMES = {
  city: { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  beach:{ bg1:"#2b6b73", bg2:"#08161b", a1:"#fcd34d", a2:"#f59e0b" },
  forest:{ bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  space:{ bg1:"#3a2f5a", bg2:"#05030a", a1:"#c4b5fd", a2:"#a78bfa" },
};

function setTheme(key){
  const t = THEMES[key];
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

vibeButtons.forEach(b=>{
  b.addEventListener("click",()=>{
    vibeButtons.forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    setTheme(b.dataset.theme);
  });
});
setTheme("city");

/* ================= PEOPLE (demo) ================= */
const DEMO = [
  ["Sam",54,"Out for a walk","within 1 km away"],
  ["Jade",31,"Coffee nearby","~1.2 km away"],
  ["Michael",42,"Taking it slow","~3.4 km away"],
  ["Elena",27,"Beach breeze","within 1 km away"],
  ["David",61,"Just chillin","~4.9 km away"],
];

peopleList.innerHTML = DEMO.map(p=>`
<li>
  <div class="avatar"></div>
  <div>
    <div class="pName">${p[0]}, ${p[1]}</div>
    <div class="pSub">${p[2]}</div>
    <div class="pDist">${p[3]}</div>
  </div>
</li>`).join("");

/* ================= MODAL ================= */
waveBtn.onclick = ()=>openModal();
laterBtn.onclick = closeModal;
backdrop.onclick = closeModal;

function openModal(){
  waveModal.classList.remove("hidden");
  waveText.focus();
}
function closeModal(){
  waveModal.classList.add("hidden");
  waveText.value="";
  count.textContent="0";
  sendBtn.disabled=false;
  sendBtn.textContent="Send";
}

waveText.oninput = ()=>count.textContent = waveText.value.length;

/* ================= GEO ================= */
let geo=null;
navigator.geolocation?.watchPosition(
  p=>{
    geo={lat:p.coords.latitude,lng:p.coords.longitude};
    pillStatus.textContent="Up to date";
  },
  ()=>pillStatus.textContent="Location off",
  { enableHighAccuracy:true }
);

/* ================= AUTH ================= */
statusLine.textContent="Signing in…";
pillStatus.textContent="Starting…";

signInAnonymously(auth).catch(e=>{
  alert("Auth failed");
  console.error(e);
});

onAuthStateChanged(auth, async user=>{
  if(!user) return;

  statusLine.textContent="Live";
  pillStatus.textContent="Live";

  await setDoc(
    doc(db,"users",user.uid),
    {
      lastSeen: serverTimestamp(),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
    },
    { merge:true }
  );

  startWaves();
});

/* ================= WAVES ================= */
function startWaves(){
  const q = query(
    collection(db,"waves"),
    orderBy("createdAt","desc"),
    limit(20)
  );

  onSnapshot(q,snap=>{
    wavesFeed.innerHTML="";
    snap.forEach(d=>{
      const w=d.data();
      const li=document.createElement("li");
      li.innerHTML=`
        <div class="avatar"></div>
        <div>
          <div class="pName">${label(w.theme)}</div>
          <div class="pSub">${escape(w.message)}</div>
        </div>`;
      wavesFeed.appendChild(li);
    });
  });
}

sendBtn.onclick = async ()=>{
  const text=waveText.value.trim();
  if(!text) return;

  sendBtn.disabled=true;
  sendBtn.textContent="Sending…";

  await addDoc(collection(db,"waves"),{
    uid: auth.currentUser.uid,
    message: text,
    theme: document.querySelector(".vibeBtn.active").dataset.theme,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    createdAt: serverTimestamp(),
  });

  closeModal();
};

/* ================= HELPERS ================= */
function label(t){
  return t==="city"?"City (Night)":
         t==="beach"?"Beach":
         t==="forest"?"Forest":
         t==="space"?"Space":"Near";
}
function escape(s){
  return String(s).replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[m]));
}
