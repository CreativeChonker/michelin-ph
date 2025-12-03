/*************************************************
 * MICHELIN MAP – CLEAN & FULLY WORKING VERSION
 *************************************************/

/* ------------------ GLOBAL VARIABLES ------------------ */
let map, userMarker, directionsService, directionsRenderer;
let currentMode;
let routeInfoWindow;
let markerMap = {};
let allMarkers = [];

window.favs = JSON.parse(localStorage.getItem("favorites") || "[]");
/*************************************************
 *  PAN OFFSET (FOR SIDEBAR)
 *************************************************/
function panToWithOffset(map, latlng, offsetX, offsetY) {
  const scale = Math.pow(2, map.getZoom());
  const proj = map.getProjection().fromLatLngToPoint(latlng);

  const pixelOffset = new google.maps.Point(offsetX / scale, offsetY / scale);

  const newPoint = new google.maps.Point(
    proj.x - pixelOffset.x,
    proj.y + pixelOffset.y
  );

  map.panTo(map.getProjection().fromPointToLatLng(newPoint));
}

/*************************************************
 * ROUTE & DIRECTIONS
 *************************************************/
function getRouteMidpoint(route) {
  const path = route.overview_path;
  return path[Math.floor(path.length / 2)];
}

function calculateRoute(start, end, name) {
  const request = {
    origin: start,
    destination: end,
    travelMode: currentMode || google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
  };

  directionsService.route(request, (result, status) => {
    if (status !== "OK") return;

    if (window.allRenderers) {
      window.allRenderers.forEach((r) => r.setMap(null));
    }
    window.allRenderers = [];

    const drawLabel = (route) => {
      if (routeInfoWindow) routeInfoWindow.setMap(null);

      const midpoint = getRouteMidpoint(route);
      const leg = route.legs[0];
      const travelTime = leg.duration.text;
      const travelDist = leg.distance.text;

      const div = document.createElement("div");
      div.className = "route-label";
      div.innerHTML = `<b>${travelTime}</b> • ${travelDist}`;
      div.style.position = "absolute";

      routeInfoWindow = new google.maps.OverlayView();

      routeInfoWindow.onAdd = function () {
        this.getPanes().floatPane.appendChild(div);
      };

      routeInfoWindow.draw = function () {
        const projection = this.getProjection();
        const pos = projection.fromLatLngToDivPixel(midpoint);

        div.style.left = pos.x - div.offsetWidth / 2 + "px";
        div.style.top = pos.y - 20 + "px";
      };

      routeInfoWindow.onRemove = function () {
        div.remove();
      };

      routeInfoWindow.setMap(map);
    };

    result.routes.forEach((route, i) => {
      const renderer = new google.maps.DirectionsRenderer({
        map,
        directions: result,
        routeIndex: i,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: i === 0 ? "#1a73e8" : "#a0a0a0",
          strokeWeight: i === 0 ? 5 : 4,
          strokeOpacity: i === 0 ? 0.9 : 0.4,
        },
      });

      window.allRenderers.push(renderer);

      if (i === 0) drawLabel(route);

      renderer.addListener("click", () => {
        window.allRenderers.forEach((r, k) =>
          r.setOptions({
            polylineOptions: {
              strokeColor: k === i ? "#1a73e8" : "#a0a0a0",
              strokeOpacity: k === i ? 0.9 : 0.4,
              strokeWeight: k === i ? 5 : 4,
            },
          })
        );

        drawLabel(route);
      });
    });
  });
}

function zoomOutToRoute(user, resto) {
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(user);
  bounds.extend(resto);
  map.fitBounds(bounds);

  setTimeout(() => map.setZoom(map.getZoom() - 1), 300);
}

/*************************************************
 * SHOW RESTAURANT CARD
 *************************************************/
function updateCardHeart(id) {
  const heart = document.getElementById("heartBtn");
  if (!heart) return;

  heart.onclick = () => {
    heart.classList.toggle("active");

    if (heart.classList.contains("active")) {
      if (!window.favs.includes(id)) window.favs.push(id);
    } else {
      window.favs = window.favs.filter((x) => x !== id);
    }

    localStorage.setItem("favorites", JSON.stringify(window.favs));
  };

  if (window.favs.includes(id)) heart.classList.add("active");
  else heart.classList.remove("active");
}

