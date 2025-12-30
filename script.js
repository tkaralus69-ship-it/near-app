
    // Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config
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

  document.getElementById("signupBtn").addEventListener("click", () => {
    const email = prompt("Enter email");
    const password = prompt("Enter password");

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => alert("Account created 🎉"))
      .catch(error => alert(error.message));
  });

  document.getElementById("loginBtn").addEventListener("click", () => {
    const email = prompt("Enter email");
    const password = prompt("Enter password");

    signInWithEmailAndPassword(auth, email, password)
      .then(() => alert("Logged in ✅"))
      .catch(error => alert(error.message));
  });

});
  });

  document.getElementById("loginBtn").addEventListener("click", function () {
    );
  });
});
