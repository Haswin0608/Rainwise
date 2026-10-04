import { 
  CalculatorInputs, 
  CalculationResult, 
  FormErrors, 
  PresetScenario, 
  RoofAreaBreakdown, 
  RoofError,
  RoofTypeKey,
  ROOF_TYPES,
  PlanningAssumptions,
  EverydayConversionFactors,
  CalculationPeriod,
  SavedWastedPeriod,
  SavedWastedBreakdown,
  TankFillBreakdown,
  RoofCalculationBreakdown,
  HouseholdPlan,
  SimulationResult,
  SimulationMonth,
  RainfallScenario,
  RoofItem,
  StorageTankItem,
  FullWaterSummary,
  PeriodWaterSummary,
  SavedBuilding
} from '../types';
import { 
  UnitSystem, 
  feetToMeters, 
  gallonsToLiters, 
  litersToGallons,
  formatVolumeFull,
  sqFeetToSqMeters,
  sqMetersToSqFeet
} from './units';

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Normalizes any format of roofs (v1 single, v1 sections, or v2 list) into version 2 RoofItem[]
 */
export function normalizeRoofs(
  rawRoofs?: any[], 
  fallbackDirectArea?: string, 
  fallbackRoofType?: RoofTypeKey
): RoofItem[] {
  if (Array.isArray(rawRoofs) && rawRoofs.length > 0) {
    return rawRoofs.map((r, i) => {
      // Version 2 format with direct area
      if (r.area !== undefined && r.area !== null && r.area !== '') {
        return {
          id: r.id || `roof_${Date.now()}_${i}`,
          name: r.name || `Roof ${i + 1}`,
          area: String(r.area),
          areaUnit: r.areaUnit || 'metric',
          typeKey: r.typeKey || fallbackRoofType || 'concrete',
          customName: r.customName || '',
          customEfficiency: typeof r.customEfficiency === 'number' ? r.customEfficiency : 70,
        };
      }
      // Version 1 format with length & width
      const l = parseFloat(r.length) || 0;
      const w = parseFloat(r.width) || 0;
      const areaVal = (l > 0 && w > 0) ? String(Math.round(l * w * 10) / 10) : '50';
      return {
        id: r.id || `roof_${Date.now()}_${i}`,
        name: r.name || `Roof ${i + 1}`,
        area: areaVal,
        areaUnit: 'metric',
        typeKey: r.typeKey || fallbackRoofType || 'concrete',
        customName: r.customName || '',
        customEfficiency: 70,
      };
    });
  }

  // Fallback if empty or not provided
  return [
    {
      id: 'roof_1',
      name: 'Roof 1',
      area: fallbackDirectArea || '100',
      areaUnit: 'metric',
      typeKey: fallbackRoofType || 'concrete',
      customName: '',
      customEfficiency: 70,
    }
  ];
}

/**
 * Normalizes tanks into version 2 StorageTankItem[]
 */
export function normalizeTanks(
  rawTanks?: any[], 
  fallbackCapacity?: string, 
  noTankYet?: boolean
): { tanks: StorageTankItem[]; noTankYet: boolean } {
  if (noTankYet) {
    return { tanks: [], noTankYet: true };
  }
  if (Array.isArray(rawTanks) && rawTanks.length > 0) {
    const list = rawTanks.map((t, i) => ({
      id: t.id || `tank_${Date.now()}_${i}`,
      name: t.name || `Tank ${i + 1}`,
      capacity: String(t.capacity ?? '1000'),
    }));
    return { tanks: list, noTankYet: false };
  }
  if (fallbackCapacity && parseFloat(fallbackCapacity) > 0) {
    return {
      tanks: [{ id: 'tank_1', name: 'Tank 1', capacity: fallbackCapacity }],
      noTankYet: false,
    };
  }
  return {
    tanks: [{ id: 'tank_1', name: 'Tank 1', capacity: '2000' }],
    noTankYet: false,
  };
}

/**
 * Computes total storage capacity across all tanks in litres
 */
export function getTotalTankCapacity(
  tanks?: StorageTankItem[], 
  noTankYet?: boolean, 
  recommendedTankSizeL: number = 2000,
  unit: UnitSystem = 'metric'
): { totalLitres: number; isCustom: boolean; count: number } {
  if (noTankYet || !tanks || tanks.length === 0) {
    return { totalLitres: recommendedTankSizeL, isCustom: false, count: 0 };
  }
  const isImperial = unit === 'imperial';
  let sumL = 0;
  let validCount = 0;
  for (const t of tanks) {
    const cap = parseFloat(t.capacity) || 0;
    if (cap > 0) {
      sumL += isImperial ? gallonsToLiters(cap) : cap;
      validCount++;
    }
  }
  if (sumL === 0) {
    return { totalLitres: recommendedTankSizeL, isCustom: false, count: 0 };
  }
  return { totalLitres: Math.round(sumL), isCustom: true, count: validCount };
}

/**
 * Standard Everyday Terms Conversions (Clearly editable by user in Assumptions UI)
 * Default values for Indian households and farmers:
 */
export const DEFAULT_EVERYDAY_CONVERSIONS: EverydayConversionFactors = {
  bucketSizeL: 15,          // 1 standard household bucket ≈ 15 L
  waterCanSizeL: 20,        // 1 drinking water can (blue bubbletop) ≈ 20 L
  bathSizeL: 50,            // 1 family bucket bath ≈ 50 L
  toiletFlushSizeL: 6,      // 1 standard toilet cistern flush ≈ 6 L
  tankerSizeL: 6000,        // 1 typical private water tanker truck ≈ 6,000 L
  gardenWateringPerM2L: 5,  // 1 m² garden / crop bed watering ≈ 5 L
};

/**
 * Standard Defaults & Assumptions (Clearly editable by user in UI)
 */
export const DEFAULT_ASSUMPTIONS: PlanningAssumptions = {
  runoffCoefficients: {
    concrete: 0.80,
    clay_tile: 0.75,
    metal_sheet: 0.90,
    asbestos: 0.80,
    thatch: 0.60,
    custom: 0.80,
  },
  demands: {
    toilet: 30,    // litres / person / day
    cleaning: 10,  // litres / person / day
    gardening: 15, // litres / person / day
    vehicle: 5,    // litres / person / day
  },
  waterTariffPerKL: 15,      // ₹ per 1,000 litres
  installationCostRs: 15000, // ₹ 15,000 typical rainwater filter & piping
  dryDaysBuffer: 15,         // Recommended dry buffer days
  conversions: DEFAULT_EVERYDAY_CONVERSIONS,
};

export const COMMON_TANK_SIZES = [500, 1000, 2000, 5000, 10000];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'suburban',
    name: 'Indian Household (Concrete Roof)',
    description: 'Concrete RCC roof (100 m² / ~1,076 sq ft), 4 people, 2,000L tank',
    icon: '🏠',
    inputs: {
      roofAreaMode: 'direct',
      directRoofArea: '100',
      roofs: [
        { id: 'preset-r-1', name: 'Main Concrete Roof', area: '100', areaUnit: 'metric', typeKey: 'concrete' }
      ],
      tanks: [
        { id: 'preset-t-1', name: 'Underground Sump', capacity: '2000' }
      ],
      noTankYet: false,
      roofType: 'concrete',
      householdSize: '4',
      tankCapacity: '2000',
      dailyRequirement: '240',
      efficiency: '80',
      waterTariff: '15',
      installationCost: '15000',
      rainfallScenario: 'normal',
    },
  },
  {
    id: 'rural_farm',
    name: 'Rural Farmhouse & Shed',
    description: 'Clay tile house + Metal shed (160 m² total), 5 people, 5,000L tank',
    icon: '🌾',
    inputs: {
      roofAreaMode: 'sections',
      directRoofArea: '160',
      roofs: [
        { id: 'preset-r-1', name: 'Main Farmhouse (Tiles)', area: '96', areaUnit: 'metric', typeKey: 'clay_tile' },
        { id: 'preset-r-2', name: 'Storage Shed (Metal)', area: '64', areaUnit: 'metric', typeKey: 'metal_sheet' },
      ],
      tanks: [
        { id: 'preset-t-1', name: 'Main Farm Tank', capacity: '5000' }
      ],
      noTankYet: false,
      roofType: 'clay_tile',
      householdSize: '5',
      tankCapacity: '5000',
      dailyRequirement: '300',
      efficiency: '75',
      waterTariff: '15',
      installationCost: '18000',
      rainfallScenario: 'normal',
    },
  },
  {
    id: 'coastal_home',
    name: 'Compact Home (Metal Sheet)',
    description: 'Metal sheet roof (80 m²), 3 people, 1,000L tank',
    icon: '🌧️',
    inputs: {
      roofAreaMode: 'direct',
      directRoofArea: '80',
      roofs: [
        { id: 'preset-r-1', name: 'House Metal Roof', area: '80', areaUnit: 'metric', typeKey: 'metal_sheet' }
      ],
      tanks: [
        { id: 'preset-t-1', name: 'Sintex Poly Tank', capacity: '1000' }
      ],
      noTankYet: false,
      roofType: 'metal_sheet',
      householdSize: '3',
      tankCapacity: '1000',
      dailyRequirement: '180',
      efficiency: '90',
      waterTariff: '15',
      installationCost: '15000',
      rainfallScenario: 'normal',
    },
  },
];

