export type RoofTypeKey = 'concrete' | 'clay_tile' | 'metal_sheet' | 'asbestos' | 'thatch' | 'custom';

export interface RoofTypeOption {
  key: RoofTypeKey;
  label: string;
  coefficient: number;
  description: string;
  icon: string;
}

export const ROOF_TYPES: RoofTypeOption[] = [
  { key: 'concrete', label: 'Concrete / RCC', coefficient: 0.80, description: 'Flat or sloped cement roof', icon: '🏢' },
  { key: 'clay_tile', label: 'Clay Tile / Mangalore', coefficient: 0.75, description: 'Traditional terracotta baked tiles', icon: '🧱' },
  { key: 'metal_sheet', label: 'Metal / GI / Tin Sheet', coefficient: 0.90, description: 'Corrugated iron or color-coated sheet', icon: '🏗️' },
  { key: 'asbestos', label: 'Asbestos / Fiber Sheet', coefficient: 0.80, description: 'Cement or composite fiber sheets', icon: '🏚️' },
  { key: 'thatch', label: 'Thatch / Palm Leaf', coefficient: 0.60, description: 'Traditional rural thatch or straw', icon: '🛖' },
  { key: 'custom', label: 'Custom Roof Type', coefficient: 0.80, description: 'Enter your own runoff coefficient', icon: '⚙️' },
];

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
  date: string;
  dayLabel: string;
  fullDayName: string;
  weatherCode: number;
  conditionLabel: string;
  conditionIcon: string;
  precipitationMm: number;
  precipitationProbabilityMax: number; // 0 - 100%
  rainSum?: number;
  tempMax: number;
  tempMin: number;
}

export interface FullWeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  currentPrecipitation: number;
  currentWeatherCode: number;
  currentConditionLabel: string;
  currentConditionIcon: string;
  rainfallTodayMm: number;
  dateStr: string;
  lastUpdatedStr: string;
  weeklyPrecipitationSumMm: number;
  rainiestDayIndex: number;
  weeklySummarySentence: string;
  dailyForecast: DailyForecastDay[];
  heavyRainAlert?: string | null;
}

/**
 * 3-Year Historical Rainfall Average from Open-Meteo Archive API
 */
export interface HistoricalRainfallData {
  typicalAnnualRainfallMm: number;     // Sum of 12 monthly averages
  typicalMonthlyRainfallMm: number[];   // 12 monthly averages (Jan through Dec)
  yearsAnalyzed: number[];              // e.g. [2023, 2024, 2025]
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface WeatherTrackInfo {
  locationName: string;
  weeklyRainfallMm: number;             // 7-day forecast precipitation sum
  dateStr: string;
  isAutoFetched: boolean;
  latitude?: number;
  longitude?: number;
  fullWeather?: FullWeatherData;
  historical?: HistoricalRainfallData | null;
  isLoadingArchive?: boolean;
  archiveError?: string | null;
}

// Editable Water Demand Defaults per person (litres/day)
export interface WaterDemandBreakdown {
  toilet: number;       // default 30 L
  cleaning: number;     // default 10 L
  gardening: number;    // default 15 L
  vehicle: number;      // default 5 L
}

// Assumptions that user can see and modify
export interface PlanningAssumptions {
  runoffCoefficients: Record<RoofTypeKey, number>;
  demands: WaterDemandBreakdown;
  waterTariffPerKL: number;    // default ₹15 / kilolitre
  installationCostRs: number;  // default ₹15,000
  dryDaysBuffer: number;       // default 15 days
}

export type RainfallScenario = 'dry' | 'normal' | 'wet';

export interface CalculatorInputs {
  // Step 1: Roof
  roofAreaMode: 'direct' | 'sections';
  directRoofArea: string; // m² or sq ft
  roofs: RoofSection[];
  roofType: RoofTypeKey;
  customRunoffCoefficient?: string;
  
  // Step 2: Planning & Household
  householdSize: string; // number of people, default '4'
  tankCapacity: string; // L or gal (optional)
  dailyRequirement: string; // L or gal (derived or custom)
  
  // Simulation scenario toggle
  rainfallScenario?: RainfallScenario; // 'dry' (-30%), 'normal', 'wet' (+30%)

  // Location-based Rainfall (Automatic, no manual typing)
  locationName?: string;
  latitude?: number;
  longitude?: number;
  weeklyRainfallMm?: number;
  typicalAnnualRainfallMm?: number;
  typicalMonthlyRainfallMm?: number[];
  historicalRainfall?: HistoricalRainfallData | null;
  isLoadingArchive?: boolean;
  archiveError?: string | null;

