// ===== Configuration =====
const API_CONFIG = {
    GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast'
};

// ===== DOM Elements =====
const elements = {
    cityInput: document.getElementById('cityInput'),
    cityName: document.getElementById('cityName'),
    rainChance: document.getElementById('rainChance'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weatherIcon'),
    feelsLike: document.getElementById('feelsLike'),
    windSpeed: document.getElementById('windSpeed'),
    rainPercent: document.getElementById('rainPercent'),
    uvIndex: document.getElementById('uvIndex'),
    hourlyContainer: document.getElementById('hourlyContainer'),
    forecastContainer: document.getElementById('forecastContainer'),
    weatherBackground: document.getElementById('weatherBackground'),
    rainContainer: document.getElementById('rainContainer')
};

// ===== Weather Codes Mapping =====
const weatherCodes = {
    0: { description: 'Ясно', icon: '☀️', iconNight: '🌙', type: 'clear' },
    1: { description: 'Преимущественно ясно', icon: '🌤️', iconNight: '🌙', type: 'clear' },
    2: { description: 'Переменная облачность', icon: '⛅', iconNight: '☁️', type: 'cloudy' },
    3: { description: 'Пасмурно', icon: '☁️', iconNight: '☁️', type: 'cloudy' },
    45: { description: 'Туман', icon: '🌫️', iconNight: '🌫️', type: 'fog' },
    48: { description: 'Изморозь', icon: '🌫️', iconNight: '🌫️', type: 'fog' },
    51: { description: 'Лёгкая морось', icon: '🌦️', iconNight: '🌧️', type: 'rain' },
    53: { description: 'Морось', icon: '🌦️', iconNight: '🌧️', type: 'rain' },
    55: { description: 'Сильная морось', icon: '🌧️', iconNight: '🌧️', type: 'rain' },
    61: { description: 'Небольшой дождь', icon: '🌦️', iconNight: '🌧️', type: 'rain' },
    63: { description: 'Дождь', icon: '🌧️', iconNight: '🌧️', type: 'rain' },
    65: { description: 'Сильный дождь', icon: '🌧️', iconNight: '🌧️', type: 'rain' },
    71: { description: 'Небольшой снег', icon: '🌨️', iconNight: '🌨️', type: 'snow' },
    73: { description: 'Снег', icon: '❄️', iconNight: '❄️', type: 'snow' },
    75: { description: 'Сильный снег', icon: '❄️', iconNight: '❄️', type: 'snow' },
    77: { description: 'Снежные зёрна', icon: '🌨️', iconNight: '🌨️', type: 'snow' },
    80: { description: 'Небольшой ливень', icon: '🌦️', iconNight: '🌧️', type: 'rain' },
    81: { description: 'Ливень', icon: '🌧️', iconNight: '🌧️', type: 'rain' },
    82: { description: 'Сильный ливень', icon: '⛈️', iconNight: '⛈️', type: 'rain' },
    85: { description: 'Небольшой снегопад', icon: '🌨️', iconNight: '🌨️', type: 'snow' },
    86: { description: 'Снегопад', icon: '❄️', iconNight: '❄️', type: 'snow' },
    95: { description: 'Гроза', icon: '⛈️', iconNight: '⛈️', type: 'thunderstorm' },
    96: { description: 'Гроза с градом', icon: '⛈️', iconNight: '⛈️', type: 'thunderstorm' },
    99: { description: 'Сильная гроза с градом', icon: '⛈️', iconNight: '⛈️', type: 'thunderstorm' }
};

// ===== Event Listeners =====
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

let debounceTimer;
elements.cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value.trim();
    if (value.length > 2) {
        debounceTimer = setTimeout(() => handleSearch(), 500);
    }
});

window.addEventListener('load', () => {
    const madrid = { lat: 40.4168, lon: -3.7038, name: 'Мадрид' };
    fetchWeatherData(madrid.lat, madrid.lon, madrid.name);
});

// ===== Main Functions =====
async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (!city) return;

    try {
        const coords = await geocodeCity(city);
        if (!coords) {
            alert('Город не найден');
            return;
        }
        await fetchWeatherData(coords.latitude, coords.longitude, coords.name);
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке данных');
    }
}

async function geocodeCity(cityName) {
    const params = new URLSearchParams({
        name: cityName,
        count: 1,
        language: 'ru',
        format: 'json'
    });

    const response = await fetch(`${API_CONFIG.GEOCODING_URL}?${params}`);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    return {
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
        name: data.results[0].name || cityName
    };
}

