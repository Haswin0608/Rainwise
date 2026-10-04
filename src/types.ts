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

export interface RoofItem {
  id: string;
  name: string;               // e.g. "Roof 1", "Roof 2" (editable)
  area: string;               // numeric string e.g. "100" (in current unit or m²)
  areaUnit: 'metric' | 'imperial';
  typeKey: RoofTypeKey;
  customName?: string;        // when typeKey is 'custom'
  customEfficiency?: number;  // 0 to 100%, default 70
}

export interface StorageTankItem {
  id: string;
  name: string;               // e.g. "Tank 1", "Tank 2" (editable)
  capacity: string;           // numeric string in L or gal
}

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

// Editable Everyday Terms Conversions (litres per unit)
export interface EverydayConversionFactors {
  bucketSizeL: number;          // default 15 L (1 bucket ≈ 15 L)
  waterCanSizeL: number;        // default 20 L (1 can ≈ 20 L)
  bathSizeL: number;            // default 50 L (1 family bucket-bath)
  toiletFlushSizeL: number;     // default 6 L
  tankerSizeL: number;          // default 6000 L (1 tanker ≈ 6,000 L)
  gardenWateringPerM2L: number; // default 5 L per m² per watering
}

// Assumptions that user can see and modify
export interface PlanningAssumptions {
  runoffCoefficients: Record<RoofTypeKey, number>;
  demands: WaterDemandBreakdown;
  waterTariffPerKL: number;    // default ₹15 / kilolitre
  installationCostRs: number;  // default ₹15,000
  dryDaysBuffer: number;       // default 15 days
  conversions: EverydayConversionFactors;
}

export type CalculationPeriod = 'week' | 'month' | 'year';
export type SavedWastedPeriod = CalculationPeriod;

export interface TankFillBreakdown {
  id: string;
  name: string;
  capacityL: number;
  fillL: number;
  fillPct: number;
}

export interface RoofCalculationBreakdown {
  id: string;
  name: string;
  areaM2: number;
  areaDisplay: number;
  areaUnit: 'metric' | 'imperial';
  roofType: RoofTypeKey;
  roofTypeLabel: string;
  runoffCoefficient: number;
  rainFallingL: number;
  rainCollectedL: number;
  rainLostL: number;
}

export interface SavedWastedBreakdown {
  period: CalculationPeriod;
  periodLabel: string;
  rainfallMm: number;
  daysInPeriod: number;
  totalRainOnRoofL: number;
  waterCollectedL: number;
  savedL: number;
  lostOnRoofL: number;
  overflowedL: number;
  totalWastedL: number;
  savedPercentage: number;
  lostPercentage: number;
  overflowPercentage: number;
  effectiveTankCapacityL: number;
  isCustomTank: boolean;
  tanksFill: TankFillBreakdown[];
  roofsBreakdown: RoofCalculationBreakdown[];
  hasLocation: boolean;
  hasRoofArea: boolean;
}

export type RainfallScenario = 'dry' | 'normal' | 'wet';

export interface CalculatorInputs {
  // Step 1: Roofs list
  roofs: RoofItem[];
  
  // Step 2: Storage Tanks list & Household
  tanks: StorageTankItem[];
  noTankYet?: boolean;
  householdSize: string; // number of people, default '4'
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
  waterTariff: string; // ₹ per 1,000 L (default '15')
  installationCost: string; // ₹ (default '15000')
  weatherInfo?: WeatherTrackInfo;
  assumptions?: PlanningAssumptions;

  // Backwards compatibility fields for old v1 data
  roofAreaMode?: 'direct' | 'sections';
  directRoofArea?: string; // m² or sq ft
  roofType?: RoofTypeKey;
  customRunoffCoefficient?: string;
  efficiency?: string; // % efficiency
  tankCapacity?: string; // L or gal (optional)
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
  roofsList?: RoofItem[];
  roofArea: number; // Combined total m²
  roofType: RoofTypeKey;
  runoffCoefficient: number;
  
  // Multi-tanks
  tanks?: StorageTankItem[];
  totalTankCapacityL?: number;
  isNoTankYet?: boolean;

  // Active period calculation ('week' | 'month' | 'year')
  period?: CalculationPeriod;
  periodRainfallMm?: number;
  periodDays?: number;
  periodCollectedL?: number;
  periodSavedL?: number;
  periodOverflowL?: number;
  periodLostL?: number;

