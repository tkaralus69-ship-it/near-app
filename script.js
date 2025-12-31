<script type="module">
  // Firebase core
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

  // Auth
  import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

  // Firestore
  import {
    getFirestore,
    doc,
    setDoc,
    collection,
    onSnapshot,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

  // 🔥 Firebase config (YOURS — correct)
  const firebaseConfig = {
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.firebasestorage.app",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  };

  // Init
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const statusEl = document.getElementById("status");
  const userEl = document.getElementById("user");
  const nearbyEl = document.getElementById("nearby");

  // 📐 Distance function
  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 🔐 Anonymous sign-in
  signInAnonymously(auth);

  onAuthStateChanged(auth, user => {
    if (!user) return;

    userEl.textContent = user.uid;

    if (!navigator.geolocation) {
      statusEl.textContent = "Geolocation not supported";
      return;
    }

    navigator.geolocation.watchPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      statusEl.textContent = "Location received ✔";

      await setDoc(doc(db, "users", user.uid), {
        lat: latitude,
        lng: longitude,
        lastSeen: serverTimestamp()
      });

      onSnapshot(collection(db, "users"), snapshot => {
        nearbyEl.innerHTML = "";

        snapshot.forEach(d => {
          if (d.id === user.uid) return;
          const data = d.data();
          if (!data.lat) return;

          const dKm = distanceKm(latitude, longitude, data.lat, data.lng);
          if (dKm <= 5) {
            const li = document.createElement("li");
            li.textContent = `${d.id.slice(0, 6)} • ${dKm.toFixed(2)} km`;
            nearbyEl.appendChild(li);
          }
        });

        if (!nearbyEl.children.length) {
          nearbyEl.innerHTML = "<li>No nearby users yet</li>";
        }
      });
    });
  });
</script>
