/* ===============================
   PERFORMANCE DETECTION
================================ */
const lowEndDevice =
  navigator.hardwareConcurrency <= 4 ||
  navigator.deviceMemory <= 4 ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===============================
   DOM ELEMENTS
================================ */
const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const statusMessage = document.getElementById("status-message");

const weatherBox = document.getElementById("weather-result");
const weatherIcon = document.querySelector(".weather-icon");
const tempEl = document.querySelector(".temp");
const cityEl = document.querySelector(".city");
const humidityEl = document.getElementById("humidity-text");
const feelsLikeEl = document.getElementById("feels-like");
const descriptionEl = document.querySelector(".description");
const loader = document.getElementById("loader");
const retryBtn = document.getElementById("retry-btn");
const hourlyList = document.getElementById("hourly-list");
const dailyList = document.getElementById("daily-list");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const todayRangeEl = document.getElementById("today-range");

/* ===============================
   ICON HANDLING
================================ */
let iconMode = "colored";

function isDayTime(timestamp, sunrise, sunset) {
  return timestamp >= sunrise && timestamp < sunset;
}

const TRANSITION_WINDOW = 60 * 60; // 1 hour in seconds

function isSunriseTransition(ts, sunrise) {
  return Math.abs(ts - sunrise) <= TRANSITION_WINDOW;
}

function isSunsetTransition(ts, sunset) {
  return Math.abs(ts - sunset) <= TRANSITION_WINDOW;
}

function getIconFor(icon, timestamp, sunrise, sunset) {
  if (!icon) return "colored-clear.svg";

  const code = icon.slice(0, 2);
  const isNight = icon.endsWith("n");

  const nearSunrise = isSunriseTransition(timestamp, sunrise);
  const nearSunset = isSunsetTransition(timestamp, sunset);

  // Dominant weather always wins
  if (["09", "10"].includes(code)) return "colored-rain.svg";
  if (code === "13") return "colored-snow.svg";
  if (code === "50") return "colored-mist.svg";
  if (["02", "03", "04"].includes(code)) return "colored-clouds.svg";

  // Clear sky logic (ONLY place where sun/moon matters)
  if (code === "01") {
    // Sunrise → show sun
    if (nearSunrise) {
      return "colored-clear.svg"; // ☀️
    }

    // Sunset → show moon
    if (nearSunset) {
      return "colored-clear-night.svg"; // 🌙
    }

    // Normal clear day/night
    return isNight
      ? "colored-clear-night.svg"
      : "colored-clear.svg";
  }

  return "colored-clouds.svg";
}

function getDailyIconFor(icon) {
  if (!icon) return "colored-clear.svg";

  const code = icon.slice(0, 2);

  if (["09", "10"].includes(code)) return "colored-rain.svg";
  if (code === "13") return "colored-snow.svg";
  if (code === "50") return "colored-mist.svg";
  if (["02", "03", "04"].includes(code)) return "colored-clouds.svg";

  // Clear day icon ONLY (no moon ever)
  if (code === "01") return "colored-clear.svg";

  return "colored-clouds.svg";
}

function generateWeatherSummary(data) {
  const temp = Math.round(data.main.temp);
  const condition = data.weather[0].main.toLowerCase();
  const windKmh = Math.round(data.wind.speed * 3.6);

  const now = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;

  const isNight = now >= sunset || now < sunrise;

  // 🌙 NIGHT — no “good wishes”
  if (isNight) {
    if (condition.includes("rain")) {
      return "Rainy night ahead. Drive carefully.";
    }
    if (condition.includes("snow")) {
      return "Cold snowy night. Stay warm indoors.";
    }
    if (windKmh > 25) {
      return "Windy night conditions expected.";
    }
    if (temp <= 10) {
      return "Chilly night with low temperatures.";
    }
    return "Quiet night with stable weather conditions.";
  }

  // ☀️ DAYTIME
  if (condition.includes("rain")) {
    return "Rain expected today. Keep an umbrella handy.";
  }
  if (condition.includes("snow")) {
    return "Snowy weather today. Dress warmly.";
  }
  if (windKmh > 25) {
    return "Windy conditions today. Be cautious outdoors.";
  }
  if (temp >= 30) {
    return "Hot weather today. Stay hydrated.";
  }
  if (temp <= 10) {
    return "Cold weather today. Layer up.";
  }

  return "Comfortable weather conditions throughout the day.";
}