export const DEFAULT_INPUTS: CalculatorInputs = {
  roofs: [
    {
      id: 'roof_1',
      name: 'Roof 1',
      area: '100',
      areaUnit: 'metric',
      typeKey: 'concrete',
      customName: '',
      customEfficiency: 70,
    }
  ],
  tanks: [
    {
      id: 'tank_1',
      name: 'Tank 1',
      capacity: '2000',
    }
  ],
  noTankYet: false,
  householdSize: '4',
  dailyRequirement: '240',
  waterTariff: '15',
  installationCost: '15000',
  rainfallScenario: 'normal',
  assumptions: DEFAULT_ASSUMPTIONS,
  // Backwards compatibility defaults:
  roofAreaMode: 'direct',
  directRoofArea: '100',
  roofType: 'concrete',
  efficiency: '80',
  tankCapacity: '2000',
};

/**
 * Returns runoff coefficient (0.0 to 1.0)
 */
export function getRunoffCoefficient(
  roofType: RoofTypeKey, 
  customCoefficient?: string, 
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS,
  customEfficiency?: number
): number {
  if (roofType === 'custom') {
    if (typeof customEfficiency === 'number' && !isNaN(customEfficiency) && customEfficiency >= 0) {
      return Math.min(1, Math.max(0, customEfficiency / 100));
    }
    if (customCoefficient) {
      const val = parseFloat(customCoefficient);
      if (!isNaN(val) && val > 0 && val <= 1) return val;
    }
    return 0.70;
  }
  return assumptions.runoffCoefficients[roofType] ?? 0.80;
}

/**
 * Form Validation
 */
