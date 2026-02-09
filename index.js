// index.js (landing page)
// Uses localStorage:
// - near_vibe (city|tech|nature|fitness|beach|food)
// - near_loc_on ("1" when user enabled location in near.html)

const hero = document.getElementById("hero");
const vibeText = document.getElementById("vibeText");
const locDot = document.getElementById("locDot");
const vibeGrid = document.getElementById("vibeGrid");

const vibeImages = {
  city: "city.jpg",
  tech: "tech.jpg",
  nature: "nature.jpg",
  fitness: "fitness.jpg",
  beach: "beach.jpg",
  food: "food.jpg",
};

function isLocOn(){
  return localStorage.getItem("near_loc_on") === "1";
}

function setHeroBackground(filename){
  hero.style.background =
    `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
     linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.22) 55%, rgba(0,0,0,.26) 100%),
     url("img/${filename}") center/cover no-repeat`;
}

function updateStatus(){
  const vibe = localStorage.getItem("near_vibe") || "nature";
  const loc = isLocOn() ? "Location on" : "Location off";
  vibeText.textContent = `Vibe: ${vibe} · ${loc}`;

  // ✅ Dot is green when on, muted when off
  locDot.style.background = isLocOn()
    ? "rgba(0,255,180,.85)"
    : "rgba(255,255,255,.35)";
}

function setVibe(vibe){
  localStorage.setItem("near_vibe", vibe);
  setHeroBackground(vibeImages[vibe] || "hero.jpg");

  // ✅ highlight selected vibe
  document.querySelectorAll(".vibe").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.vibe === vibe);
  });

  updateStatus();
}

// Restore vibe on load
setVibe(localStorage.getItem("near_vibe") || "nature");

// Vibe click
vibeGrid.querySelectorAll(".vibe").forEach(btn => {
  btn.addEventListener("click", () => setVibe(btn.dataset.vibe));
});

// Buttons
document.getElementById("btnNear").addEventListener("click", () => {
  window.location.href = "near.html";
});

document.getElementById("btnCreate").addEventListener("click", () => {
  window.location.href = "create.html";
});

document.getElementById("btnMe").addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Placeholders
document.getElementById("btnWave").addEventListener("click", () => {
  alert("Soon: send a wave 👋");
});
document.getElementById("btnLive").addEventListener("click", () => {
  alert("Soon: live waves 🌊");
});

// If location was enabled/disabled in another page, keep pill accurate
window.addEventListener("focus", updateStatus);
