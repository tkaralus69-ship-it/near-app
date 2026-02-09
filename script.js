// script.js — NEAR landing page
// Fixes: buttons not working, primary blue button styling, vibe persistence, location badge green dot.

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

    // IMPORTANT: keep it “look-through window” (light overlay)
    heroEl.style.background =
      `radial-gradient(1200px 800px at 50% 18%, rgba(255,255,255,.10), transparent 55%),
       linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.24) 55%, rgba(0,0,0,.28) 100%),
       url("img/${img}") center top/cover no-repeat`;
  }

  function setActiveVibeButtons(vibe) {
    const v = normVibe(vibe);
    const vibeBtns = $$(".vibe");
    vibeBtns.forEach((btn) => {
      const label = normVibe(btn.textContent);
      btn.classList.toggle("active", label === v);
      btn.setAttribute("aria-pressed", label === v ? "true" : "false");
    });
  }

  function setStatusPill(vibe) {
    const status = $(".statusPill");
    if (!status) return;

    // we expect: .statusPill contains .dot and text like “Vibe: x • Location off”
    const dot = $(".dot", status);
    const locOn = localStorage.getItem("near_loc_on") === "1";

    const v = normVibe(vibe) || "—";
    const text = `Vibe: ${v} • Location ${locOn ? "on" : "off"}`;

    // write text safely (works regardless of how you structured the pill)
    const textNode = status.querySelector(".statusText");
    if (textNode) textNode.textContent = text;
    else {
      // fallback: keep dot, then set rest of text
      // remove existing text nodes except dot
      Array.from(status.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) n.nodeValue = "";
      });
      status.setAttribute("aria-label", text);
      // if there isn't a dedicated span, just append a span
      let span = status.querySelector("span._autoText");
      if (!span) {
        span = document.createElement("span");
        span.className = "_autoText";
        status.appendChild(span);
      }
      span.textContent = text;
    }

    if (dot) {
      dot.style.background = locOn ? "rgba(0,255,180,.85)" : "rgba(255,255,255,.35)";
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
    // tiny no-fuss toast
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
    window.__nearToastTimer = setTimeout(() => (t.style.opacity = "0"), 1600);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const hero = $("#hero") || $(".hero") || document.body;

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

    // --- IMPORTANT BUTTONS (make them work + make primary blue)
    // Choose someone Near -> near.html
    const btnNear = wireButtonByText("Choose someone Near", () => {
      window.location.href = "near.html";
    });
    makePrimary(btnNear);

    // Create -> create.html
    const btnCreate = wireButtonByText("Create", () => {
      window.location.href = "create.html";
    });
    // On landing, Create should also feel important (blue)
    makePrimary(btnCreate);

    // Me -> profile.html
    wireButtonByText("Me", () => {
      window.location.href = "profile.html";
    });

    // Send a Wave -> placeholder (until we build chat/waves)
    wireButtonByText("Send a Wave", () => {
      toast("Waves are next ✨");
    });

    // Live Waves -> placeholder
    wireButtonByText("Live Waves", () => {
      toast("Live Waves soon 🌊");
    });

    // Keep status pill always accurate when returning from other pages
    window.addEventListener("focus", () => {
      const v = normVibe(localStorage.getItem("near_vibe")) || "nature";
      setStatusPill(v);
    });
  });
})();
