import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔑 PASTE YOUR REAL FIREBASE CONFIG HERE */
const firebaseConfig = {
  apiKey: "PASTE_YOURS",
  authDomain: "PASTE_YOURS",
  projectId: "PASTE_YOURS",
  storageBucket: "PASTE_YOURS",
  messagingSenderId: "PASTE_YOURS",
  appId: "PASTE_YOURS"
};
/* ------------------------------------ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
const peopleList = document.getElementById("people");
const waveBtn = document.getElementById("waveBtn");
const modal = document.getElementById("modal");
const sendBtn = document.getElementById("sendBtn");
const cancelBtn = document.getElementById("cancelBtn");
const messageInput = document.getElementById("message");
const count = document.getElementById("count");

/* Auth */
signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;

  onSnapshot(collection(db, "waves"), snap => {
    peopleList.innerHTML = "";
    snap.forEach(doc => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>Someone nearby</strong><br/><small>within 1 km away</small>`;
      peopleList.appendChild(li);
    });
  });
});

/* Modal */
waveBtn.onclick = () => modal.classList.remove("hidden");
cancelBtn.onclick = () => modal.classList.add("hidden");

messageInput.oninput = () => {
  count.textContent = messageInput.value.length;
};

sendBtn.onclick = async () => {
  if (!messageInput.value.trim()) return;

  await addDoc(collection(db, "waves"), {
    text: messageInput.value,
    createdAt: serverTimestamp()
  });

  messageInput.value = "";
  count.textContent = "0";
  modal.classList.add("hidden");
};
