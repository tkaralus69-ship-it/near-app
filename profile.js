import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

const statusEl = document.getElementById("status");
const card = document.getElementById("profileCard");

const avatar = document.getElementById("avatar");
const nameEl = document.getElementById("name");
const bioEl  = document.getElementById("bio");
const townEl = document.getElementById("town");

document.getElementById("btnLogout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html?redirect=profile.html";
    return;
  }

  statusEl.textContent = `Signed in as ${user.email || "your account"} — loading…`;

  try {
    const q = query(
      collection(db, "profiles"),
      where("ownerUid", "==", user.uid),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      statusEl.textContent = "No profile yet. Tap Create.";
      card.style.display = "none";
      return;
    }

    const p = snap.docs[0].data();

    card.style.display = "flex";
    statusEl.textContent = `Signed in as ${user.email || "your account"}`;

    avatar.src = p.photoURL || "";
    avatar.style.display = p.photoURL ? "block" : "none";

    nameEl.textContent = `${p.name || "Anonymous"}${p.age ? `, ${p.age}` : ""}`;
    bioEl.textContent = p.bio || "";
    townEl.textContent = (p.town || "").toUpperCase();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Could not load your profile (check Firestore rules / indexes).";
  }
});
