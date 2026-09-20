export interface RoofSection {
  id: string;
  name: string;
  length: string;
  width: string;
}

export interface WeatherConditionInfo {
  label: string;
  icon: string;
}

export interface DailyForecastDay {
  date: string; // e.g. "2026-09-20"
  dayLabel: string; // e.g. "Today", "Mon", "Tue"
  fullDayName: string; // e.g. "Monday", "Tuesday"
  weatherCode: number;
  conditionLabel: string; // e.g. "Sunny", "Partly Cloudy", "Rainy"
  conditionIcon: string; // e.g. "☀️", "🌧️"
  precipitationMm: number; // expected rainfall mm
  tempMax: number; // °C
  tempMin: number; // °C
}

export interface FullWeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  currentTemp: number; // °C
  currentPrecipitation: number; // mm
  currentWeatherCode: number;
  currentConditionLabel: string;
  currentConditionIcon: string;
  rainfallTodayMm: number; // mm
  dateStr: string;
  dailyForecast: DailyForecastDay[];
  heavyRainAlert?: string | null;
}

export interface WeatherTrackInfo {
  locationName: string;
  rainfallMm: number;
  dateStr: string;
  isAutoFetched: boolean;
  latitude?: number;
  longitude?: number;
  fullWeather?: FullWeatherData;
}

export interface CalculatorInputs {
  roofs: RoofSection[];
  rainfall: string;
  efficiency: string;
  tankCapacity: string;
  dailyRequirement: string;
  weatherInfo?: WeatherTrackInfo;
}

export interface RoofAreaBreakdown {
  id: string;
  name: string;
  length: number;
  width: number;
  area: number;
}

export interface WaterComparison {
  primaryText: string;
  secondaryText?: string;
  dailyNeedText?: string;
  icon: string;
}

export interface CalculationResult {
  roofs: RoofAreaBreakdown[];
  roofArea: number; // Combined total m²
  rainfall: number; // mm
  potentialWater: number; // L (Total Rain That Falls)
  harvestableWater: number; // L (Rain You Can Actually Collect)
  actuallyHarvested: number; // L (Water You Can Save)
  wastedWater: number; // L (Water Wasted / Losing)
  tankCapacity: number; // L (Your Tank Size)
  dailyRequirement?: number; // L (Daily water need)
  supplyDays?: number; // days (Days This Water Will Last)
  efficiency: number; // %
  storageUtilizationRate: number; // % of tank capacity used
  harvestEfficiencyRate: number; // % of harvestable saved
  summarySentence: string;
  suggestionLine: string;
  savedComparison: WaterComparison;
  wastedComparison: WaterComparison;
  weatherInfo?: WeatherTrackInfo;
}

export type PageView = 'home' | 'calculator' | 'results';

export interface RoofError {
  length?: string;
  width?: string;
}

export interface FormErrors {
  roofs?: Record<string, RoofError>;
  rainfall?: string;
  efficiency?: string;
  tankCapacity?: string;
  dailyRequirement?: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputs: CalculatorInputs;
}

export interface SavedBuilding {
  id: string;
  userId: string;
  nickname: string;
  locationLabel?: string;
  roofs: RoofSection[];
  tankCapacity: string;
  efficiency: string;
  dailyRequirement?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
}

export type UnitSystem = 'metric' | 'imperial';


