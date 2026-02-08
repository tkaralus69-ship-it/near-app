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
