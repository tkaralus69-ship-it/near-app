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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Elements
const email = document.getElementById("email");
const password = document.getElementById("password");
const status = document.getElementById("status");

// Sign up
window.signup = async function () {
  status.textContent = "Creating account…";
  try {
    await auth.createUserWithEmailAndPassword(
      email.value,
      password.value
    );
    status.textContent = "✅ Account created";
  } catch (e) {
    status.textContent = "❌ " + e.message;
  }
};

// Login
window.login = async function () {
  status.textContent = "Logging in…";
  try {
    await auth.signInWithEmailAndPassword(
      email.value,
      password.value
    );
    status.textContent = "✅ Logged in";
  } catch (e) {
    status.textContent = "❌ " + e.message;
  }
};
