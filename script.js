// ===== Configuration =====
const API_CONFIG = {
    // Используем Open-Meteo API (бесплатный, не требует API ключ)
    GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast'
};

// ===== DOM Elements =====
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    errorMessage: document.getElementById('errorMessage'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    weatherDisplay: document.getElementById('weatherDisplay'),
    defaultMessage: document.getElementById('defaultMessage'),
    cityName: document.getElementById('cityName'),
    currentDate: document.getElementById('currentDate'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    forecastContainer: document.getElementById('forecastContainer'),
    weatherBackground: document.getElementById('weatherBackground')
};

// Create rain and snow containers
function createWeatherEffects() {
    const rainContainer = document.createElement('div');
    rainContainer.className = 'rain-container';
    rainContainer.id = 'rainContainer';
    
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    snowContainer.id = 'snowContainer';
    
    elements.weatherBackground.appendChild(rainContainer);
    elements.weatherBackground.appendChild(snowContainer);
}

// Generate rain drops
function generateRain(intensity = 50) {
    const container = document.getElementById('rainContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < intensity; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 0.4 + 0.6) + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        drop.style.opacity = Math.random() * 0.5 + 0.3;
        container.appendChild(drop);
    }
}

// Generate snow flakes
function generateSnow(intensity = 30) {
    const container = document.getElementById('snowContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < intensity; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.style.left = Math.random() * 100 + '%';
        
        const size = Math.random() * 4 + 3;
        flake.style.width = size + 'px';
        flake.style.height = size + 'px';
        
        flake.style.animationDuration = (Math.random() * 3 + 3) + 's';
        flake.style.animationDelay = Math.random() * 5 + 's';
        flake.style.opacity = Math.random() * 0.6 + 0.4;
        
        container.appendChild(flake);
    }
}

// ===== Weather Codes Mapping (WMO Code) =====
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

// ===== State Management =====
let currentState = {
    latitude: null,
    longitude: null,
    cityName: '',
    isDay: true
};

// ===== Event Listeners =====
elements.searchBtn.addEventListener('click', handleSearch);
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Search on input with debounce
let debounceTimer;
elements.cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value.trim();
    
    if (value.length > 2) {
        debounceTimer = setTimeout(() => {
            handleSearch();
        }, 500);
    }
});

// Auto-detect location on load
window.addEventListener('load', () => {
    createWeatherEffects();
    detectLocation();
});

// ===== Main Functions =====

async function handleSearch() {
    const city = elements.cityInput.value.trim();
    
    if (!city) {
        showError('Пожалуйста, введите название города');
        return;
    }

    try {
        showLoading();
        hideError();
        
        // Geocoding - get coordinates for the city
        const coords = await geocodeCity(city);
        
        if (!coords) {
            throw new Error('Город не найден');
        }
        
        // Get weather data
        await fetchWeatherData(coords.latitude, coords.longitude, coords.name);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Произошла ошибка при загрузке данных');
        hideLoading();
    }
}

