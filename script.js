<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔥 Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
const statusEl = document.getElementById("status");
const userEl = document.getElementById("user");
const nearbyEl = document.getElementById("nearby");
const chatSection = document.getElementById("chatSection");
const nearSection = document.getElementById("nearSection");
const messagesEl = document.getElementById("messages");
const chatTitle = document.getElementById("chatTitle");
const inputBar = document.getElementById("inputBar");
const msgEl = document.getElementById("msg");
const matchOverlay = document.getElementById("matchOverlay");
const matchNameEl = document.getElementById("matchName");
const startChatBtn = document.getElementById("startChatBtn");

/* State */
let me, myName, chatId, pendingChat;

/* 📐 Distance helper (from minimal version) */
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

/* 🔐 Auth */
signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;
  me = user;

  myName = localStorage.getItem("name") ||
    "User-" + Math.random().toString(36).slice(2, 6);
  localStorage.setItem("name", myName);
  userEl.textContent = myName;

  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation not supported";
    return;
  }

  navigator.geolocation.watchPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    statusEl.textContent = "Online ✔";

    await setDoc(doc(db, "users", me.uid), {
      name: myName,
      lat: latitude,
      lng: longitude,
      lastSeen: serverTimestamp()
    });

    onSnapshot(collection(db, "users"), snap => {
      nearbyEl.innerHTML = "";
      let found = false;

      snap.forEach(d => {
        if (d.id === me.uid) return;
        const u = d.data();
        if (!u.lat) return;

        const dKm = distanceKm(latitude, longitude, u.lat, u.lng);
        if (dKm <= 5) {
          found = true;
          const li = document.createElement("li");
          li.className = "nearby-user";
          li.innerHTML = `<strong>${u.name}</strong>`;
          const btn = document.createElement("button");
          btn.textContent = "Like";
          btn.onclick = () => likeUser(d.id, u.name);
          li.appendChild(btn);
          nearbyEl.appendChild(li);
        }
      });

      if (!found) {
        nearbyEl.innerHTML = "<li>No nearby users yet</li>";
      }
    });
  });
});

/* ❤️ Likes */
async function likeUser(otherUid, name) {
  await setDoc(doc(db, "likes", me.uid + "_" + otherUid), {
    from: me.uid,
    to: otherUid,
    created: serverTimestamp()
  });

  const reverse = await getDoc(doc(db, "likes", otherUid + "_" + me.uid));
  if (reverse.exists()) {
    pendingChat = { uid: otherUid, name };
    matchNameEl.textContent = `You and ${name}`;
    matchOverlay.classList.remove("hidden");
  } else {
    alert("Liked 👍 Waiting for match");
  }
}

startChatBtn.onclick = () => {
  matchOverlay.classList.add("hidden");
  openChat(me.uid, pendingChat.uid, pendingChat.name);
};

/* 💬 Chat */
function openChat(a, b, name) {
  chatId = [a, b].sort().join("_");
  chatTitle.textContent = name;
  chatSection.classList.remove("hidden");
  nearSection.classList.add("hidden");
  inputBar.classList.remove("hidden");
  messagesEl.innerHTML = "";

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("created")
  );

  onSnapshot(q, s => {
    messagesEl.innerHTML = "";
    s.forEach(d => {
      const m = d.data();
      const div = document.createElement("div");
      div.className = "bubble " + (m.uid === me.uid ? "me" : "them");
      div.textContent = m.text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  });
}

document.getElementById("send").onclick = async () => {
  if (!msgEl.value) return;
  await addDoc(collection(db, "chats", chatId, "messages"), {
    uid: me.uid,
    text: msgEl.value,
    created: serverTimestamp()
  });
  msgEl.value = "";
};
</script>