function showRestaurantCard(r) {
  const card = document.getElementById("restaurantCard");
  card.style.display = "none";

  document.getElementById("cardImage").src = r.image;
  document.getElementById("cardTitle").textContent = r.name;

  let stars = "";
  if (r.stars === 2)
    stars = `<img src="assets/star.png" class="icon"/><img src="assets/star.png" class="icon"/>`;
  else if (r.stars === 1) stars = `<img src="assets/star.png" class="icon"/>`;
  else stars = `<img src="assets/bibgourmand.png" class="icon"/>`;

  document.getElementById(
    "cardCategory"
  ).innerHTML = `${stars} ${r.categoryText}`;

  document.getElementById("cardDescription").textContent = r.description;
  document.getElementById("cardAddress").textContent = r.address;
  document.getElementById("cardContact").textContent = r.contact;
  document.getElementById("cardEmail").textContent = r.email;
  document.getElementById("cardWebsite").href = r.website;

  document.getElementById("directionsBtn").onclick = () => {
    if (!userMarker) return alert("Please allow location access first.");
    zoomOutToRoute(userMarker.position, r.location);
  };

  card.classList.add("show");
  card.style.display = "block";

  updateCardHeart(r.id);
}

/*************************************************
 * FILTERING LOGIC
 *************************************************/
function filterMarkers(value) {
  allMarkers.forEach((m) => {
    const s = Number(m.customStars);
    let show = false;

    if (value === "all") show = true;
    else if (value === "two_star" && s === 2) show = true;
    else if (value === "one_star" && s === 1) show = true;
    else if (value === "bib_gourmand" && s === 0) show = true;
    else if (value === "favorites") show = window.favs.includes(m.id);

    if (show) {
      m.map = map; 
      m.content.style.display = "flex";
    } else {
      m.map = null; 
      m.content.style.display = "none";
    }
  });
}

