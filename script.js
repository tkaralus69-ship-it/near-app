<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
  import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    setDoc,
    collection,
    onSnapshot,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.firebasestorage.app",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Anonymous login
  const userCred = await signInAnonymously(auth);
  const uid = userCred.user.uid;

  // Watch location
  navigator.geolocation.watchPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    await setDoc(doc(db, "users", uid), {
      lat: latitude,
      lng: longitude,
      lastActive: serverTimestamp()
    });
  });

  // Listen for nearby users (basic version)
  onSnapshot(collection(db, "users"), (snap) => {
    console.log("Nearby users:", snap.docs.map(d => d.id));
  });
</script>
