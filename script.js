// script.js (ES module) — FULL (6 VIBES + TRIAL + PAYWALL + FEEDBACK + LIVE WAVES)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (yours)
=========================== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===========================
   UI
=========================== */
const statusLine = document.getElementById("statusLine");
const pillStatus  = document.getElementById("pillStatus");
const bannerWrap  = document.getElementById("bannerWrap");

const peopleList = document.getElementById("people");
const wavesFeed  = document.getElementById("wavesFeed");

const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const waveBtn   = document.getElementById("waveBtn");
const manageBtn = document.getElementById("manageBtn");

/* Wave modal */
const waveModal    = document.getElementById("waveModal");
const waveBackdrop = waveModal?.querySelector(".modalBackdrop");
const waveText     = document.getElementById("waveText");
const countEl      = document.getElementById("count");
const sendBtn      = document.getElementById("sendBtn");
const laterBtn     = document.getElementById("laterBtn");

/* Plans + Feedback + Gate */
const plansModal    = document.getElementById("plansModal");
const feedbackModal = document.getElementById("feedbackModal");
const gateModal     = document.getElementById("gateModal");

const plansState  = document.getElementById("plansState");
const planMonthly = document.getElementById("planMonthly");
const planYearly  = document.getElementById("planYearly");
const gateMonthly = document.getElementById("gateMonthly");
const gateYearly  = document.getElementById("gateYearly");

const feedbackBtn        = document.getElementById("feedbackBtn");
const feedbackText       = document.getElementById("feedbackText");
const fbCount            = document.getElementById("fbCount");
const submitFeedbackBtn  = document.getElementById("submitFeedbackBtn");

/* ===========================
   VIBE IMAGES (LOCAL first, fallback remote)
   ✅ IMPORTANT: no leading slash
   Put images here:
   /img/city.jpg, tech.jpg, nature.jpg, fitness.jpg, beach.jpg, food.jpg
=========================== */
const VIBE_IMAGES_LOCAL = {
  city:   "img/city.jpg",
  tech:   "img/tech.jpg",
  nature: "img/nature.jpg",
  fitness:"img/fitness.jpg",
  beach:  "img/beach.jpg",
  food:   "img/food.jpg"
};

// Fallbacks (only used if local fails)
const VIBE_IMAGES_REMOTE = {
  city:   "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2000&q=70",
  tech:   "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=70",
  nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=70",
  fitness:"https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=2000&q=70",
  beach:  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=70",
  food:   "https://images.unsplash.com/photo-1556912167-f556f1f39df8?auto=format&fit=crop&w=2000&q=70"
};