export function validateInputs(
  inputs: CalculatorInputs,
  unit: UnitSystem = 'metric'
): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};
  let isValid = true;

  const normalized = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  if (normalized.length === 0) {
    errors.directArea = 'Please add at least one roof';
    isValid = false;
  } else {
    for (const r of normalized) {
      const a = parseFloat(r.area);
      if (isNaN(a) || a <= 0) {
        errors.directArea = `Please enter a valid area for ${r.name}`;
        isValid = false;
        break;
      }
      if (r.typeKey === 'custom' && (!r.customName || !r.customName.trim())) {
        errors.directArea = `Please type your roof material for ${r.name}`;
        isValid = false;
        break;
      }
    }
  }

  if (inputs.householdSize) {
    const h = parseInt(inputs.householdSize, 10);
    if (isNaN(h) || h < 1 || h > 100) {
      errors.householdSize = 'Household size should be between 1 and 100 people';
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Recommends rounded tank size (Litres)
 * Formula from brief: Recommended tank (L) = daily non-drinking demand × 15 dry days,
 * capped at the annual collection. Round to common tank sizes (500, 1000, 2000, 5000, 10000 L).
 */
export function getRecommendedTankSize(
  dailyNonDrinkingDemandL: number,
  annualHarvestableL: number,
  dryDaysBuffer: number = 15
): number {
  if (annualHarvestableL <= 0 || dailyNonDrinkingDemandL <= 0) {
    return 1000;
  }

  const rawSize = dailyNonDrinkingDemandL * dryDaysBuffer;
  const capped = Math.min(rawSize, annualHarvestableL);

  for (const size of COMMON_TANK_SIZES) {
    if (size >= capped * 0.85) return size;
  }
  return 10000;
}

/**
 * Calculates Step 2: PLAN details
 */
export function calculateHouseholdPlan(
  annualHarvestableL: number,
  inputs: CalculatorInputs,
  unit: UnitSystem = 'metric',
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS,
  peakMonthHarvestL?: number,
  typicalEventRunoffL?: number
): HouseholdPlan {
  const isImperial = unit === 'imperial';
  const householdSize = Math.max(1, parseInt(inputs.householdSize || '4', 10));

  // Per-person non-drinking demand components (litres/day)
  const demands = assumptions.demands;
  const toiletDaily = demands.toilet * householdSize;
  const cleaningDaily = demands.cleaning * householdSize;
  const gardeningDaily = demands.gardening * householdSize;
  const vehicleDaily = demands.vehicle * householdSize;

  const dailyDemandTotalL = toiletDaily + cleaningDaily + gardeningDaily + vehicleDaily;
  const annualDemandTotalL = dailyDemandTotalL * 365;

  const daysSupportedToilet = toiletDaily > 0 ? Math.round(annualHarvestableL / toiletDaily) : 0;
  const daysSupportedCleaning = cleaningDaily > 0 ? Math.round(annualHarvestableL / cleaningDaily) : 0;
  const daysSupportedGardening = gardeningDaily > 0 ? Math.round(annualHarvestableL / gardeningDaily) : 0;
  const daysSupportedVehicle = vehicleDaily > 0 ? Math.round(annualHarvestableL / vehicleDaily) : 0;
  const daysSupportedAll = dailyDemandTotalL > 0 ? Math.round(annualHarvestableL / dailyDemandTotalL) : 0;

  const waterUses = [
    {
      task: 'Toilet Flushing',
      icon: '🚽',
      dailyLiters: toiletDaily,
      daysSupported: daysSupportedToilet,
      friendlyText: `${daysSupportedToilet.toLocaleString()} days of toilet flushing for ${householdSize} people`,
    },
    {
      task: 'Floor Cleaning & Mopping',
      icon: '🧹',
      dailyLiters: cleaningDaily,
      daysSupported: daysSupportedCleaning,
      friendlyText: `${daysSupportedCleaning.toLocaleString()} days of home floor cleaning`,
    },
    {
      task: 'Gardening & Plants',
      icon: '🌱',
      dailyLiters: gardeningDaily,
      daysSupported: daysSupportedGardening,
      friendlyText: `${daysSupportedGardening.toLocaleString()} days of plant and yard watering`,
    },
    {
      task: 'Vehicle Washing',
      icon: '🚗',
      dailyLiters: vehicleDaily,
      daysSupported: daysSupportedVehicle,
      friendlyText: `${daysSupportedVehicle.toLocaleString()} days (or ~${Math.round(annualHarvestableL / 50)} car/bike washes)`,
    },
  ];

  // Tank Adequacy Evaluation (Requirement 6)
  const recommendedSize = getRecommendedTankSize(dailyDemandTotalL, annualHarvestableL, assumptions.dryDaysBuffer);

  const tankCapacityInfo = getTotalTankCapacity(inputs.tanks, inputs.noTankYet, recommendedSize, unit);
  const enteredTankL = tankCapacityInfo.isCustom ? tankCapacityInfo.totalLitres : 0;

  // Calculate fallbacks for peakMonthHarvestL and typicalEventRunoffL if not supplied
  const peakHarvest = peakMonthHarvestL && peakMonthHarvestL > 0 
    ? peakMonthHarvestL 
    : Math.max(500, Math.round(annualHarvestableL * 0.28));
  const typicalEventRunoff = typicalEventRunoffL && typicalEventRunoffL > 0 
    ? typicalEventRunoffL 
    : Math.max(300, Math.round(annualHarvestableL * 0.12));

  let tankStatus: 'good' | 'overflow' | 'large' = 'good';
  let statusLabel = 'Good size';
  let badgeColor = 'emerald';
  let message = '';
  let overflowLitres = 0;
  let overflowNotice = 'Zero waste expected with typical usage!';

  // Case 0: No tank yet / not custom
  if (!tankCapacityInfo.isCustom || enteredTankL <= 0 || inputs.noTankYet) {
    tankStatus = 'good';
    statusLabel = 'Recommended Size';
    badgeColor = 'sky';
    message = `Recommended tank size: ${formatVolumeFull(recommendedSize, unit)} based on your roof and local rain.`;
    overflowLitres = Math.max(0, annualHarvestableL);
    overflowNotice = `Without a tank, 100% of your harvestable water (${formatVolumeFull(annualHarvestableL, unit)}) will be wasted! Adding a ${formatVolumeFull(recommendedSize, unit)} tank captures clean water for your household.`;
  } else {
    const tankDesc = tankCapacityInfo.count > 1 
      ? `${formatVolumeFull(enteredTankL, unit)} total storage across ${tankCapacityInfo.count} tanks` 
      : `${formatVolumeFull(enteredTankL, unit)} tank`;

    // Case 1: "May overflow ⚠️" when total tank capacity is less than typical rainfall event runoff (or < 50% of peak month harvest)
    if (enteredTankL < typicalEventRunoff || enteredTankL < peakHarvest * 0.50) {
      tankStatus = 'overflow';
      statusLabel = 'May overflow ⚠️';
      badgeColor = 'amber';
      const eventOverflow = Math.max(0, typicalEventRunoff - enteredTankL);
      const peakOverflow = Math.max(0, peakHarvest - enteredTankL);
      overflowLitres = peakOverflow > 0 ? peakOverflow : eventOverflow;
      message = `Your ${tankDesc} is less than typical rainfall event runoff. It may overflow by about ${formatVolumeFull(overflowLitres, unit)} during heavy rains.`;
      overflowNotice = `About ${formatVolumeFull(overflowLitres, unit)} of overflow could be lost in wet periods. Consider adding another tank.`;
    }
    // Case 2: "Larger than needed 🔻" when tank capacity exceeds what the roof can fill even in the wettest month
    else if (enteredTankL > peakHarvest && enteredTankL > recommendedSize * 1.5) {
      tankStatus = 'large';
      statusLabel = 'Larger than needed 🔻';
      badgeColor = 'purple';
      overflowLitres = 0;
      const suggestedSize = Math.round(peakHarvest * 0.85);
      message = `Your ${tankDesc} exceeds what your roof can fill even in the wettest month (~${formatVolumeFull(peakHarvest, unit)}). A smaller size (such as ${formatVolumeFull(suggestedSize, unit)}) could save you money.`;
      overflowNotice = `No water will be lost, but smaller storage could reduce upfront installation costs.`;
    }
    // Case 3: "Good size ✅" when tank holds between 50% and 100% of the peak month's harvest
    else {
      tankStatus = 'good';
      statusLabel = 'Good size ✅';
      badgeColor = 'emerald';
      overflowLitres = 0;
      message = `Your ${tankDesc} holds between 50% and 100% of the peak month's harvest (~${formatVolumeFull(peakHarvest, unit)}). It is well-sized for your roof and rainfall!`;
      overflowNotice = `Optimal balance of storage capacity and budget. Almost nothing wasted during normal rains!`;
    }
  }

  // Economic Impact & Savings
  const waterReusedPerYearL = Math.min(annualHarvestableL, annualDemandTotalL);
  const freshWaterReplacedL = waterReusedPerYearL;

  const tariff = parseFloat(inputs.waterTariff) || assumptions.waterTariffPerKL;
  const cost = parseFloat(inputs.installationCost) || assumptions.installationCostRs;

  const yearlyBillSavingsRs = Math.round((waterReusedPerYearL / 1000) * tariff);
  const paybackPeriodYears = (yearlyBillSavingsRs > 0)
    ? Number((cost / yearlyBillSavingsRs).toFixed(1))
    : null;

  const economicImpact = {
    waterReusedPerYearL,
    freshWaterReplacedL,
    yearlyBillSavingsRs,
    approxInstallationCostRs: cost,
    paybackPeriodYears,
    disclaimer: 'approximate estimates, not guaranteed savings',
  };

  return {
    householdSize,
    dailyDemandTotalL,
    annualDemandTotalL,
    waterUses,
    daysSupportedAllTasks: daysSupportedAll,
    tankAdequacy: {
      status: tankStatus,
      statusLabel,
      badgeColor,
      message,
      recommendedSize,
      enteredCapacity: enteredTankL > 0 ? enteredTankL : undefined,
      overflowLitres,
      overflowWastedNotice: overflowNotice,
    },
    economicImpact,
  };
}

/**
 * Monthly Simulation Logic (Step 3)
 * level = min(tank capacity, level + inflow − demand) each month
 * overflow = anything above capacity, shortfall = demand not met
 * heavy-rain alert: if inflow in a month > remaining tank space
 */
export function runMonthlySimulation(
  roofAreaM2: number,
  runoffCoefficient: number,
  monthlyRainfallMm: number[],
  tankCapacityL: number,
  dailyDemandL: number,
  scenario: RainfallScenario = 'normal',
  scenarioMultiplier: number = 1.0
): SimulationResult {
  const simulationMonths: SimulationMonth[] = [];
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let currentLevel = 0;
  let totalAnnualInflow = 0;
  let totalAnnualDemand = 0;
  let totalAnnualUsed = 0;
  let totalAnnualOverflow = 0;
  let totalAnnualShortfall = 0;

  let peakFillMonth = MONTH_NAMES[0];
  let peakFillPercentage = 0;
  const heavyRainMonths: string[] = [];

  for (let m = 0; m < 12; m++) {
    const monthName = MONTH_NAMES[m];
    const rainMm = monthlyRainfallMm[m] || 0;
    const days = daysInMonths[m];

    const inflowL = Math.round(roofAreaM2 * rainMm * runoffCoefficient);
    const demandL = Math.round(dailyDemandL * days);

    const startLevelL = currentLevel;
    const remainingSpace = Math.max(0, tankCapacityL - startLevelL);

    // Heavy rain alert: if inflow > remaining tank space
    const heavyRainAlert = inflowL > remainingSpace && inflowL > 500;
    if (heavyRainAlert) {
      heavyRainMonths.push(monthName);
    }

    const availableWater = startLevelL + inflowL;
    let overflowL = 0;
    let endLevelL = 0;
    let shortfallL = 0;

    if (availableWater >= demandL) {
      const waterAfterDemand = availableWater - demandL;
      if (waterAfterDemand > tankCapacityL) {
        overflowL = waterAfterDemand - tankCapacityL;
        endLevelL = tankCapacityL;
      } else {
        overflowL = 0;
        endLevelL = waterAfterDemand;
      }
      shortfallL = 0;
      totalAnnualUsed += demandL;
    } else {
      shortfallL = demandL - availableWater;
      endLevelL = 0;
      overflowL = 0;
      totalAnnualUsed += availableWater;
    }

    currentLevel = endLevelL;

    totalAnnualInflow += inflowL;
    totalAnnualDemand += demandL;
    totalAnnualOverflow += overflowL;
    totalAnnualShortfall += shortfallL;

    const fillPercentage = tankCapacityL > 0 ? Math.min(100, Math.round((endLevelL / tankCapacityL) * 100)) : 0;

    if (fillPercentage > peakFillPercentage) {
      peakFillPercentage = fillPercentage;
      peakFillMonth = monthName;
    }

    simulationMonths.push({
      monthIndex: m,
      monthName,
      rainfallMm: rainMm,
      inflowL,
      demandL,
      startLevelL,
      endLevelL,
      overflowL,
      shortfallL,
      fillPercentage,
      heavyRainAlert,
    });
  }

  return {
    months: simulationMonths,
    tankCapacityL,
    totalAnnualInflowL: totalAnnualInflow,
    totalAnnualDemandL: totalAnnualDemand,
    totalAnnualUsedL: totalAnnualUsed,
    totalAnnualOverflowL: totalAnnualOverflow,
    totalAnnualShortfallL: totalAnnualShortfall,
    peakFillMonth,
    peakFillPercentage,
    hasHeavyRainWarning: heavyRainMonths.length > 0,
    heavyRainMonths,
    rainfallScenario: scenario,
    scenarioMultiplier,
  };
}

/**
 * ONE SINGLE SOURCE OF TRUTH FOR ALL NUMBERS
 * Calculates water summary metrics for Week, Month, and Year periods simultaneously.
 */
export function calcWaterSummary(
  inputs: CalculatorInputs,
  unit: UnitSystem = 'metric',
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS,
  overrideTankCapacityL?: number
): FullWaterSummary {
  const bucketSizeL = assumptions.conversions?.bucketSizeL || 15;

  // Normalize roofs
  const normalizedRoofs = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  let hasRoofArea = false;

  const roofItems = normalizedRoofs.map((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    if (rawA > 0) hasRoofArea = true;
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const coeff = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    return {
      aM2,
      coeff,
    };
  });

  // Normalize tanks & total tank capacity in litres
  const { tanks: normalizedTanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);
  const tankCapacityInfo = getTotalTankCapacity(normalizedTanks, noTankYet, 2000, unit);
  
  const totalTankCapacityL = overrideTankCapacityL !== undefined
    ? Math.max(0, overrideTankCapacityL)
    : (noTankYet ? 0 : tankCapacityInfo.totalLitres);

  // Family water demand per day
  const people = parseInt(inputs.householdSize || '4', 10);
  const unlimitedDemandTip = isNaN(people) || people <= 0;
  const noTankTip = totalTankCapacityL === 0;

  const demands = assumptions.demands || DEFAULT_ASSUMPTIONS.demands;
  const lPerPersonPerDay = (demands.toilet ?? 30) + (demands.cleaning ?? 10) + (demands.gardening ?? 15) + (demands.vehicle ?? 5);
  const dailyTotalFamilyDemandL = unlimitedDemandTip ? Infinity : Math.max(1, people * lPerPersonPerDay);

  // Rainfall sources
  const historical = inputs.historicalRainfall || inputs.weatherInfo?.historical;
  const monthlyRainArray = inputs.typicalMonthlyRainfallMm || historical?.typicalMonthlyRainfallMm || new Array(12).fill(0);

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const daysInCurrentMonth = new Date(now.getFullYear(), currentMonthIdx + 1, 0).getDate();
  const currentMonthRainMm = monthlyRainArray[currentMonthIdx] || 0;

  const typicalAnnualRainMm = inputs.typicalAnnualRainfallMm || historical?.typicalAnnualRainfallMm || monthlyRainArray.reduce((a, b) => a + b, 0);

  const weeklyRainMm = inputs.weeklyRainfallMm ?? inputs.weatherInfo?.weeklyRainfallMm ?? inputs.weatherInfo?.fullWeather?.weeklyPrecipitationSumMm ?? 0;

  const hasLocation = Boolean(inputs.locationName && (typicalAnnualRainMm > 0 || weeklyRainMm > 0 || currentMonthRainMm > 0));

  let invariantError = false;

  // Compute 7-day week summary
  const safeWeekRainMm = Math.max(0, weeklyRainMm || 0);
  let weekRainOnRoof = 0;
  let weekCaught = 0;
  roofItems.forEach((r) => {
    const fall = r.aM2 * safeWeekRainMm;
    weekRainOnRoof += fall;
    weekCaught += fall * r.coeff;
  });
  weekRainOnRoof = Math.round(weekRainOnRoof);
  weekCaught = Math.round(weekCaught);
  const weekLostOnRoof = Math.max(0, weekRainOnRoof - weekCaught);
  let weekKept = 0;
  let weekSpilled = 0;

  if (noTankTip) {
    weekKept = 0;
    weekSpilled = weekCaught;
  } else {
    const dailyCaught = weekCaught / 7;
    let lvl = 0;
    let sSum = 0;
    for (let d = 0; d < 7; d++) {
      const startL = lvl;
      lvl = Math.min(totalTankCapacityL, lvl + dailyCaught);
      const spillToday = Math.max(0, (startL + dailyCaught) - totalTankCapacityL);
      sSum += spillToday;
      const usedToday = Math.min(lvl, dailyTotalFamilyDemandL);
      lvl = lvl - usedToday;
    }
    weekSpilled = Math.round(sSum);
    weekKept = Math.max(0, weekCaught - weekSpilled);
  }
  const weekWasted = weekLostOnRoof + weekSpilled;
  const weekKeptPct = weekRainOnRoof > 0 ? Math.min(100, Math.round((weekKept / weekRainOnRoof) * 100)) : 0;
  const weekWastedPct = weekRainOnRoof > 0 ? Math.max(0, 100 - weekKeptPct) : 0;

  const week: PeriodWaterSummary = {
    period: 'week',
    periodLabel: 'This week',
    daysInPeriod: 7,
    rainfallMm: safeWeekRainMm,
    rainOnRoof: weekRainOnRoof,
    caught: weekCaught,
    lostOnRoof: weekLostOnRoof,
    kept: weekKept,
    spilled: weekSpilled,
    wasted: weekWasted,
    keptPercent: weekKeptPct,
    wastedPercent: weekWastedPct,
    rainOnRoofBuckets: toBuckets(weekRainOnRoof, bucketSizeL),
    caughtBuckets: toBuckets(weekCaught, bucketSizeL),
    lostOnRoofBuckets: toBuckets(weekLostOnRoof, bucketSizeL),
    keptBuckets: toBuckets(weekKept, bucketSizeL),
    spilledBuckets: toBuckets(weekSpilled, bucketSizeL),
    wastedBuckets: toBuckets(weekWasted, bucketSizeL),
  };

  // Compute 12-Month breakdown sequentially
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthlyBreakdown: PeriodWaterSummary[] = [];
  let currentLevel = 0;

  for (let m = 0; m < 12; m++) {
    const mRainMm = Math.max(0, monthlyRainArray[m] || 0);
    const daysInM = daysInMonths[m];

    let mRainOnRoof = 0;
    let mCaught = 0;
    roofItems.forEach((r) => {
      const fall = r.aM2 * mRainMm;
      mRainOnRoof += fall;
      mCaught += fall * r.coeff;
    });

    mRainOnRoof = Math.round(mRainOnRoof);
    mCaught = Math.round(mCaught);
    const mLostOnRoof = Math.max(0, mRainOnRoof - mCaught);

    let mKept = 0;
    let mSpilled = 0;

    if (noTankTip) {
      mKept = 0;
      mSpilled = mCaught;
    } else {
      const dailyCaught = mCaught / daysInM;
      let mSpill = 0;

      for (let d = 0; d < daysInM; d++) {
        const startL = currentLevel;
        currentLevel = Math.min(totalTankCapacityL, currentLevel + dailyCaught);
        const spillToday = Math.max(0, (startL + dailyCaught) - totalTankCapacityL);
        mSpill += spillToday;
        const usedToday = Math.min(currentLevel, dailyTotalFamilyDemandL);
        currentLevel = currentLevel - usedToday;
      }
      mSpilled = Math.round(mSpill);
      mKept = Math.max(0, mCaught - mSpilled);
    }

    const mWasted = mLostOnRoof + mSpilled;
    const mKeptPct = mRainOnRoof > 0 ? Math.min(100, Math.round((mKept / mRainOnRoof) * 100)) : 0;
    const mWastedPct = mRainOnRoof > 0 ? Math.max(0, 100 - mKeptPct) : 0;

    monthlyBreakdown.push({
      period: 'month',
      periodLabel: MONTH_NAMES[m],
      monthName: MONTH_NAMES[m],
      daysInPeriod: daysInM,
      rainfallMm: mRainMm,
      rainOnRoof: mRainOnRoof,
      caught: mCaught,
      lostOnRoof: mLostOnRoof,
      kept: mKept,
      spilled: mSpilled,
      wasted: mWasted,
      keptPercent: mKeptPct,
      wastedPercent: mWastedPct,
      rainOnRoofBuckets: toBuckets(mRainOnRoof, bucketSizeL),
      caughtBuckets: toBuckets(mCaught, bucketSizeL),
      lostOnRoofBuckets: toBuckets(mLostOnRoof, bucketSizeL),
      keptBuckets: toBuckets(mKept, bucketSizeL),
      spilledBuckets: toBuckets(mSpilled, bucketSizeL),
      wastedBuckets: toBuckets(mWasted, bucketSizeL),
    });
  }

  // Current calendar month summary
  const month = monthlyBreakdown[currentMonthIdx] || monthlyBreakdown[0];

  // Year summary = sum of 12 monthly periods
  const yearRainOnRoof = monthlyBreakdown.reduce((acc, m) => acc + m.rainOnRoof, 0);
  const yearCaught = monthlyBreakdown.reduce((acc, m) => acc + m.caught, 0);
  const yearLostOnRoof = monthlyBreakdown.reduce((acc, m) => acc + m.lostOnRoof, 0);
  const yearKept = monthlyBreakdown.reduce((acc, m) => acc + m.kept, 0);
  const yearSpilled = monthlyBreakdown.reduce((acc, m) => acc + m.spilled, 0);
  const yearWasted = yearLostOnRoof + yearSpilled;

  const yearKeptPct = yearRainOnRoof > 0 ? Math.min(100, Math.round((yearKept / yearRainOnRoof) * 100)) : 0;
  const yearWastedPct = yearRainOnRoof > 0 ? Math.max(0, 100 - yearKeptPct) : 0;

  // Invariant check
  if (Math.abs((yearKept + yearSpilled + yearLostOnRoof) - yearRainOnRoof) > 2) {
    console.error(`Water summary invariant check failed: ${yearKept} + ${yearSpilled} + ${yearLostOnRoof} != ${yearRainOnRoof}`);
    invariantError = true;
  }

  const year: PeriodWaterSummary = {
    period: 'year',
    periodLabel: 'Typical year',
    daysInPeriod: 365,
    rainfallMm: typicalAnnualRainMm,
    rainOnRoof: yearRainOnRoof,
    caught: yearCaught,
    lostOnRoof: yearLostOnRoof,
    kept: yearKept,
    spilled: yearSpilled,
    wasted: yearWasted,
    keptPercent: yearKeptPct,
    wastedPercent: yearWastedPct,
    rainOnRoofBuckets: toBuckets(yearRainOnRoof, bucketSizeL),
    caughtBuckets: toBuckets(yearCaught, bucketSizeL),
    lostOnRoofBuckets: toBuckets(yearLostOnRoof, bucketSizeL),
    keptBuckets: toBuckets(yearKept, bucketSizeL),
    spilledBuckets: toBuckets(yearSpilled, bucketSizeL),
    wastedBuckets: toBuckets(yearWasted, bucketSizeL),
  };

  return {
    week,
    month,
    year,
    monthlyBreakdown,
    hasLocation,
    hasRoofArea,
    bucketSizeL,
    unlimitedDemandTip,
    noTankTip,
    invariantError,
  };
}

/**
 * Main Calculation Engine:
 * Location-based Automatic Rainfall:
 * - Short term: 7-day forecast weekly collection
 * - Seasonal: current calendar month from 3-year historical patterns
 * - Yearly: 3-year historical average (Open-Meteo Archive)
 */
export function calculateHarvesting(
  inputs: CalculatorInputs, 
  unit: UnitSystem = 'metric',
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS
): CalculationResult {
  const isImperial = unit === 'imperial';

  // 1. Normalize roofs and compute individual areas and runoff coefficients
  const normalizedRoofs = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  
  let totalRoofArea = 0;
  let weightedCoeffSum = 0;

  const roofsBreakdown: RoofAreaBreakdown[] = normalizedRoofs.map((roof, index) => {
    const rawA = Math.max(0, parseFloat(roof.area) || 0);
    const aMeters = roof.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const coeff = getRunoffCoefficient(roof.typeKey, undefined, assumptions, roof.customEfficiency);
    
    totalRoofArea += aMeters;
    weightedCoeffSum += aMeters * coeff;

    return {
      id: roof.id || `roof_${index + 1}`,
      name: roof.name || `Roof ${index + 1}`,
      length: 0,
      width: 0,
      area: Number(aMeters.toFixed(2)),
    };
  });

  totalRoofArea = Number(totalRoofArea.toFixed(2));
  const overallRunoffCoeff = totalRoofArea > 0 ? weightedCoeffSum / totalRoofArea : 0.80;
  const primaryRoofType = normalizedRoofs[0]?.typeKey || 'concrete';
  const efficiency = Math.round(overallRunoffCoeff * 100);

  // 2. Storage Tanks
  const { tanks: normalizedTanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);
  const tankCapacityInfo = getTotalTankCapacity(normalizedTanks, noTankYet, 2000, unit);
  const tankCapacityL = tankCapacityInfo.totalLitres;

  // 3. Location & Rainfall checks
  const historical = inputs.historicalRainfall || inputs.weatherInfo?.historical;
  const hasHistoricalRainfall = typeof inputs.typicalAnnualRainfallMm === 'number' || (historical && typeof historical.typicalAnnualRainfallMm === 'number');
  const hasWeeklyRainfall = typeof inputs.weeklyRainfallMm === 'number' || (inputs.weatherInfo && typeof inputs.weatherInfo.weeklyRainfallMm === 'number');
  const hasLocation = Boolean(inputs.locationName && (hasHistoricalRainfall || hasWeeklyRainfall));

  if (!hasLocation) {
    const householdPlan = calculateHouseholdPlan(0, inputs, unit, assumptions);

    return {
      hasLocation: false,
      locationName: inputs.locationName,
      roofs: roofsBreakdown,
      roofsList: normalizedRoofs,
      roofArea: totalRoofArea,
      roofType: primaryRoofType,
      runoffCoefficient: Number(overallRunoffCoeff.toFixed(2)),
      tanks: normalizedTanks,
      totalTankCapacityL: tankCapacityL,
      isNoTankYet: noTankYet,
      weeklyRainfallMm: 0,
      weeklyHarvestableWater: 0,
      annualRainfallMm: 0,
      scaledAnnualRainfallMm: 0,
      rainfallScenario: 'normal',
      scenarioMultiplier: 1.0,
      potentialWater: 0,
      harvestableWater: 0,
      waterLost: 0,
      actuallyHarvested: 0,
      wastedWater: 0,
      tankCapacity: Math.round(tankCapacityL),
      dailyRequirement: Math.round(householdPlan.dailyDemandTotalL),
      supplyDays: 0,
      efficiency,
      storageUtilizationRate: 0,
      harvestEfficiencyRate: 0,
      summarySentence: '📍 Choose your location to see how much rain you could collect.',
      suggestionLine: 'RainWise will automatically load your 7-day live weather and 3-year historical rainfall pattern.',
      savedComparison: { primaryText: 'Choose your location to see your water savings.', icon: '📍' },
      wastedComparison: { primaryText: 'Zero waste calculation pending location choice.', icon: '💧' },
      weatherInfo: inputs.weatherInfo,
      householdPlan,
      simulation: undefined,
      isLoadingArchive: inputs.isLoadingArchive,
      archiveError: inputs.archiveError,
    };
  }

  // Location is chosen:
  // Weekly collection from 7-day forecast
  const weeklyRainfallMm = inputs.weeklyRainfallMm ?? inputs.weatherInfo?.weeklyRainfallMm ?? inputs.weatherInfo?.fullWeather?.weeklyPrecipitationSumMm ?? 0;
  
  // Weekly harvestable: sum over each roof of (roofAreaM2 * weeklyRainfallMm * roofCoeff)
  let weeklyHarvestableWater = 0;
  normalizedRoofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    weeklyHarvestableWater += aM2 * weeklyRainfallMm * c;
  });
  weeklyHarvestableWater = Math.round(weeklyHarvestableWater / 10) * 10;

  // Monthly collection for current calendar month
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const baseMonthly = inputs.typicalMonthlyRainfallMm ?? historical?.typicalMonthlyRainfallMm ?? new Array(12).fill(0);
  const scenario: RainfallScenario = inputs.rainfallScenario || 'normal';
  const scenarioMultiplier = scenario === 'dry' ? 0.7 : scenario === 'wet' ? 1.3 : 1.0;
  
  const monthlyRainfallMm = Number(((baseMonthly[currentMonthIdx] || 0) * scenarioMultiplier).toFixed(1));
  let monthlyHarvestableWater = 0;
  normalizedRoofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    monthlyHarvestableWater += aM2 * monthlyRainfallMm * c;
  });
  monthlyHarvestableWater = Math.round(monthlyHarvestableWater);

  // Typical annual rainfall from 3-year historical archive
  const annualRainfallMm = inputs.typicalAnnualRainfallMm ?? historical?.typicalAnnualRainfallMm ?? 0;
  const scaledAnnualRainfallMm = Math.round(annualRainfallMm * scenarioMultiplier * 10) / 10;

  // Yearly potential & harvestable calculations
  let annualHarvestableWater = 0;
  normalizedRoofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    annualHarvestableWater += aM2 * scaledAnnualRainfallMm * c;
  });
  const harvestableWater = Math.round(annualHarvestableWater);
  const potentialWater = Math.round(totalRoofArea * scaledAnnualRainfallMm);
  const waterLost = Math.max(0, potentialWater - harvestableWater);

  const actuallyHarvested = tankCapacityL > 0 ? Math.min(harvestableWater, tankCapacityL) : harvestableWater;
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // Peak month rain & harvestable for tank assessment
  const maxMonthRain = Math.max(...baseMonthly, 0);
  let peakMonthHarvestL = 0;
  let typicalEventRunoffL = 0;
  normalizedRoofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    peakMonthHarvestL += aM2 * (maxMonthRain * scenarioMultiplier) * c;
    typicalEventRunoffL += aM2 * 35 * c; // Typical 35mm downpour event
  });
  peakMonthHarvestL = Math.round(peakMonthHarvestL) || Math.round(harvestableWater * 0.28);
  typicalEventRunoffL = Math.round(typicalEventRunoffL) || Math.round(harvestableWater * 0.12);

  // Household Plan (Step 2)
  const householdPlan = calculateHouseholdPlan(
    harvestableWater, 
    inputs, 
    unit, 
    assumptions, 
    peakMonthHarvestL, 
    typicalEventRunoffL
  );

  // Monthly Simulation (Step 3)
  const scaledMonthly = baseMonthly.map(m => Math.round(m * scenarioMultiplier * 10) / 10);
  const effectiveTankForSim = tankCapacityL > 0 ? tankCapacityL : householdPlan.tankAdequacy.recommendedSize;

  const simulation = runMonthlySimulation(
    totalRoofArea,
    overallRunoffCoeff,
    scaledMonthly,
    effectiveTankForSim,
    householdPlan.dailyDemandTotalL,
    scenario,
    scenarioMultiplier
  );

  const supplyDays = householdPlan.daysSupportedAllTasks;
  const storageUtilizationRate = tankCapacityL > 0 
    ? Math.min(100, Math.round((actuallyHarvested / tankCapacityL) * 100)) 
    : 100;
  const harvestEfficiencyRate = potentialWater > 0 
    ? Math.round((harvestableWater / potentialWater) * 100) 
    : 100;

  const savedFormatted = formatVolumeFull(harvestableWater, unit);
  const lostFormatted = formatVolumeFull(waterLost, unit);

  const summarySentence = `At ${inputs.locationName || 'your location'}, you could collect about ${savedFormatted} of clean rainwater across ${normalizedRoofs.length} ${normalizedRoofs.length === 1 ? 'roof' : 'roofs'} in a typical year.`;
  const suggestionLine = `About ${lostFormatted} (${100 - efficiency}%) splashes off or evaporates from your roof surfaces.`;

  const savedComparison = getRelatableWaterComparison(
    harvestableWater,
    'saved',
    householdPlan.dailyDemandTotalL,
    tankCapacityL,
    unit
  );

  const wastedComparison = getRelatableWaterComparison(
    waterLost + wastedWater,
    'wasted',
    householdPlan.dailyDemandTotalL,
    tankCapacityL,
    unit
  );

  return {
    hasLocation: true,
    locationName: inputs.locationName,
    roofs: roofsBreakdown,
    roofsList: normalizedRoofs,
    roofArea: totalRoofArea,
    roofType: primaryRoofType,
    runoffCoefficient: Number(overallRunoffCoeff.toFixed(2)),
    tanks: normalizedTanks,
    totalTankCapacityL: tankCapacityL,
    isNoTankYet: noTankYet,
    weeklyRainfallMm: Number(weeklyRainfallMm.toFixed(1)),
    weeklyHarvestableWater,
    monthlyRainfallMm,
    monthlyHarvestableWater,
    annualRainfallMm: Number(annualRainfallMm.toFixed(1)),
    scaledAnnualRainfallMm,
    rainfallScenario: scenario,
    scenarioMultiplier,
    potentialWater,
    harvestableWater,
    waterLost,
    actuallyHarvested,
    wastedWater,
    tankCapacity: Math.round(tankCapacityL),
    dailyRequirement: Math.round(householdPlan.dailyDemandTotalL),
    supplyDays,
    efficiency,
    storageUtilizationRate,
    harvestEfficiencyRate,
    summarySentence,
    suggestionLine,
    savedComparison,
    wastedComparison,
    weatherInfo: inputs.weatherInfo,
    householdPlan,
    simulation,
    isLoadingArchive: inputs.isLoadingArchive,
    archiveError: inputs.archiveError,
  };
}

