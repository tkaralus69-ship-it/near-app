// near.js — People Near page logic

const hero = document.getElementById("hero");
const enableBtn = document.getElementById("enableBtn");
const peopleList = document.getElementById("peopleList");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const vibeToImg = {
  city: "city.jpg",
  tech: "tech.jpg",
  nature: "nature.jpg",
  fitness: "fitness.jpg",
  beach: "beach.jpg",
  food: "food.jpg"
};

// apply saved vibe background
const savedVibe = localStorage.getItem("near_vibe");
if (savedVibe && vibeToImg[savedVibe]) {
  hero.style.background =
    `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
     linear-gradient(180deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.32) 55%, rgba(0,0,0,.38) 100%),
     url("img/${vibeToImg[savedVibe]}") center/cover no-repeat`;
}

// restore location state
const locOn = localStorage.getItem("near_loc_on") === "1";
if (locOn) {
  setStatus(true, "Location on");
  enableBtn.style.display = "none";
  peopleList.style.display = "grid";
}

// enable location
enableBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Location not supported");
    return;
  }

  statusText.textContent = "Requesting…";

  navigator.geolocation.getCurrentPosition(
    () => {
      localStorage.setItem("near_loc_on", "1");
      setStatus(true, "Location on");
      enableBtn.style.display = "none";
      peopleList.style.display = "grid";
    },
    () => {
      setStatus(false, "Location off");
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

function setStatus(on, text) {
  statusText.textContent = text;
  statusDot.style.background = on
    ? "rgba(0,255,180,.9)"   // green
    : "rgba(255,255,255,.35)";
}
