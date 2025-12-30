// Firebase SDKs (compat = simpler, works everywhere)
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.appspot.com",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// Load Firebase dynamically
const script1 = document.createElement("script");
script1.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";

const script2 = document.createElement("script");
script2.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";

script2.onload = () => {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  document.getElementById("signup").onclick = async () => {
    try {
      await auth.createUserWithEmailAndPassword(email.value, password.value);
      status.textContent = "✅ Account created";
    } catch (e) {
      status.textContent = e.message;
    }
  };

  document.getElementById("login").onclick = async () => {
    try {
      await auth.signInWithEmailAndPassword(email.value, password.value);
      status.textContent = "✅ Logged in";
    } catch (e) {
      status.textContent = e.message;
    }
  };
};

document.head.appendChild(script1);
document.head.appendChild(script2);
