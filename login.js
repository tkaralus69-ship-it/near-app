import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ IMPORTANT: set this to your live GitHub Pages URL
// Example: https://tkaralus69-ship-it.github.io/near-app/login.html
const LOGIN_URL = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}/login.html`;

const emailEl = document.getElementById("email");
const statusBadge = document.getElementById("statusBadge");
const sendLinkBtn = document.getElementById("sendLinkBtn");
const signOutBtn = document.getElementById("signOutBtn");
const microLine = document.getElementById("microLine");

function getNext() {
  const url = new URL(window.location.href);
  return url.searchParams.get("next") || "index.html";
}

async function routeAfterLogin(uid) {
  // If profile exists -> go to profile
  // else -> go create
  const pRef = doc(db, "profiles", uid);
  const snap = await getDoc(pRef);
  if (snap.exists()) {
    window.location.href = "profile.html";
  } else {
    window.location.href = "create.html";
  }
}

sendLinkBtn.addEventListener("click", async () => {
  const email = (emailEl.value || "").trim().toLowerCase();
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  sendLinkBtn.disabled = true;
  statusBadge.textContent = "Sending…";

  try {
    const actionCodeSettings = {
      url: `${LOGIN_URL}?next=${encodeURIComponent(getNext())}`,
      handleCodeInApp: true
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem("near_emailForSignIn", email);

    statusBadge.textContent = "Check email";
    microLine.textContent = "Link sent. Open it on this device to sign in. If you open it on another device, we’ll ask you to confirm your email.";
    alert("Sign-in link sent ✅ Check your email.");
  } catch (e) {
    console.error(e);
    statusBadge.textContent = "Error";
    alert("Couldn’t send link. Check your email address and try again.");
  } finally {
    sendLinkBtn.disabled = false;
  }
});

signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// If user opened email link
(async function handleEmailLink() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;

  statusBadge.textContent = "Signing in…";

  let email = localStorage.getItem("near_emailForSignIn");
  if (!email) {
    // Opened on different device: ask for email to confirm
    email = prompt("Confirm your email to finish signing in:");
  }

  if (!email) {
    statusBadge.textContent = "Email needed";
    alert("Email is required to complete sign-in.");
    return;
  }

  try {
    const result = await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem("near_emailForSignIn");
    statusBadge.textContent = "Signed in";
    await routeAfterLogin(result.user.uid);
  } catch (e) {
    console.error(e);
    statusBadge.textContent = "Link invalid";
    alert("That sign-in link is invalid or expired. Please request a new one.");
  }
})();

onAuthStateChanged(auth, (user) => {
  if (user) {
    statusBadge.textContent = "Signed in";
    signOutBtn.style.display = "inline-block";
  } else {
    signOutBtn.style.display = "none";
  }
});
