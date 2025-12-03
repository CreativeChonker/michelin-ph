/*************************************************
 * FAVORITES + VISITED SYSTEM 
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------ LOCAL STORAGE ------------------ */
  window.visited = JSON.parse(localStorage.getItem("visited") || "[]");
  window.favs = JSON.parse(localStorage.getItem("favorites") || "[]");

  /* ----------------------------------------------------
   * VISITED BUTTON LOGIC
   * ---------------------------------------------------- */
  function toggleVisited(id) {
    if (window.visited.includes(id)) {
      window.visited = window.visited.filter(v => v !== id);
    } else {
      window.visited.push(id);
    }

    localStorage.setItem("visited", JSON.stringify(window.visited));
    updateVisitedDisplay(id);
    updateCardVisited(id);
  }

  function updateVisitedDisplay(id) {
    const wrapper = document.getElementById("visitedWrapper");
    if (!wrapper) return;

    if (window.visited.includes(id)) {
      wrapper.classList.add("visited", "show");
    } else {
      wrapper.classList.remove("visited");
      wrapper.classList.add("show");
      setTimeout(() => wrapper.classList.remove("show"), 200);
    }
  }

  function updateCardVisited(id) {
    const wrapper = document.getElementById("visitedWrapper");
    if (!wrapper) return;

    const visited = window.visited.includes(id);

    wrapper.classList.add("show");
    wrapper.classList.toggle("visited", visited);
    wrapper.classList.toggle("inactive", !visited);
  }

  window.toggleVisited = toggleVisited;
  window.updateVisitedDisplay = updateVisitedDisplay;
  window.updateCardVisited = updateCardVisited;


  /* ----------------------------------------------------
   * FAVORITES LOGIC
   * ---------------------------------------------------- */

  const pillHearts = document.querySelectorAll(".heart-toggle");
  const cardHeart = document.getElementById("heartBtn");

  pillHearts.forEach((heart) => {
    const id = heart.dataset.id;

    if (window.favs.includes(id)) {
      heart.classList.add("fa-solid", "active");
      heart.classList.remove("fa-regular");
      heart.style.color = "#C2042B";
    } else {
      heart.classList.remove("fa-solid");
      heart.classList.add("fa-regular");
      heart.style.color = "#bbb";
    }

    heart.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(id);
      updateHearts(id);
    });
  });

  window.updateCardHeart = function (id) {
    if (!cardHeart) return;

    cardHeart.dataset.id = id;

    const active = window.favs.includes(id);

    if (active) {
      cardHeart.classList.add("fa-solid", "active");
      cardHeart.classList.remove("fa-regular");
      cardHeart.style.color = "#C2042B";
    } else {
      cardHeart.classList.remove("fa-solid", "active");
      cardHeart.classList.add("fa-regular");
      cardHeart.style.color = "#bbb";
    }

    cardHeart.onclick = () => {
      toggleFavorite(id);
      updateHearts(id);
    };
  };

  function toggleFavorite(id) {
    if (window.favs.includes(id)) {
      window.favs = window.favs.filter((x) => x !== id);
    } else {
      window.favs.push(id);
    }

    localStorage.setItem("favorites", JSON.stringify(window.favs));
  }

  function updateHearts(id) {
    pillHearts.forEach((heart) => {
      if (heart.dataset.id === id) {
        const isActive = window.favs.includes(id);
        heart.classList.toggle("fa-solid", isActive);
        heart.classList.toggle("fa-regular", !isActive);
        heart.style.color = isActive ? "#C2042B" : "#bbb";
      }
    });

    if (cardHeart) updateCardHeart(id);
  }

});
