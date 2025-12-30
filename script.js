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
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  message.innerText = "Loading...";

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      message.innerText = "Welcome to Near";
    })
    .catch(error => {
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
