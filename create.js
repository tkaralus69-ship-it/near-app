import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

let myUid = null;
let lastGeo = null;
let photoDataUrl = ""; // if using file upload

function userRef(uid){ return doc(db, "users", uid); }

bioEl.addEventListener("input", ()=> bioCount.textContent = String(bioEl.value.length));

function showPreview(src){
  if (!src) {
    previewWrap.classList.add("hidden");
    previewImg.src = "";
    return;
  }
  previewWrap.classList.remove("hidden");
  previewImg.src = src;
}

photoUrl.addEventListener("input", ()=>{
  // If URL typed, we ignore file DataURL
  photoDataUrl = "";
  if (photoUrl.value.trim()) showPreview(photoUrl.value.trim());
});

photoFile.addEventListener("change", async ()=>{
  const f = photoFile.files?.[0];
  if (!f) return;

  // If file chosen, ignore URL
  photoUrl.value = "";

  // Resize/compress into a safe DataURL (no Storage needed)
  photoDataUrl = await fileToCompressedDataURL(f, 720, 0.82);
  showPreview(photoDataUrl);
});

function startGeo(){
  if (!("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    },
    ()=>{},
    { enableHighAccuracy:true, maximumAge:10000, timeout:10000 }
  );
}

async function loadExisting(){
  const snap = await getDoc(userRef(myUid));
  const u = snap.data() || {};

  if (u.name) nameEl.value = u.name;
  if (u.age) ageEl.value = String(u.age);
  if (u.locationText) locationEl.value = u.locationText;
  if (u.bio) bioEl.value = u.bio;
  bioCount.textContent = String((u.bio || "").length);

  if (u.photoDataUrl){
    photoDataUrl = u.photoDataUrl;
    showPreview(photoDataUrl);
  } else if (u.photoUrl){
    photoUrl.value = u.photoUrl;
    showPreview(u.photoUrl);
  }
}

saveBtn.addEventListener("click", async ()=>{
  hint.textContent = "";

  const name = nameEl.value.trim();
  const bio = bioEl.value.trim();
  const locationText = locationEl.value.trim();

  if (name.length < 2){
    hint.textContent = "Name is too short.";
    return;
  }
  if (bio.length < 10){
    hint.textContent = "Bio needs a bit more (10+ characters).";
    return;
  }

  const ageNumRaw = ageEl.value.trim();
  const age = ageNumRaw ? Math.max(18, Math.min(99, Number(ageNumRaw))) : null;

  const url = photoUrl.value.trim();
  const finalPhotoUrl = url ? url : "";
  const finalPhotoDataUrl = photoDataUrl ? photoDataUrl : "";

  if (!finalPhotoUrl && !finalPhotoDataUrl){
    hint.textContent = "Add one photo (upload or URL).";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try{
    await setDoc(userRef(myUid), {
      name,
      age: age ?? null,
      locationText: locationText || "Near you",
      bio,
      photoUrl: finalPhotoUrl || null,
      photoDataUrl: finalPhotoDataUrl || null,
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() // merge keeps original if exists
    }, { merge:true });

    // Go to your profile view
    window.location.href = `profile.html?uid=${encodeURIComponent(myUid)}`;
  }catch(e){
    console.error(e);
    hint.textContent = "Couldn’t save. Try again.";
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = "Save profile";
  }
});

signInAnonymously(auth).then(async (cred)=>{
  myUid = cred.user.uid;
  statusLine.textContent = "You’re signed in ✅";
  startGeo();
  await loadExisting();
}).catch((e)=>{
  console.error(e);
  statusLine.textContent = "Sign-in failed.";
});

/* ---------- image helper ---------- */
function fileToCompressedDataURL(file, maxSide = 720, quality = 0.82){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
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
    img.onerror = ()=> resolve("");
    img.src = URL.createObjectURL(file);
  });
                             }
