// near.js

const hero = document.getElementById("hero");
const enableBtn = document.getElementById("enableBtn");
const peopleList = document.getElementById("peopleList");
const statusText = document.getElementById("statusText");
const statusDot  = document.getElementById("statusDot");

const vibeToImg = {
  city: "city.jpg",
  tech: "tech.jpg",
  nature: "nature.jpg",
  fitness: "fitness.jpg",
  beach: "beach.jpg",
  food: "food.jpg"
};

const savedVibe = localStorage.getItem("near_vibe");
if (savedVibe && vibeToImg[savedVibe]) {
  hero.style.background =
    `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
     linear-gradient(180deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.32) 55%, rgba(0,0,0,.38) 100%),
     url("img/${vibeToImg[savedVibe]}") center/cover no-repeat`;
}

document.getElementById("backBtn").addEventListener("click", () => {
  if (document.referrer) history.back();
  else window.location.href = "index.html";
});

function setStatus(on, text){
  statusText.textContent = text;
  statusDot.style.background = on
    ? "rgba(0,255,180,.85)"
    : "rgba(255,255,255,.35)";
}

enableBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus(false, "No GPS");
    alert("This device/browser doesn't support location.");
    return;
  }

  setStatus(false, "Requesting…");

  navigator.geolocation.getCurrentPosition(
    () => {
      setStatus(true, "Location on");
      localStorage.setItem("near_loc_on", "1");
      enableBtn.style.display = "none";
      peopleList.style.display = "grid";
    },
    () => {
      setStatus(false, "Location off");
      alert("No worries — you can enable location anytime.");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
});