const THEMES = {
  city:   { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  tech:   { bg1:"#2a2240", bg2:"#070312", a1:"#c4b5fd", a2:"#a78bfa" },
  nature: { bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  fitness:{ bg1:"#2b2f3a", bg2:"#0a0c12", a1:"#fcd34d", a2:"#fb7185" },
  beach:  { bg1:"#1f3a4a", bg2:"#061018", a1:"#7dd3fc", a2:"#a5f3fc" },
  food:   { bg1:"#3a2f2a", bg2:"#120a07", a1:"#fdba74", a2:"#fb923c" }
};

function setTheme(key){
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

function imageLoads(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=> resolve(true);
    img.onerror = ()=> resolve(false);
    img.src = src;
  });
}

async function resolveVibeImage(theme){
  const local = VIBE_IMAGES_LOCAL[theme];
  const remote = VIBE_IMAGES_REMOTE[theme] || VIBE_IMAGES_REMOTE.city;

  if (!local) return remote;
  const ok = await imageLoads(local);
  return ok ? local : remote;
}

async function applyVibe(theme){
  const url = await resolveVibeImage(theme);
  const layer = document.querySelector(".bgVibe");
  if (layer) layer.style.backgroundImage = `url("${url}")`;
  setTheme(theme);
}

/* ===========================
   PROMO JUMPS
=========================== */
function wirePromoCards() {
  document.querySelectorAll(".promoCard[data-jump]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "waveBtn") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.click(), 200);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ===========================
   PEOPLE (demo)
=========================== */
function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

const usedAvatarKeys = new Set();
function avatarUrl(gender, id){
  const g = gender === "f" ? "women" : "men";
  const safeId = Math.max(0, Math.min(99, Number(id || 0)));
  return `https://randomuser.me/api/portraits/${g}/${safeId}.jpg`;
}
function uniqueAvatar(gender, preferredId){
  let id = Number(preferredId || 0) % 100;
  for (let tries = 0; tries < 120; tries++){
    const key = `${gender}:${id}`;
    if (!usedAvatarKeys.has(key)){
      usedAvatarKeys.add(key);
      return avatarUrl(gender, id);
    }
    id = (id + 7) % 100;
  }
  return avatarUrl(gender, preferredId || 0);
}

/* First profile = YOU (placeholder image for now)
   When you’re ready, replace img/me.jpg with your uploaded photo.
*/
const ME_PROFILE = {
  name: "Tone",
  age: 57,
  gender: "m",
  bio: "Kangaroo Island • music, art, nature, animals & life. Positive vibrations. Hoping to find someone who can pick up what I’m putting down.",
  km: 1.0,
  avatarLocal: "img/me.jpg"
};

const PEOPLE_BY_VIBE = {
  city: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"Jade", age:31, gender:"f", bio:"Coffee nearby • day streets", km:1.2, avatarId:14 },
    { name:"Luke", age:38, gender:"m", bio:"Tradie • finishing a job", km:2.2, avatarId:93 },
    { name:"Elena", age:27, gender:"f", bio:"Late snack • good chats", km:0.7, avatarId:45 },
    { name:"Michael", age:42, gender:"m", bio:"Taking it slow • skyline", km:3.4, avatarId:27 }
  ],
  tech: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"Sophie", age:29, gender:"f", bio:"Design + dev • headphones on", km:2.4, avatarId:16 },
    { name:"Nina",   age:32, gender:"f", bio:"Gaming night • chill co-op?", km:1.9, avatarId:48 },
    { name:"Omar",   age:41, gender:"m", bio:"Writing code • coffee fuel", km:3.7, avatarId:35 },
    { name:"Casey",  age:37, gender:"m", bio:"IT support • steady vibes", km:0.8, avatarId:25 }
  ],
  nature: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"Mia",  age:29, gender:"f", bio:"Forest air • quiet mind", km:0.6, avatarId:22 },
    { name:"Noah", age:36, gender:"m", bio:"Coastal walk • no rush", km:1.8, avatarId:11 },
    { name:"Kai",  age:33, gender:"m", bio:"Hiking • simple life", km:3.6, avatarId:39 },
    { name:"Rose", age:57, gender:"f", bio:"Tea after a walk", km:4.1, avatarId:80 }
  ],
  fitness: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"Asha",  age:30, gender:"f", bio:"Runner • steady pace", km:1.6, avatarId:9 },
    { name:"Tahlia",age:28, gender:"f", bio:"Pilates • strong + calm", km:3.0, avatarId:33 },
    { name:"Ethan", age:44, gender:"m", bio:"Gym then smoothie", km:2.1, avatarId:52 },
    { name:"Mark",  age:58, gender:"m", bio:"Daily walk • feeling good", km:4.4, avatarId:88 }
  ],
  beach: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"Ivy",   age:28, gender:"f", bio:"Sunshine walk • ocean air", km:0.8, avatarId:30 },
    { name:"Josh",  age:40, gender:"m", bio:"Beach run • no rush", km:1.4, avatarId:41 },
    { name:"Kira",  age:33, gender:"f", bio:"Blue water • good laughs", km:2.6, avatarId:24 },
    { name:"Mara",  age:55, gender:"f", bio:"Coffee by the water", km:4.7, avatarId:12 }
  ],
  food: [
    { ...ME_PROFILE, km: 1.0 },
    { name:"May",   age:34, gender:"f", bio:"Testing a new recipe", km:0.9, avatarId:62 },
    { name:"Luca",  age:39, gender:"m", bio:"Cooking pasta • slow night", km:1.4, avatarId:21 },
    { name:"Elise", age:29, gender:"f", bio:"Baking bread • cozy", km:3.1, avatarId:18 },
    { name:"Jonah", age:47, gender:"m", bio:"Kitchen radio • soup on", km:2.6, avatarId:84 }
  ]
};

