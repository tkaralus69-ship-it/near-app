// profile.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// UI
const statusEl = document.getElementById("status");
const card = document.getElementById("profileCard");

const avatar = document.getElementById("avatar");
const nameEl = document.getElementById("name");
const bioEl  = document.getElementById("bio");
const townEl = document.getElementById("town");

// Logout
document.getElementById("btnLogout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html?next=profile.html";
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

    if (p.photoURL) {
      avatar.src = p.photoURL;
      avatar.style.display = "block";
    } else {
      avatar.style.display = "none";
    }

    nameEl.textContent = `${p.name || "Anonymous"}${p.age ? `, ${p.age}` : ""}`;
    bioEl.textContent = p.bio || "";
    townEl.textContent = (p.town || "").toUpperCase();

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not load your profile.";
  }
});
