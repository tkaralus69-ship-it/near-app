document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("location");

  if (!statusEl) {
    console.error("❌ #location element not found");
    return;
  }

  if (!("geolocation" in navigator)) {
    statusEl.textContent = "❌ Geolocation not supported";
    return;
  }

  statusEl.textContent = "📍 Requesting location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);

      statusEl.textContent = `📍 Location: ${lat}, ${lon}`;
      console.log("✅ Location success", lat, lon);
    },
    (error) => {
      console.error("❌ Location error", error);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          statusEl.textContent = "❌ Permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          statusEl.textContent = "❌ Position unavailable";
          break;
        case error.TIMEOUT:
          statusEl.textContent = "❌ Location timeout";
          break;
        default:
          statusEl.textContent = "❌ Unknown location error";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
});
