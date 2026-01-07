function refresh(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;
  const now = Date.now();

  if (!snap || !myLocation) return;

  snap.forEach(d => {
    if (d.id === myUid) return;

    const u = d.data();
    if (!u.lat || !u.updatedAt) return;

    // ⏳ EXPIRY CHECK
    if (now - u.updatedAt > PRESENCE_WINDOW_MS) {
      return;
    }

    const km = distanceKm(myLocation, u);
    const label = distanceLabel(km);

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.style.opacity = "0";

    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="distance">${label}</div>
        <div class="now">${u.now || ""}</div>
      </div>
    `;

    list.appendChild(c);

    // ✨ soft appear
    requestAnimationFrame(() => {
      c.style.transition = "opacity .4s ease";
      c.style.opacity = "1";
    });
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}
