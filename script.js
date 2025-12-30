auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-email").innerText = user.email;
});

function getLocation() {
  const status = document.getElementById("location-status");

  if (!navigator.geolocation) {
    status.innerText = "Geolocation not supported";
    return;
  }

  status.innerText = "Getting location…";

  navigator.geolocation.getCurrentPosition(
    position => {
      const user = auth.currentUser;

      db.collection("users").doc(user.uid).set({
        email: user.email,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      status.innerText = "✅ Location saved";
    },
    error => {
      status.innerText = "❌ Location denied";
    }
  );
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}
