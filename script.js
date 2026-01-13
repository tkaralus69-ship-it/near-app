// Near — MVP live screen
// Firebase Auth (anonymous) + Firestore users + location + nearby list
// Distances shown with minimum 1 km for privacy.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* ---------------------------
   1) PUT YOUR FIREBASE CONFIG HERE
   --------------------------- */
const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};
/* --------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI refs */
const root = document.getElementById("app");
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("peopleList");

const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const dots = Array.from(document.querySelectorAll(".dot"));

const btnWave = document.getElementById("btnWave");

const modalOverlay = document.getElementById("modalOverlay");
const btnModalClose = document.getElementById("btnModalClose");
const btnMaybeLater = document.getElementById("btnMaybeLater");
const btnSend = document.getElementById("btnSend");
const realMessage = document.getElementById("realMessage");
const countNow = document.getElementById("countNow");
const countMin = document.getElementById("countMin");

const MIN_CHARS = 250;
countMin.textContent = String(MIN_CHARS);

/* State */
let uid = null;
let watchId = null;
let lastPos = null;
let unsubNearby = null;

let activeTheme = "forest";
setTheme(activeTheme);

const DEMO_PEOPLE = [
  { name: "Sam", age: 54, bio: "Out for a walk" },
  { name: "Jade", age: 31, bio: "Coffee nearby" },
  { name: "Michael", age: 42, bio: "Taking it slow" },
  { name: "Elena", age: 27, bio: "Beach breeze" },
  { name: "David", age: 61, bio: "Just chillin" }
];

/* ---------------------------
   Theme packs
   --------------------------- */
vibeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    setTheme(theme);

    vibeButtons.forEach(b => {
      const isActive = b.dataset.theme === theme;
      b.classList.toggle("isActive", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    dots.forEach(d => {
      d.classList.toggle("isActive", d.dataset.theme === theme);
    });

    // Store preference for this user (optional)
    if (uid) {
      const userRef = doc(db, "users", uid);
      updateDoc(userRef, { theme, updatedAt: serverTimestamp() }).catch(() => {});
    }
  });
});

function setTheme(theme) {
  activeTheme = theme;
  root.dataset.theme = theme;
}

/* ---------------------------
   Modal: One real message
   --------------------------- */
btnWave.addEventListener("click", () => openModal());
btnModalClose.addEventListener("click", () => closeModal());
btnMaybeLater.addEventListener("click", () => closeModal());

realMessage.addEventListener("input", () => {
  const n = realMessage.value.length;
  countNow.textContent = String(n);
  btnSend.disabled = n < MIN_CHARS;
});

btnSend.addEventListener("click", async () => {
  if (!uid) return;
  const text = realMessage.value.trim();
  if (text.length < MIN_CHARS) return;

  btnSend.disabled = true;
  btnSend.textContent = "Sending…";

  try {
    // Writes a "real_messages" doc (you can later link this to a chosen person)
    await addDoc(collection(db, "real_messages"), {
      fromUid: uid,
      text,
      createdAt: serverTimestamp(),
      theme: activeTheme
    });
    realMessage.value = "";
    countNow.textContent = "0";
    closeModal();
  } catch (e) {
    alert("Couldn’t send right now. Check connection & rules.");
  } finally {
    btnSend.textContent = "Send";
    btnSend.disabled = true;
  }
});

function openModal() {
  modalOverlay.hidden = false;
  setTimeout(() => realMessage.focus(), 50);
}

function closeModal() {
  modalOverlay.hidden = true;
}

/* ---------------------------
   2) Auth + boot
   --------------------------- */
setStatus("Signing in…");

signInAnonymously(auth).catch((e) => {
  console.error(e);
  setStatus("Couldn’t sign in. Check Firebase config.");
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  uid = user.uid;
  setStatus("Up to date");
  setMainStatus("Finding people near you…");

  // Create / update user doc
  const userRef = doc(db, "users", uid);

  // Basic profile placeholders (later: onboarding)
  const defaultProfile = {
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    theme: activeTheme,
    // Profile (edit later)
    displayName: "You",
    age: null,
    bio: "Here now",
    // Location fields will be set by GPS
    lat: null,
    lng: null,
    // Geohash for simple range querying (string prefix)
    gh: null,
    // simple status
    online: true
  };

  try {
    await setDoc(userRef, defaultProfile, { merge: true });
  } catch (e) {
    console.error(e);
    setMainStatus("Signed in. Check Firestore rules.");
  }

  startLocationWatch();
});

/* ---------------------------
   3) Location + nearby
   --------------------------- */

function startLocationWatch() {
  if (!("geolocation" in navigator)) {
    setMainStatus("Location not available on this device.");
    renderDemo();
    return;
  }

  setMainStatus("Requesting location…");

  // iOS Safari sometimes needs highAccuracy false; Android generally fine.
  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      lastPos = pos;
      const { latitude, longitude } = pos.coords;

      setMainStatus("Finding people near you…");

      await upsertLocation(latitude, longitude);

      // Subscribe to nearby users using a simple geohash-prefix query
      subscribeNearby(latitude, longitude);
    },
    (err) => {
      console.warn(err);
      setMainStatus("Location blocked. Showing demo.");
      renderDemo();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 12_000
    }
  );
}

