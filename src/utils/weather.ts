import { FullWeatherData, DailyForecastDay, WeatherConditionInfo } from '../types';

export interface WeatherFetchResult {
  rainfallMm: number;
  locationName: string;
  dateStr: string;
  latitude: number;
  longitude: number;
  fullWeather?: FullWeatherData;
}

export interface CitySearchResult {
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

const SESSION_WEATHER_KEY = 'rainwise_session_weather_v1';

/**
 * Translate Open-Meteo's weather_code (WMO codes) into official description and calm icon
 */
export function parseWmoWeatherCode(code: number): WeatherConditionInfo {
  switch (code) {
    case 0:
      return { label: 'Sunny', icon: '☀️' };
    case 1:
    case 2:
      return { label: 'Partly Cloudy', icon: '🌤️' };
    case 3:
      return { label: 'Cloudy', icon: '☁️' };
    case 45:
    case 48:
      return { label: 'Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Light Rain', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: 'Rainy', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Snowy', icon: '❄️' };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: '⛈️' };
    default:
      if (code >= 51 && code <= 67) return { label: 'Rainy', icon: '🌧️' };
      if (code >= 80 && code <= 82) return { label: 'Rainy', icon: '🌧️' };
      if (code >= 71 && code <= 86) return { label: 'Snowy', icon: '❄️' };
      if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
      return { label: 'Cloudy', icon: '☁️' };
  }
}

/**
 * Format today's date in a simple, friendly format (e.g., "20 Sep 2026")
 */
export function getFriendlyTodayDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Fetch full current weather + 7-day outlook using Open-Meteo
 * https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation,weather_code&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto
 */
export async function fetchFullWeatherFromOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<FullWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned error ${response.status}`);
  }

  const data = await response.json();

  // Validate presence of daily data
  const dailyTime: string[] = data?.daily?.time || [];
  const dailyPrecip: number[] = data?.daily?.precipitation_sum || [];
  const dailyCodes: number[] = data?.daily?.weather_code || [];
  const dailyMax: number[] = data?.daily?.temperature_2m_max || [];
  const dailyMin: number[] = data?.daily?.temperature_2m_min || [];

  if (dailyTime.length === 0 || dailyPrecip.length === 0) {
    throw new Error('No weather forecast data returned for this location');
  }

  // Today's rainfall sum so far
  const rawTodayRain = dailyPrecip[0] ?? 0;
  const rainfallTodayMm = Math.round((Number(rawTodayRain) || 0) * 10) / 10;

  // Current weather
  const currentTemp = Math.round(Number(data?.current?.temperature_2m ?? dailyMax[0] ?? 20));
  const currentPrecip = Math.round((Number(data?.current?.precipitation ?? 0)) * 10) / 10;
  const currentWeatherCode = Number(data?.current?.weather_code ?? dailyCodes[0] ?? 0);
  const currentCondition = parseWmoWeatherCode(currentWeatherCode);

  // Build 7-day daily forecast
  const dailyForecast: DailyForecastDay[] = [];
  const count = Math.min(dailyTime.length, 7);

  for (let i = 0; i < count; i++) {
    const dateStr = dailyTime[i];
    // Use mid-day or noon to avoid timezone shift on date parsing
    const dateObj = new Date(`${dateStr}T12:00:00`);
    
    let dayLabel = 'Today';
    let fullDayName = 'Today';
    if (i > 0) {
      dayLabel = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
      fullDayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    }

    const code = Number(dailyCodes[i] ?? 0);
    const cond = parseWmoWeatherCode(code);
    const precip = Math.round((Number(dailyPrecip[i]) || 0) * 10) / 10;
    const maxT = Math.round(Number(dailyMax[i] ?? currentTemp));
    const minT = Math.round(Number(dailyMin[i] ?? currentTemp - 5));

    dailyForecast.push({
      date: dateStr,
      dayLabel,
      fullDayName,
      weatherCode: code,
      conditionLabel: cond.label,
      conditionIcon: cond.icon,
      precipitationMm: precip,
      tempMax: maxT,
      tempMin: minT,
    });
  }

  // Check for upcoming heavy rain to show a helpful alert
  // e.g. "🌧️ Heavy rain expected on Wednesday — good time to check your tank space!"
  let heavyRainAlert: string | null = null;
  for (let i = 0; i < dailyForecast.length; i++) {
    const day = dailyForecast[i];
    const isHeavy =
      day.precipitationMm >= 15 ||
      day.weatherCode === 65 || // heavy rain
      day.weatherCode === 82 || // violent shower
      day.weatherCode === 95 || // thunderstorm
      day.weatherCode === 96 || // thunderstorm with hail
      day.weatherCode === 99;

    if (isHeavy) {
      if (i === 0) {
        heavyRainAlert = `🌧️ Heavy rain expected today (${day.precipitationMm} mm) — good time to check your tank space!`;
      } else {
        heavyRainAlert = `🌧️ Heavy rain expected on ${day.fullDayName} (${day.precipitationMm} mm) — good time to check your tank space!`;
      }
      break; // highlight the nearest day with heavy rain
    }
  }

  const result: FullWeatherData = {
    locationName,
    latitude: lat,
    longitude: lon,
    currentTemp,
    currentPrecipitation: currentPrecip,
    currentWeatherCode,
    currentConditionLabel: currentCondition.label,
    currentConditionIcon: currentCondition.icon,
    rainfallTodayMm,
    dateStr: getFriendlyTodayDate(),
    dailyForecast,
    heavyRainAlert,
  };

  return result;
}

/**
 * Fetch rainfall for coordinates from Open-Meteo (backward compatible wrapper)
 */
export async function fetchRainfallFromOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<WeatherFetchResult> {
  const full = await fetchFullWeatherFromOpenMeteo(lat, lon, locationName);
  return {
    rainfallMm: full.rainfallTodayMm,
    locationName: full.locationName,
    dateStr: full.dateStr,
    latitude: lat,
    longitude: lon,
    fullWeather: full,
  };
}

/**
 * Reverse geocode coordinates to a human-friendly city/town name
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'RainWise-Rainwater-Harvest-App/1.0',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const place = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county;
      const stateOrCountry = addr.state || addr.country;

      if (place && stateOrCountry && place !== stateOrCountry) {
        return `${place}, ${stateOrCountry}`;
      } else if (place) {
        return place;
      } else if (stateOrCountry) {
        return stateOrCountry;
      }
    }
  } catch {
    // Fall back to coordinate representation if reverse geocoding is slow or unavailable
  }

  return `Your Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
}

/**
 * Search city/town by name using Open-Meteo Geocoding API
 * https://geocoding-api.open-meteo.com/v1/search?name={query}
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=8&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('City search service failed');
  }

  const data = await res.json();
  if (!data?.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.map((item: any) => ({
    name: item.name,
    admin1: item.admin1,
    country: item.country,
    countryCode: item.country_code,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

/**
 * Session storage helpers to remember location during the browser session
 */
export function saveSessionWeather(weather: FullWeatherData): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_WEATHER_KEY, JSON.stringify(weather));
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export function getSessionWeather(): FullWeatherData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_WEATHER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FullWeatherData;
  } catch {
    return null;
  }
}

export function clearSessionWeather(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_WEATHER_KEY);
  } catch {
    // Ignore
  }
}
