import { 
  FullWeatherData, 
  DailyForecastDay, 
  WeatherConditionInfo, 
  HistoricalRainfallData 
} from '../types';

/**
 * Localized Strings Dictionary
 * All UI strings are kept here so Tamil, Hindi, or other Indian languages
 * can be added easily in the future without modifying business logic.
 */
export const WEATHER_STRINGS = {
  cardTitle: '📍 Where are you?',
  privacyNotice: 'RainWise will use your location only to show local weather. It is not saved or shared.',
  useCurrentLocation: 'Use my current location',
  locatingPosition: 'Finding your location...',
  detectingPlaceName: 'Detecting village, town & district...',
  searchPrompt: 'Or type your village / town / city',
  searchPlaceholder: 'Search village, town, or city in India...',
  noPlaceFound: 'No place found. Try a nearby bigger town',
  changeLocation: 'Change location',
  lastUpdated: 'Last updated',
  dataSourceNotice: 'Forecast data: Open-Meteo. Forecasts can change, so check again closer to the day.',
  refresh: 'Refresh',
  errorLoadingWeather: "Couldn't load the weather. Check your internet and try again",
  retry: 'Retry',
  bestDayBadge: '🌧️ Best day to collect water',
  noRain: 'No rain',
  lightRain: 'Light rain',
  moderateRain: 'Moderate rain',
  heavyRain: 'Heavy rain',
  veryHeavyRain: 'Very heavy rain, be careful',
  chanceOfRain: 'Chance of rain',
  chanceShort: 'Chance',
  collectablePrefix: '💧 You could collect about',
  litresText: 'litres',
  weeklyTotalPrefix: 'This week you could collect about',
  tankOverflowAlert: '⚠️ Your tank may overflow. About {litres} litres could be wasted.',
  useWeeklyRainBtn: "Use this week's rainfall in the calculator",
  appliedToCalculator: 'Applied to Calculator!',
  enterRoofPrompt: 'Enter your roof size to see how much water you could collect',
  permissionDenied: 'Location permission was denied. You can easily type your town or village below.',
  locationUnavailable: 'Could not detect location. Please type your town or village below.',
  locationTimeout: 'Location request timed out. Please try again or type your place name.',
  genericLocationError: 'Could not find your location. Please type your village or town.',
  optionA: 'Option A • Automatic',
  optionATitle: 'Detect From My Phone / Computer',
  optionADesc: 'One tap to find your local rain forecast using GPS.',
  optionB: 'Option B • Search Place',
  optionBTitle: 'Search Village / Town / City',
  optionBDesc: 'Type any village, taluk, town, or city in India.',
  selectBtn: 'Select',
  dryDayLabel: '0 litres (dry day)',
  mmOfRain: 'mm of rain',
  rainLegendTitle: 'Rain Legend:',
  legendNoRain: '0 mm: grey "No rain"',
  legendLight: 'under 2.5 mm: light blue "Light rain"',
  legendModerate: '2.5 to 10 mm: blue "Moderate rain"',
  legendHeavy: '10 to 50 mm: dark blue "Heavy rain"',
  legendVeryHeavy: 'over 50 mm: purple "Very heavy rain, be careful"',
  total7DayRain: 'Total 7-day rain:',
  basedOnRainfallText: 'Based on {mm} mm of rain forecast over the next 7 days for {location}.',

  // Location-based automatic rainfall strings
  chooseLocationPrompt: '📍 Choose your location to see how much rain you could collect',
  chooseLocationSubtext: 'Select your town or village above to load real rainfall data.',
  typicalYearlyRainLabel: '🌧️ Typical yearly rain at your location:',
  typicalYearlyRainInfo: 'We calculated this from the last 3 years of real rainfall data.',
  basedOn3YearAverage: 'Based on rainfall at your location over the last 3 years, an average year brings about {mm} mm of rain.',
  errorLoadingArchive: "Couldn't load past rainfall for your location. Check your internet and try again",
  dryYear: 'Dry year (−30%)',
  normalYear: 'Normal year',
  wetYear: 'Wet year (+30%)',
  thisWeekCollectHeadline: 'This week you could collect about',
  rainfallSourceAssumptions: 'Rainfall source: Open-Meteo (7-day forecast for the week, 3-year historical archive for the year). Figures are realistic estimates; real rainfall varies from year to year.',
};

