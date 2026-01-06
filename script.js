snap.forEach(d => {
  if (d.id === myUid) return;

  const u = d.data();
  if (!u.lat || !myLocation) return;

  const km = distanceKm(
    myLocation.lat,
    myLocation.lng,
    u.lat,
    u.lng
  );

  if (km > 5) return; // hard radius limit

  const label = distanceLabel(km);
  if (!label) return;

  visible++;

  const c = document.createElement("div");
  c.className = "card";
  c.innerHTML = `
    <div class="avatar"></div>
    <div class="info">
      <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
      <div class="distance">${label}</div>
      <div class="now">${u.now || ""}</div>
    </div>
  `;

  list.appendChild(c);
});