  // Weekly collection from 7-day forecast
  weeklyRainfallMm: number;
  weeklyHarvestableWater: number; // L = roof area (m²) × weekly rain (mm) × runoff coefficient

  // Monthly collection for current calendar month
  monthlyRainfallMm?: number;
  monthlyHarvestableWater?: number;

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

export type PageView = 'planner' | 'home' | 'calculator' | 'results';
export type ToolStep = 'calculate' | 'plan' | 'simulate' | 'report';

/**
 * ══════════════════════════════════════════════════════════════════════
 * SMART BUILDING PLANNER DATA MODELS
 * ══════════════════════════════════════════════════════════════════════
 */
export type BuildingTypeKey = 
  | 'house' 
  | 'apartment' 
  | 'office' 
  | 'school' 
  | 'hospital' 
  | 'hotel' 
  | 'commercial' 
  | 'factory' 
  | 'public';

export type BuildingStatus = 'new' | 'existing';

export interface BuildingUsageItem {
  task: string;
  sharePercent: number; // e.g. 40
  icon: string;
  description: string;
}

export interface BuildingProfile {
  key: BuildingTypeKey;
  name: string;
  icon: string;
  shortDesc: string;
  occupancyQuestion: string;
  occupancyPrimaryLabel: string;
  occupancyPrimaryUnit: string;
  occupancyPrimaryDefault: number;
  hasSecondaryInput?: boolean;
  secondaryLabel?: string;
  secondaryUnit?: string;
  secondaryDefault?: number;
  secondaryHelper?: string;
  dailyNonDrinkingUsePerPerson: number; // Litres per person/bed/guest/worker/visitor per day
  workingDaysPerWeek: number; // 5, 6, or 7
  storageMultiplierDays: { min: number; ideal: number }; // Days of storage buffer
  usageBreakdown: BuildingUsageItem[];
  focusAreas: string[];
  priorityTips: string[];
  safetyNote?: string;
}

export interface BuildingPlannerAnswers {
  buildingType: BuildingTypeKey;
  buildingStatus: BuildingStatus;
  primaryOccupancy: number;
  secondaryOccupancy?: number;
  roofAreaM2: number;
  roofUnit: 'metric' | 'imperial';
  roofLength?: string;
  roofWidth?: string;
  isCalculatedRoof?: boolean;
  roofType: RoofTypeKey;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  tankCapacityL?: number;
  isTankUserSpecified?: boolean;
  notes?: string;
}

export interface RecommendedSystemPart {
  id: string;
  icon: string;
  name: string;
  explanation: string;
  isSpecialHighlight: boolean;
}

export interface GeneratedBuildingPlan {
  buildingProfile: BuildingProfile;
  buildingStatus: BuildingStatus;
  occupancySummaryText: string;
  headlineText: string;
  headlineBuckets: number;
  headlineLitres: number;
  
  // Rain Collection
  roofAreaM2: number;
  roofTypeLabel: string;
  runoffCoefficient: number;
  annualRainfallMm: number;
  annualCollectedLitres: number;
  monthlyCollectedLitres: number[];
  
  // Water Demand & Coverage
  dailyDemandLitres: number;
  annualDemandLitres: number;
  coveragePercentage: number; // capped at 100%
  workingDaysPerYear: number;
  
  // Storage Tank Sizing
  minStorageLitres: number;
  recommendedStorageLitres: number;
  largeStorageLitres: number;
  userTankLitres?: number;
  tankVerdict: 'good' | 'overflow' | 'large' | 'suggested';
  tankVerdictLabel: string;
  tankVerdictMessage: string;
  
  // Heavy Rain 7-day Alert
  weeklyRainfallMm: number;
  weeklyHarvestLitres: number;
  hasHeavyRainOverflowRisk: boolean;
  heavyRainNotice: string;
  
  // Possible Uses
  usesBreakdown: Array<{
    task: string;
    icon: string;
    sharePercent: number;
    litresPerYear: number;
    bucketsPerYear: number;
  }>;
  
  // Recommended Checklist
  systemParts: RecommendedSystemPart[];
  
  // Economic impact
  yearlyWaterReusedLitres: number;
  yearlyBillSavingsRs: number;
  approxInstallationCostRs: number;
  paybackYears: number | null;
  
  // Tips & Rules
  priorityTips: string[];
  statutoryNote: string;
}

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
  version?: number;
  roofs: (RoofItem | RoofSection)[];
  tanks?: StorageTankItem[];
  noTankYet?: boolean;
  // Backward compatibility fields for v1:
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
