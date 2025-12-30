function load(src) {
  return new Promise(r => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = r;
    document.head.appendChild(s);
  });
}

(async () => {
  await load("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
  await load("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js");

  firebase.initializeApp({
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.appspot.com",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  });

  const auth = firebase.auth();

  signup.onclick = async () => {
    status.textContent = "Creating account…";
    try {
      await auth.createUserWithEmailAndPassword(email.value, password.value);
    } catch (e) {
      status.textContent = e.message;
    }
  };

  login.onclick = async () => {
    status.textContent = "Logging in…";
    try {
      await auth.signInWithEmailAndPassword(email.value, password.value);
    } catch (e) {
      status.textContent = e.message;
    }
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = "app.html";
    }
  });
})();
