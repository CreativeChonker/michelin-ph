const track = document.getElementById("scrollTrack");

function generateCard(r) {
  let badge = "";

  if (r.stars == 2) {
    badge = `
      <div class="michelin-badge star"></div>
      <div class="michelin-badge star"></div>
    `;
  } else if (r.stars == 1) {
    badge = `<div class="michelin-badge star"></div>`;
  } else {
    badge = `<div class="michelin-badge bib"></div>`;
  }

  return `
    <div class="preview-card oxygen-regular">
      <img src="${r.image}">
      <div class="card-pill">
        ${badge}
        <span>${r.name}</span>
      </div>
    </div>
  `;
}

let cardsHTML = "";
restaurants.forEach(r => cardsHTML += generateCard(r));
restaurants.forEach(r => cardsHTML += generateCard(r)); 
track.innerHTML = cardsHTML;

window.addEventListener("load", () => {
  const fullWidth = track.scrollWidth;     
  const halfWidth = fullWidth / 2;         

  
  const duration = halfWidth / 90; 

  track.style.setProperty("--scroll-width", halfWidth + "px");
  track.style.animationDuration = duration + "s";
});


const searchInput = document.querySelector(".nav-search");
const dropdown = document.querySelector(".search-dropdown");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    dropdown.style.display = "none";
    return;
  }

  const matches = restaurants
    .filter((r) => r.name.toLowerCase().includes(query))
    .slice(0, 10);

  if (matches.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  dropdown.innerHTML = matches
    .map(
      (r) => `
      <div class="search-item" data-id="${r.id}">
        <img src="${r.image}" class="search-thumb">
        <span class="search-name">${r.name}</span>
      </div>
    `
    )
    .join("");

  dropdown.style.display = "block";
});

dropdown.addEventListener("click", (e) => {
  const item = e.target.closest(".search-item");
  if (!item) return;

  const id = item.dataset.id;

  window.location.href = `map.html?focus=${id}`;
});

