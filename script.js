import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

const list = document.getElementById("users");

function addUser(id, lat, lng) {
  const el = document.createElement("div");
  el.textContent = `📍 User ${id.slice(0, 5)} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  list.appendChild(el);
}

signInAnonymously(auth);

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    await setDoc(doc(db, "users", user.uid), {
      lat,
      lng,
      updated: Date.now()
    });

    onSnapshot(doc(db, "users", user.uid), (snap) => {
      list.innerHTML = "";
      if (snap.exists()) {
        const d = snap.data();
        addUser(user.uid, d.lat, d.lng);
      }
    });
  });
});
