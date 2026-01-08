const waveBtn = document.getElementById("waveBtn");
const textGateOverlay = document.getElementById("textGateOverlay");
const textGateInput = document.getElementById("textGateInput");
const textGateSend = document.getElementById("textGateSend");
const textGateCancel = document.getElementById("textGateCancel");

waveBtn.addEventListener("click", () => {
  textGateOverlay.classList.remove("hidden");
});

textGateSend.addEventListener("click", () => {
  const msg = textGateInput.value.trim();
  if (!msg) return;

  console.log("Sending:", msg);

  textGateOverlay.classList.add("hidden");
  textGateInput.value = "";

  showSentMessage();
});

textGateCancel.addEventListener("click", () => {
  textGateOverlay.classList.add("hidden");
});

function showSentMessage() {
  const sent = document.createElement("div");
  sent.className = "sent-banner";
  sent.innerHTML = `
    <div class="sent-title">Sent</div>
    <div class="sent-body">
      If it’s meant, you’ll hear back.<br/>
      Go live your life.
    </div>
  `;
  document.body.appendChild(sent);

  setTimeout(() => sent.remove(), 3500);
}
