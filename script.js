<!-- force rebuild -->
<script type="module">
  import { auth } from "./firebase.js";
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  window.addEventListener("DOMContentLoaded", () => {

    // --- Vibe behaviour: PLAY FIRST, NO FORCED NAV ---
    const hero = document.getElementById("hero");
    const vibeGrid = document.getElementById("vibeGrid");
    const statusBadge = document.getElementById("statusBadge");

    if (!hero || !vibeGrid || !statusBadge) {
      console.warn("Near: core elements missing");
      return;
    }

    const vibeButtons = Array.from(vibeGrid.querySelectorAll(".vibe"));

    function setHeroImage(filename){
      hero.style.background =
        `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
         linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.72) 100%),
         url("img/${filename}") center/cover no-repeat`;
    }

    function setActive(btn){
      vibeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }

    function setVibe(vibe){
      localStorage.setItem("near_vibe", vibe);
      statusBadge.textContent = `Vibe: ${vibe}`;
    }

    vibeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        setActive(btn);
        setHeroImage(btn.dataset.img);
        setVibe(btn.dataset.vibe);
      });
    });

    // Restore last vibe
    const saved = localStorage.getItem("near_vibe");
    if (saved){
      const btn = vibeButtons.find(b => b.dataset.vibe === saved);
      if (btn){
        setActive(btn);
        setHeroImage(btn.dataset.img);
        statusBadge.textContent = `Vibe: ${saved}`;
      }
    } else {
      setHeroImage("hero.jpg");
    }

    // --- Auth gating ---
    let currentUser = null;
    onAuthStateChanged(auth, (u) => currentUser = u);

    function goOrLogin(target){
      if (currentUser) window.location.href = target;
      else window.location.href = `login.html?next=${encodeURIComponent(target)}`;
    }

    document.getElementById("btnCreate")?.addEventListener("click", () => goOrLogin("create.html"));
    document.getElementById("btnMe")?.addEventListener("click", () => goOrLogin("profile.html"));
    document.getElementById("btnChooseNear")?.addEventListener("click", () => goOrLogin("near.html"));
    document.getElementById("btnWave")?.addEventListener("click", () => alert("Soon: send a wave 👋"));
    document.getElementById("btnLiveWaves")?.addEventListener("click", () => alert("Soon: live waves 🌊"));

  });
</script>
<!-- Firebase SDKs -->
<script type="module">
  // Firebase core
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    isSignInWithEmailLink,
    signOut
  } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

  // 🔐 Your Firebase config (SAFE to be public)
  const firebaseConfig = {
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.firebasestorage.app",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
    measurementId: "G-98XYEKXLLT"
  };

  // Init
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // -------------------------
  // ✉️ EMAIL LINK LOGIN
  // -------------------------
  const actionCodeSettings = {
    url: window.location.origin,
    handleCodeInApp: true
  };

  async function sendLoginEmail(email) {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem("near_email", email);
    alert("Check your email to sign in ✉️");
  }

  if (isSignInWithEmailLink(auth, window.location.href)) {
    const email = localStorage.getItem("near_email");
    if (email) {
      await signInWithEmailLink(auth, email, window.location.href);
      localStorage.removeItem("near_email");
    }
  }

  // -------------------------
  // 👤 AUTH STATE
  // -------------------------
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("Not logged in");
      return;
    }

    console.log("Logged in:", user.uid);

    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Create EMPTY / GENERIC profile
      await setDoc(ref, {
        name: "",
        bio: "",
        vibe: localStorage.getItem("near_vibe") || "",
        createdAt: serverTimestamp(),
        ownerUid: user.uid
      });
    }

    const profile = (await getDoc(ref)).data();
    console.log("Profile loaded:", profile);

    // You can now populate UI fields safely
  });

  // -------------------------
  // 💾 SAVE PROFILE
  // -------------------------
  async function saveProfile(data) {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
      doc(db, "profiles", user.uid),
      {
        ...data,
        updatedAt: serverTimestamp(),
        ownerUid: user.uid
      },
      { merge: true }
    );
  }

  // -------------------------
  // 🚪 LOG OUT (optional)
  // -------------------------
  async function logout() {
    await signOut(auth);
    location.reload();
  }

  // Expose minimal functions
  window.nearAuth = {
    sendLoginEmail,
    saveProfile,
    logout
  };
</script>
