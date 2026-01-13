// script.js (PATCH-FRIENDLY FULL)
// Paste this at the TOP of your existing script.js (or merge it in).
// It won't break Firebase; it only handles promo cards + vibe backgrounds.

const VIBE_IMAGES = {
  city:  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=60",
  beach: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=60",
  forest:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=60",
  space: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1400&q=60"
};

// ---- Promo grid behavior ----
function wirePromoCards() {
  document.querySelectorAll(".promoCard[data-jump]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      // If jump target is the wave button, click it for you
      if (id === "waveBtn") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.click(), 250);
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ---- Vibe background behavior ----
function applyVibe(theme) {
  const url = VIBE_IMAGES[theme] || VIBE_IMAGES.city;

  // background layer
  const vibeLayer = document.querySelector(".bgVibe");
  if (vibeLayer) vibeLayer.style.backgroundImage = `url("${url}")`;

  // promo cards all use the same vibe image (looks cohesive)
  document.querySelectorAll(".promoCard").forEach((card) => {
    card.style.setProperty("--promoImage", `url("${url}")`);
  });
}

// ---- Wire vibe buttons (compatible with your current UI) ----
function wireVibeButtons() {
  const btns = document.querySelectorAll(".vibeBtn");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const theme = b.dataset.theme || "city";
      applyVibe(theme);

      // if your Firebase code tracks theme, it can keep doing that.
      // we do not overwrite your storage logic here.
    });
  });

  // init from currently active button
  const active = document.querySelector(".vibeBtn.active");
  applyVibe(active?.dataset?.theme || "city");
}

document.addEventListener("DOMContentLoaded", () => {
  wirePromoCards();
  wireVibeButtons();
});

/*
IMPORTANT:
- Keep your existing Firebase/auth/location/waves code BELOW this.
- If you want, paste your whole current script.js here and I’ll merge cleanly into one file.
*/