const SAVED_LOCATION_STORAGE_KEY = 'rainwise_saved_location_v2';
const ARCHIVE_CACHE_KEY_PREFIX = 'rainwise_archive_v2_';

export interface SavedLocationPreference {
  name: string;
  latitude: number;
  longitude: number;
  lastUpdated?: string;
}

export interface CitySearchResult {
  name: string;
  admin1?: string; // State (e.g. Tamil Nadu)
  admin2?: string; // District (e.g. Salem)
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  formattedLabel: string;
}

export interface RainLevelStyle {
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

/**
 * 1. WMO Weather Code Mapping (Official WMO Standards)
 */
export function parseWmoWeatherCode(code: number): WeatherConditionInfo {
  switch (code) {
    case 0:
      return { label: 'Clear', icon: '☀️' };
    case 1:
    case 2:
      return { label: 'Mostly clear', icon: '🌤️' };
    case 3:
      return { label: 'Cloudy', icon: '☁️' };
    case 45:
    case 48:
      return { label: 'Fog', icon: '🌫️' };
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
      return { label: 'Drizzle', icon: '🌦️' };
    case 61:
      return { label: 'Light rain', icon: '🌧️' };
    case 63:
      return { label: 'Rain', icon: '🌧️' };
    case 65:
      return { label: 'Heavy rain', icon: '🌧️' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain showers', icon: '🌦️' };
    case 95:
      return { label: 'Thunderstorm', icon: '⛈️' };
    case 96:
    case 99:
      return { label: 'Thunderstorm with hail', icon: '⛈️' };
    default:
      if (code >= 51 && code <= 55) return { label: 'Drizzle', icon: '🌦️' };
      if (code >= 61 && code <= 67) return { label: 'Rain', icon: '🌧️' };
      if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: '🌦️' };
      if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
      return { label: 'Mostly clear', icon: '🌤️' };
  }
}

/**
 * 2. Rain-Level Color Coding & Classification
 * - 0 mm: grey "No rain"
 * - under 2.5 mm: light blue "Light rain"
 * - 2.5 to 10 mm: blue "Moderate rain"
 * - 10 to 50 mm: dark blue "Heavy rain"
 * - over 50 mm: purple "Very heavy rain, be careful"
 */
export function getRainLevelCategory(precipitationMm: number): RainLevelStyle {
  if (precipitationMm <= 0) {
    return {
      label: WEATHER_STRINGS.noRain,
      colorClass: 'text-slate-400',
      badgeBg: 'bg-[#0e1626]',
      badgeBorder: 'border-[#24354c]',
      badgeText: 'text-slate-300',
    };
  }
  if (precipitationMm < 2.5) {
    return {
      label: WEATHER_STRINGS.lightRain,
      colorClass: 'text-sky-300',
      badgeBg: 'bg-sky-950/80',
      badgeBorder: 'border-sky-700/70',
      badgeText: 'text-sky-200',
    };
  }
  if (precipitationMm <= 10) {
    return {
      label: WEATHER_STRINGS.moderateRain,
      colorClass: 'text-teal-300',
      badgeBg: 'bg-teal-950/80',
      badgeBorder: 'border-teal-700/70',
      badgeText: 'text-teal-200',
    };
  }
  if (precipitationMm <= 50) {
    return {
      label: WEATHER_STRINGS.heavyRain,
      colorClass: 'text-indigo-300',
      badgeBg: 'bg-indigo-950/80',
      badgeBorder: 'border-indigo-700/70',
      badgeText: 'text-indigo-200',
    };
  }
  return {
    label: WEATHER_STRINGS.veryHeavyRain,
    colorClass: 'text-purple-300',
    badgeBg: 'bg-purple-950/90',
    badgeBorder: 'border-purple-700/70',
    badgeText: 'text-purple-200',
  };
}

/**
 * 3. Reverse Geocode Coordinates via BigDataCloud Client Endpoint
 * https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=LAT&longitude=LON&localityLanguage=en
 */
export async function reverseGeocodeWithBigDataCloud(lat: number, lon: number): Promise<string> {
  const fallback = `Your location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    
    // Extract town/village name
    const place = data.locality || data.city || data.principalSubdivision;
    const state = data.principalSubdivision;
    
    // Extract district from administrative info
    let district = '';
    if (data.localityInfo && Array.isArray(data.localityInfo.administrative)) {
      for (const admin of data.localityInfo.administrative) {
        if (admin.order === 3 || admin.description?.toLowerCase().includes('district') || admin.name?.toLowerCase().includes('district')) {
          district = admin.name.replace(/district/i, '').trim();
          break;
        }
      }
    }

    if (place && district && state && place !== district && district !== state) {
      return `${place}, ${district}, ${state}`;
    } else if (place && state && place !== state) {
      return `${place}, ${state}`;
    } else if (place) {
      return place;
    } else if (state) {
      return state;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * 4. Search Villages / Towns / Cities using Open-Meteo Geocoding API
 * https://geocoding-api.open-meteo.com/v1/search?name=QUERY&count=5&language=en&format=json
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=5&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Geocoding search service is temporarily unavailable');
  }

  const data = await res.json();
  if (!data?.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.slice(0, 5).map((item: any) => {
    const parts = [item.name];
    if (item.admin2 && item.admin2 !== item.name) {
      parts.push(`${item.admin2}`);
    }
    if (item.admin1 && item.admin1 !== item.name && item.admin1 !== item.admin2) {
      parts.push(item.admin1);
    }
    if (item.country) {
      parts.push(item.country);
    }

    return {
      name: item.name,
      admin1: item.admin1,
      admin2: item.admin2,
      country: item.country,
      countryCode: item.country_code,
      latitude: item.latitude,
      longitude: item.longitude,
      formattedLabel: parts.join(', '),
    };
  });
}

/**
 * 5. Fetch 7-Day Forecast from Open-Meteo
 * Real values only; strictly no mock data.
 */
export async function fetch7DayWeatherForecast(
  lat: number,
  lon: number,
  locationName: string
): Promise<FullWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,rain_sum&timezone=auto&forecast_days=7`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service error: ${response.status}`);
  }

  const data = await response.json();
  const daily = data?.daily;

  if (!daily || !daily.time || !Array.isArray(daily.time) || daily.time.length === 0) {
    throw new Error('No weather forecast returned for this location.');
  }

  const dailyTime: string[] = daily.time;
  const dailyCodes: number[] = daily.weather_code || [];
  const dailyMax: number[] = daily.temperature_2m_max || [];
  const dailyMin: number[] = daily.temperature_2m_min || [];
  const dailyPrecip: number[] = daily.precipitation_sum || [];
  const dailyProb: number[] = daily.precipitation_probability_max || [];
  const dailyRainSum: number[] = daily.rain_sum || [];

  const dailyForecast: DailyForecastDay[] = [];
  const count = Math.min(dailyTime.length, 7);

  let rainiestIdx = 0;
  let maxRainAmount = -1;
  let totalWeekRain = 0;
  let rainyDaysCount = 0;

  for (let i = 0; i < count; i++) {
    const dateStr = dailyTime[i];
    const dateObj = new Date(`${dateStr}T12:00:00`);

    let dayLabel = 'Today';
    let fullDayName = 'Today';

    if (i === 1) {
      dayLabel = 'Tomorrow';
      fullDayName = 'Tomorrow';
    } else if (i > 1) {
      dayLabel = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      fullDayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
    }

    const code = Number(dailyCodes[i] ?? 0);
    const cond = parseWmoWeatherCode(code);
    const precipMm = Math.round((Number(dailyPrecip[i]) || 0) * 10) / 10;
    const probMax = Math.min(100, Math.max(0, Math.round(Number(dailyProb[i] || 0))));
    const maxT = Math.round(Number(dailyMax[i] ?? 30));
    const minT = Math.round(Number(dailyMin[i] ?? 22));

    if (precipMm > maxRainAmount) {
      maxRainAmount = precipMm;
      rainiestIdx = i;
    }

    if (precipMm > 0) {
      rainyDaysCount += 1;
      totalWeekRain += precipMm;
    }

    dailyForecast.push({
      date: dateStr,
      dayLabel,
      fullDayName,
      weatherCode: code,
      conditionLabel: cond.label,
      conditionIcon: cond.icon,
      precipitationMm: precipMm,
      precipitationProbabilityMax: probMax,
      rainSum: Number(dailyRainSum[i] ?? precipMm),
      tempMax: maxT,
      tempMin: minT,
    });
  }

  totalWeekRain = Math.round(totalWeekRain * 10) / 10;

  // Generate One-Sentence Summary above the cards
  let weeklySummarySentence = '';
  if (rainyDaysCount > 0) {
    const rainiestDay = dailyForecast[rainiestIdx];
    const dayNameRef = rainiestIdx === 0 ? 'today' : rainiestIdx === 1 ? 'tomorrow' : rainiestDay.fullDayName;
    weeklySummarySentence = `Rain is expected on ${rainyDaysCount} of the next 7 days. The most rain is on ${dayNameRef}.`;
  } else {
    weeklySummarySentence = 'Dry weather expected for the next 7 days with clear skies. Keep your tanks clean and ready!';
  }

  // Heavy Rain Alert Check
  let heavyRainAlert: string | null = null;
  for (let i = 0; i < dailyForecast.length; i++) {
    const day = dailyForecast[i];
    if (day.precipitationMm >= 25 || day.weatherCode === 65 || day.weatherCode === 95 || day.weatherCode === 96 || day.weatherCode === 99) {
      heavyRainAlert = `🌧️ Heavy rain expected ${i === 0 ? 'today' : 'on ' + day.fullDayName} (${day.precipitationMm} mm) — good time to check your tank space!`;
      break;
    }
  }

  const now = new Date();
  const lastUpdatedStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const rainfallTodayMm = dailyForecast[0]?.precipitationMm || 0;
  const currentTemp = dailyForecast[0]?.tempMax || 30;
  const currentWeatherCode = dailyForecast[0]?.weatherCode || 0;
  const currentCond = parseWmoWeatherCode(currentWeatherCode);

  return {
    locationName,
    latitude: lat,
    longitude: lon,
    currentTemp,
    currentPrecipitation: rainfallTodayMm,
    currentWeatherCode,
    currentConditionLabel: currentCond.label,
    currentConditionIcon: currentCond.icon,
    rainfallTodayMm,
    dateStr: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    lastUpdatedStr,
    weeklyPrecipitationSumMm: totalWeekRain,
    rainiestDayIndex: rainiestIdx,
    weeklySummarySentence,
    dailyForecast,
    heavyRainAlert,
  };
}

/**
 * 6. Fetch 3-Year Historical Rainfall from Open-Meteo Archive API
 * Endpoint:
 * https://archive-api.open-meteo.com/v1/archive?latitude=LAT&longitude=LON&start_date=YYYY-01-01&end_date=YYYY-12-31&daily=precipitation_sum&timezone=auto
 *
 * Rules:
 * - Request the last 3 full calendar years (e.g. 2023, 2024, 2025).
 * - Add up daily values into monthly totals, then average each month across the 3 years (Jan to Dec).
 * - Typical yearly rainfall = sum of those 12 monthly averages.
 * - Cache in localStorage (wrapped in try/catch).
 * - Throw error with WEATHER_STRINGS.errorLoadingArchive on failure; never invent numbers.
 */
export async function fetch3YearHistoricalRainfall(
  lat: number,
  lon: number,
  locationName: string
): Promise<HistoricalRainfallData> {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear - 1; // Last full calendar year (e.g. 2025)
  const startYear = endYear - 2;   // 3 full years (e.g. 2023, 2024, 2025)
  const yearsAnalyzed = [startYear, startYear + 1, endYear];

  const cacheKey = `${ARCHIVE_CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lon.toFixed(3)}_${startYear}_${endYear}`;

  // 1. Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as HistoricalRainfallData;
      if (
        parsed &&
        typeof parsed.typicalAnnualRainfallMm === 'number' &&
        Array.isArray(parsed.typicalMonthlyRainfallMm) &&
        parsed.typicalMonthlyRainfallMm.length === 12
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache error, proceed to fetch
  }

  // 2. Fetch from Open-Meteo Archive API
  const startDate = `${startYear}-01-01`;
  const endDate = `${endYear}-12-31`;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=auto`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(WEATHER_STRINGS.errorLoadingArchive);
  }

