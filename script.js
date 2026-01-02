const people = [
  { name: "Sam", age: 54, distance: "600m away" },
  { name: "Jade", age: 31, distance: "1.1km away" },
  { name: "Michael", age: 42, distance: "300m away" },
  { name: "Elena", age: 27, distance: "900m away" },
  { name: "David", age: 61, distance: "1.4km away" }
];

const list = document.getElementById("peopleList");
const count = document.getElementById("count");

count.textContent = `${people.length} people near you right now`;

people.forEach(p => {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="avatar"></div>
    <div class="info">
      <div class="name">${p.name}, ${p.age}</div>
      <div class="distance">${p.distance}</div>
    </div>
  `;

  list.appendChild(card);
});