function generateOutfitSuggestion(data) {
  const temp = data.main.temp;
  const condition = data.weather[0].main.toLowerCase();
  const windKmh = Math.round(data.wind.speed * 3.6);

  const now = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  const isNight = now >= sunset || now < sunrise;

  if (condition.includes("rain")) {
    return {
      icon: "☔",
      text: isNight
        ? "Carry an umbrella if heading out tonight."
        : "An umbrella or rain jacket is recommended."
    };
  }

  if (condition.includes("snow")) {
    return { icon: "🧤", text: "Wear warm layers and insulated footwear." };
  }

  if (windKmh > 25) {
    return { icon: "🧥", text: "A windproof jacket is a good choice." };
  }

  if (temp >= 28) {
    return {
      icon: "👕",
      text: isNight
        ? "Light clothing for a warm night."
        : "Light, breathable clothing recommended."
    };
  }

  if (temp <= 10) {
    return {
      icon: "🧣",
      text: isNight
        ? "Warm layers recommended for a cold night."
        : "A warm jacket is advised today."
    };
  }

  return {
    icon: "👟",
    text: isNight
      ? "Comfortable indoor clothing suggested."
      : "Comfortable casual wear is suitable."
  };
}

function calculateWeatherScore(data) {
  let score = 10;

  const temp = data.main.temp;
  const condition = data.weather[0].main.toLowerCase();
  const windKmh = Math.round(data.wind.speed * 3.6);

  const now = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;

  const isNight = now >= sunset || now < sunrise;

  // Temperature comfort
  if (temp < 5 || temp > 35) score -= 3;
  else if (temp < 10 || temp > 30) score -= 2;
  else if (temp < 15 || temp > 27) score -= 1;

  // Weather conditions
  if (condition.includes("rain")) score -= 2;
  if (condition.includes("snow")) score -= 3;
  if (condition.includes("thunder")) score -= 4;

  // Wind
  if (windKmh > 30) score -= 2;
  else if (windKmh > 20) score -= 1;

  // Night penalty (slightly)
  if (isNight) score -= 1;

  // Clamp score
  return Math.max(1, Math.min(10, score));
}

function getAqiLabel(aqi) {
  if (aqi === 1) return "🟢 Good air quality";
  if (aqi === 2) return "🟡 Fair air quality";
  if (aqi === 3) return "🟠 Moderate air quality";
  if (aqi === 4) return "🔴 Poor air quality";
  if (aqi === 5) return "🟣 Very poor air quality";
  return "Air quality unavailable";
}

async function fetchAirQuality(lat, lon) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/air-quality?lat=${lat}&lon=${lon}`
    );
    const data = await res.json();

    const aqi = data.list[0].main.aqi;

    const aqiText = document.getElementById("aqi-text");

if (aqiText) {
  aqiText.textContent = getAqiLabel(aqi);
}

  } catch {
  const aqiText = document.getElementById("aqi-text");
  if (aqiText) {
    aqiText.textContent = "Air quality unavailable";
  }
}
}

let hourlyChart = null;

function renderHourlyTempChart(list, timezoneOffset) {
  if (!Array.isArray(list) || list.length === 0) return;

  const canvas = document.getElementById("hourly-temp-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const labels = [];
  const temps = [];

  list.slice(0, 8).forEach((item) => {
    const d = new Date((item.dt + timezoneOffset) * 1000);
    labels.push(`${String(d.getUTCHours()).padStart(2, "0")}:00`);
    temps.push(Math.round(item.main.temp));
  });

  const minTemp = Math.min(...temps) - 2;
  const maxTemp = Math.max(...temps) + 2;

  const isNight = document.body.classList.contains("night");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(
    0,
    isNight ? "rgba(140,160,255,0.45)" : "rgba(79,172,254,0.45)"
  );
  gradient.addColorStop(
    1,
    isNight ? "rgba(140,160,255,0.05)" : "rgba(79,172,254,0.05)"
  );

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: temps,
          borderColor: isNight ? "#a5b4fc" : "#4facfe",
          backgroundColor: gradient,
          fill: true,
          tension: 0.45,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15,23,42,0.9)",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => ` ${ctx.raw}°C`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#94a3b8" }
        },
        y: {
          display: false,
          suggestedMin: minTemp,
          suggestedMax: maxTemp
        }
      },
      animation: {
        duration: 900,
        easing: "easeOutQuart"
      }
    }
  });
}

/* ===============================
   API CALLS (BACKEND ONLY)
================================ */
async function fetchWeather(city) {
  try {
    statusMessage.textContent = "";
    retryBtn.style.display = "none";
    loader.style.display = "block";
    weatherBox.style.display = "none";

    const response = await fetch(`http://localhost:5000/api/weather?city=${city}`);
    if (!response.ok) throw new Error("API failed");

    const data = await response.json();
    statusMessage.textContent = "";
    retryBtn.style.display = "none";
    updateUI(data);
    fetchForecast(city, data);
  } catch(err) {
    console.error("Weather fetch error:",err);
    statusMessage.textContent = "❌ Unable to fetch weather.";
    statusMessage.style.color = "crimson";
    retryBtn.style.display = "block";
  } finally {
    loader.style.display = "none";
  }
}

