// script.js — NEAR landing page
// Fixes:
// - buttons working
// - primary blue button styling
// - vibe persistence
// - location badge green dot
// - Firebase auth guard

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // --- vibe backgrounds (must exist in /img/)
  const vibeToImg = {
    city: "city.jpg",
    tech: "tech.jpg",
    nature: "nature.jpg",
    fitness: "fitness.jpg",
    beach: "beach.jpg",
    food: "food.jpg",
  };

  function normVibe(v) {
    return (v || "").toLowerCase().trim();
  }

  function setHeroBackground(heroEl, vibe) {
    if (!heroEl) return;
    const v = normVibe(vibe);
    const img = vibeToImg[v] || "hero.jpg";

    heroEl.style.background = `
      radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
      linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.24) 55%, rgba(0,0,0,.28) 100%),
      url("img/${img}") center top / cover no-repeat
    `;
  }

  function setActiveVibeButtons(vibe) {
    const v = normVibe(vibe);
    const vibeBtns = $$(".vibe");

    vibeBtns.forEach((btn) => {
      const label = normVibe(btn.textContent);
      const isActive = label === v;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function setStatusPill(vibe) {
    const status = $(".statusPill");
    if (!status) return;

    const dot = $(".dot", status);
    const locOn = localStorage.getItem("near_loc_on") === "1";
    const v = normVibe(vibe) || "—";
    const text = `Vibe: ${v} • Location ${locOn ? "on" : "off"}`;

    const textNode = status.querySelector(".statusText");

    if (textNode) {
      textNode.textContent = text;
    } else {
      Array.from(status.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) n.nodeValue = "";
      });

      status.setAttribute("aria-label", text);

      let span = status.querySelector("span._autoText");
      if (!span) {
        span = document.createElement("span");
        span.className = "_autoText";
        status.appendChild(span);
      }
      span.textContent = text;
    }

    if (dot) {
      dot.style.background = locOn
        ? "rgba(0,255,180,.85)"
        : "rgba(255,255,255,.35)";
      dot.style.boxShadow = locOn
        ? "0 0 0 4px rgba(0,255,180,.14)"
        : "0 0 0 4px rgba(255,255,255,.10)";
    }
  }

  function makePrimary(btn) {
    if (!btn) return;
    btn.classList.add("primary");
  }

  function wireButtonByText(text, onClick) {
    const btns = $$("button, a");
    const found = btns.find((b) => normVibe(b.textContent) === normVibe(text));
    if (!found) return null;

    found.addEventListener("click", (e) => {
      e.preventDefault();
      onClick();
    });

    return found;
  }

  function toast(msg) {
    let t = $("#nearToast");

    if (!t) {
      t = document.createElement("div");
      t.id = "nearToast";
      t.style.position = "fixed";
      t.style.left = "50%";
      t.style.bottom = "18px";
      t.style.transform = "translateX(-50%)";
      t.style.padding = "12px 14px";
      t.style.borderRadius = "14px";
      t.style.background = "rgba(0,0,0,.55)";
      t.style.border = "1px solid rgba(255,255,255,.14)";
      t.style.backdropFilter = "blur(12px)";
      t.style.webkitBackdropFilter = "blur(12px)";
      t.style.color = "rgba(255,255,255,.92)";
      t.style.fontWeight = "700";
      t.style.zIndex = "9999";
      t.style.maxWidth = "92vw";
      t.style.textAlign = "center";
      t.style.opacity = "0";
      t.style.transition = "opacity .18s ease";
      document.body.appendChild(t);
    }

    t.textContent = msg;
    t.style.opacity = "1";

    clearTimeout(window.__nearToastTimer);
    window.__nearToastTimer = setTimeout(() => {
      t.style.opacity = "0";
    }, 1600);
  }

  function wireAuthGuard() {
    if (!window.firebase || !firebase.auth) {
      console.warn("Firebase auth not loaded on landing page.");
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("User signed in:", user.email || user.uid);
      } else {
        window.location.href = "auth.html";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const hero = $("#hero") || $(".hero") || document.body;

    // --- Firebase auth check
    wireAuthGuard();

    // --- apply last vibe everywhere
    const savedVibe = normVibe(localStorage.getItem("near_vibe")) || "nature";
    setHeroBackground(hero, savedVibe);
    setActiveVibeButtons(savedVibe);
    setStatusPill(savedVibe);

    // --- vibe selection
    $$(".vibe").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = normVibe(btn.textContent);
        localStorage.setItem("near_vibe", v);
        setHeroBackground(hero, v);
        setActiveVibeButtons(v);
        setStatusPill(v);
      });
    });

    // --- buttons
    const btnNear = wireButtonByText("Choose someone Near", () => {
      window.location.href = "near.html";
    });
    makePrimary(btnNear);

    const btnCreate = wireButtonByText("Create", () => {
      window.location.href = "create.html";
    });
    makePrimary(btnCreate);

    wireButtonByText("Me", () => {
      window.location.href = "profile.html";
    });

    wireButtonByText("Send a Wave", () => {
      toast("Waves are next ✨");
    });

    wireButtonByText("Live Waves", () => {
      toast("Live Waves soon 🌊");
    });

    // --- keep status pill accurate
    window.addEventListener("focus", () => {
      const v = normVibe(localStorage.getItem("near_vibe")) || "nature";
      setStatusPill(v);
    });
  });
})();
