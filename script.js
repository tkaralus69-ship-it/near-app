// Near — Landing Page (vibes + gentle location)
// - No forced navigation
// - Location is requested only when user taps "Choose someone Near"

const hero = document.getElementById("hero");
const vibeGrid = document.getElementById("vibeGrid");
const statusBadge = document.getElementById("statusBadge");
const vibeButtons = Array.from(vibeGrid.querySelectorAll(".vibe"));

let locationState = "off"; // "off" | "on"

function setHeroImage(filename){
  hero.style.background =
    `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
     linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.72) 100%),
     url("img/${filename}") center/cover no-repeat`;
}

function setActive(btn){
  vibeButtons.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function getVibe(){
  return localStorage.getItem("near_vibe") || "";
}

function setVibe(vibe){
  localStorage.setItem("near_vibe", vibe);
  updateStatus();
}

function updateStatus(){
  const vibe = getVibe();
  const vibeText = vibe ? `Vibe: ${vibe}` : "Up to date";
  const locText = `Location ${locationState === "on" ? "on" : "off"}`;

  // Add a soft dot so it looks “system”
  statusBadge.innerHTML = `<span class="dot"></span>${vibe ? `${vibeText} • ${locText}` : locText}`;
  const dot = statusBadge.querySelector(".dot");
  dot.style.background = locationState === "on" ? "rgba(0, 255, 180, .85)" : "rgba(255,255,255,.35)";
}

// Default hero image
setHeroImage("hero.jpg");

// Vibe button clicks
vibeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setActive(btn);
    setHeroImage(btn.dataset.img);
    setVibe(btn.dataset.vibe);
  });
});

// Restore last vibe
const saved = getVibe();
if (saved){
  const btn = vibeButtons.find(b => b.dataset.vibe === saved);
  if (btn){
    setActive(btn);
    setHeroImage(btn.dataset.img);
  }
}
updateStatus();

// Navigation — only when user chooses
document.getElementById("btnCreate").addEventListener("click", () => {
  window.location.href = "create.html";
});

document.getElementById("btnMe").addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Choose someone Near: ask for location THEN go near.html
document.getElementById("btnChooseNear").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Location isn’t available on this device/browser.");
    return;
  }

  // Ask only when the user taps this (your rule)
  navigator.geolocation.getCurrentPosition(
    () => {
      locationState = "on";
      updateStatus();
      window.location.href = "near.html";
    },
    () => {
      locationState = "off";
      updateStatus();
      alert("No worries — you can enable location anytime when you want to see people near you.");
      // Stay on the landing page
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
});

// Keep these playful for now
document.getElementById("btnWave").addEventListener("click", () => {
  alert("Soon: send a wave 👋");
});

document.getElementById("btnLiveWaves").addEventListener("click", () => {
  alert("Soon: live waves feed 🌊");
});
