import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.appspot.com",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get elements
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("signup");

// Sign up
signupBtn.onclick = async () => {
  await createUserWithEmailAndPassword(auth, email.value, password.value);
  window.location.href = "dashboard.html";
};

// Log in
loginBtn.onclick = async () => {
  await signInWithEmailAndPassword(auth, email.value, password.value);
  window.location.href = "dashboard.html";
};
