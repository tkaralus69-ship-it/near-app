// near.js — REAL RADAR (Firestore powered)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.appspot.com",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🎯 RADAR SETUP
const canvas = document.getElementById("radarCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 300;
canvas.height = 300;

const centerX = 150;
const centerY = 150;

// 🎨 VIBE COLORS
const vibeColors = {
  calm: "#00ffc3",
  adventurous: "#ff6b6b",
  romantic: "#ff4da6",
  grounded: "#ffaa00",
  playful: "#00aaff",
  deep: "#9b5cff"
};

// 📍 GET USER LOCATION
function getLocation() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  });
}

// 📏 DISTANCE CALC (KM)
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 🎯 DRAW RADAR
function drawRadar(users) {
  ctx.clearRect(0, 0, 300, 300);

  // circles
  for (let r = 50; r <= 150; r += 50) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,255,180,0.2)";
    ctx.stroke();
  }

  // center
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#00ffc3";
  ctx.fill();

  // users
  users.forEach((u) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.min(u.distance * 20, 140);

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = vibeColors[u.vibe] || "#ffffff";
    ctx.fill();
  });
}

// 🔥 LOAD USERS FROM FIRESTORE
async function loadUsers() {
  const myLoc = await getLocation();

  const snapshot = await getDocs(collection(db, "profiles"));

  const users = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (!data.lat || !data.lng) return;

    const dist = distanceKm(
      myLoc.lat,
      myLoc.lng,
      data.lat,
      data.lng
    );

    if (dist <= 10) {
      users.push({
        ...data,
        distance: dist
      });
    }
  });

  drawRadar(users);

  document.getElementById("nearbyCount").textContent =
    users.length + " Nearby";
}

// 🚀 START
loadUsers();
