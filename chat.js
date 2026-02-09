import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

/* ---------- VIBE BACKGROUND ---------- */
const hero = document.getElementById("chatHero");
const vibe = localStorage.getItem("near_vibe") || "nature";

const vibeToImg = {
  city: "city.jpg",
  tech: "tech.jpg",
  nature: "nature.jpg",
  fitness: "fitness.jpg",
  beach: "beach.jpg",
  food: "food.jpg"
};

hero.style.background =
  `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.14), transparent 55%),
   linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.22)),
   url("img/${vibeToImg[vibe] || "hero.jpg"}") center/cover no-repeat`;

/* ---------- ELEMENTS ---------- */
const messagesEl = document.getElementById("messages");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

/* ---------- DEMO CHAT ID ---------- */
const chatId = "chat_demo"; // later: real match ID

let currentUser = null;

/* ---------- AUTH ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html?redirect=chat.html";
    return;
  }
  currentUser = user;
  listenForMessages();
});

/* ---------- LISTEN ---------- */
function listenForMessages() {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";

    snap.forEach((doc) => {
      const m = doc.data();
      const div = document.createElement("div");
      div.className = "bubble " + (m.uid === currentUser.uid ? "me" : "them");
      div.textContent = m.text;
      messagesEl.appendChild(div);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

/* ---------- SEND ---------- */
sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});

async function send() {
  const text = input.value.trim();
  if (!text || !currentUser) return;

  input.value = "";

  await addDoc(
    collection(db, "chats", chatId, "messages"),
    {
      text,
      uid: currentUser.uid,
      createdAt: serverTimestamp()
    }
  );
}