async function renderPeople(vibe){
  usedAvatarKeys.clear();
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city).slice(0, 5);

  peopleList.innerHTML = "";

  for (const p of arr){
    const li = document.createElement("li");

    let avatarSrc = "";
    if (p.avatarLocal){
      const ok = await imageLoads(p.avatarLocal);
      avatarSrc = ok ? p.avatarLocal : uniqueAvatar(p.gender === "f" ? "f" : "m", p.avatarId);
    } else {
      avatarSrc = uniqueAvatar(p.gender === "f" ? "f" : "m", p.avatarId);
    }

    li.innerHTML = `
      <div class="avatar" aria-hidden="true">
        <img class="avatarImg" src="${avatarSrc}" alt="" loading="lazy"
          onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">
      </div>
      <div>
        <div class="pName">${escapeHtml(p.name)}, ${escapeHtml(p.age)}</div>
        <div class="pSub">${escapeHtml(p.bio)}</div>
        <div class="pDist">${escapeHtml(kmMin1(p.km))}</div>
      </div>
    `;
    peopleList.appendChild(li);
  }
}

/* ===========================
   GEO
=========================== */
let lastGeo = null;
function startGeo(){
  if (!("geolocation" in navigator)) {
    pillStatus.textContent = "No location";
    return;
  }
  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus.textContent = "Up to date";
    },
    ()=>{
      pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* ===========================
   TRIAL + ACCESS LOGIC
=========================== */
const TRIAL_DAYS = 7;
const BONUS_DAYS = 7;

let myUid = null;
let userState = null;

function nowMs(){ return Date.now(); }
function toMs(ts){
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  return null;
}
function sameDay(msA, msB){
  if (!msA || !msB) return false;
  const a = new Date(msA); const b = new Date(msB);
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function computeAccess(u){
  const planActive = !!u.planActive;
  const plan = u.plan || "free";

  const start = toMs(u.trialStartAt) || nowMs();
  const extra = Number(u.trialExtraDays || 0);
  const trialEnds = start + (TRIAL_DAYS + extra) * 24*60*60*1000;

  const dayNumber = Math.floor((nowMs() - start) / (24*60*60*1000)) + 1;
  const msLeft = trialEnds - nowMs();

  if (planActive) return { mode:"full", plan, dayNumber, trialEnds, msLeft };
  if (nowMs() >= trialEnds) return { mode:"readonly", plan:"free", dayNumber, trialEnds, msLeft:0 };
  return { mode:"trial", plan:"free", dayNumber, trialEnds, msLeft };
}

function formatDaysLeft(msLeft){
  const d = Math.max(0, Math.ceil(msLeft / (24*60*60*1000)));
  if (d === 0) return "0 days";
  if (d === 1) return "1 day";
  return `${d} days`;
}

/* ===========================
   Banner copy
=========================== */
function renderBanner(access){
  bannerWrap.innerHTML = "";
  if (!userState) return;

  if (access.mode === "full") return;

  if (access.mode === "readonly"){
    bannerWrap.innerHTML = bannerHtml({
      title: "Choose how you stay Near",
      sub: "Your free time ended. Both plans are full access. No ads. No add-ons.",
      primaryText: "See plans",
      secondaryText: "Not now",
      onPrimary: "openPlans",
      onSecondary: "dismissBanner"
    });
    wireBannerActions();
    return;
  }

  const day = access.dayNumber;
  const lastDay = Number(userState.seenCountdownBannerDay || 0);
  const shouldMark = lastDay !== day;

  if (day === 4){
    bannerWrap.innerHTML = bannerHtml({
      title: "You don’t have to find the one.",
      sub: "You can just find the one for right now… or just have a conversation. We’re here for you. We are Near.",
      primaryText: "Keep going",
      secondaryText: "Plans",
      onPrimary: "dismissBanner",
      onSecondary: "openPlans"
    });
  } else if (day === 6){
    bannerWrap.innerHTML = bannerHtml({
      title: "Need more time to find your person?",
      sub: "We’ve got options. Both plans are full access — $5/mo or $50/yr. Fair, simple, no ads.",
      primaryText: "See options",
      secondaryText: "Not now",
      onPrimary: "openPlans",
      onSecondary: "dismissBanner"
    });
  } else if (day === 7){
    bannerWrap.innerHTML = bannerHtml({
      title: "Tomorrow is a day of decision.",
      sub: "Sleep on it. If you want to keep going, choose how you stay Near.",
      primaryText: "Choose now",
      secondaryText: "+7 days (feedback)",
      onPrimary: "openPlans",
      onSecondary: "openFeedback"
    });
  } else {
    bannerWrap.innerHTML = bannerHtml({
      title: `Free access: ${formatDaysLeft(access.msLeft)} left`,
      sub: "No pressure. Just be real. Near speaks for itself.",
      primaryText: "Plans",
      secondaryText: "Hide",
      onPrimary: "openPlans",
      onSecondary: "dismissBanner"
    });
  }

  wireBannerActions();

  if (shouldMark){
    updateUser({ seenCountdownBannerDay: day }).catch(()=>{});
  }
}

function bannerHtml({title, sub, primaryText, secondaryText, onPrimary, onSecondary}){
  return `
    <div class="banner">
      <div class="bannerTitle">${escapeHtml(title)}</div>
      <div class="bannerSub">${escapeHtml(sub)}</div>
      <div class="bannerActions">
        <button class="bannerBtn primary" data-action="${onPrimary}">${escapeHtml(primaryText)}</button>
        <button class="bannerBtn" data-action="${onSecondary}">${escapeHtml(secondaryText)}</button>
      </div>
    </div>
  `;
}

function wireBannerActions(){
  bannerWrap.querySelectorAll("[data-action]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const a = btn.getAttribute("data-action");
      if (a === "openPlans") openPlans();
      if (a === "openFeedback") openFeedback();
      if (a === "dismissBanner") bannerWrap.innerHTML = "";
    });
  });
}