/**
 * Friendly relatable metaphors (glasses, buckets, water tankers)
 */
export function getRelatableWaterComparison(
  amount: number, // in litres
  type: 'saved' | 'wasted',
  dailyNeed?: number,
  userTankCapacity?: number,
  unit: UnitSystem = 'metric'
): { primaryText: string; icon: string; dailyNeedText?: string } {
  if (amount <= 0) {
    if (type === 'wasted') {
      return {
        primaryText: 'Zero waste! Not a single drop lost.',
        icon: '🎉',
      };
    }
    return {
      primaryText: 'Choose your location to see your water savings.',
      icon: '💧',
    };
  }

  const isImperial = unit === 'imperial';
  const amountGal = litersToGallons(amount);

  if (isImperial) {
    if (amountGal < 40) {
      const buckets = Math.max(1, Math.round(amountGal / 4));
      return { primaryText: `That's about ${buckets} standard buckets (~4 gal each)!`, icon: '🪣' };
    } else if (amountGal < 250) {
      const bathtubs = Math.max(1, Math.round(amountGal / 50));
      return { primaryText: `Roughly ${bathtubs} full bathtubs of water (~50 gal each)!`, icon: '🛁' };
    } else if (amountGal <= 5000) {
      const tankers = Math.max(1, Math.round(amountGal / 1000));
      return { primaryText: `Enough to fill about ${tankers} municipal water delivery tankers!`, icon: '🚛' };
    } else {
      const pools = (amountGal / 20000).toFixed(1);
      return { primaryText: `That's equivalent to about ${pools} full residential swimming pools!`, icon: '🏊' };
    }
  }

  // Metric comparisons (Indian household friendly)
  if (amount < 20) {
    const glasses = Math.round(amount / 0.25);
    return { primaryText: `About ${glasses} drinking glasses of clean water!`, icon: '🥛' };
  } else if (amount < 200) {
    const buckets = Math.max(1, Math.round(amount / 15));
    return { primaryText: `About ${buckets} household buckets (15 litres each)!`, icon: '🪣' };
  } else if (amount < 1500) {
    const drums = Math.max(1, Math.round(amount / 200));
    return { primaryText: `About ${drums} large 200-litre storage drums!`, icon: '🛢️' };
  } else if (amount <= 12000) {
    const tankers = Math.max(1, Math.round(amount / 3000));
    return { primaryText: `Enough to fill ${tankers} whole water supply tankers (~3,000 L each)!`, icon: '🚛' };
  } else {
    const tankers = Math.max(1, Math.round(amount / 6000));
    return { primaryText: `Enough to fill ${tankers} large municipal water tankers (~6,000 L each)!`, icon: '🚛' };
  }
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * SAVED VS WASTED CALCULATION ENGINE
 * ══════════════════════════════════════════════════════════════════════
 * Formula for students, builders, and developers:
 * 1. Rain Falling on Roof (L) = sum over roofs of (roofArea (m²) × rainfall (mm))
 * 2. Water Collected (L) = sum over roofs of (roofArea × rainfall × that roof's runoff coefficient)
 * 3. Lost on Roof (L) = Rain Falling on Roof − Water Collected (loss from roof material, splashing, first flush)
 * 4. Effective Tank Capacity (L) = total storage capacity of all tanks combined (or recommended size if none entered)
 * 5. Saved (L) = min(Water Collected, Effective Tank Capacity) — water safely stored in tanks
 * 6. Overflowed (L) = max(0, Water Collected − Effective Tank Capacity) — water lost because all tanks are full
 * 7. Total Wasted (L) = Lost on Roof + Overflowed
 * 
 * Invariance check:
 * Saved + Wasted = Saved + (Lost on Roof + Overflowed)
 *                = Water Collected + (Rain on Roof − Water Collected)
 *                = Rain Falling on Roof (Always 100% of rain!)
 */
export function calcSavedWasted(
  period: CalculationPeriod,
  roofsOrArea: RoofItem[] | number,
  rainfallMm: number,
  tanksOrCoeff?: StorageTankItem[] | number,
  noTankYetOrTankCap?: boolean | number,
  recommendedTankSizeL: number = 2000,
  hasLocation: boolean = true,
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS,
  unit: UnitSystem = 'metric'
): SavedWastedBreakdown {
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const daysInPeriod = period === 'week' ? 7 : period === 'month' ? daysInCurrentMonth : 365;
  const periodLabel = period === 'week'
    ? 'This week (7-Day Forecast)'
    : period === 'month'
    ? `This month (Typical for ${currentMonthName})`
    : 'Typical year (3-Year Average)';

  // Handle both signatures (array of RoofItem vs legacy single number)
  let roofsList: RoofItem[] = [];
  if (Array.isArray(roofsOrArea)) {
    roofsList = normalizeRoofs(roofsOrArea);
  } else {
    const singleArea = typeof roofsOrArea === 'number' ? roofsOrArea : 100;
    roofsList = [{
      id: 'roof_1',
      name: 'Main Roof',
      area: String(singleArea),
      areaUnit: 'metric',
      typeKey: 'concrete',
      customName: '',
      customEfficiency: 70,
    }];
  }

  // Handle tanks
  let tanksList: StorageTankItem[] = [];
  let noTank = false;
  if (Array.isArray(tanksOrCoeff)) {
    tanksList = tanksOrCoeff;
    noTank = Boolean(noTankYetOrTankCap);
  } else if (typeof noTankYetOrTankCap === 'number') {
    tanksList = [{ id: 'tank_1', name: 'Tank 1', capacity: String(noTankYetOrTankCap) }];
    noTank = noTankYetOrTankCap <= 0;
  } else {
    tanksList = [{ id: 'tank_1', name: 'Tank 1', capacity: '2000' }];
    noTank = false;
  }

  const tankCapacityInfo = getTotalTankCapacity(tanksList, noTank, recommendedTankSizeL, unit);
  const effectiveTankCapacityL = tankCapacityInfo.totalLitres;
  const isCustomTank = tankCapacityInfo.isCustom;

  // Calculate per-roof values and sums
  let totalRainOnRoofL = 0;
  let waterCollectedL = 0;
  let hasRoofArea = false;

  const safeRainfall = Math.max(0, rainfallMm || 0);

  const roofsBreakdown: RoofCalculationBreakdown[] = roofsList.map((r, idx) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    if (rawA > 0) hasRoofArea = true;
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, assumptions, r.customEfficiency);
    const fall = Math.round(aM2 * safeRainfall);
    const coll = Math.round(fall * c);
    const lost = Math.max(0, fall - coll);

    totalRainOnRoofL += fall;
    waterCollectedL += coll;

    const typeOpt = ROOF_TYPES.find((t) => t.key === r.typeKey);
    const label = r.typeKey === 'custom' && r.customName ? r.customName : typeOpt?.label || 'Roof';

    return {
      id: r.id || `roof_${idx + 1}`,
      name: r.name || `Roof ${idx + 1}`,
      areaM2: Number(aM2.toFixed(1)),
      areaDisplay: rawA,
      areaUnit: r.areaUnit,
      roofType: r.typeKey,
      roofTypeLabel: label,
      runoffCoefficient: c,
      rainFallingL: fall,
      rainCollectedL: coll,
      rainLostL: lost,
    };
  });

  // If no location or roof area or 0 rainfall
  if (!hasLocation || !hasRoofArea || safeRainfall <= 0) {
    return {
      period,
      periodLabel,
      rainfallMm: safeRainfall,
      daysInPeriod,
      totalRainOnRoofL: 0,
      waterCollectedL: 0,
      savedL: 0,
      lostOnRoofL: 0,
      overflowedL: 0,
      totalWastedL: 0,
      savedPercentage: 0,
      lostPercentage: 0,
      overflowPercentage: 0,
      effectiveTankCapacityL,
      isCustomTank,
      tanksFill: tanksList.map((t, idx) => ({
        id: t.id || `tank_${idx + 1}`,
        name: t.name || `Tank ${idx + 1}`,
        capacityL: parseFloat(t.capacity) || 0,
        fillL: 0,
        fillPct: 0,
      })),
      roofsBreakdown,
      hasLocation,
      hasRoofArea,
    };
  }

  // Wasted part a) Lost on roof
  const lostOnRoofL = Math.max(0, totalRainOnRoofL - waterCollectedL);

  // Saved = min(water collected, effective tank capacity)
  const savedL = Math.min(waterCollectedL, effectiveTankCapacityL);

  // Wasted part b) Overflowed = water collected minus what all tanks combined can hold
  const overflowedL = Math.max(0, waterCollectedL - effectiveTankCapacityL);

  // Total wasted = Lost on roof + Overflowed
  const totalWastedL = lostOnRoofL + overflowedL;

  // In-order filling: Tank 1 fills first, then overflow goes to Tank 2, etc.
  let remToFill = savedL;
  const isImperial = unit === 'imperial';
  const tanksFill: TankFillBreakdown[] = (tanksList && tanksList.length > 0 && !noTank) ? tanksList.map((t, idx) => {
    const rawCap = parseFloat(t.capacity) || 0;
    const capL = isImperial ? gallonsToLiters(rawCap) : rawCap;
    const fillL = Math.min(remToFill, capL);
    remToFill = Math.max(0, remToFill - fillL);
    const fillPct = capL > 0 ? Math.round((fillL / capL) * 100) : 0;
    return {
      id: t.id || `tank_${idx + 1}`,
      name: t.name || `Tank ${idx + 1}`,
      capacityL: Math.round(capL),
      fillL: Math.round(fillL),
      fillPct: Math.min(100, Math.max(0, fillPct)),
    };
  }) : [
    {
      id: 'rec_tank',
      name: 'Recommended Tank',
      capacityL: effectiveTankCapacityL,
      fillL: savedL,
      fillPct: effectiveTankCapacityL > 0 ? Math.min(100, Math.round((savedL / effectiveTankCapacityL) * 100)) : 0,
    }
  ];

  // Exact percentages adding up to 100%
  let savedPercentage = 0;
  let overflowPercentage = 0;
  let lostPercentage = 0;

  if (totalRainOnRoofL > 0) {
    savedPercentage = Math.round((savedL / totalRainOnRoofL) * 100);
    overflowPercentage = Math.round((overflowedL / totalRainOnRoofL) * 100);
    lostPercentage = Math.max(0, 100 - savedPercentage - overflowPercentage);
  }

  return {
    period,
    periodLabel,
    rainfallMm: safeRainfall,
    daysInPeriod,
    totalRainOnRoofL,
    waterCollectedL,
    savedL,
    lostOnRoofL,
    overflowedL,
    totalWastedL,
    savedPercentage,
    lostPercentage,
    overflowPercentage,
    effectiveTankCapacityL,
    isCustomTank,
    tanksFill,
    roofsBreakdown,
    hasLocation,
    hasRoofArea,
  };
}

