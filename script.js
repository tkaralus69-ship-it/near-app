import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const statusText = document.getElementById("status");

signupBtn.onclick = () => {
  createUserWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  )
    .then(() => {
      statusText.innerText = "Signed up successfully";
    })
    .catch(err => {
      statusText.innerText = err.message;
    });
};

loginBtn.onclick = () => {
  signInWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  )
    .then(() => {
      statusText.innerText = "Logged in successfully";
    })
    .catch(err => {
      statusText.innerText = err.message;
    });
};

onAuthStateChanged(auth, user => {
  if (user) {
    document.body.innerHTML = `
      <h1>Welcome to NEAR</h1>
      <p>${user.email}</p>
      <p id="location">Waiting for location...</p>
      <button id="logout">Logout</button>
    `;

    document.getElementById("logout").onclick = () => signOut(auth);

    navigator.geolocation.getCurrentPosition(
      pos => {
        document.getElementById("location").innerText =
          "Location received ✔️";
      },
      err => {
        document.getElementById("location").innerText =
          "Location blocked ❌";
      }
    );
  }
});
