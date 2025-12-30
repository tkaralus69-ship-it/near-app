// Load Firebase SDKs (compat = easiest + GitHub Pages safe)
const appScript = document.createElement("script");
appScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";

const authScript = document.createElement("script");
authScript.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";

authScript.onload = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.appspot.com",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  document.getElementById("signup").onclick = async () => {
    status.textContent = "Creating account…";
    try {
      await auth.createUserWithEmailAndPassword(email.value, password.value);
      status.textContent = "✅ Account created successfully";
    } catch (err) {
      status.textContent = "❌ " + err.message;
    }
  };

  document.getElementById("login").onclick = async () => {
    status.textContent = "Logging in…";
    try {
      await auth.signInWithEmailAndPassword(email.value, password.value);
      status.textContent = "✅ Logged in successfully";
    } catch (err) {
      status.textContent = "❌ " + err.message;
    }
  };
};

document.head.appendChild(appScript);
document.head.appendChild(authScript);