/**
 * ══════════════════════════════════════════════════════════════════════
 * "IN EVERYDAY TERMS" CONVERSION HELPERS
 * ══════════════════════════════════════════════════════════════════════
 */

/**
 * Converts litres to buckets (default 1 bucket ≈ 15 L).
 */
export function toBuckets(litres: number, bucketSizeL: number = 15): number {
  if (!litres || litres <= 0 || !bucketSizeL || bucketSizeL <= 0) return 0;
  return Math.round(litres / bucketSizeL);
}

/**
 * Converts litres to drinking water cans (default 1 can ≈ 20 L).
 */
export function toWaterCans(litres: number, canSizeL: number = 20): number {
  if (!litres || litres <= 0 || !canSizeL || canSizeL <= 0) return 0;
  return Math.round(litres / canSizeL);
}

/**
 * Converts litres to family bath days / baths (default 50 L per bath).
 */
export function toFamilyBaths(litres: number, bathSizeL: number = 50): number {
  if (!litres || litres <= 0 || !bathSizeL || bathSizeL <= 0) return 0;
  return Math.round(litres / bathSizeL);
}

/**
 * Converts litres to toilet flushes (default 6 L per flush).
 */
export function toToiletFlushes(litres: number, flushSizeL: number = 6): number {
  if (!litres || litres <= 0 || !flushSizeL || flushSizeL <= 0) return 0;
  return Math.round(litres / flushSizeL);
}