async function geocodeCity(cityName) {
    try {
        const params = new URLSearchParams({
            name: cityName,
            count: 1,
            language: 'ru',
            format: 'json'
        });

        const response = await fetch(`${API_CONFIG.GEOCODING_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error('Ошибка геокодирования');
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            return null;
        }

        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name || cityName
        };

    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

async function fetchWeatherData(latitude, longitude, cityName) {
    try {
        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,visibility',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum',
            timezone: 'auto',
            forecast_days: 5,
            language: 'ru'
        });

        const response = await fetch(`${API_CONFIG.WEATHER_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error('Ошибка получения данных о погоде');
        }

        const data = await response.json();
        
        // Update state
        currentState = {
            latitude,
            longitude,
            cityName: cityName,
            isDay: data.current.is_day === 1
        };

        // Display weather data
        displayCurrentWeather(data.current);
        displayForecast(data.daily);
        updateBackground(currentState.isDay, data.current.weather_code);
        
        showWeatherDisplay();
        hideLoading();

    } catch (error) {
        console.error('Weather fetch error:', error);
        throw error;
    }
}

function displayCurrentWeather(current) {
    const weatherInfo = getWeatherInfo(current.weather_code, current.is_day === 1);
    
    elements.cityName.textContent = currentState.cityName;
    elements.currentDate.textContent = formatDate(new Date());
    elements.temperature.textContent = Math.round(current.temperature_2m);
    elements.weatherIcon.textContent = weatherInfo.icon;
    elements.weatherDescription.textContent = weatherInfo.description;
    elements.feelsLike.textContent = `Ощущается как ${Math.round(current.apparent_temperature)}°C`;
    elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} км/ч`;
    elements.humidity.textContent = `${current.relative_humidity_2m}%`;
    elements.visibility.textContent = formatVisibility(current.visibility);
    elements.pressure.textContent = `${Math.round(current.surface_pressure)} гПа`;
}

function displayForecast(daily) {
    elements.forecastContainer.innerHTML = '';
    
    for (let i = 1; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const weatherInfo = getWeatherInfo(daily.weather_code[i], true);
        
        const card = createForecastCard(date, daily.temperature_2m_max[i], 
                                      daily.temperature_2m_min[i], weatherInfo);
        elements.forecastContainer.appendChild(card);
    }
}

function createForecastCard(date, maxTemp, minTemp, weatherInfo) {
    const card = document.createElement('div');
    card.className = 'forecast-card glass-morphism hover-lift';
    
    const dayName = getDayName(date);
    
    card.innerHTML = `
        <div class="forecast-date">${dayName}</div>
        <div class="forecast-icon">${weatherInfo.icon}</div>
        <div class="forecast-temp">
            <span class="forecast-high">${Math.round(maxTemp)}°</span>
            <span class="forecast-low">${Math.round(minTemp)}°</span>
        </div>
        <div class="forecast-desc">${weatherInfo.description}</div>
    `;
    
    return card;
}

function updateBackground(isDay, weatherCode) {
    const bg = elements.weatherBackground;
    
    // Reset all classes
    bg.querySelectorAll('.stars, .sun, .clouds').forEach(el => {
        el.classList.remove('active');
    });
    
    // Clear rain and snow containers
    const rainContainer = document.getElementById('rainContainer');
    const snowContainer = document.getElementById('snowContainer');
    if (rainContainer) rainContainer.innerHTML = '';
    if (snowContainer) snowContainer.innerHTML = '';
    
    // Day/Night cycle
    if (isDay) {
        document.body.style.background = 'linear-gradient(180deg, #5ac8fa 0%, #007aff 100%)';
        bg.querySelector('.sun').classList.add('active');
    } else {
        document.body.style.background = 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        bg.querySelector('.stars').classList.add('active');
    }
    
    // Get weather type
    const weatherInfo = weatherCodes[weatherCode];
    const weatherType = weatherInfo ? weatherInfo.type : 'clear';
    
    // Weather conditions - improved animations
    switch(weatherType) {
        case 'rain':
        case 'thunderstorm':
            generateRain(weatherCode >= 63 ? 80 : 50);
            if (weatherCode >= 2 || weatherType === 'thunderstorm') {
                bg.querySelector('.clouds').classList.add('active');
            }
            break;
            
        case 'snow':
            generateSnow(weatherCode >= 73 ? 50 : 30);
            if (weatherCode >= 2) {
                bg.querySelector('.clouds').classList.add('active');
            }
            break;
            
        case 'cloudy':
            bg.querySelector('.clouds').classList.add('active');
            break;
            
        case 'fog':
            bg.querySelector('.clouds').classList.add('active');
            break;
    }
}

// ===== Helper Functions =====

function getWeatherInfo(code, isDay) {
    const info = weatherCodes[code] || { description: 'Неизвестно', icon: '❓', iconNight: '❓' };
    return {
        description: info.description,
        icon: isDay ? info.icon : info.iconNight
    };
}

function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
}

function getDayName(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    
    if (isSameDay(date, today)) {
        return 'Сегодня';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
        return 'Завтра';
    }
    
    return days[date.getDay()];
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function formatVisibility(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} км`;
    }
    return `${meters} м`;
}

function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    showLoading();
                    const { latitude, longitude } = position.coords;
                    
                    // Reverse geocoding to get city name
                    const response = await fetch(
                        `https://api.bigdatacloud.net/geocode/reverse?latitude=${latitude}&longitude=${longitude}&localityLanguage=ru`
                    );
                    
                    let cityName = 'Моё местоположение';
                    if (response.ok) {
                        const data = await response.json();
                        cityName = data.city || data.locality || cityName;
                    }
                    
                    await fetchWeatherData(latitude, longitude, cityName);
                } catch (error) {
                    console.error('Location detection error:', error);
                    hideLoading();
                    showDefaultMessage();
                }
            },
            (error) => {
                console.log('Geolocation denied');
                showDefaultMessage();
            }
        );
    } else {
        showDefaultMessage();
    }
}

// ===== UI State Management =====

function showLoading() {
    elements.loadingIndicator.classList.add('show');
    elements.weatherDisplay.classList.remove('show');
    elements.defaultMessage.style.display = 'none';
}

function hideLoading() {
    elements.loadingIndicator.classList.remove('show');
}

function showWeatherDisplay() {
    elements.weatherDisplay.classList.add('show');
    elements.defaultMessage.style.display = 'none';
}

function showDefaultMessage() {
    elements.defaultMessage.style.display = 'flex';
    elements.weatherDisplay.classList.remove('show');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('show');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    elements.errorMessage.classList.remove('show');
}

// ===== Additional Features =====

// Add smooth scroll behavior
document.addEventListener('DOMContentLoaded', () => {
    // Focus input on load
    elements.cityInput.focus();
    
    // Add keyboard shortcut (Ctrl/Cmd + K to focus search)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.cityInput.focus();
        }
    });
});

// Add service worker for offline support (optional PWA feature)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable PWA features
        // navigator.serviceWorker.register('sw.js');
    });
}

console.log('🌤 Погодное приложение загружено успешно!');
console.log('💡 Совет: Нажмите Ctrl+K для быстрого поиска');