async function fetchWeatherData(latitude, longitude, cityName) {
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m',
        hourly: 'temperature_2m,weather_code,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: 7
    });

    const response = await fetch(`${API_CONFIG.WEATHER_URL}?${params}`);
    const data = await response.json();

    displayCurrentWeather(data.current, cityName);
    displayHourlyForecast(data.hourly);
    displayForecast(data.daily);
    updateWeatherAnimation(data.current.weather_code, data.current.is_day === 1);
}

function displayCurrentWeather(current, cityName) {
    const weatherInfo = getWeatherInfo(current.weather_code, current.is_day === 1);
    
    elements.cityName.textContent = cityName;
    elements.temperature.textContent = `${Math.round(current.temperature_2m)}°`;
    elements.weatherIcon.textContent = weatherInfo.icon;
    elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
    elements.windSpeed.textContent = `${current.wind_speed_10m} км/ч`;
    elements.rainChance.textContent = `Вероятность дождя: ${current.precipitation || 0}%`;
    elements.rainPercent.textContent = `${current.precipitation || 0}%`;
    elements.uvIndex.textContent = '3';
}

function displayHourlyForecast(hourly) {
    elements.hourlyContainer.innerHTML = '';
    
    const currentHour = new Date().getHours();
    const startHour = currentHour;
    
    for (let i = startHour; i < startHour + 7 && i < hourly.time.length; i++) {
        const time = new Date(hourly.time[i]);
        const weatherInfo = getWeatherInfo(hourly.weather_code[i], hourly.is_day[i] === 1);
        
        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <div class="hourly-time">${time.getHours()}:00</div>
            <div class="hourly-icon">${weatherInfo.icon}</div>
            <div class="hourly-temp">${Math.round(hourly.temperature_2m[i])}°</div>
        `;
        elements.hourlyContainer.appendChild(item);
    }
}

function displayForecast(daily) {
    elements.forecastContainer.innerHTML = '';
    
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    
    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const weatherInfo = getWeatherInfo(daily.weather_code[i], true);
        
        let dayName;
        if (i === 0) {
            dayName = 'Сегодня';
        } else {
            dayName = days[date.getDay()].substring(0, 3);
        }
        
        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${weatherInfo.icon}</div>
            <div class="forecast-desc">${weatherInfo.description}</div>
            <div class="forecast-temp">
                <span>${Math.round(daily.temperature_2m_max[i])}</span> / <span>${Math.round(daily.temperature_2m_min[i])}</span>
            </div>
        `;
        elements.forecastContainer.appendChild(item);
    }
}

function updateWeatherAnimation(weatherCode, isDay) {
    const weatherInfo = weatherCodes[weatherCode];
    const weatherType = weatherInfo ? weatherInfo.type : 'clear';
    
    // Clear existing animations
    elements.rainContainer.innerHTML = '';
    elements.weatherBackground.classList.remove('active');
    
    // Add rain/snow animation based on weather type
    switch(weatherType) {
        case 'rain':
        case 'thunderstorm':
            generateRain(weatherCode >= 63 ? 80 : 50);
            if (weatherType === 'thunderstorm') {
                document.getElementById('lightning').style.animation = 'lightningFlash 4s ease-in-out infinite';
            }
            break;
        case 'snow':
            generateSnow(weatherCode >= 73 ? 50 : 30);
            break;
    }
}

function generateRain(intensity) {
    elements.weatherBackground.classList.add('active');
    
    for (let i = 0; i < intensity; i++) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        raindrop.style.left = Math.random() * 100 + '%';
        raindrop.style.animationDuration = (Math.random() * 0.3 + 0.7) + 's';
        raindrop.style.animationDelay = Math.random() * 2 + 's';
        raindrop.style.opacity = Math.random() * 0.5 + 0.3;
        elements.rainContainer.appendChild(raindrop);
    }
}

function generateSnow(intensity) {
    elements.weatherBackground.classList.add('active');
    
    for (let i = 0; i < intensity; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'raindrop';
        snowflake.style.left = Math.random() * 100 + '%';
        
        const size = Math.random() * 5 + 3;
        snowflake.style.width = size + 'px';
        snowflake.style.height = size + 'px';
        snowflake.style.background = 'white';
        snowflake.style.borderRadius = '50%';
        snowflake.style.filter = 'blur(0.5px)';
        
        snowflake.style.animationDuration = (Math.random() * 3 + 3) + 's';
        snowflake.style.animationDelay = Math.random() * 3 + 's';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        
        elements.rainContainer.appendChild(snowflake);
    }
}

function getWeatherInfo(code, isDay) {
    const info = weatherCodes[code] || { description: 'Неизвестно', icon: '❓' };
    return {
        description: info.description,
        icon: isDay ? info.icon : info.iconNight
    };
}