/**
 * Converts litres to tanker loads (default 1 tanker ≈ 6,000 L).
 */
export function toTankerLoads(litres: number, tankerSizeL: number = 6000): number {
  if (!litres || litres <= 0 || !tankerSizeL || tankerSizeL <= 0) return 0;
  const val = litres / tankerSizeL;
  return val >= 10 ? Math.round(val) : Number(val.toFixed(1));
}

/**
 * Converts litres to garden square metres watered once (default 5 L/m²).
 */
export function toGardenAreaWatered(litres: number, wateringPerM2L: number = 5): number {
  if (!litres || litres <= 0 || !wateringPerM2L || wateringPerM2L <= 0) return 0;
  return Math.round(litres / wateringPerM2L);
}

/**
 * Converts litres to days of household non-drinking use.
 */
export function toHouseholdDays(litres: number, householdSize: number = 4, dailyPerPersonL: number = 60): number {
  const dailyTotal = (householdSize || 4) * (dailyPerPersonL || 60);
  if (!dailyTotal || dailyTotal <= 0 || !litres || litres <= 0) return 0;
  return Math.round(litres / dailyTotal);
}

/**
 * Returns the most relatable unit automatically according to the user rules:
 * - under 100 L: use buckets
 * - 100 to 5,000 L: use buckets plus days of use
 * - above 5,000 L: use buckets plus days of use plus tanker loads
 */
