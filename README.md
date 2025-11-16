🇵🇭 Michelin Guide Philippines — Interactive Map

A sleek and interactive web map that showcases MICHELIN-Starred, Bib Gourmand, and Selected restaurants across the Philippines.
Designed for smooth navigation, restaurant discovery, and efficient route planning.

👉 Live Demo: (Add GitHub Pages link once deployed)

✨ Features

🗺 Interactive Google Map

📍 Custom Michelin-style markers

🚗 Route calculation with Car & Motor modes

🎯 User location detection

🔎 Clickable restaurant list (pills) with active highlighting

🎴 Animated restaurant info card

🧭 Clean filtering system

All

Two-Star

One-Star

Bib Gourmand

Selected Restaurants

⚡ Smooth UI animations and transitions

📁 Clean separation of concerns (HTML / CSS / JS)

📂 Project Structure

michelin-ph/
│── assets/               # All images + icons (restaurant photos, stars, banners)
│── index.html            # Main page
│── style.css             # Styling
│── map.js                # Google Maps logic (routes, markers, UI)
│── restaurantinfo.js     # Restaurant database (DO NOT EDIT)
│── README.md

🔑 Google Maps API Setup (For Developers Running Locally)

If you clone the project and want to run it locally, you must provide your own API key.

Enable:

Maps JavaScript API

Directions API

Geocoding API

Create an API key

Restrict usage to your environment:

http://127.0.0.1/*

http://localhost/*

Replace the key in index.html:

<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&callback=initMap" async defer></script>


⚠ The repository does NOT include an exposed unrestricted key.
You must use your own.

🛑 Important Note About Data

All restaurant information, including:

Names

Categories

Michelin distinctions

Coordinates

Images

Descriptions

…is stored in restaurantinfo.js and is intended to remain unchanged.

Please do not modify the restaurant data file, as it contains curated, accurate Michelin information.

📜 License

This project is for educational and personal use only.
It is not affiliated with MICHELIN®.
All trademarks belong to their respective owners.
