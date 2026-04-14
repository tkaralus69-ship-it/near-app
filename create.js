// create.js — NEAR profile save to Firestore + local backup + live location

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function getValue(selectors, fallback = "") {
    for (const sel of selectors) {
      const el = $(sel);
      if (!el) continue;

      if (el.type === "checkbox") return !!el.checked;
      if (el.type === "range") return el.value;
      return (el.value ?? el.textContent ?? "").toString().trim();
    }
    return fallback;
  }

  function setStatus(message, isError = false) {
    const statusEl =
      $("#saveStatus") ||
      $(".status") ||
      $("#status") ||
      $(".save-status");

    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = isError
        ? "rgba(255,120,120,.95)"
        : "rgba(255,255,255,.72)";
    } else {
      alert(message);
    }
  }

  function getSelectedVibe() {
    const activeChip =
      $(".chip.active") ||
      $('[data-vibe].active') ||
      $('[aria-pressed="true"]');

    if (!activeChip) return "";

    return (
      activeChip.dataset.value ||
      activeChip.dataset.vibe ||
      activeChip.textContent ||
      ""
    ).trim();
  }

  function getPhotoData() {
    const img =
      $("#photoImg") ||
      $("#photoPreview img") ||
      $(".photo img");

    if (img && img.src && img.src.startsWith("data:image")) {
      return img.src;
    }

    try {
      const saved = JSON.parse(localStorage.getItem("nearProfile") || "{}");
      return saved.photoDataUrl || "";
    } catch {
      return "";
    }
  }

  function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.warn("Location error:", error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }

  async function buildProfilePayload(user) {
    const name = getValue(["#nameInput", "#name", 'input[name="name"]']);
    const age = getValue(["#ageInput", "#age", 'input[name="age"]']);
    const bio = getValue(["#bioInput", "#bio", 'textarea[name="bio"]']);
    const status = getValue([
      "#statusInput",
      "#statusLine",
      "#headline",
      'input[name="status"]'
    ]);
    const city = getValue(["#cityInput", "#city", 'input[name="city"]']);
    const distance = getValue([
      "#distanceRange",
      "#maxDistanceKm",
      'input[name="distance"]'
    ], "15");
    const ageMin = getValue(["#ageMin", 'input[name="ageMin"]'], "18");
    const ageMax = getValue(["#ageMax", 'input[name="ageMax"]'], "99");
    const visible = getValue(
      ["#visibilityToggle", "#visibleToggle", 'input[name="visible"]'],
      true
    );
    const vibe = getSelectedVibe();
    const photoDataUrl = getPhotoData();

    const location = await getCurrentLocation();

    return {
      uid: user.uid,
      email: user.email || "",
      name,
      age: age ? Number(age) : null,
      bio,
      status,
      city,
      vibe,
      maxDistanceKm: Number(distance || 15),
      preferredAgeMin: Number(ageMin || 18),
      preferredAgeMax: Number(ageMax || 99),
      visible: Boolean(visible),
      photoDataUrl,
      lat: location ? location.lat : null,
      lng: location ? location.lng : null,
      locationUpdatedAt: location ? Date.now() : null,
      updatedAt: Date.now()
    };
  }

  async function saveProfile() {
    if (!window.firebase || !firebase.auth || !firebase.firestore) {
      setStatus("Firebase not loaded", true);
      return;
    }

    const user = firebase.auth().currentUser;

    if (!user) {
      setStatus("Not signed in. Sending to auth…", true);
      setTimeout(() => {
        window.location.href = "auth.html";
      }, 600);
      return;
    }

    setStatus("Getting location...");

    const profile = await buildProfilePayload(user);

    if (!profile.name) {
      setStatus("Please add your name", true);
      return;
    }

    setStatus("Saving profile...");

    try {
      await firebase.firestore().collection("profiles").doc(user.uid).set(
        profile,
        { merge: true }
      );

      localStorage.setItem("nearProfile", JSON.stringify(profile));

      setStatus("Profile saved ✓");
    } catch (error) {
      console.error("Save failed:", error);
      setStatus(`Save failed: ${error.message}`, true);
    }
  }

  function wireSaveButton() {
    const saveBtn =
      $("#saveBtn") ||
      $(".save-btn") ||
      $('button[type="submit"]') ||
      $('button[data-action="save-profile"]');

    if (!saveBtn) {
      console.warn("No save button found on create page.");
      return;
    }

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveProfile();
    });
  }

  function wireAuthGuard() {
    if (!window.firebase || !firebase.auth) {
      setStatus("Firebase auth not loaded", true);
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        setStatus("Please sign in first...");
        setTimeout(() => {
          window.location.href = "auth.html";
        }, 500);
      } else {
        console.log("Signed in:", user.email || user.uid);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireAuthGuard();
    wireSaveButton();
  });
})();
