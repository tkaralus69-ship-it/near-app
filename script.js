// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Button logic
document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");

  signupBtn.addEventListener("click", async () => {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign up successful!");
      window.location.href = "home.html";
    } catch (error) {
      alert(error.message);
    }
  });

  loginBtn.addEventListener("click", async () => {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      window.location.href = "home.html";
    } catch (error) {
      alert(error.message);
    }
  });
});
