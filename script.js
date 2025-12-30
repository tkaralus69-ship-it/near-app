const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Show email
  document.getElementById("user-email").innerText = user.email;

  // Create user profile if it doesn't exist
  const userRef = db.collection("users").doc(user.uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      uid: user.uid,
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ User profile created");
  } else {
    console.log("✅ User profile exists");
  }
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