/*************************************************
 *  MAIN GOOGLE MAP LOADER
 *************************************************/
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.5579, lng: 121.02525 },
    zoom: 14,
    mapId: "8c12e5469e2cb7562dc816e8",
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
  });

  currentMode = google.maps.TravelMode.DRIVING;
  directionsService = new google.maps.DirectionsService();

  function createMichelinMarker(r) {
    let iconURL = "";

    switch (r.category) {
      case "two_star":
        iconURL = "assets/star2.png";
        break;
      case "one_star":
        iconURL = "assets/star.png";
        break;
      case "bib_gourmand":
        iconURL = "assets/bibgourmand.png";
        break;
      case "selected":
        iconURL = "assets/bibgourmand.png";
        break;
      default:
        iconURL = "assets/selected.jpg";
    }

    const markerDiv = document.createElement("div");
    markerDiv.classList.add("michelin-marker");

    const img = document.createElement("img");
    img.src = iconURL;
    img.classList.add("michelin-icon");

    markerDiv.appendChild(img);

    return new google.maps.marker.AdvancedMarkerElement({
      map,
      position: r.location,
      content: markerDiv,
      title: r.name,
      gmpClickable: true,
    });
  }

  /*************************************************
   * USER LOCATION
   *************************************************/
  function placeUserMarker(userLoc) {
    if (userMarker) {
      userMarker.position = userLoc;
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "30px";
    wrapper.style.height = "30px";

    const dot = document.createElement("div");
    dot.style.width = "14px";
    dot.style.height = "14px";
    dot.style.background = "#4285F4";
    dot.style.border = "3px solid white";
    dot.style.borderRadius = "50%";
    dot.style.position = "absolute";
    dot.style.top = "50%";
    dot.style.left = "50%";
    dot.style.transform = "translate(-50%, -50%)";
    dot.style.zIndex = "10";
    dot.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.3)";

    const pulse = document.createElement("div");
    pulse.style.width = "30px";
    pulse.style.height = "30px";
    pulse.style.border = "2px solid #4285F4";
    pulse.style.borderRadius = "50%";
    pulse.style.position = "absolute";
    pulse.style.top = "50%";
    pulse.style.left = "50%";
    pulse.style.transform = "translate(-50%, -50%)";
    pulse.style.animation = "pulseAnim 1.6s ease-out infinite";
    pulse.style.opacity = "0.6";

    wrapper.appendChild(pulse);
    wrapper.appendChild(dot);

    userMarker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: userLoc,
      content: wrapper,
      zIndex: 999999,
    });

    map.panTo(userLoc);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        placeUserMarker(userLoc);

        navigator.geolocation.watchPosition(
          (p) => {
            const updatedLoc = {
              lat: p.coords.latitude,
              lng: p.coords.longitude,
            };
            placeUserMarker(updatedLoc);
          },
          (err) => console.warn("Location watch error:", err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      },
      () => {
        alert("Enable location access to calculate travel time.");
      }
    );
  } else {
    alert("Geolocation is not supported by your device.");
  }

  /*************************************************
   * RESTAURANT MARKERS
   *************************************************/
  restaurants.forEach((r) => {
    const marker = createMichelinMarker(r);

    marker.customStars = r.stars;
    marker.id = r.id;

    markerMap[r.id] = marker;
    allMarkers.push(marker);

    marker.addListener("click", () => {
      marker.content.style.transition = "transform 0.2s ease";
      marker.content.style.transform = "scale(1.3)";

      setTimeout(() => {
        marker.content.style.transform = "scale(1)";
      }, 200);

      showRestaurantCard(r);

      if (userMarker) {
        calculateRoute(userMarker.position, r.location, r.name);
      }
    });
  });

  /*************************************************
   * SIDEBAR PILLS
   *************************************************/
  document.querySelectorAll(".restaurant-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      if (!userMarker) return alert("Please allow location access first.");

      const id = pill.dataset.id;
      const r = restaurants.find((x) => x.id === id);

      document
        .querySelectorAll(".restaurant-pill")
        .forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      showRestaurantCard(r);
      updateCardHeart(id);

      google.maps.event.addListenerOnce(map, "idle", () => {
        panToWithOffset(map, r.location, 0, 0);

        google.maps.event.addListenerOnce(map, "idle", () => {
          map.setZoom(17);

          if (userMarker) {
            calculateRoute(userMarker.position, r.location, r.name);
          }
        });
      });

      map.panTo(r.location);
    });
  });

  /*************************************************
   * FOCUS RESTAURANT (FROM HOME REDIRECT)
   *************************************************/
  const params = new URLSearchParams(window.location.search);
  const focusId = params.get("focus");

  if (focusId && markerMap[focusId]) {
    const r = restaurants.find((x) => x.id === focusId);

    document
      .querySelectorAll(".restaurant-pill")
      .forEach((p) => p.classList.remove("active"));
    const pill = document.querySelector(
      `.restaurant-pill[data-id="${focusId}"]`
    );
    pill?.classList.add("active");

    showRestaurantCard(r);
    updateCardHeart(focusId);

    setTimeout(() => {
      map.panTo(r.location);

      google.maps.event.addListenerOnce(map, "idle", () => {
        panToWithOffset(map, r.location, 0, 0);

        google.maps.event.addListenerOnce(map, "idle", () => {
          map.setZoom(17);

          if (userMarker) {
            calculateRoute(userMarker.position, r.location, r.name);
          }
        });
      });
    }, 300);
  }

  /*************************************************
   * SEARCH FILTER
   *************************************************/
  document
    .getElementById("restaurantSearch")
    .addEventListener("input", function () {
      const q = this.value.toLowerCase().trim();

      // Filter pills visibility
      document.querySelectorAll(".restaurant-pill").forEach((p) => {
        const match = p.textContent.toLowerCase().includes(q);
        p.style.display = match ? "flex" : "none";
      });

      const first = Array.from(
        document.querySelectorAll(".restaurant-pill")
      ).find((p) => p.style.display !== "none");

      if (!first) return;

      const id = first.dataset.id;
      const r = restaurants.find((x) => x.id === id);
      const marker = markerMap[id];

      // Same pill highlight
      document
        .querySelectorAll(".restaurant-pill")
        .forEach((p) => p.classList.remove("active"));
      first.classList.add("active");

      // Open card
      showRestaurantCard(r);
      updateCardHeart(id);

      // 🔥 EXACT SAME BEHAVIOR AS PILL CLICK 🔥
      map.panTo(r.location);

      google.maps.event.addListenerOnce(map, "idle", () => {
        panToWithOffset(map, r.location, 0, 0);

        google.maps.event.addListenerOnce(map, "idle", () => {
          map.setZoom(17);

          if (userMarker) {
            calculateRoute(userMarker.position, r.location, r.name);
          }
        });
      });
    });

  /*************************************************
   * FILTER RADIO BUTTONS
   *************************************************/
  document.querySelectorAll('input[name="filter"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const val = radio.value;

      document.querySelectorAll(".restaurant-pill").forEach((pill) => {
        const stars = Number(pill.dataset.stars);
        let show = false;

        if (val === "all") show = true;
        else if (val === "two_star" && stars === 2) show = true;
        else if (val === "one_star" && stars === 1) show = true;
        else if (val === "bib_gourmand" && stars === 0) show = true;
        else if (val === "favorites")
          show = window.favs.includes(pill.dataset.id);

        pill.style.opacity = show ? 1 : 0;

        setTimeout(() => {
          pill.style.display = show ? "flex" : "none";
        }, 200);
      });

      filterMarkers(val);
    });
  });
}
/*************************************************
 * CARD CLOSE BUTTON
 *************************************************/
window.onload = () => {
  const btn = document.getElementById("closeCard");

  if (btn) {
    btn.addEventListener("click", () => {
      const card = document.getElementById("restaurantCard");

      card.classList.add("closing");
      card.classList.remove("show");

      document
        .querySelectorAll(".restaurant-pill")
        .forEach((p) => p.classList.remove("active"));

      setTimeout(() => {
        card.style.display = "none";
        card.classList.remove("closing");
      }, 500);
    });
  }
};
