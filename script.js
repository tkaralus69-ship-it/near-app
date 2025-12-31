<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Near</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0f172a;
      color: white;
      margin: 0;
      padding: 16px;
    }
    h1 { margin: 0 0 4px; }
    .sub { color: #94a3b8; margin-bottom: 12px; }

    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 10px;
      border: none;
      background: #38bdf8;
      color: #022c22;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .card {
      background: #1e293b;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .small { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>

  <h1>📍 Near</h1>
  <div class="sub">Find people close to you right now</div>

  <button id="locBtn" class="btn">Enable location</button>

  <div id="list"></div>

  <!-- 🔥 FULL APP SCRIPT -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
    import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
    import { getFirestore, doc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
      authDomain: "near-c7681.firebaseapp.com",
      projectId: "near-c7681",
      storageBucket: "near-c7681.firebasestorage.app",
      messagingSenderId: "316318833624",
      appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 🔒 Stable device ID (prevents duplicates)
    let deviceId = localStorage.getItem("near_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("near_device_id", deviceId);
    }

    const list = document.getElementById("list");
    const btn = document.getElementById("locBtn");

    btn.onclick = async () => {
      btn.textContent = "Location enabled";

      await signInAnonymously(auth);

      navigator.geolocation.watchPosition(async pos => {
        const { latitude, longitude } = pos.coords;

        await setDoc(doc(db, "users", deviceId), {
          lat: latitude,
          lng: longitude,
          lastActive: Date.now()
        });
      });
    };

    function distanceKm(a, b, c, d) {
      const R = 6371;
      const dLat = (c - a) * Math.PI / 180;
      const dLon = (d - b) * Math.PI / 180;
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a * Math.PI / 180) *
        Math.cos(c * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    onSnapshot(collection(db, "users"), snap => {
      list.innerHTML = "";

      snap.forEach(d => {
        if (d.id === deviceId) return;
        const u = d.data();
        if (Date.now() - u.lastActive > 30000) return;

        const km = distanceKm(
          u.lat, u.lng,
          u.lat, u.lng
        ).toFixed(2);

        const el = document.createElement("div");
        el.className = "card";
        el.innerHTML = `
          <strong>Someone nearby</strong>
          <div class="small">${km} km away</div>
        `;
        list.appendChild(el
