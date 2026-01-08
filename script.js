// =====================================================
// NEAR APP UI FLOW SCRIPT (UI + STATES)
// =====================================================

// Elements
const peopleContainer = document.getElementById("people-container");
const waveFooter = document.getElementById("wave-footer");
const waveBtn = document.getElementById("wave-btn");
const statusEl = document.getElementById("status");

// Optional message gate elements (spawn on demand)
let messageInput, sendBtn, laterBtn;

// =====================================================
// STATE (mock + future Firestore binding)
// =====================================================

let currentPerson = null;
let waved = false;
let gateOpen = false;

// Mock fetch nearby (replace later w/ Firebase)
function fetchNearby() {
  statusEl.textContent = "Finding people...";
  
  // Simulate find
  setTimeout(() => {
    currentPerson = { name: "Bob", age: 30, status: "Just chillin" };
    renderPerson(currentPerson);
    statusEl.textContent = "";
  }, 900);
}

// =====================================================
// RENDERS
// =====================================================

function renderPerson(person) {
  peopleContainer.innerHTML = `
    <div class="person-card">
      <div class="person-pfp"></div>
      <div class="person-info">
        <div class="person-name">${person.name} ${person.age}s</div>
        <div class="person-status">${person.status}</div>
      </div>
    </div>
  `;

  waveFooter.style.display = "block";
}

// Wave → Message Gate
function openMessageGate() {
  if (gateOpen) return;
  gateOpen = true;

  const gate = document.createElement("div");
  gate.id = "message-box";
  gate.innerHTML = `
    <input id="message-input" type="text" placeholder="One message. Kind. Real." />
    <button id="send-btn">Send</button>
    <button id="later-btn">Later</button>
  `;
  peopleContainer.appendChild(gate);

  messageInput = document.getElementById("message-input");
  sendBtn = document.getElementById("send-btn");
  laterBtn = document.getElementById("later-btn");

  sendBtn.onclick = sendMessage;
  laterBtn.onclick = maybeLater;
}

// =====================================================
// ACTIONS
// =====================================================

function wave() {
  if (waved) return;
  waved = true;

  waveBtn.textContent = "Waved 👋";
  waveBtn.disabled = true;

  // Open gate
  openMessageGate();
}

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  // Placeholder for Firestore send:
  console.log("SENT:", msg);

  statusEl.textContent = "Message sent.";
  
  closeGate();
}

function maybeLater() {
  statusEl.textContent = "Maybe later.";
  closeGate();
}

function closeGate() {
  gateOpen = false;
  const gate = document.getElementById("message-box");
  if (gate) gate.remove();
}

// =====================================================
// INIT
// =====================================================

waveFooter.style.display = "none"; // hidden until someone found
waveBtn.onclick = wave;

fetchNearby();
