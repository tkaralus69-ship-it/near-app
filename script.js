import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* 🔥 Firebase config — YOUR project */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGKSt41S9U53GQt4vFLa8CPVzEAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.appspot.com",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elements
const email = document.getElementById("email");
const password = document.getElementById("password");
const status = document.getElementById("status");

// Sign up
document.getElementById("signup").onclick = async () => {
  status.textContent = "Signing up...";
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    status.textContent = "Signup successful ✅";
  } catch (err) {
    status.textContent = err.message;
  }
};

// Login
document.getElementById("login").onclick = async () => {
  status.textContent = "Logging in...";
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    status.textContent = "Login successful ✅";
  } catch (err) {
    status.textContent = err.message;
  }
};