export function getRelatableEverydayText(
  litres: number,
  conversions: EverydayConversionFactors = DEFAULT_EVERYDAY_CONVERSIONS,
  householdSize: number = 4,
  dailyPerPersonL: number = 60
): string {
  if (!litres || litres <= 0) return '0 buckets';

  const bucketSize = conversions.bucketSizeL || 15;
  const tankerSize = conversions.tankerSizeL || 6000;
  const buckets = toBuckets(litres, bucketSize);
  const days = toHouseholdDays(litres, householdSize, dailyPerPersonL);
  const tankers = toTankerLoads(litres, tankerSize);

  if (litres < 100) {
    return `about ${buckets.toLocaleString()} buckets`;
  }
  if (litres <= 5000) {
    return `about ${buckets.toLocaleString()} buckets • about ${days} days of family use`;
  }
  return `about ${buckets.toLocaleString()} buckets • about ${days} days of family use • about ${tankers} tanker loads`;
}

/**
 * Generates the top headline summary updating live:
 * "🎉 You could save about 330 buckets of rainwater this year (5,000 L). ⚠️ About 90 buckets may be wasted."
 * If waste is small: "👏 Great setup, almost nothing is wasted."
 * If no location or roof size yet: "Enter your roof size and choose your location to see this."
 */
