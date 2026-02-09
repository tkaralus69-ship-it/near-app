// index.js — homepage wiring

document.addEventListener("DOMContentLoaded", () => {

  const go = (path) => {
    window.location.href = path;
  };

  // Primary blue CTA
  const chooseNear = document.getElementById("btnChooseNear");
  if (chooseNear) chooseNear.onclick = () => go("near.html");

  // Secondary actions
  const sendWave = document.getElementById("btnSendWave");
  if (sendWave) sendWave.onclick = () => go("near.html");

  const liveWaves = document.getElementById("btnLiveWaves");
  if (liveWaves) liveWaves.onclick = () => go("near.html");

  // Profile buttons
  const btnCreate = document.getElementById("btnCreate");
  if (btnCreate) btnCreate.onclick = () => go("create.html");

  const btnMe = document.getElementById("btnMe");
  if (btnMe) btnMe.onclick = () => go("profile.html");

});
