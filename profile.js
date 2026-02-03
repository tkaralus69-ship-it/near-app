import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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
const pName = document.getElementById("pName");
const pBio = document.getElementById("pBio");
const pLoc = document.getElementById("pLoc");
const heroImg = document.getElementById("heroImg");
const hint = document.getElementById("hint");
const editLink = document.getElementById("editLink");

function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}

function userRef(uid){ return doc(db, "users", uid); }

signInAnonymously(auth).then(async (cred)=>{
  const me = cred.user.uid;
  const uid = qs("uid") || me;

  // Only show Edit if this is your own profile
  editLink.style.display = (uid === me) ? "inline-flex" : "none";

  const snap = await getDoc(userRef(uid));
  const u = snap.data();

  if (!u){
    statusLine.textContent = "No profile found.";
    hint.textContent = "Create your profile first.";
    return;
  }

  const name = u.name || "Profile";
  const age = u.age ? `, ${u.age}` : "";
  const bio = u.bio || "";
  const loc = u.locationText || "Near you";
  const photo = u.photoDataUrl || u.photoUrl || "";

  pName.textContent = `${name}${age}`;
  pBio.textContent = bio;
  pLoc.textContent = loc;

  if (photo){
    heroImg.src = photo;
  } else {
    heroImg.src = "";
  }

  statusLine.textContent = "Real people. Real profiles.";

}).catch((e)=>{
  console.error(e);
  statusLine.textContent = "Sign-in failed.";
});