  if (!response.ok) {
    throw new Error(WEATHER_STRINGS.errorLoadingArchive);
  }

  const data = await response.json();
  const daily = data?.daily;

  if (!daily || !daily.time || !daily.precipitation_sum || !Array.isArray(daily.time)) {
    throw new Error(WEATHER_STRINGS.errorLoadingArchive);
  }

  const times: string[] = daily.time;
  const precipSums: (number | null)[] = daily.precipitation_sum;

  // Initialize monthly totals per year: 12 months for each year
  const monthlyTotalsByYear: Record<number, number[]> = {};
  for (const y of yearsAnalyzed) {
    monthlyTotalsByYear[y] = new Array(12).fill(0);
  }

  for (let i = 0; i < times.length; i++) {
    const dateStr = times[i];
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(5, 7), 10) - 1; // 0 to 11
    const mm = Number(precipSums[i]) || 0;

    if (monthlyTotalsByYear[year] && month >= 0 && month < 12) {
      monthlyTotalsByYear[year][month] += mm;
    }
  }

  // Average each month across the 3 years
  const typicalMonthlyRainfallMm: number[] = [];
  for (let m = 0; m < 12; m++) {
    let sum = 0;
    let count = 0;
    for (const y of yearsAnalyzed) {
      if (monthlyTotalsByYear[y]) {
        sum += monthlyTotalsByYear[y][m];
        count++;
      }
    }
    const avgMonth = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    typicalMonthlyRainfallMm.push(avgMonth);
  }

  // Sum of 12 monthly averages = typical yearly rainfall
  const typicalAnnualRainfallMm = Math.round(
    typicalMonthlyRainfallMm.reduce((acc, curr) => acc + curr, 0) * 10
  ) / 10;

  const result: HistoricalRainfallData = {
    typicalAnnualRainfallMm,
    typicalMonthlyRainfallMm,
    yearsAnalyzed,
    latitude: lat,
    longitude: lon,
    locationName,
  };

  // Cache in localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // Ignore storage quota limits
  }

  return result;
}

/**
 * 7. LocalStorage helpers for saved location preference
 */
export function saveLocationPreference(loc: SavedLocationPreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_LOCATION_STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // Graceful fallback
  }
}

export function getSavedLocationPreference(): SavedLocationPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedLocationPreference;
  } catch {
    return null;
  }
}

export function clearSavedLocationPreference(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SAVED_LOCATION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Backward compatibility alias
 */
export const fetchFullWeatherFromOpenMeteo = fetch7DayWeatherForecast;
export const reverseGeocodeCoords = reverseGeocodeWithBigDataCloud;
