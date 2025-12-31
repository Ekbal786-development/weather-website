# Copilot / AI Agent Instructions — Weather-App

Purpose: give an AI coding agent the minimal, actionable knowledge to be productive in this small static Weather App.

- **Big picture:** This is a client-only single-page app (no build step). The UI is served by Weather-App/weather.html, styles in Weather-App/weather.css, and behavior in Weather-App/weather.js. Images are in Weather-App/images/ and external weather icons are loaded from OpenWeatherMap.

- **Data flows / integrations:**

  - User input -> `fetchWeather(city)` in `weather.js` calls OpenWeather current weather API at `apiUrl` and uses `apiKey` (hard-coded in `weather.js`).
  - Forecast data comes from `forecastApiUrl` and is parsed by `renderHourlyForecast` and `renderDailyForecast` (the latter filters items containing "12:00:00").
  - Geolocation: `detectUserLocation()` uses `navigator.geolocation` then calls `fetchWeatherByCoords(lat, lon)`.
  - UI state: `updateUI(data)` sets `localStorage.lastCity` and toggles `body.day` / `body.night` classes based on `data.dt`, `data.sys.sunrise`, and `data.sys.sunset`.

- **Key files to edit or inspect:**

  - Weather-App/weather.html — top-level DOM structure, IDs expected by `weather.js` (e.g., `weather-form`, `city-input`, `status-message`, `weather-result`, `hourly-list`, `daily-list`).
  - Weather-App/weather.js — main logic; search here for `fetchWeather`, `fetchForecast`, `updateUI`, `detectUserLocation` to change behavior.
  - Weather-App/weather.css — defines layout and `body.day` / `body.night` themes.

- **Project-specific patterns to follow:**

  - DOM selection by `id` is the primary pattern. Use existing IDs/classes rather than creating new ones unless UI changes require it.
  - UI lists are rendered via `innerHTML` concatenation (see `renderHourlyForecast` and `renderDailyForecast`). Keep the same simple approach for small DOM fragments.
  - The 5-day forecast is derived by filtering forecast entries at `12:00:00`. Do not rely on indexing in the raw list.
  - Status and error UX use `statusMessage`, `loader`, and `retry-btn` toggles — reuse these elements for consistent UX.

- **Security / operational note (discoverable):**

  - The OpenWeather API key is present in `weather.js` as `apiKey`. For local edits or tests, keep using the existing variable; for production, the project currently has no server-side token management (this is observable in the code).

- **Dev / run workflow (discoverable):**

  - No build tools. To run locally, open Weather-App/weather.html in a browser (or serve the folder with any static server).
  - Debugging: use the browser DevTools Network tab to inspect calls to api.openweathermap.org. Console logs can be added to `weather.js` near fetch calls.

- **When editing:**
  - If you change the DOM IDs or structure in `weather.html`, update `weather.js` selectors accordingly.
  - Preserve the `localStorage.lastCity` flows so the app retains last viewed city on reload.
  - Keep day/night theme toggling logic in `updateUI` if you change how timestamps are processed.

If anything here is unclear or you want more examples (for instance, small code snippets demonstrating how to add a new panel), tell me which area to expand and I will iterate.
