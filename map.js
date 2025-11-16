// ========== Global Variables ==========
let map, userMarker, directionsService, directionsRenderer;
let allMarkers = [];
let currentMode;
let routeInfoWindow;

// ========== Calculate Route ==========
function getRouteMidpoint(route) {
  const path = route.overview_path;
  const midIndex = Math.floor(path.length / 2);
  return path[midIndex];
}

function calculateRoute(start, end, name) {
  const request = {
    origin: start,
    destination: end,
    travelMode: currentMode || google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
  };

  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      // Clear previous renderers
      if (window.allRenderers) {
        window.allRenderers.forEach((r) => r.setMap(null));
      }
      window.allRenderers = [];

      // Helper to draw label on the selected route
      const drawLabel = (route) => {
        if (routeInfoWindow) routeInfoWindow.setMap(null);

        const leg = route.legs[0];
        const midpoint = getRouteMidpoint(route);
        const travelTime = leg.duration.text;
        const travelDistance = leg.distance.text;

        const labelDiv = document.createElement("div");
        labelDiv.innerHTML = `🚗 <b>${travelTime}</b> • ${travelDistance}`;
        labelDiv.style.cssText = `
          background: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #222;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          border: 1px solid #ddd;
          white-space: nowrap;
          transition: opacity 0.3s ease;
          opacity: 0;
          position: absolute;
        `;

        routeInfoWindow = new google.maps.OverlayView();
        routeInfoWindow.onAdd = function () {
          this.getPanes().floatPane.appendChild(labelDiv);
        };
        routeInfoWindow.draw = function () {
          const projection = this.getProjection();
          const pos = projection.fromLatLngToDivPixel(midpoint);
          labelDiv.style.left = pos.x - labelDiv.offsetWidth / 2 + "px";
          labelDiv.style.top = pos.y - 20 + "px";
          labelDiv.style.opacity = "1";
        };
        routeInfoWindow.onRemove = function () {
          if (labelDiv.parentNode) labelDiv.parentNode.removeChild(labelDiv);
        };
        routeInfoWindow.setMap(map);
      };

      // Draw each route
      result.routes.forEach((route, index) => {
        const color = index === 0 ? "#1a73e8" : "#a0a0a0";
        const renderer = new google.maps.DirectionsRenderer({
          map: map,
          directions: result,
          routeIndex: index,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: color,
            strokeWeight: index === 0 ? 5 : 4,
            strokeOpacity: index === 0 ? 0.9 : 0.4,
          },
        });

        // Save renderer
        window.allRenderers.push(renderer);

        // Detect click on route polyline
        google.maps.event.addListener(renderer, "click", () => {
          // Reset colors for all
          window.allRenderers.forEach((r, i) => {
            r.setOptions({
              polylineOptions: {
                strokeColor: i === index ? "#1a73e8" : "#a0a0a0",
                strokeWeight: i === index ? 5 : 4,
                strokeOpacity: i === index ? 0.9 : 0.4,
              },
            });
          });
          // Update label for clicked route
          drawLabel(route);
        });

        // Draw label for main route initially
        if (index === 0) drawLabel(route);
      });

      map.fitBounds(result.routes[0].bounds);
    } else {
      console.error("Directions request failed due to " + status);
    }
  });
}