async function upsertLocation(lat, lng) {
  if (!uid) return;

  // Simple geohash (base32) to support prefix queries in Firestore
  const gh = encodeGeohash(lat, lng, 6); // ~1.2km-ish cell size

  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      lat,
      lng,
      gh,
      updatedAt: serverTimestamp(),
      online: true
    });
  } catch (e) {
    console.error(e);
    setMainStatus("Couldn’t write location. Check Firestore rules.");
  }
}

function subscribeNearby(lat, lng) {
  const gh = encodeGeohash(lat, lng, 6);

  // Only resubscribe if prefix changed
  const prefix = gh.slice(0, 4); // wider bucket to capture nearby
  if (subscribeNearby._lastPrefix === prefix) return;
  subscribeNearby._lastPrefix = prefix;

  if (typeof unsubNearby === "function") unsubNearby();

  // Prefix range trick for Firestore (startAt/endAt not used; using >= and < end)
  const start = prefix;
  const end = prefix + "\uf8ff";

  const qy = query(
    collection(db, "users"),
    where("gh", ">=", start),
    where("gh", "<=", end),
    orderBy("gh"),
    limit(40)
  );

  unsubNearby = onSnapshot(
    qy,
    (snap) => {
      const rows = [];
      snap.forEach((d) => {
        const u = d.data();
        if (!u || u.uid === uid) return;
        if (typeof u.lat !== "number" || typeof u.lng !== "number") return;

        const km = distanceKm(lat, lng, u.lat, u.lng);
        // show within ~10km for now; adjust later
        if (km > 10) return;

        rows.push({
          uid: u.uid,
          name: u.displayName || "Someone",
          age: u.age ?? "",
          bio: u.bio || "",
          km
        });
      });

      if (rows.length === 0) {
        // If nobody yet, render demo but keep it obvious it's live-ready
        renderDemo("No one in your area yet — you’re early.");
        return;
      }

      rows.sort((a, b) => a.km - b.km);
      renderPeople(rows);
    },
    (err) => {
      console.error(err);
      setMainStatus("Couldn’t load people. Check indexes/rules.");
      renderDemo("Demo mode (rules/index).");
    }
  );
}

function renderPeople(rows) {
  peopleList.innerHTML = "";

  rows.forEach((p) => {
    const kmShown = Math.max(1, Math.round(p.km * 10) / 10); // min 1km, 0.1 precision

    const el = document.createElement("div");
    el.className = "personCard";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const main = document.createElement("div");
    main.className = "personMain";

    const name = document.createElement("p");
    name.className = "personName";
    name.textContent = `${p.name}${p.age !== "" ? `, ${p.age}` : ""}`;

    const bio = document.createElement("p");
    bio.className = "personBio";
    bio.textContent = p.bio || "Here now";

    const dist = document.createElement("div");
    dist.className = "personDist";
    dist.textContent = kmShown === 1 ? "within 1 km away" : `~${kmShown} km away`;

    main.appendChild(name);
    main.appendChild(bio);
    main.appendChild(dist);

    el.appendChild(avatar);
    el.appendChild(main);

    // Future: tap card to open profile / wave confirmation / crossed paths
    el.addEventListener("click", () => {
      openModal();
    });

    peopleList.appendChild(el);
  });
}

function renderDemo(note = "Live-ready. Waiting for nearby users…") {
  peopleList.innerHTML = "";

  const info = document.createElement("div");
  info.className = "muted";
  info.style.textAlign = "center";
  info.style.marginTop = "8px";
  info.textContent = note;
  peopleList.appendChild(info);

  DEMO_PEOPLE.forEach((p, i) => {
    const kmShown = i === 0 || i === 3 ? "within 1 km away" : i === 1 ? "~1.2 km away" : i === 2 ? "~3.4 km away" : "~4.9 km away";

    const el = document.createElement("div");
    el.className = "personCard";

    const avatar = document.createElement("div");
    avatar.className = "avatar";

    const main = document.createElement("div");
    main.className = "personMain";

    const name = document.createElement("p");
    name.className = "personName";
    name.textContent = `${p.name}, ${p.age}`;

    const bio = document.createElement("p");
    bio.className = "personBio";
    bio.textContent = p.bio;

    const dist = document.createElement("div");
    dist.className = "personDist";
    dist.textContent = kmShown;

    main.appendChild(name);
    main.appendChild(bio);
    main.appendChild(dist);

    el.appendChild(avatar);
    el.appendChild(main);
    el.addEventListener("click", () => openModal());

    peopleList.appendChild(el);
  });
}

/* ---------------------------
   Status helpers
   --------------------------- */
function setStatus(text) {
  pillStatus.textContent = text;
}
function setMainStatus(text) {
  statusLine.textContent = text;
}

/* ---------------------------
   Distance
   --------------------------- */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRad(v) { return (v * Math.PI) / 180; }

/* ---------------------------
   Tiny geohash encoder (base32)
   (enough for prefix queries)
   --------------------------- */
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(latitude, longitude, precision = 6) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude >= lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = (idx << 1) + 0;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude >= latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = (idx << 1) + 0;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}
