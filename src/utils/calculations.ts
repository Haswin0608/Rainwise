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
  SavedWastedPeriod,
  SavedWastedBreakdown,
  HouseholdPlan,
  SimulationResult,
  SimulationMonth,
  RainfallScenario
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
      roofs: [{ id: '1', name: 'Main House', length: '12.5', width: '8' }],
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
        { id: '1', name: 'Main Farmhouse (Tiles)', length: '12', width: '8' },
        { id: '2', name: 'Storage Shed (Metal)', length: '8', width: '8' },
      ],
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
      roofs: [{ id: '1', name: 'House Roof', length: '10', width: '8' }],
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
  roofAreaMode: 'direct',
  directRoofArea: '100',
  roofs: [{ id: '1', name: 'Main Roof', length: '12.5', width: '8' }],
  roofType: 'concrete',
  efficiency: '80',
  householdSize: '4',
  tankCapacity: '2000',
  dailyRequirement: '240',
  waterTariff: '15',
  installationCost: '15000',
  rainfallScenario: 'normal',
  assumptions: DEFAULT_ASSUMPTIONS,
};

/**
 * Returns runoff coefficient (0.0 to 1.0)
 */
export function getRunoffCoefficient(
  roofType: RoofTypeKey, 
  customCoefficient?: string, 
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS
): number {
  if (roofType === 'custom' && customCoefficient) {
    const val = parseFloat(customCoefficient);
    if (!isNaN(val) && val > 0 && val <= 1) return val;
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

  if (inputs.roofAreaMode === 'direct') {
    const directArea = parseFloat(inputs.directRoofArea);
    if (isNaN(directArea) || directArea <= 0) {
      errors.directArea = 'Please enter a valid roof area greater than 0';
      isValid = false;
    } else if (unit === 'imperial' && directArea > 150000) {
      errors.directArea = 'Roof area seems unusually large for a household';
    } else if (unit === 'metric' && directArea > 15000) {
      errors.directArea = 'Roof area seems unusually large for a household';
    }
  } else {
    const roofErrors: Record<string, RoofError> = {};
    let hasRoofError = false;

    if (!inputs.roofs || inputs.roofs.length === 0) {
      errors.directArea = 'Please add at least one roof section';
      isValid = false;
    } else {
      inputs.roofs.forEach((roof) => {
        const rErr: RoofError = {};
        const l = parseFloat(roof.length);
        const w = parseFloat(roof.width);

        if (isNaN(l) || l <= 0) {
          rErr.length = 'Length must be > 0';
          hasRoofError = true;
        }
        if (isNaN(w) || w <= 0) {
          rErr.width = 'Width must be > 0';
          hasRoofError = true;
        }

        if (Object.keys(rErr).length > 0) {
          roofErrors[roof.id] = rErr;
        }
      });

      if (hasRoofError) {
        errors.roofs = roofErrors;
        isValid = false;
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
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS
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

  // Tank Adequacy Evaluation
  const recommendedSize = getRecommendedTankSize(dailyDemandTotalL, annualHarvestableL, assumptions.dryDaysBuffer);

  const rawTank = inputs.tankCapacity ? parseFloat(inputs.tankCapacity) : 0;
  const enteredTankL = isImperial ? gallonsToLiters(rawTank) : rawTank;

  let tankStatus: 'good' | 'overflow' | 'large' = 'good';
  let statusLabel = 'Good size';
  let badgeColor = 'emerald';
  let message = '';
  let overflowLitres = 0;
  let overflowNotice = 'Zero waste expected with typical usage!';

  if (!enteredTankL || enteredTankL <= 0) {
    tankStatus = 'good';
    statusLabel = 'Recommended Size';
    badgeColor = 'sky';
    message = `We recommend a ${formatVolumeFull(recommendedSize, unit)} tank for your ${householdSize}-person household to bridge typical dry breaks.`;
    overflowLitres = Math.max(0, annualHarvestableL - (recommendedSize * 6));
    overflowNotice = `A ${formatVolumeFull(recommendedSize, unit)} tank captures multiple rain cycles nicely.`;
  } else {
    const peakStormVolume = annualHarvestableL * 0.20;

    if (enteredTankL < peakStormVolume * 0.7) {
      tankStatus = 'overflow';
      statusLabel = 'May overflow ⚠️';
      badgeColor = 'amber';
      overflowLitres = Math.max(0, Math.round(annualHarvestableL - (enteredTankL * 4)));
      message = `Your ${formatVolumeFull(enteredTankL, unit)} tank is on the smaller side for this roof. It will fill fast and water may spill over during heavy rains.`;
      overflowNotice = `Approximately ${formatVolumeFull(overflowLitres, unit)} of overflow could be lost without a larger or second tank.`;
    } else if (enteredTankL > annualHarvestableL * 0.8 && enteredTankL > recommendedSize * 2) {
      tankStatus = 'large';
      statusLabel = 'Larger than needed 🔻';
      badgeColor = 'purple';
      overflowLitres = 0;
      message = `Your ${formatVolumeFull(enteredTankL, unit)} tank is very generous. It will rarely reach 100% capacity from this roof alone.`;
      overflowNotice = `No water will be lost, but a smaller tank could have saved installation cost.`;
    } else {
      tankStatus = 'good';
      statusLabel = 'Good size ✅';
      badgeColor = 'emerald';
      overflowLitres = Math.max(0, Math.round(annualHarvestableL * 0.08));
      message = `Your ${formatVolumeFull(enteredTankL, unit)} tank is well-balanced for your roof collection and household needs.`;
      overflowNotice = overflowLitres > 0 
        ? `Only ~${formatVolumeFull(overflowLitres, unit)} overflow during peak torrential storms.`
        : `Virtually no water will be wasted during regular rainfall!`;
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
 * Main Calculation Engine:
 * Location-based Automatic Rainfall:
 * - Short term: 7-day forecast weekly collection
 * - Yearly: 3-year historical average (Open-Meteo Archive)
 */
export function calculateHarvesting(
  inputs: CalculatorInputs, 
  unit: UnitSystem = 'metric',
  assumptions: PlanningAssumptions = DEFAULT_ASSUMPTIONS
): CalculationResult {
  const isImperial = unit === 'imperial';

  // 1. Calculate Roof Area (m²)
  let totalRoofArea = 0;
  let roofsBreakdown: RoofAreaBreakdown[] = [];

  if (inputs.roofAreaMode === 'direct') {
    const rawDirect = Math.max(0, parseFloat(inputs.directRoofArea) || 0);
    totalRoofArea = isImperial ? sqFeetToSqMeters(rawDirect) : rawDirect;
    totalRoofArea = Number(totalRoofArea.toFixed(2));

    roofsBreakdown = [
      {
        id: 'direct-roof',
        name: 'Total Roof Area',
        length: 0,
        width: 0,
        area: totalRoofArea,
      },
    ];
  } else {
    roofsBreakdown = (inputs.roofs || []).map((roof, index) => {
      const rawL = Math.max(0, parseFloat(roof.length) || 0);
      const rawW = Math.max(0, parseFloat(roof.width) || 0);
      const lMeters = isImperial ? feetToMeters(rawL) : rawL;
      const wMeters = isImperial ? feetToMeters(rawW) : rawW;
      const aMeters = Number((lMeters * wMeters).toFixed(2));
      return {
        id: roof.id,
        name: roof.name || `Roof ${index + 1}`,
        length: Number(lMeters.toFixed(2)),
        width: Number(wMeters.toFixed(2)),
        area: aMeters,
      };
    });

    totalRoofArea = Number(
      roofsBreakdown.reduce((sum, r) => sum + r.area, 0).toFixed(2)
    );
  }

  // 2. Runoff Coefficient
  const roofType = inputs.roofType || 'concrete';
  const runoffCoefficient = getRunoffCoefficient(roofType, inputs.customRunoffCoefficient, assumptions);
  const efficiency = Math.round(runoffCoefficient * 100);

  // 3. Tank Capacity (in litres)
  const rawTank = inputs.tankCapacity ? Math.max(0, parseFloat(inputs.tankCapacity) || 0) : 0;
  const tankCapacityL = isImperial ? gallonsToLiters(rawTank) : rawTank;

  // 4. Check whether location has been selected
  const historical = inputs.historicalRainfall || inputs.weatherInfo?.historical;
  const hasHistoricalRainfall = typeof inputs.typicalAnnualRainfallMm === 'number' || (historical && typeof historical.typicalAnnualRainfallMm === 'number');
  const hasWeeklyRainfall = typeof inputs.weeklyRainfallMm === 'number' || (inputs.weatherInfo && typeof inputs.weatherInfo.weeklyRainfallMm === 'number');
  const hasLocation = Boolean(inputs.locationName && (hasHistoricalRainfall || hasWeeklyRainfall));

  if (!hasLocation) {
    // Before location is chosen: Return clean state with hasLocation: false
    const householdPlan = calculateHouseholdPlan(0, inputs, unit, assumptions);

    return {
      hasLocation: false,
      locationName: inputs.locationName,
      roofs: roofsBreakdown,
      roofArea: totalRoofArea,
      roofType,
      runoffCoefficient,
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

  // When location IS chosen:
  // Weekly collection from 7-day forecast
  const weeklyRainfallMm = inputs.weeklyRainfallMm ?? inputs.weatherInfo?.weeklyRainfallMm ?? inputs.weatherInfo?.fullWeather?.weeklyPrecipitationSumMm ?? 0;
  const weeklyHarvestableWater = Math.round((totalRoofArea * weeklyRainfallMm * runoffCoefficient) / 10) * 10;

  // Typical annual rainfall from 3-year historical archive
  const annualRainfallMm = inputs.typicalAnnualRainfallMm ?? historical?.typicalAnnualRainfallMm ?? 0;

  // Simulation scenario scaling: 'dry' (-30%), 'normal' (0%), 'wet' (+30%)
  const scenario: RainfallScenario = inputs.rainfallScenario || 'normal';
  const scenarioMultiplier = scenario === 'dry' ? 0.7 : scenario === 'wet' ? 1.3 : 1.0;
  const scaledAnnualRainfallMm = Math.round(annualRainfallMm * scenarioMultiplier * 10) / 10;

  // Yearly potential & harvestable calculations
  const potentialWater = Math.round(totalRoofArea * scaledAnnualRainfallMm);
  const harvestableWater = Math.round(potentialWater * runoffCoefficient);
  const waterLost = Math.max(0, potentialWater - harvestableWater);

  const actuallyHarvested = tankCapacityL > 0 ? Math.min(harvestableWater, tankCapacityL) : harvestableWater;
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // Household Plan (Step 2)
  const householdPlan = calculateHouseholdPlan(harvestableWater, inputs, unit, assumptions);

  // Monthly Simulation (Step 3)
  const baseMonthly = inputs.typicalMonthlyRainfallMm ?? historical?.typicalMonthlyRainfallMm ?? new Array(12).fill(annualRainfallMm / 12);
  const scaledMonthly = baseMonthly.map(m => Math.round(m * scenarioMultiplier * 10) / 10);
  const effectiveTankForSim = tankCapacityL > 0 ? tankCapacityL : householdPlan.tankAdequacy.recommendedSize;

  const simulation = runMonthlySimulation(
    totalRoofArea,
    runoffCoefficient,
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

  const summarySentence = `At ${inputs.locationName || 'your location'}, you could collect about ${savedFormatted} of clean rainwater in a typical year.`;
  const suggestionLine = `About ${lostFormatted} (${100 - efficiency}%) splashes off or evaporates from the roof surface.`;

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
    roofArea: totalRoofArea,
    roofType,
    runoffCoefficient,
    weeklyRainfallMm: Number(weeklyRainfallMm.toFixed(1)),
    weeklyHarvestableWater,
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
 * Formula for students and developers:
 * 1. Rain Falling on Roof (L) = roofArea (m²) × rainfall (mm)
 * 2. Water Collected (L) = Rain Falling on Roof × runoffCoefficient
 * 3. Lost on Roof (L) = Rain Falling on Roof − Water Collected (loss from roof material, splashing, first flush)
 * 4. Effective Tank Capacity (L) = entered tank capacity (or recommended size if none entered)
 * 5. Saved (L) = min(Water Collected, Effective Tank Capacity) — water safely stored in the tank
 * 6. Overflowed (L) = max(0, Water Collected − Effective Tank Capacity) — water lost because tank is full
 * 7. Total Wasted (L) = Lost on Roof + Overflowed
 * 
 * Invariance check:
 * Saved + Wasted = Saved + (Lost on Roof + Overflowed)
 *                = Water Collected + (Rain on Roof − Water Collected)
 *                = Rain Falling on Roof (Always 100% of rain!)
 */
export function calcSavedWasted(
  period: SavedWastedPeriod,
  roofAreaM2: number,
  rainfallMm: number,
  runoffCoefficient: number,
  tankCapacityL: number,
  recommendedTankSizeL: number = 2000,
  hasLocation: boolean = true
): SavedWastedBreakdown {
  const hasRoofArea = roofAreaM2 > 0;
  const isCustomTank = tankCapacityL > 0;
  const effectiveTankCapacityL = isCustomTank ? tankCapacityL : (recommendedTankSizeL || 2000);

  // If no location or roof area, return safe 0 state
  if (!hasLocation || !hasRoofArea || rainfallMm <= 0) {
    return {
      period,
      periodLabel: period === 'week' ? 'This week (7-Day Forecast)' : 'Typical year (3-Year Average)',
      rainfallMm: Math.max(0, rainfallMm || 0),
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
      hasLocation,
      hasRoofArea,
    };
  }

  // 1. Rain falling on roof (L) = roof area (m²) × rainfall (mm)
  const totalRainOnRoofL = Math.round(roofAreaM2 * rainfallMm);

  // 2. Water reaching gutters and pipes
  const waterCollectedL = Math.round(totalRainOnRoofL * runoffCoefficient);

  // 3. Wasted part a) Lost on roof
  const lostOnRoofL = Math.max(0, totalRainOnRoofL - waterCollectedL);

  // 4. Saved = min(water collected, tank capacity)
  const savedL = Math.min(waterCollectedL, effectiveTankCapacityL);

  // 5. Wasted part b) Overflowed = water collected minus what tank can hold
  const overflowedL = Math.max(0, waterCollectedL - effectiveTankCapacityL);

  // 6. Total wasted = Lost on roof + Overflowed
  const totalWastedL = lostOnRoofL + overflowedL;

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
    periodLabel: period === 'week' ? 'This week (7-Day Forecast)' : 'Typical year (3-Year Average)',
    rainfallMm,
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
  const periodWord = breakdown.period === 'week' ? 'this week' : 'this year';

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
