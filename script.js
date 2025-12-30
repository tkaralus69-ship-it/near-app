// 🔥 Firebase config — REPLACE with your real keys
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  message.innerText = "Loading...";

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      message.innerText = "Welcome to Near";
    })
    .catch((error) => {
      // If user doesn't exist → create account
      if (error.code === "auth/user-not-found") {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            message.innerText = "Welcome to Near";
          })
          .catch(err => {
            message.innerText = err.message;
          });
      } else {
        message.innerText = error.message;
      }
    });
}
