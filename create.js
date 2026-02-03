import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* FIREBASE CONFIG (yours) */
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

/* ---------- DOM ---------- */
const statusLine = document.getElementById("statusLine");
const nameEl = document.getElementById("name");
const ageEl = document.getElementById("age");
const locationEl = document.getElementById("locationText");
const bioEl = document.getElementById("bio");
const bioCount = document.getElementById("bioCount");
const photoFile = document.getElementById("photoFile");
const photoUrl = document.getElementById("photoUrl");
const previewWrap = document.getElementById("previewWrap");
const previewImg = document.getElementById("previewImg");
const saveBtn = document.getElementById("saveBtn");
const hint = document.getElementById("hint");

/* ---------- state ---------- */
let myUid = null;
let lastGeo = null;
let photoDataUrl = ""; // if using file upload

function userRef(uid) {
  return doc(db, "users", uid);
}

bioEl.addEventListener("input", () => {
  bioCount.textContent = String(bioEl.value.length);
});

function showPreview(src) {
  if (!src) {
    previewWrap.classList.add("hidden");
    previewImg.src = "";
    return;
  }
  previewWrap.classList.remove("hidden");
  previewImg.src = src;
}

/* ---------- photo input logic ---------- */
photoUrl.addEventListener("input", () => {
  // If URL typed, ignore file DataURL
  photoDataUrl = "";
  const v = photoUrl.value.trim();
  if (v) showPreview(v);
  else showPreview("");
});

photoFile.addEventListener("change", async () => {
  const f = photoFile.files?.[0];
  if (!f) return;

  // If file chosen, ignore URL
  photoUrl.value = "";

  // Resize/compress into a safe DataURL (no Storage needed)
  photoDataUrl = await fileToCompressedDataURL(f, 720, 0.82);
  showPreview(photoDataUrl);
});

/* ---------- geo ---------- */
function startGeo() {
  if (!("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
  );
}

/* ---------- load existing ---------- */
async function loadExisting() {
  const snap = await getDoc(userRef(myUid));
  const u = snap.data() || {};

  if (u.name) nameEl.value = u.name;
  if (u.age) ageEl.value = String(u.age);
  if (u.locationText) locationEl.value = u.locationText;
  if (u.bio) bioEl.value = u.bio;
  bioCount.textContent = String((u.bio || "").length);

  if (u.photoDataUrl) {
    photoDataUrl = u.photoDataUrl;
    showPreview(photoDataUrl);
  } else if (u.photoUrl) {
    photoUrl.value = u.photoUrl;
    showPreview(u.photoUrl);
  }
}

/* ---------- save ---------- */
saveBtn.addEventListener("click", async () => {
  hint.textContent = "";

  const name = nameEl.value.trim();
  const bio = bioEl.value.trim();
  const locationText = locationEl.value.trim();

  // Basic checks
  if (name.length < 2) {
    hint.textContent = "Name is too short.";
    return;
  }

  if (bio.length < 10) {
    hint.textContent = "Bio needs a bit more (10+ characters).";
    return;
  }

  // ✅ Age optional (blank ok). If provided, must be whole number 18–99.
  const ageNumRaw = ageEl.value.trim();
  let age = null;

  if (ageNumRaw) {
    const n = Number(ageNumRaw);
    if (!Number.isFinite(n) || n % 1 !== 0) {
      hint.textContent = "Age must be a whole number (or leave it blank).";
      return;
    }
    if (n < 18 || n > 99) {
      hint.textContent = "If you add age, it must be 18–99.";
      return;
    }
    age = n;
  }

  // Photo (URL or uploaded DataURL)
  const url = photoUrl.value.trim();
  const finalPhotoUrl = url ? url : "";
  const finalPhotoDataUrl = photoDataUrl ? photoDataUrl : "";

  if (!finalPhotoUrl && !finalPhotoDataUrl) {
    hint.textContent = "Add one photo (upload or URL).";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const ref = userRef(myUid);
    const snap = await getDoc(ref);
    const exists = snap.exists();

    const payload = {
      name,
      age: age ?? null,
      locationText: locationText || "Near you",
      bio,
      photoUrl: finalPhotoUrl || null,
      photoDataUrl: finalPhotoDataUrl || null,
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      updatedAt: serverTimestamp()
    };

    if (!exists) {
      // ✅ first-time create: set createdAt once
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      // ✅ updates: DO NOT touch createdAt
      await updateDoc(ref, payload);
    }

    // Go to your profile view
    window.location.href = `profile.html?uid=${encodeURIComponent(myUid)}`;
  } catch (e) {
    console.error(e);
    hint.textContent = "Couldn’t save. Try again.";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save profile";
  }
});

/* ---------- auth ---------- */
signInAnonymously(auth)
  .then(async (cred) => {
    myUid = cred.user.uid;
    statusLine.textContent = "You’re signed in ✅";
    startGeo();
    await loadExisting();
  })
  .catch((e) => {
    console.error(e);
    statusLine.textContent = "Sign-in failed.";
  });

/* ---------- image helper ---------- */
function fileToCompressedDataURL(file, maxSide = 720, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const w = img.width;
      const h = img.height;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const nw = Math.round(w * scale);
      const nh = Math.round(h * scale);

      canvas.width = nw;
      canvas.height = nh;
      ctx.drawImage(img, 0, 0, nw, nh);

      const out = canvas.toDataURL("image/jpeg", quality);
      resolve(out);
    };
    img.onerror = () => resolve("");
    img.src = URL.createObjectURL(file);
  });
    }