async function fetchForecast(city, currentData) {
  try {
    const response = await fetch(`http://localhost:5000/api/forecast?city=${city}`);
    if (!response.ok) throw new Error("Forecast failed");

    const data = await response.json();
    window.__forecastList = data.list;
    window.__forecastTimezone = data.city.timezone;

    renderHourlyForecast(data.list, data.city.timezone, currentData);
    renderDailyForecast(data.list, currentData);
    
    setTimeout(() => {
      renderHourlyTempChart(
        window.__forecastList,
        window.__forecastTimezone
      );
    }, 0);
  } catch {
    hourlyList.innerHTML = "<p>Unable to load forecast.</p>";
    dailyList.innerHTML = "";
  }
}

function getSmartGreeting(now, sunrise, sunset) {
  const hour = new Date(now * 1000).getHours();

  if (now < sunrise) return "Good early morning";
  if (hour < 12) return "Good morning";
  if (now < sunset) return "Good afternoon";
  return "Good evening";
}

/* ===============================
   UI RENDERING
================================ */
function updateUI(data) {
  /* ===============================
     LOW-END DEVICE
  ================================ */
  if (lowEndDevice) {
    document.body.classList.add("low-end");
  } else {
    document.body.classList.remove("low-end");
  }

  /* ===============================
     DAY / NIGHT LOGIC
  ================================ */
  const now = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  const greetingEl = document.getElementById("intel-greeting");
if (greetingEl) {
  greetingEl.textContent = getSmartGreeting(
    data.dt,
    data.sys.sunrise,
    data.sys.sunset
  );
}



  document.body.classList.remove(
    "day", 
    "night",
    "sunrise",
    "sunset"
  );

  const TRANSITION_WINDOW = 60 * 60; // 1 hour in seconds

  if (now >= sunrise && now < sunset) {
    document.body.classList.add("day");

    if (Math.abs(now - sunrise) <= TRANSITION_WINDOW) {
      document.body.classList.add("sunrise");
    } 
    else if (Math.abs(now - sunset) <= TRANSITION_WINDOW) {
      document.body.classList.add("sunset");
    }

  } else {
    document.body.classList.add("night");
  }

  /* ===============================
     WEATHER TYPE BACKGROUND
  ================================ */
  document.body.classList.remove(
    "weather-clear",
    "weather-clouds",
    "weather-rain",
    "weather-snow",
    "weather-mist",
    "weather-wind",
    "weather-thunder"
  );

  const condition = data.weather[0].main.toLowerCase();

  if (condition.includes("thunder")) {
    document.body.classList.add("weather-thunder");
  } else if (condition.includes("rain")) {
    document.body.classList.add("weather-rain");
  } else if (condition.includes("snow")) {
    document.body.classList.add("weather-snow");
  } else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) {
    document.body.classList.add("weather-mist");
  } else if (condition.includes("cloud")) {
    document.body.classList.add("weather-clouds");
  } else {
    document.body.classList.add("weather-clear");
  }

  /* ===============================
     MAIN WEATHER INFO
  ================================ */
  cityEl.textContent = data.name;
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("feels-like").textContent = `${Math.round(data.main.feels_like)}°C`;
  descriptionEl.textContent = data.weather[0].description;
  document.getElementById("humidity-text").textContent = `${data.main.humidity}%`;

  /* ===============================
     WEATHER ICON
  ================================ */
  const iconCode = data.weather[0].icon;
  weatherIcon.src = `images/${getIconFor(
    iconCode,
    data.dt,
    data.sys.sunrise,
    data.sys.sunset
 )}`;
  weatherIcon.onerror = () => {
    weatherIcon.src = "images/rain.png";
  };

    /* ===============================
     WIND
  ================================ */
  const windText = document.getElementById("wind-text");

