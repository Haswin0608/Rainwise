import { 
  BuildingPlannerAnswers, 
  GeneratedBuildingPlan, 
  BuildingProfile, 
  BuildingTypeKey,
  PlanningAssumptions,
  FullWeatherData,
  HistoricalRainfallData,
  RecommendedSystemPart
} from '../types';
import { BUILDING_PROFILES, BASE_SYSTEM_PARTS, PLANNER_STRINGS } from '../data/buildingProfiles';
import { getRunoffCoefficient, toBuckets } from './calculations';

export const COMMON_TANK_SIZES_EXTENDED = [
  500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 75000, 100000
];

/**
 * Rounds any raw litre number up or to the nearest standard commercial tank size.
 */
export function roundToCommonTankSize(litres: number): number {
  if (litres <= 500) return 500;
  for (const size of COMMON_TANK_SIZES_EXTENDED) {
    if (litres <= size) return size;
  }
  return Math.ceil(litres / 10000) * 10000;
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * 1. DEMAND CALCULATION (Small commented function for students)
 * ══════════════════════════════════════════════════════════════════════
 * Daily Demand (L) = (Primary Occupants × daily rate) + (Secondary Occupants × secondary rate)
 * Annual Demand (L) = Daily Demand × (Working Days per Week × 52 weeks)
 */
export function calcBuildingDemand(
  profile: BuildingProfile,
  primaryOccupancy: number,
  secondaryOccupancy?: number
): { dailyDemandLitres: number; annualDemandLitres: number; workingDaysPerYear: number; occupancySummaryText: string } {
  const primaryCount = Math.max(1, primaryOccupancy || profile.occupancyPrimaryDefault || 1);
  let dailyDemand = 0;
  let occupancySummaryText = '';

  switch (profile.key) {
    case 'house':
      dailyDemand = primaryCount * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${primaryCount} residents`;
      break;

    case 'apartment': {
      const flats = secondaryOccupancy && secondaryOccupancy > 0 ? secondaryOccupancy : Math.ceil(primaryCount / 4);
      dailyDemand = primaryCount * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${primaryCount} residents across ${flats} flats`;
      break;
    }

    case 'office':
      dailyDemand = primaryCount * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${primaryCount} employees`;
      break;

    case 'school':
      dailyDemand = primaryCount * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${primaryCount} students & staff`;
      break;

    case 'hospital': {
      const beds = primaryCount;
      const staff = secondaryOccupancy ?? 20;
      dailyDemand = (beds * 100) + (staff * 20);
      occupancySummaryText = `${beds} beds & ${staff} staff`;
      break;
    }

    case 'hotel': {
      const rooms = primaryCount;
      const guestsPerRoom = secondaryOccupancy ?? 2;
      const totalGuests = rooms * guestsPerRoom;
      dailyDemand = totalGuests * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${rooms} rooms (${totalGuests} guest capacity)`;
      break;
    }

    case 'commercial': {
      const visitors = primaryCount;
      const staff = secondaryOccupancy ?? 25;
      dailyDemand = (visitors * 10) + (staff * 25);
      occupancySummaryText = `${visitors.toLocaleString()} daily visitors & ${staff} staff`;
      break;
    }

    case 'factory': {
      const workers = primaryCount;
      const extraProcess = secondaryOccupancy ?? 500;
      dailyDemand = (workers * 30) + extraProcess;
      occupancySummaryText = `${workers} workers + ${extraProcess.toLocaleString()} L/day process water`;
      break;
    }

    case 'public':
      dailyDemand = primaryCount * profile.dailyNonDrinkingUsePerPerson;
      occupancySummaryText = `${primaryCount.toLocaleString()} daily community visitors`;
      break;

    default:
      dailyDemand = primaryCount * 40;
      occupancySummaryText = `${primaryCount} occupants`;
      break;
  }

  const workingDaysPerYear = profile.workingDaysPerWeek === 7 
    ? 365 
    : profile.workingDaysPerWeek === 6 
    ? 312 
    : 260;

  const annualDemandLitres = Math.round(dailyDemand * workingDaysPerYear);

  return {
    dailyDemandLitres: Math.round(dailyDemand),
    annualDemandLitres,
    workingDaysPerYear,
    occupancySummaryText,
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * 2. STORAGE SIZING RANGE (Minimum, Recommended, Large)
 * ══════════════════════════════════════════════════════════════════════
 * Range = Daily Demand × storage days multiplier from profile,
 * capped at the yearly collection, rounded to common tank sizes.
 */
export function calcStorageRange(
  dailyDemand: number,
  storageDays: { min: number; ideal: number },
  annualCollection: number
): { minStorageLitres: number; recommendedStorageLitres: number; largeStorageLitres: number } {
  if (dailyDemand <= 0) {
    return { minStorageLitres: 1000, recommendedStorageLitres: 2000, largeStorageLitres: 5000 };
  }

  const cap = annualCollection > 0 ? annualCollection : 1000000;

  const rawMin = Math.min(cap, dailyDemand * storageDays.min);
  const rawRec = Math.min(cap, dailyDemand * storageDays.ideal);
  const rawLarge = Math.min(cap, dailyDemand * (storageDays.ideal * 1.5));

  return {
    minStorageLitres: roundToCommonTankSize(rawMin),
    recommendedStorageLitres: roundToCommonTankSize(rawRec),
    largeStorageLitres: roundToCommonTankSize(rawLarge),
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * 3. COVERAGE PERCENTAGE
 * ══════════════════════════════════════════════════════════════════════
 * How much of the annual non-drinking demand can rain cover (capped at 100%).
 */
export function calcCoverage(annualCollection: number, annualDemand: number): number {
  if (!annualDemand || annualDemand <= 0) return 0;
  return Math.min(100, Math.round((annualCollection / annualDemand) * 100));
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * 4. BUILD COMPLETE RAINWISE PLAN
 * ══════════════════════════════════════════════════════════════════════
 * Integrates location rainfall, building profile, occupancy demand,
 * and tank storage into a comprehensive final report.
 */
export function buildBuildingPlan(
  answers: BuildingPlannerAnswers,
  weatherData?: FullWeatherData | null,
  historicalData?: HistoricalRainfallData | null,
  assumptions?: PlanningAssumptions
): GeneratedBuildingPlan {
  const profile = BUILDING_PROFILES[answers.buildingType] || BUILDING_PROFILES.house;
  const roofAreaM2 = Math.max(1, answers.roofAreaM2 || 100);
  const runoffCoeff = getRunoffCoefficient(answers.roofType, undefined, assumptions);

  // 1. Rainfall from real Open-Meteo data
  const annualRainfallMm = historicalData?.typicalAnnualRainfallMm || 950;
  const annualCollectedLitres = Math.round(roofAreaM2 * annualRainfallMm * runoffCoeff);

  // Monthly collected distribution (12 months)
  const monthlyRainMm = historicalData?.typicalMonthlyRainfallMm || 
    new Array(12).fill(annualRainfallMm / 12);
  const monthlyCollectedLitres = monthlyRainMm.map(rain => Math.round(roofAreaM2 * rain * runoffCoeff));

  // 2. Demand
  const { dailyDemandLitres, annualDemandLitres, workingDaysPerYear, occupancySummaryText } = 
    calcBuildingDemand(profile, answers.primaryOccupancy, answers.secondaryOccupancy);

  // 3. Coverage
  const coveragePercentage = calcCoverage(annualCollectedLitres, annualDemandLitres);

  // 4. Storage Range
  const { minStorageLitres, recommendedStorageLitres, largeStorageLitres } = 
    calcStorageRange(dailyDemandLitres, profile.storageMultiplierDays, annualCollectedLitres);

  // 5. User Tank Verdict
  const userTank = answers.tankCapacityL && answers.tankCapacityL > 0 ? answers.tankCapacityL : undefined;
  let tankVerdict: 'good' | 'overflow' | 'large' | 'suggested' = 'suggested';
  let tankVerdictLabel = 'Suggested by RainWise';
  let tankVerdictMessage = `We recommend a ${recommendedStorageLitres.toLocaleString()} L tank based on ${profile.storageMultiplierDays.ideal} days dry buffer.`;

  if (userTank && userTank > 0) {
    if (userTank < minStorageLitres * 0.8) {
      tankVerdict = 'overflow';
      tankVerdictLabel = '⚠️ May overflow';
      tankVerdictMessage = `Your ${userTank.toLocaleString()} L tank is smaller than the recommended minimum (${minStorageLitres.toLocaleString()} L). Excess monsoon rain will overflow unless expanded.`;
    } else if (userTank > recommendedStorageLitres * 1.6) {
      tankVerdict = 'large';
      tankVerdictLabel = '🔻 Larger than needed';
      tankVerdictMessage = `Your ${userTank.toLocaleString()} L tank is generous! It provides abundant storage, though it will take longer to fill completely outside heavy monsoons.`;
    } else {
      tankVerdict = 'good';
      tankVerdictLabel = '✅ Good size';
      tankVerdictMessage = `Your ${userTank.toLocaleString()} L tank is well-balanced for your ${profile.name.toLowerCase()} and roof size.`;
    }
  }

  // 6. Headline & Buckets
  const headlineLitres = annualCollectedLitres;
  const bucketSize = assumptions?.conversions?.bucketSizeL || 15;
  const headlineBuckets = toBuckets(headlineLitres, bucketSize);
  const statusPrefix = answers.buildingStatus === 'new' ? 'new ' : 'existing ';
  const headlineText = `${profile.icon} Your ${statusPrefix}${profile.name.toLowerCase()} could collect about ${headlineLitres.toLocaleString()} L of rainwater a year, about ${headlineBuckets.toLocaleString()} buckets.`;

  // 7. 7-Day Live Weather Heavy Rain Overflow Planning
  const weeklyRainfallMm = weatherData?.weeklyPrecipitationSumMm || 0;
  const weeklyHarvestLitres = Math.round(roofAreaM2 * weeklyRainfallMm * runoffCoeff);
  const activeTankCap = userTank || recommendedStorageLitres;
  const hasHeavyRainOverflowRisk = weeklyHarvestLitres > activeTankCap * 0.8 && weeklyHarvestLitres > 500;
  const heavyRainNotice = hasHeavyRainOverflowRisk
    ? `🌧️ Heavy rain expected (${weeklyRainfallMm} mm / ${weeklyHarvestLitres.toLocaleString()} L), your tank may overflow. Plan an overflow route to your garden or recharge pit!`
    : `Forecast rain this week is ${weeklyRainfallMm} mm (~${weeklyHarvestLitres.toLocaleString()} L), safely within your tank capacity.`;

  // 8. Possible Uses Breakdown
  const usesBreakdown = profile.usageBreakdown.map(item => {
    const litresShare = Math.round((annualCollectedLitres * item.sharePercent) / 100);
    return {
      task: item.task,
      icon: item.icon,
      sharePercent: item.sharePercent,
      litresPerYear: litresShare,
      bucketsPerYear: toBuckets(litresShare, bucketSize),
    };
  });

  // 9. Recommended System Checklist tailored to building type
  const systemParts: RecommendedSystemPart[] = BASE_SYSTEM_PARTS.map(part => {
    const isSpecial = Boolean(part.specialFor?.includes(profile.key));
    return {
      id: part.id,
      icon: part.icon,
      name: part.name,
      explanation: part.explanation,
      isSpecialHighlight: isSpecial,
    };
  });

  // 10. Rough Impact & Savings
  const waterTariff = parseFloat(assumptions?.waterTariffPerKL?.toString() || '15') || 15;
  const yearlyWaterReusedLitres = Math.min(annualCollectedLitres, annualDemandLitres);
  const yearlyBillSavingsRs = Math.round((yearlyWaterReusedLitres / 1000) * waterTariff);

  // Scaled installation cost based on tank size
  const tankFactor = (activeTankCap / 2000);
  const approxInstallationCostRs = Math.round(15000 + (tankFactor - 1) * 8000);
  const paybackYears = yearlyBillSavingsRs > 200 
    ? Number((approxInstallationCostRs / yearlyBillSavingsRs).toFixed(1)) 
    : null;

  return {
    buildingProfile: profile,
    buildingStatus: answers.buildingStatus,
    occupancySummaryText,
    headlineText,
    headlineBuckets,
    headlineLitres,
    roofAreaM2,
    roofTypeLabel: answers.roofType,
    runoffCoefficient: runoffCoeff,
    annualRainfallMm,
    annualCollectedLitres,
    monthlyCollectedLitres,
    dailyDemandLitres,
    annualDemandLitres,
    coveragePercentage,
    workingDaysPerYear,
    minStorageLitres,
    recommendedStorageLitres,
    largeStorageLitres,
    userTankLitres: userTank,
    tankVerdict,
    tankVerdictLabel,
    tankVerdictMessage,
    weeklyRainfallMm,
    weeklyHarvestLitres,
    hasHeavyRainOverflowRisk,
    heavyRainNotice,
    usesBreakdown,
    systemParts,
    yearlyWaterReusedLitres,
    yearlyBillSavingsRs,
    approxInstallationCostRs,
    paybackYears,
    priorityTips: profile.priorityTips,
    statutoryNote: PLANNER_STRINGS.statutoryDisclaimer,
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * LOCALSTORAGE PERSISTENCE (Safe try/catch)
 * ══════════════════════════════════════════════════════════════════════
 */
const STORAGE_KEY = 'rainwise_building_planner_state_v1';

export function saveBuildingPlannerAnswers(answers: BuildingPlannerAnswers): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (err) {
    console.warn('Could not save planner answers to localStorage:', err);
  }
}

export function loadBuildingPlannerAnswers(): BuildingPlannerAnswers | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load planner answers from localStorage:', err);
    return null;
  }
}
