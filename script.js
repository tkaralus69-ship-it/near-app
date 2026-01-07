/* =========================
   CONFIG
========================= */
const MAX_DISTANCE_KM = 5;
const USER_EXPIRY_MS = 5 * 60 * 1000;   // 5 min presence
const HELLO_EXPIRY_MS = 10 * 60 * 1000; // 10 min hello

/* =========================
   DOM
========================= */
const list = document.getElementById("list");
const count = document.getElementById("count");

/* =========================
   STATE
========================= */
let myUid = null;
let myLat = null;
let myLng = null;

/* =========================
   FIREBASE
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   AUTH + GEO
========================= */
signInAnonymously(auth).then(cred => {
  myUid = cred.user.uid;

  navigator.geolocation.watchPosition(pos => {
    myLat = pos.coords.latitude;
    myLng = pos.coords.longitude;
    updatePresence();
  });

  listenForUsers();
  listenForHellos();
});

/* =========================
   UPDATE PRESENCE
========================= */
function updatePresence() {
  if (!myLat || !myLng) return;

  setDoc(
    doc(db, "users", myUid),
    {
      lat: myLat,
      lng: myLng,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

/* =========================
   DISTANCE
========================= */
function distanceKm(a, b, c, d) {
  const R = 6371;
  const dLat = (c - a) * Math.PI / 180;
  const dLng = (d - b) * Math.PI / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a * Math.PI / 180) *
      Math.cos(c * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* =========================
   LISTEN USERS
========================= */
function listenForUsers() {
  onSnapshot(collection(db, "users"), snap => {
    list.innerHTML = "";
    let visible = 0;
    const now = Date.now();

    snap.forEach(d => {
      if (d.id === myUid) return;

      const u = d.data();

      // expiry
      if (!u.updatedAt || now - u.updatedAt > USER_EXPIRY_MS) {
        deleteDoc(doc(db, "users", d.id));
        return;
      }

      // distance
      const dist = distanceKm(myLat, myLng, u.lat, u.lng);
      if (dist > MAX_DISTANCE_KM) return;

      visible++;

      const card = document.createElement("div");
      card.className = "card";

      const hello = document.createElement("button");
      hello.textContent = "👋 Hello";
      hello.onclick = () => {
        sendHello(d.id);
        hello.textContent = "Sent";
        hello.disabled = true;
      };

      card.innerHTML = `
        <div class="avatar"></div>
        <div class="info">
          <div class="name">Someone</div>
          <div class="dist">${dist.toFixed(1)} km away</div>
        </div>
      `;

      card.appendChild(hello);
      list.appendChild(card);
    });

    count.textContent = visible
      ? `${visible} people near you`
      : "No one near you right now";
  });
}

/* =========================
   HELLO SEND
========================= */
function sendHello(toUid) {
  const id = `${toUid}_${myUid}`;

  setDoc(doc(db, "hellos", id), {
    from: myUid,
    to: toUid,
    createdAt: Date.now()
  });
}

/* =========================
   HELLO LISTENER
========================= */
function listenForHellos() {
  onSnapshot(collection(db, "hellos"), snap => {
    const now = Date.now();

    snap.forEach(d => {
      const h = d.data();
      if (h.to !== myUid) return;

      // expiry
      if (now - h.createdAt > HELLO_EXPIRY_MS) {
        deleteDoc(doc(db, "hellos", d.id));
        return;
      }

      showHelloPrompt(d.id);
    });
  });
}

/* =========================
   HELLO PROMPT
========================= */
function showHelloPrompt(id) {
  if (document.getElementById(id)) return;

  const box = document.createElement("div");
  box.id = id;
  box.className = "helloPrompt";

  box.innerHTML = `
    <div>👋 Someone nearby said hello</div>
    <button class="wave">🌊 Wave back</button>
    <button class="ignore">Ignore</button>
  `;

  box.querySelector(".ignore").onclick = () => {
    deleteDoc(doc(db, "hellos", id));
    box.remove();
  };

  box.querySelector(".wave").onclick = () => {
    deleteDoc(doc(db, "hellos", id));
    box.remove();
    // 🔓 next phase: unlock text gate
  };

  document.body.appendChild(box);
        }