// ========== Google Maps Logic ==========
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.5579, lng: 121.02525 },
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  currentMode = google.maps.TravelMode.DRIVING;

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    preserveViewport: true,
    suppressInfoWindows: true,
    polylineOptions: {
      strokeColor: "#4285F4",
      strokeWeight: 5,
      strokeOpacity: 0.8,
    },
  });

  // ========== Travel Mode Buttons ==========
  document.getElementById("driveMode").addEventListener("click", () => {
    currentMode = google.maps.TravelMode.DRIVING;
    document.getElementById("driveMode").classList.add("active");
    document.getElementById("motorMode").classList.remove("active");
  });

  document.getElementById("motorMode").addEventListener("click", () => {
    currentMode = google.maps.TravelMode.TWO_WHEELER;
    document.getElementById("motorMode").classList.add("active");
    document.getElementById("driveMode").classList.remove("active");
  });

  // ========== User Location ==========
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const userLoc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      const userIcon = {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" fill="#4285F4" stroke="white" stroke-width="2"/>
              <circle cx="10" cy="10" r="4" fill="white"/>
            </svg>
          `),
        scaledSize: new google.maps.Size(20, 20),
        anchor: new google.maps.Point(10, 10),
      };

      userMarker = new google.maps.Marker({
        position: userLoc,
        map,
        title: "You are here",
        icon: userIcon,
        zIndex: 999,
      });
      map.setCenter(userLoc);
    });
  }

  function getMarkerIcon(stars) {
    let svg = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path fill="#e74c3c" stroke="white" stroke-width="2"
        d="M15 0C6.7 0 0 6.7 0 15c0 10.2 15 25 15 25s15-14.8 15-25C30 6.7 23.3 0 15 0z"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `;

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(30, 40),
      anchor: new google.maps.Point(15, 40),
    };
  }

  // ========== Restaurant Markers ==========
  restaurants.forEach((r) => {
    const marker = new google.maps.Marker({
      position: r.location,
      map,
      title: r.name,
      icon: getMarkerIcon(r.stars),
    });

    marker.customStars = r.stars;
    allMarkers.push(marker);

    marker.addListener("click", () => {
      if (!userMarker) {
        alert("Please allow location access first.");
        return;
      }

      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 1200);

      showRestaurantCard(r);
      calculateRoute(userMarker.getPosition(), r.location, r.name);
    });
  });

  // ========== Sidebar Restaurant Pills ==========
  document.querySelectorAll(".restaurant-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const id = pill.dataset.id;
      const r = restaurants.find((x) => x.id === id);

      if (!userMarker) {
        alert("Please allow location access first.");
        return;
      }

      document
        .querySelectorAll(".restaurant-pill")
        .forEach((p) => p.classList.remove("active"));

      pill.classList.add("active");

      showRestaurantCard(r);
      calculateRoute(userMarker.getPosition(), r.location, r.name);
    });
  });
}

// ========== Show Restaurant Card ==========
function showRestaurantCard(data) {
  const card = document.getElementById("restaurantCard");

  card.style.display = "none";

  document.getElementById("cardImage").src = data.image;
  document.getElementById("cardTitle").textContent = data.name;

  let stars = "";
  if (data.stars === 2)
    stars = `<img src="assets/star.png" class="icon" /><img src="assets/star.png" class="icon" />`;
  else if (data.stars === 1)
    stars = `<img src="assets/star.png" class="icon" />`;
  else if (data.category === "bib_gourmand")
    stars = `<img src="assets/bibgourmand.png" class="icon" />`;

  document.getElementById(
    "cardCategory"
  ).innerHTML = `${stars} ${data.categoryText}`;
  document.getElementById("cardDescription").textContent = data.description;
  document.getElementById("cardAddress").textContent = data.address;
  document.getElementById("cardContact").textContent = data.contact;
  document.getElementById("cardEmail").textContent = data.email;
  document.getElementById("cardWebsite").href = data.website;

  card.classList.add("show");
  card.style.display = "block";
}

// === CLOSE CARD BUTTON ===
window.onload = () => {
  const closeBtn = document.getElementById("closeCard");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const card = document.getElementById("restaurantCard");

      card.classList.add("closing");
      card.classList.remove("show");

      document
        .querySelectorAll(".restaurant-pill")
        .forEach((b) => b.classList.remove("active"));

      setTimeout(() => {
        card.style.display = "none";
        card.classList.remove("closing");
      }, 600);
    });
  }
};

// ===== FILTERING LOGIC (MARKERS + PILLS) =====
function filterMarkers(value) {
  allMarkers.forEach((marker) => {
    const stars = Number(marker.customStars);
    let visible = false;

    if (value === "all") visible = true;
    else if (value === "two_star" && stars === 2) visible = true;
    else if (value === "one_star" && stars === 1) visible = true;
    else if (value === "bib_gourmand" && stars === 0) visible = true;

    marker.setVisible(visible);
  });
}

document.querySelectorAll('input[name="filter"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const value = radio.value;

    document.querySelectorAll(".restaurant-pill").forEach((pill) => {
      const stars = Number(pill.dataset.stars);
      let show = false;

      if (value === "all") show = true;
      else if (value === "two_star" && stars === 2) show = true;
      else if (value === "one_star" && stars === 1) show = true;
      else if (value === "bib_gourmand" && stars === 0) show = true;

      pill.style.transition = "opacity 0.25s ease";
      pill.style.opacity = show ? "1" : "0";

      setTimeout(() => {
        pill.style.display = show ? "flex" : "none";
      }, 250);
    });

    filterMarkers(value);
  });
});