export function getSavedWastedHeadlineSummary(
  breakdown: SavedWastedBreakdown,
  conversions: EverydayConversionFactors = DEFAULT_EVERYDAY_CONVERSIONS
): { icon: string; headline: string; subtext: string; isGood: boolean } {
  if (!breakdown.hasLocation || !breakdown.hasRoofArea) {
    return {
      icon: '📍',
      headline: 'Enter your roof size and choose your location to see this.',
      subtext: 'We will show how many buckets of rain you can save and how much may be lost.',
      isGood: false,
    };
  }

  if (breakdown.rainfallMm <= 0) {
    return {
      icon: '☀️',
      headline: breakdown.period === 'week' 
        ? 'No rain expected this week, nothing to collect yet.' 
        : 'Zero rainfall recorded for this period.',
      subtext: 'Check again when rain is forecast!',
      isGood: true,
    };
  }

  const bucketSize = conversions.bucketSizeL || 15;
  const savedBuckets = toBuckets(breakdown.savedL, bucketSize);
  const wastedBuckets = toBuckets(breakdown.totalWastedL, bucketSize);
  const overflowBuckets = toBuckets(breakdown.overflowedL, bucketSize);
  const periodWord = breakdown.period === 'week' ? 'this week' : breakdown.period === 'month' ? 'this month' : 'this year';

  // If waste is small (e.g. overflow is 0 or less than 1 bucket)
  if (breakdown.overflowedL < bucketSize && breakdown.savedPercentage >= 70) {
    return {
      icon: '👏',
      headline: `Great setup, almost nothing is wasted. You could save about ${savedBuckets.toLocaleString()} buckets of rainwater ${periodWord} (${breakdown.savedL.toLocaleString()} L).`,
      subtext: `Your tank capacity (${breakdown.effectiveTankCapacityL.toLocaleString()} L) is well matched to your roof.`,
      isGood: true,
    };
  }

  return {
    icon: '🎉',
    headline: `You could save about ${savedBuckets.toLocaleString()} buckets of rainwater ${periodWord} (${breakdown.savedL.toLocaleString()} L). ⚠️ About ${wastedBuckets.toLocaleString()} buckets may be wasted.`,
    subtext: overflowBuckets > 0 
      ? `About ${overflowBuckets.toLocaleString()} buckets overflow past your tank. A bigger tank could save most of it.`
      : `Most loss is natural absorption on your roof.`,
    isGood: false,
  };
}

/**
 * Helper to compute water summary for a SavedBuilding
 * Reads roofs, tanks, occupancy, location, and stored rainfall from the building
 */
export function getBuildingWaterSummary(
  building: SavedBuilding,
  unit: UnitSystem = 'metric',
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS
): FullWaterSummary {
  const normalizedRoofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
  const { tanks: normalizedTanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);

  const inputs: CalculatorInputs = {
    ...DEFAULT_INPUTS,
    roofs: normalizedRoofs,
    tanks: normalizedTanks,
    noTankYet: Boolean(noTankYet),
    householdSize: String(building.people || 4),
    locationName: building.location?.name || building.locationLabel || '',
    latitude: building.location?.latitude,
    longitude: building.location?.longitude,
    typicalMonthlyRainfallMm: building.monthlyRainfallMm,
    weeklyRainfallMm: building.weeklyRainfallMm,
    assumptions,
  };

  return calcWaterSummary(inputs, unit, assumptions);
}
