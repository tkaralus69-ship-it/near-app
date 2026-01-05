document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");

  if (!status) return;

  // Initial calm presence
  status.textContent = "Finding people near you...";

  // Gentle transition (future-ready)
  setTimeout(() => {
    status.textContent = "Real people. Near you.";
  }, 2500);
});
