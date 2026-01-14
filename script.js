/* ===========================
   DEMO PEOPLE (age + gender matched)
   - Used for testers only
   - Each person has:
     name, age, gender, bio, km, photo
=========================== */

function kmMin1(km) {
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

// Use simple, consistent real-world names (not “model” vibes)
const PEOPLE_BY_VIBE = {
  city: [
    {
      name: "Sam",
      age: 54,
      gender: "m",
      bio: "Out for a walk • city lights",
      km: 0.7,
      photo: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Jade",
      age: 31,
      gender: "f",
      bio: "Coffee nearby • night stroll",
      km: 1.6,
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Michael",
      age: 42,
      gender: "m",
      bio: "Taking it slow • skyline",
      km: 3.2,
      photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Elena",
      age: 27,
      gender: "f",
      bio: "Late snack • good chats",
      km: 1.0,
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "David",
      age: 61,
      gender: "m",
      bio: "Just chillin • music on",
      km: 4.6,
      photo: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=400&q=70"
    }
  ],

  nature: [
    {
      name: "Mia",
      age: 29,
      gender: "f",
      bio: "Forest air • quiet mind",
      km: 1.0,
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Noah",
      age: 36,
      gender: "m",
      bio: "Coastal walk • no rush",
      km: 2.3,
      photo: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Lena",
      age: 48,
      gender: "f",
      bio: "Bird sounds • calm day",
      km: 3.4,
      photo: "https://images.unsplash.com/photo-1550525811-e5869dd03032?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Kai",
      age: 33,
      gender: "m",
      bio: "Hiking • simple life",
      km: 1.7,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Rose",
      age: 57,
      gender: "f",
      bio: "Tea after a walk",
      km: 4.2,
      photo: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=400&q=70"
    }
  ],

  fitness: [
    {
      name: "Chris",
      age: 34,
      gender: "m",
      bio: "Runner • sunrise laps",
      km: 1.0,
      photo: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Asha",
      age: 30,
      gender: "f",
      bio: "Runner • steady pace",
      km: 2.1,
      photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Tom",
      age: 45,
      gender: "m",
      bio: "Gym + coffee after",
      km: 3.0,
      photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Renee",
      age: 39,
      gender: "f",
      bio: "Yoga • breathe • balance",
      km: 1.9,
      photo: "https://images.unsplash.com/photo-1547212371-17c1b2d0c1cd?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Mark",
      age: 58,
      gender: "m",
      bio: "Daily walk • feeling good",
      km: 4.4,
      photo: "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=400&q=70"
    }
  ],

  tech: [
    {
      name: "Ava",
      age: 26,
      gender: "f",
      bio: "Laptop open • building things",
      km: 1.0,
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Nina",
      age: 32,
      gender: "f",
      bio: "Gaming night • chill co-op?",
      km: 2.4,
      photo: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Omar",
      age: 41,
      gender: "m",
      bio: "Writing code • coffee fuel",
      km: 3.7,
      photo: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Sophie",
      age: 29,
      gender: "f",
      bio: "Design + dev • headphones on",
      km: 1.6,
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=70"
    },
    {
      name: "Ben",
      age: 55,
      gender: "m",
      bio: "Tech talk • no ego",
      km: 4.8,
      photo: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=400&q=70"
    }
  ]
};

/* ===========================
   RENDER PEOPLE (with safe fallback)
=========================== */
function renderPeople(vibe) {
  const arr = PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city;

  peopleList.innerHTML = "";

  arr.slice(0, 5).forEach((p) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="avatar" aria-hidden="true"
        style="
          background-image:url('${p.photo}');
          background-size:cover;
          background-position:center;
        ">
      </div>
      <div>
        <div class="pName">${p.name}, ${p.age}</div>
        <div class="pSub">${p.bio}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
    `;

    // If image fails, fall back to neutral avatar (no broken look)
    const avatar = li.querySelector(".avatar");
    const img = new Image();
    img.onload = () => {};
    img.onerror = () => {
      avatar.style.backgroundImage = "none";
      avatar.style.backgroundColor = "rgba(255,255,255,0.12)";
    };
    img.src = p.photo;

    peopleList.appendChild(li);
  });
}
