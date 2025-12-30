// === Load Firebase scripts ===
function load(src) {
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

(async () => {
  await load("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
  await load("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js");

  // === Firebase config ===
  firebase.initializeApp({
    apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
    authDomain: "near-c7681.firebaseapp.com",
    projectId: "near-c7681",
    storageBucket: "near-c7681.appspot.com",
    messagingSenderId: "316318833624",
    appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
  });

  const auth = firebase.auth();

  // ===