if (windText) {
  const windSpeedKmh = Math.round(data.wind.speed * 3.6);
  windText.textContent = `${windSpeedKmh} km/h`;
}

  /* ===============================
     SUNRISE / SUNSET
  ================================ */
  const tz = data.timezone;

  const sunriseMain = document.getElementById("sunrise");
const sunsetMain = document.getElementById("sunset");
const sunriseProgress = document.getElementById("sunrise-progress");
const sunsetProgress = document.getElementById("sunset-progress");

const sunriseTime = formatLocalTime(data.sys.sunrise, tz);
const sunsetTime = formatLocalTime(data.sys.sunset, tz);

if (sunriseMain) sunriseMain.textContent = sunriseTime;
if (sunsetMain) sunsetMain.textContent = sunsetTime;
if (sunriseProgress) sunriseProgress.textContent = sunriseTime;
if (sunsetProgress) sunsetProgress.textContent = sunsetTime;

  

  /* ===============================
   DAY PROGRESS BAR (SUNRISE → SUNSET)
=============================== */
const progressFill = document.getElementById("day-progress-fill");
const progressDot = document.getElementById("day-progress-dot");

if (progressFill && progressDot) {
  const now = data.dt;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;

  let progress;

  if (now <= sunrise) {
    progress = 0;
  } else if (now >= sunset) {
    progress = 100;
  } else {
    progress = ((now - sunrise) / (sunset - sunrise)) * 100;
  }

  progressFill.style.width = `${progress}%`;
  progressDot.style.left = `${progress}%`;
}


  /* ===============================
     FINAL UI STATE
  ================================ */
  weatherBox.style.display = "block";
  statusMessage.textContent = "";
  localStorage.setItem("lastCity", data.name);

  const summaryEl = document.getElementById("weather-summary");
  summaryEl.textContent = generateWeatherSummary(data);

const outfitEl = document.getElementById("intel-outfit");
if (outfitEl) {
  const outfit = generateOutfitSuggestion(data);
  outfitEl.textContent = `${outfit.icon} ${outfit.text}`;
}

const score = calculateWeatherScore(data);
const scoreText = document.getElementById("weather-score-text");
if (scoreText) {
  scoreText.textContent = `${score}/10`;
}

const scoreExplain = document.getElementById("weather-score-explain");
if (scoreExplain) {
  scoreExplain.textContent = 
  score >= 8
    ? "Excellent conditions today. Very comfortable weather."
    : score >= 6
    ? "Decent conditions. Minor discomfort possible."
    : "Challenging weather today. Plan carefully.";
}
fetchAirQuality(data.coord.lat, data.coord.lon);
addFavorite(data.name);
const addFavBtn = document.getElementById("add-favorite");
if (addFavBtn) {
  addFavBtn.onclick = () => addFavorite(data.name);
}
}
function formatLocalTime(unix, tz) {
  const d = new Date((unix + tz) * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")}`;
}

/* ===============================
   FORECAST RENDERING
================================ */
function renderHourlyForecast(list, timezoneOffset, currentData) {
  hourlyList.innerHTML = "";

  /* ===============================
     NOW
  ================================ */
  hourlyList.innerHTML += `
    <div class="hourly-item">
      <div>Now</div>
      <img src="images/${getIconFor(
  currentData.weather[0].icon,
  currentData.dt,
  currentData.sys.sunrise,
  currentData.sys.sunset
)}" />
 
      <span>${Math.round(currentData.main.temp)}°</span>
    </div>
  `;

  /* ===============================
     FIXED +3h STEPS (UI-DRIVEN)
  ================================ */
  const steps = [3, 6, 9, 12, 15, 18];
  const usableForecasts = list.slice(0, steps.length);

  const nowLocal = new Date(
    (currentData.dt + timezoneOffset) * 1000
  );

  usableForecasts.forEach((item, index) => {
    const labelHour = (nowLocal.getUTCHours() + steps[index]) % 24;
    const label = `${String(labelHour).padStart(2, "0")}:00`;

    hourlyList.innerHTML += `
      <div class="hourly-item">
        <div>${label}</div>
        <img src="images/${getIconFor(
          item.weather[0].icon,
          item.dt,
          currentData.sys.sunrise,
          currentData.sys.sunset
       )}" />
        <span>${Math.round(item.main.temp)}°</span>
      </div>
    `;
  });
}

function renderDailyForecast(list, currentData) {
  dailyList.innerHTML = "";

  const days = {};
  list.forEach((item) => {
    const day = new Date(item.dt * 1000).toISOString().split("T")[0];
    days[day] ??= [];
    days[day].push(item);
  });

  Object.entries(days)
    .slice(0, 5)
    .forEach(([date, items], i) => {
      const temps = items.map(i => i.main.temp);
      const max = Math.round(Math.max(...temps));
      const min = Math.round(Math.min(...temps));

      const icon =
        items[Math.floor(items.length / 2)]?.weather?.[0]?.icon || "01d";

      if (i === 0) todayRangeEl.textContent = `${max}°/${min}°`;

      dailyList.innerHTML += `
        <div class="daily-item">
          <div>${new Date(date).toLocaleDateString("en-US", {
            weekday: "short"
          })}</div>
          <img src="images/${getDailyIconFor(icon)}" alt="icon" />
          <span>${max}° / ${min}°</span>
        </div>`;
    });
}

/* ===============================
   EVENTS
================================ */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
});

retryBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

/* ===============================
   INIT
================================ */
const lastCity = localStorage.getItem("lastCity");
if (lastCity) fetchWeather(lastCity);

const intelToggle = document.getElementById("intel-toggle");
const intelligenceBox = document.querySelector(".intelligence");

if (intelToggle && intelligenceBox) {
  intelToggle.addEventListener("click", () => {
    intelligenceBox.classList.toggle("open");
  });
}
renderFavorites();
/* ===============================
   PERSONAL SPACE TOGGLE
================================ */
const openPersonalBtn = document.getElementById("open-personal");
const closePersonalBtn = document.getElementById("close-personal");
const personalPanel = document.getElementById("personal-panel");
const overlay = document.getElementById("panel-overlay");

if (openPersonalBtn && personalPanel) {
  openPersonalBtn.addEventListener("click", () => {
    personalPanel.classList.toggle("open");
    overlay.classList.toggle("active");
  });
}

if (closePersonalBtn && personalPanel) {
  closePersonalBtn.addEventListener("click", () => {
    personalPanel.classList.remove("open");
    overlay.classList.remove("active");
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    personalPanel?.classList.remove("open");
    document.getElementById("panel-overlay")?.classList.remove("show");
  }
});
overlay.addEventListener("click", () => {
  personalPanel.classList.remove("open");
  overlay.classList.remove("active");
});

/* ===============================
   FAVORITE CITIES
================================ */
const favoritesContainer = document.getElementById("favorite-cities");

function loadFavorites() {
  if (!favoritesContainer) return;
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  favoritesContainer.innerHTML = "";

  favorites.forEach(city => {
    const div = document.createElement("div");
    div.className = "favorite-item";
    div.textContent = city;
    div.onclick = () => fetchWeather(city);
    favoritesContainer.appendChild(div);
  });
}

function showToast(message) {
  // Simple, non-intrusive feedback
  console.log("Toast:", message);

  // Optional: visual toast later
  // For now, just fail-safe
}

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(list) {
  localStorage.setItem("favorites", JSON.stringify(list));
}

function renderFavorites() {
  const container = document.getElementById("favorite-cities");
  if (!container) return;

  const favorites = getFavorites();
  container.innerHTML = "";

  favorites.forEach(city => {
    const item = document.createElement("div");
    item.className = "favorite-item";
    item.innerHTML = `
      <span>${city}</span>
      <button data-city="${city}">❌</button>
    `;

    item.querySelector("span").onclick = () => fetchWeather(city);
    item.querySelector("button").onclick = () => removeFavorite(city);

    container.appendChild(item);
  });
}

function addFavorite(city) {
  const favorites = getFavorites();
  if (!favorites.includes(city)) {
    favorites.push(city);
    saveFavorites(favorites);
    renderFavorites();
    showToast("Added to favorites");
  }
}

function removeFavorite(city) {
  const favorites = getFavorites().filter(c => c !== city);
  saveFavorites(favorites);
  renderFavorites();
}



