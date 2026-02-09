// index.js — Home page logic

const vibeButtons = document.querySelectorAll("[data-vibe]");
const hero = document.getElementById("hero");
const vibeLabel = document.getElementById("vibeLabel");

const vibeToImg = {
  city: "city.jpg",
  tech: "tech.jpg",
  nature: "nature.jpg",
  fitness: "fitness.jpg",
  beach: "beach.jpg",
  food: "food.jpg"
};

// restore saved vibe
const savedVibe = localStorage.getItem("near_vibe");
if (savedVibe && vibeToImg[savedVibe]) {
  applyVibe(savedVibe);
}

// vibe button clicks
vibeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const vibe = btn.dataset.vibe;
    localStorage.setItem("near_vibe", vibe);
    applyVibe(vibe);
  });
});

function applyVibe(vibe) {
  hero.style.background =
    `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
     linear-gradient(180deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,.32) 55%, rgba(0,0,0,.38) 100%),
     url("img/${vibeToImg[vibe]}") center/cover no-repeat`;

  if (vibeLabel) vibeLabel.textContent = `Vibe: ${vibe}`;
}

// blue buttons
document.getElementById("btnNear")?.addEventListener("click", () => {
  window.location.href = "near.html";
});

document.getElementById("btnCreate")?.addEventListener("click", () => {
  window.location.href = "create.html";
});

document.getElementById("btnMe")?.addEventListener("click", () => {
  window.location.href = "profile.html";
});
