// =========================
// index.js  ✅ (NEW FILE)
// Put this in /index.js
// Then in index.html replace your inline <script type="module">...</script>
// with: <script type="module" src="index.js"></script>
// =========================

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

window.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero");
  const vibeGrid = document.getElementById("vibeGrid");
  const statusBadge = document.getElementById("statusBadge");
  const locDot = document.getElementById("locDot");

  const btnChooseNear = document.getElementById("btnChooseNear");
  const btnWave = document.getElementById("btnWave");
  const btnLiveWaves = document.getElementById("btnLiveWaves");
  const btnCreate = document.getElementById("btnCreate");
  const btnMe = document.getElementById("btnMe");

  if (!hero || !vibeGrid || !statusBadge) {
    console.warn("Near: missing core elements on index.html");
    return;
  }

  // ---- VIBE backgrounds (must match your /img files)
  const vibeToImg = {
    city: "city.jpg",
    tech: "tech.jpg",
    nature: "nature.jpg",
    fitness: "fitness.jpg",
    beach: "beach.jpg",
    food: "food.jpg",
  };

  const vibeButtons = Array.from(vibeGrid.querySelectorAll(".vibe"));

  function setHeroImage(filename) {
    // Keep it “window mode”: minimal darkening so you see the vibe photo
    hero.style.background =
      `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
       linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.22) 55%, rgba(0,0,0,.26) 100%),
       url("img/${filename}") center/cover no-repeat`;
  }

  function getVibe() {
    return localStorage.getItem("near_vibe") || "nature";
  }
  function setVibe(v) {
    localStorage.setItem("near_vibe", v);
    updateStatus();
  }

  function isLocationOn() {
    return localStorage.getItem("near_loc_on") === "1";
  }

  function updateStatus() {
    const vibe = getVibe();
    const locText = isLocationOn() ? "Location on" : "Location off";
    statusBadge.textContent = `Vibe: ${vibe} • ${locText}`;

    if (locDot) {
      locDot.style.opacity = "1";
      // ✅ green when on, muted when off
      locDot.style.background = isLocationOn()
        ? "rgba(0,255,180,.85)"
        : "rgba(255,255,255,.30)";
      locDot.style.boxShadow = isLocationOn()
        ? "0 0 0 4px rgba(0,255,180,.14)"
        : "0 0 0 3px rgba(255,255,255,.10)";
    }
  }

  function setActive(btn) {
    vibeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  // Wire vibe clicks
  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vibe = btn.dataset.vibe || "nature";
      const img = btn.dataset.img || vibeToImg[vibe] || "hero.jpg";
      setActive(btn);
      setHeroImage(img);
      setVibe(vibe);
    });
  });

  // Restore last vibe
  const saved = getVibe();
  const savedBtn = vibeButtons.find((b) => b.dataset.vibe === saved);
  if (savedBtn) {
    setActive(savedBtn);
    setHeroImage(savedBtn.dataset.img || vibeToImg[saved] || "hero.jpg");
  } else {
    setHeroImage("hero.jpg");
  }
  updateStatus();

  // ---- AUTH gating
  let currentUser = null;
  onAuthStateChanged(auth, (u) => (currentUser = u));

  function goOrLogin(target) {
    if (currentUser) window.location.href = target;
    else window.location.href = `login.html?next=${encodeURIComponent(target)}`;
  }

  // ✅ Make these work (these were failing for you)
  btnCreate?.addEventListener("click", () => goOrLogin("create.html"));
  btnMe?.addEventListener("click", () => goOrLogin("profile.html"));
  btnChooseNear?.addEventListener("click", () => goOrLogin("near.html"));

  // placeholders
  btnWave?.addEventListener("click", () => alert("Soon: send a wave 👋"));
  btnLiveWaves?.addEventListener("click", () => alert("Soon: live waves 🌊"));
});
