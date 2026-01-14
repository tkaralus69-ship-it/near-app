// script.js — FULL FINAL (VISUAL / CLEAN / LOCKED)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= UI ================= */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const vibeButtons = [...document.querySelectorAll(".vibeBtn")];
const waveBtn = document.getElementById("waveBtn");

const modal = document.getElementById("waveModal");
const backdrop = modal.querySelector(".modalBackdrop");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ================= BACKGROUND LAYER ================= */
const bg = document.createElement("div");
bg.className = "bgVibe";
document.body.prepend(bg);

const shade = document.createElement("div");
shade.className = "bgShade";
document.body.prepend(shade);

/* ================= VIBES (LOCKED) ================= */
const VIBES = {
  city: {
    img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b",
    people: [
      ["Sam",54,"Evening walk","https://randomuser.me/api/portraits/men/75.jpg"],
      ["Jade",31,"Coffee nearby","https://randomuser.me/api/portraits/women/65.jpg"],
      ["Michael",42,"City lights","https://randomuser.me/api/portraits/men/41.jpg"],
      ["Elena",27,"Late snack","https://randomuser.me/api/portraits/women/48.jpg"],
      ["David",61,"Just chillin","https://randomuser.me/api/portraits/men/68.jpg"]
    ]
  },

  nature: {
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    people: [
      ["Mia",29,"Forest air","https://randomuser.me/api/portraits/women/32.jpg"],
      ["Noah",36,"Quiet walks","https://randomuser.me/api/portraits/men/52.jpg"],
      ["Rose",57,"Green therapy","https://randomuser.me/api/portraits/women/71.jpg"],
      ["Kai",33,"Hiking days","https://randomuser.me/api/portraits/men/34.jpg"],
      ["Lena",48,"Slow mornings","https://randomuser.me/api/portraits/women/55.jpg"]
    ]
  },

  beach: {
    img: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
    people: [
      ["Aiden",28,"Ocean breeze","https://randomuser.me/api/portraits/men/21.jpg"],
      ["Sophie",35,"Sunset walks","https://randomuser.me/api/portraits/women/19.jpg"],
      ["Tom",44,"Salt air","https://randomuser.me/api/portraits/men/60.jpg"],
      ["Nina",26,"Barefoot days","https://randomuser.me/api/portraits/women/12.jpg"],
      ["Paul",58,"Beach coffee","https://randomuser.me/api/portraits/men/80.jpg"]
    ]
  },

  fitness: {
    img: "https://images.unsplash.com/photo-1546483875-ad9014c88eba",
    people: [
      ["Chris",34,"Morning run","https://randomuser.me/api/portraits/men/17.jpg"],
      ["Asha",30,"Runner vibes","https://randomuser.me/api/portraits/women/44.jpg"],
      ["Mark",58,"Daily walks","https://randomuser.me/api/portraits/men/72.jpg"],
      ["Renee",39,"Yoga flow","https://randomuser.me/api/portraits/women/56.jpg"],
      ["Leo",41,"Gym + coffee","https://randomuser.me/api/portraits/men/49.jpg"]
    ]
  },

  tech: {
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    people: [
      ["Ava",26,"Laptop open","https://randomuser.me/api/portraits/women/22.jpg"],
      ["Nina",32,"Gaming chill","https://randomuser.me/api/portraits/women/29.jpg"],
      ["Ben",55,"Tech talk","https://randomuser.me/api/portraits/men/66.jpg"],
      ["Sophie",29,"Design + code","https://randomuser.me/api/portraits/women/36.jpg"],
      ["Omar",41,"Building stuff","https://randomuser.me/api/portraits/men/37.jpg"]
    ]
  }
};

/* ================= HELPERS ================= */
const km = () => "within 1 km away";

function setBackground(vibe){
  bg.style.backgroundImage = `url("${VIBES[vibe].img}&auto=format&fit=crop&w=2000&q=70")`;
}

function renderPeople(vibe){
  peopleList.innerHTML = "";
  VIBES[vibe].people.forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar"><img src="${p[3]}" alt=""></div>
      <div>
        <div class="pName">${p[0]}, ${p[1]}</div>
        <div class="pSub">${p[2]}</div>
        <div class="pDist">${km()}</div>
      </div>`;
    peopleList.appendChild(li);
  });
}

/* ================= WAVES ================= */
function openModal(){
  modal.classList.remove("hidden");
  waveText.focus();
}
function closeModal(){
  modal.classList.add("hidden");
  waveText.value="";
  countEl.textContent="0";
  sendBtn.disabled=false;
  sendBtn.textContent="Send";
}

waveText.addEventListener("input",()=>countEl.textContent=waveText.value.length);
waveBtn.onclick=openModal;
laterBtn.onclick=closeModal;
backdrop.onclick=closeModal;

sendBtn.onclick=async ()=>{
  if(!waveText.value.trim())return;
  sendBtn.disabled=true;
  sendBtn.textContent="Sending…";
  await addDoc(collection(db,"waves"),{
    message: waveText.value.trim(),
    createdAt: serverTimestamp()
  });
  closeModal();
};

function listenWaves(){
  const q=query(collection(db,"waves"),orderBy("createdAt","desc"),limit(10));
  onSnapshot(q,s=>{
    wavesFeed.innerHTML="";
    s.forEach(d=>{
      const li=document.createElement("li");
      li.innerHTML=`<div class="avatar"></div><div><div class="pSub">${d.data().message}</div></div>`;
      wavesFeed.appendChild(li);
    });
  });
}

/* ================= VIBE SWITCH ================= */
function wireVibes(){
  vibeButtons.forEach(b=>{
    b.onclick=()=>{
      vibeButtons.forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      const v=b.dataset.theme;
      setBackground(v);
      renderPeople(v);
    };
  });

  const start=vibeButtons.find(b=>b.classList.contains("active"))?.dataset.theme || "city";
  setBackground(start);
  renderPeople(start);
}

/* ================= INIT ================= */
statusLine.textContent="Signing in…";
pillStatus.textContent="Live";

signInAnonymously(auth).then(()=>{
  statusLine.textContent="Live";
  listenWaves();
});

wireVibes();