  // Advanced / Assumptions
  efficiency: string; // % efficiency (derived from roofType coefficient)
  waterTariff: string; // ₹ per 1,000 L (default '15')
  installationCost: string; // ₹ (default '15000')
  weatherInfo?: WeatherTrackInfo;
  assumptions?: PlanningAssumptions;
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

export interface WaterUseSupport {
  task: string;
  icon: string;
  dailyLiters: number;
  daysSupported: number;
  friendlyText: string;
}

export interface TankAdequacyInfo {
  status: 'good' | 'overflow' | 'large';
  statusLabel: string;
  badgeColor: string;
  message: string;
  recommendedSize: number; // in Litres
  enteredCapacity?: number;
  overflowLitres: number;
  overflowWastedNotice: string;
}

export interface EconomicImpactInfo {
  waterReusedPerYearL: number;
  freshWaterReplacedL: number;
  yearlyBillSavingsRs: number;
  approxInstallationCostRs: number;
  paybackPeriodYears: number | null; // null if 0 savings
  disclaimer: string;
}

export interface HouseholdPlan {
  householdSize: number;
  dailyDemandTotalL: number;
  annualDemandTotalL: number;
  waterUses: WaterUseSupport[];
  daysSupportedAllTasks: number;
  tankAdequacy: TankAdequacyInfo;
  economicImpact: EconomicImpactInfo;
}

export interface SimulationMonth {
  monthIndex: number;
  monthName: string;
  rainfallMm: number;
  inflowL: number;
  demandL: number;
  startLevelL: number;
  endLevelL: number;
  overflowL: number;
  shortfallL: number;
  fillPercentage: number;
  heavyRainAlert: boolean;
}

export interface SimulationResult {
  months: SimulationMonth[];
  tankCapacityL: number;
  totalAnnualInflowL: number;
  totalAnnualDemandL: number;
  totalAnnualUsedL: number;
  totalAnnualOverflowL: number;
  totalAnnualShortfallL: number;
  peakFillMonth: string;
  peakFillPercentage: number;
  hasHeavyRainWarning: boolean;
  heavyRainMonths: string[];
  rainfallScenario: RainfallScenario;
  scenarioMultiplier: number;
}

export interface CalculationResult {
  hasLocation: boolean;
  locationName?: string;
  roofs: RoofAreaBreakdown[];
  roofArea: number; // Combined total m²
  roofType: RoofTypeKey;
  runoffCoefficient: number;
  
  // Weekly collection from 7-day forecast
  weeklyRainfallMm: number;
  weeklyHarvestableWater: number; // L = roof area (m²) × weekly rain (mm) × runoff coefficient

  // Typical annual collection from 3-year historical archive
  annualRainfallMm: number; // Typical yearly mm
  scaledAnnualRainfallMm: number; // Scaled by scenario
  rainfallScenario: RainfallScenario;
  scenarioMultiplier: number;
  potentialWater: number; // L = roof area * scaled rain
  harvestableWater: number; // L = potential * coefficient
  waterLost: number; // L = potential - harvestable
  actuallyHarvested: number; // L accounting for tank
  wastedWater: number; // L overflowing
  tankCapacity: number; // L entered or 0

  dailyRequirement?: number; // L
  supplyDays?: number; // days
  efficiency: number; // %
  storageUtilizationRate: number; // %
  harvestEfficiencyRate: number; // %
  summarySentence: string;
  suggestionLine: string;
  savedComparison: WaterComparison;
  wastedComparison: WaterComparison;
  weatherInfo?: WeatherTrackInfo;
  householdPlan?: HouseholdPlan;
  simulation?: SimulationResult;
  isLoadingArchive?: boolean;
  archiveError?: string | null;
}

export type PageView = 'home' | 'calculator' | 'results';
export type ToolStep = 'calculate' | 'plan' | 'simulate' | 'report';

export interface RoofError {
  length?: string;
  width?: string;
  directArea?: string;
}

export interface FormErrors {
  roofs?: Record<string, RoofError>;
  directArea?: string;
  efficiency?: string;
  tankCapacity?: string;
  dailyRequirement?: string;
  householdSize?: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputs: Partial<CalculatorInputs>;
}

export interface SavedBuilding {
  id: string;
  userId: string;
  nickname: string;
  locationLabel?: string;
  roofs: RoofSection[];
  roofAreaMode?: 'direct' | 'sections';
  directRoofArea?: string;
  roofType?: RoofTypeKey;
  tankCapacity: string;
  efficiency: string;
  dailyRequirement?: string;
  householdSize?: string;
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
