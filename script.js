// Firebase loader (clean, no alerts)

const app = document.createElement("script");
app.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";

const auth = document.createElement("script");
auth.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";

auth.onload = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.appspot.com",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  };

  firebase.initializeApp(firebaseConfig);
  const authService = firebase.auth();

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const status = document.getElementById("status");

  document.getElementById("signup").onclick = async () => {
    status.textContent = "Creating account…";
    try {
      await authService.createUserWithEmailAndPassword(
        email.value,
        password.value
      );
      status.textContent = "✅ Account created";
    } catch (e) {
      status.textContent = "❌ " + e.message;
    }
  };

  document.getElementById("login").onclick = async () => {
    status.textContent = "Logging in…";
    try {
      await authService.signInWithEmailAndPassword(
        email.value,
        password.value
      );
      status.textContent = "✅ Logged in";
    } catch (e) {
      status.textContent = "❌ " + e.message;
    }
  };
};

document.head.appendChild(app);
document.head.appendChild(auth);
