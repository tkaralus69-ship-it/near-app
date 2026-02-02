// profile.js — renders one profile from URL params

const card = document.getElementById("profileCard");
const qs = new URLSearchParams(location.search);

const name = qs.get("name") || "Near";
const age = qs.get("age") || "";
const loc = qs.get("loc") || "Near you";
const bio = qs.get("bio") || "";
const photo = qs.get("photo") || "img/beach.jpg";
const km = qs.get("km");

const distLine = km ? `~${Number(km).toFixed(1)} km away` : "within 1 km away";

card.innerHTML = `
  <div style="display:flex; gap:14px; align-items:center;">
    <div class="avatar" style="width:84px;height:84px;border-radius:26px;">
      <img class="avatarImg" src="${photo}" alt="" onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">
    </div>
    <div>
      <div class="pName" style="font-size:26px;">${escapeHtml(name)}${age ? `, ${escapeHtml(age)}` : ""}</div>
      <div class="pSub">${escapeHtml(loc)}</div>
      <div class="pDist">${escapeHtml(distLine)}</div>
    </div>
  </div>

  <div style="margin-top:14px; line-height:1.45; opacity:.92;">
    ${escapeHtml(bio || "No pressure. Just be real.")}
  </div>

  <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
    <button class="secondaryBtn" type="button" id="callBtn">Call</button>
    <button class="secondaryBtn" type="button" id="videoBtn">Video</button>
    <button class="primaryBtn" type="button" id="msgBtn">Message</button>
  </div>

  <div class="cardSub" style="margin-top:12px;">
    Coming next: permission-based call/video + clean UX prompts.
  </div>
`;

document.getElementById("callBtn").addEventListener("click", ()=> alert("Call: coming next ✅"));
document.getElementById("videoBtn").addEventListener("click", ()=> alert("Video: coming next ✅"));
document.getElementById("msgBtn").addEventListener("click", ()=> alert("Message: coming next ✅"));

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