/* ===========================
   Firestore user doc
=========================== */
function userRef(){ return doc(db, "users", myUid); }

async function updateUser(patch){
  if (!myUid) return;
  await setDoc(userRef(), patch, { merge:true });
}

async function ensureUserBoot(){
  const ref = userRef();
  const snap = await getDoc(ref);

  if (!snap.exists()){
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      trialStartAt: serverTimestamp(),
      trialExtraDays: 0,
      plan: "free",
      planActive: false
    }, { merge:true });
    return;
  }

  const u = snap.data() || {};
  if (!u.trialStartAt) await setDoc(ref, { trialStartAt: serverTimestamp() }, { merge:true });
  if (u.trialExtraDays == null) await setDoc(ref, { trialExtraDays: 0 }, { merge:true });
  if (!u.plan) await setDoc(ref, { plan: "free", planActive: false }, { merge:true });
}

/* ===========================
   Plans + Feedback + Gate UI
=========================== */
function openModal(root){
  if (!root) return;
  root.classList.remove("hidden");
  root.setAttribute("aria-hidden","false");
}
function closeModal(root){
  if (!root) return;
  root.classList.add("hidden");
  root.setAttribute("aria-hidden","true");
}

function openPlans(){
  if (!userState) return;
  const access = computeAccess(userState);
  const left = access.mode === "trial" ? formatDaysLeft(access.msLeft) : "0 days";

  if (access.mode === "full"){
    plansState.innerHTML = `You’re on <b>${escapeHtml(access.plan)}</b> — full access ✅`;
  } else if (access.mode === "readonly"){
    plansState.innerHTML = `Free time ended. Choose $5/mo or $50/yr — <b>both full access</b>.`;
  } else {
    plansState.innerHTML = `Free access active: <b>${escapeHtml(left)}</b> left.`;
  }

  const alreadyBonus = Number(userState.trialExtraDays || 0) >= BONUS_DAYS;
  const hasFeedback = !!userState.feedbackSubmittedAt;

  if (feedbackBtn){
    feedbackBtn.disabled = alreadyBonus || hasFeedback;
    feedbackBtn.textContent = feedbackBtn.disabled
      ? "Feedback bonus already used ✅"
      : "Need more time? Give us honest feedback → +7 days";
  }

  openModal(plansModal);
}

function openFeedback(){
  if (!userState) return;

  const alreadyBonus = Number(userState.trialExtraDays || 0) >= BONUS_DAYS;
  const hasFeedback = !!userState.feedbackSubmittedAt;
  if (alreadyBonus || hasFeedback){
    openPlans();
    return;
  }

  if (feedbackText) feedbackText.value = "";
  if (fbCount) fbCount.textContent = "0";
  openModal(feedbackModal);
}

function openGate(){
  openModal(gateModal);
}

function wireModalClosers(){
  document.querySelectorAll(".modalBackdrop[data-close]").forEach(bg=>{
    bg.addEventListener("click", ()=>{
      const k = bg.getAttribute("data-close");
      if (k === "plans") closeModal(plansModal);
      if (k === "feedback") closeModal(feedbackModal);
      if (k === "gate") closeModal(gateModal);
    });
  });
}

/* Fake “activate plan”
