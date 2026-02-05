// ==============================
// Near - Location + Privacy Guard
// ==============================

const PRIVACY_MIN_KM = 5; // was 1km — now 5km minimum
const DEFAULT_VIBE = "city";

// Map vibes to images (adjust paths if needed)
const VIBE_IMAGES = {
  city: "img/city.jpg",     // OR "img/hero.jpg" if you want city == hero
  tech: "img/tech.jpg",
  nature: "img/nature.jpg",
  fitness: "img/fitness.jpg",
  beach: "img/beach.jpg",
  food: "img/food.jpg",
};

// If you prefer the landing “money shot” always uses hero.jpg:
const HERO_IMAGE = "img/hero.jpg";

// ------------------------------
// Helpers
// ------------------------------
function kmBetween(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function displayDistanceKm(km) {
  // Privacy: never show less than 5km
  const safe = Math.max(km, PRIVACY_MIN_KM);
  // Nice formatting
  if (safe < 10) return `${safe.toFixed(1)} km`;
  return `${Math.round(safe)} km`;
}

function setBackground(url) {
  // You likely already have a hero background element; this is the safest generic approach:
  document.documentElement.style.setProperty("--near-bg", `url('${url}')`);
}

// ------------------------------
// Vibe Selection (no navigation)
// ------------------------------
function setVibe(vibe) {
  const v = (vibe || "").toLowerCase();
  const img = VIBE_IMAGES[v] || HERO_IMAGE;

  setBackground(img);

  // Optional: update a little "Vibe: x" badge if you have one
  const badge = document.querySelector("[data-vibe-badge]");
  if (badge) badge.textContent = `Vibe: ${v}`;

  // Optional: button active state
  document.querySelectorAll("[data-vibe]").forEach(btn => {
    btn.classList.toggle("active", (btn.dataset.vibe || "").toLowerCase() === v);
  });

  // Store vibe for later pages if you want
  try { localStorage.setItem("near_vibe", v); } catch {}
}

// ------------------------------
// Location Request (ONLY on tap)
// ------------------------------
function requestLocationThenEnter() {
  if (!navigator.geolocation) {
    alert("Location isn’t supported on this device.");
    return;
  }

  // Optional: quick UI feedback
  const enterBtn = document.getElementById("enterNearBtn");
  if (enterBtn) {
    enterBtn.disabled = true;
    enterBtn.textContent = "Finding you…";
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      // Save for the live page / other screens
      try {
        localStorage.setItem("near_lat", String(latitude));
        localStorage.setItem("near_lng", String(longitude));
      } catch {}

      // ✅ Navigate to your actual live experience page
      // If your live view is index itself, change this to whatever you use.
      // Common options:
      // window.location.href = "live.html";
      // window.location.href = "profile.html";
      // window.location.href = "plans.html";
      window.location.href = "profile.html"; // <-- CHANGE THIS if your "live" page is different
    },
    (err) => {
      console.warn("Geolocation error:", err);

      // Reset button
      if (enterBtn) {
        enterBtn.disabled = false;
        enterBtn.textContent = "Enter Near (Live)";
      }

      // Friendly messaging (no guilt)
      alert("Near works best with location enabled. You can still explore vibes without it.");
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    }
  );
}

// ------------------------------
// Wire up on load
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Always start with the money-shot hero
  setBackground(HERO_IMAGE);

  // Restore last vibe if desired (or default)
  let saved = DEFAULT_VIBE;
  try { saved = localStorage.getItem("near_vibe") || DEFAULT_VIBE; } catch {}
  setVibe(saved);

  // Hook vibe buttons (these should NOT navigate)
  document.querySelectorAll("[data-vibe]").forEach(btn => {
    btn.addEventListener("click", () => setVibe(btn.dataset.vibe));
  });

  // Hook Enter Near (Live) -> ONLY place we ask for location
  const enterBtn = document.getElementById("enterNearBtn");
  if (enterBtn) enterBtn.addEventListener("click", requestLocationThenEnter);

  // Optional: also ask location when tapping "See Live waves"
  const liveWavesBtn = document.getElementById("liveWavesBtn");
  if (liveWavesBtn) liveWavesBtn.addEventListener("click", requestLocationThenEnter);

  // Update privacy text if you have a target element
  const privacyLine = document.querySelector("[data-privacy-line]");
  if (privacyLine) privacyLine.textContent = `Distances shown as a minimum of ${PRIVACY_MIN_KM} km for privacy.`;
});

// ------------------------------------------------------
// If you render distances anywhere, use displayDistanceKm
// Example:
//   distanceEl.textContent = displayDistanceKm(kmBetween(...));
// ------------------------------------------------------
