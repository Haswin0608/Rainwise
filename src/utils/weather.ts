/**
 * Open-Meteo Weather & Geocoding Service for RainWise
 * Free, reliable, public API with no API key required.
 */

export interface WeatherFetchResult {
  rainfallMm: number;
  locationName: string;
  dateStr: string;
  latitude: number;
  longitude: number;
}

export interface CitySearchResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * Format today's date in a simple, friendly format (e.g., "20 Sep 2026" or "Today, 20 Sep")
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
 * Fetch rainfall for coordinates from Open-Meteo
 */
export async function fetchRainfallFromOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<WeatherFetchResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned error ${response.status}`);
  }

  const data = await response.json();
  const precipitationArray = data?.daily?.precipitation_sum;

  if (!precipitationArray || !Array.isArray(precipitationArray) || precipitationArray.length === 0) {
    throw new Error('No rainfall data received for this location');
  }

  const rawRainfall = precipitationArray[0];
  if (rawRainfall === null || rawRainfall === undefined || isNaN(rawRainfall)) {
    throw new Error('Rainfall reading was unavailable');
  }

  // Round to 1 decimal place or whole number (e.g., 12.5 or 0)
  const rainfallMm = Math.round(rawRainfall * 10) / 10;
  const dateStr = getFriendlyTodayDate();

  return {
    rainfallMm,
    locationName,
    dateStr,
    latitude: lat,
    longitude: lon,
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
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=5&language=en&format=json`;

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
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}
