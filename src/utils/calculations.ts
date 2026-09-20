import { CalculatorInputs, CalculationResult, FormErrors, PresetScenario, RoofAreaBreakdown, RoofError } from '../types';
import { 
  UnitSystem, 
  feetToMeters, 
  inchesToMm, 
  gallonsToLiters, 
  litersToGallons,
  formatVolumeFull 
} from './units';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'suburban',
    name: 'Standard Suburban Home',
    description: 'Single roof: 15m × 10m, 60mm storm event, 5,000L tank',
    icon: '🏠',
    inputs: {
      roofs: [
        { id: '1', name: 'Roof 1', length: '15', width: '10' },
      ],
      rainfall: '60',
      efficiency: '80',
      tankCapacity: '5000',
      dailyRequirement: '250',
    },
  },
  {
    id: 'urban',
    name: 'Compact Urban Townhouse',
    description: 'Single roof: 10m × 7m, 45mm rain, 2,000L slimline tank',
    icon: '🏢',
    inputs: {
      roofs: [
        { id: '1', name: 'Roof 1', length: '10', width: '7' },
      ],
      rainfall: '45',
      efficiency: '85',
      tankCapacity: '2000',
      dailyRequirement: '120',
    },
  },
  {
    id: 'rural',
    name: 'Rural Farmhouse & Shed',
    description: '2 roofs: House (16m × 10m) + Shed (12m × 8m), 80mm rain, 15,000L tank',
    icon: '🌾',
    inputs: {
      roofs: [
        { id: '1', name: 'Roof 1 (House)', length: '16', width: '10' },
        { id: '2', name: 'Roof 2 (Shed)', length: '12', width: '8' },
      ],
      rainfall: '80',
      efficiency: '90',
      tankCapacity: '15000',
      dailyRequirement: '400',
    },
  },
];

export function validateInputs(inputs: CalculatorInputs, unit: UnitSystem = 'metric'): { errors: FormErrors; isValid: boolean } {
  const errors: FormErrors = {};
  const roofErrors: Record<string, RoofError> = {};
  let hasRoofErrors = false;

  const roofs = inputs.roofs && inputs.roofs.length > 0
    ? inputs.roofs
    : [{ id: '1', name: 'Roof 1', length: '', width: '' }];

  const maxLength = unit === 'imperial' ? 3000 : 1000;
  const maxRain = unit === 'imperial' ? 80 : 2000;
  const maxTank = unit === 'imperial' ? 2600000 : 10000000;
  const lengthUnitText = unit === 'imperial' ? 'feet' : 'metres';
  const rainUnitText = unit === 'imperial' ? 'inches' : 'mm';
  const tankUnitText = unit === 'imperial' ? 'gallons' : 'litres';

  roofs.forEach((roof) => {
    const rErr: RoofError = {};
    const length = parseFloat(roof.length);
    if (!roof.length.trim()) {
      rErr.length = 'Please enter the length of this roof';
    } else if (isNaN(length) || length <= 0) {
      rErr.length = 'Please enter a number greater than 0';
    } else if (length > maxLength) {
      rErr.length = `Please enter a roof length under ${maxLength.toLocaleString()} ${lengthUnitText}`;
    }

    const width = parseFloat(roof.width);
    if (!roof.width.trim()) {
      rErr.width = 'Please enter the width of this roof';
    } else if (isNaN(width) || width <= 0) {
      rErr.width = 'Please enter a number greater than 0';
    } else if (width > maxLength) {
      rErr.width = `Please enter a roof width under ${maxLength.toLocaleString()} ${lengthUnitText}`;
    }

    if (rErr.length || rErr.width) {
      roofErrors[roof.id] = rErr;
      hasRoofErrors = true;
    }
  });

  if (hasRoofErrors) {
    errors.roofs = roofErrors;
  }

  const rain = parseFloat(inputs.rainfall);
  if (!inputs.rainfall.trim()) {
    errors.rainfall = 'Please enter how much rain fell';
  } else if (isNaN(rain) || rain <= 0) {
    errors.rainfall = 'Please enter a number greater than 0';
  } else if (rain > maxRain) {
    errors.rainfall = `Please enter a rainfall amount under ${maxRain} ${rainUnitText}`;
  }

  const eff = parseFloat(inputs.efficiency);
  if (!inputs.efficiency.trim()) {
    errors.efficiency = 'Please enter an efficiency percentage';
  } else if (isNaN(eff) || eff <= 0) {
    errors.efficiency = 'Please enter a number greater than 0';
  } else if (eff > 100) {
    errors.efficiency = 'Percentage cannot be more than 100%';
  }

  const tank = parseFloat(inputs.tankCapacity);
  if (!inputs.tankCapacity.trim()) {
    errors.tankCapacity = 'Please enter how much water your tank can hold';
  } else if (isNaN(tank) || tank <= 0) {
    errors.tankCapacity = 'Please enter a number greater than 0';
  } else if (tank > maxTank) {
    errors.tankCapacity = `Please enter a tank size under ${maxTank.toLocaleString()} ${tankUnitText}`;
  }

  if (inputs.dailyRequirement.trim()) {
    const daily = parseFloat(inputs.dailyRequirement);
    if (isNaN(daily) || daily <= 0) {
      errors.dailyRequirement = 'Please enter a number greater than 0';
    } else if (daily > maxTank) {
      errors.dailyRequirement = 'Please enter a realistic daily amount';
    }
  }

  const isValid = !hasRoofErrors &&
    !errors.rainfall &&
    !errors.efficiency &&
    !errors.tankCapacity &&
    !errors.dailyRequirement;

  return {
    errors,
    isValid,
  };
}

export function calculateHarvesting(inputs: CalculatorInputs, unit: UnitSystem = 'metric'): CalculationResult {
  // Convert inputs to internal metric if entered in imperial
  const isImperial = unit === 'imperial';

  const rawRainfall = Math.max(0, parseFloat(inputs.rainfall) || 0);
  const rainfallMm = isImperial ? inchesToMm(rawRainfall) : rawRainfall;

  const efficiency = Math.min(100, Math.max(0, parseFloat(inputs.efficiency) || 80));

  const rawTank = Math.max(0, parseFloat(inputs.tankCapacity) || 0);
  const tankCapacityL = isImperial ? gallonsToLiters(rawTank) : rawTank;

  const rawDaily = inputs.dailyRequirement.trim() ? Math.max(0, parseFloat(inputs.dailyRequirement) || 0) : undefined;
  const dailyRequirementL = rawDaily !== undefined ? (isImperial ? gallonsToLiters(rawDaily) : rawDaily) : undefined;

  // Calculate the area of each roof in metric (metres and m²)
  const roofsBreakdown: RoofAreaBreakdown[] = (inputs.roofs || []).map((roof, index) => {
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

  // Total Roof Area in m²
  const totalRoofArea = Number(
    roofsBreakdown.reduce((sum, r) => sum + r.area, 0).toFixed(2)
  );

  // Total Rain That Falls (litres) = Total Roof Area (m²) × Rainfall (mm)
  // (1mm of rain on 1m² = 1 litre)
  const potentialWater = Math.round(totalRoofArea * rainfallMm);

  // Rain You Can Actually Collect (litres) = Total Rain × (Efficiency / 100)
  const harvestableWater = Math.round(potentialWater * (efficiency / 100));

  // Water You Can Save (litres) = MIN(Rain You Can Collect, Tank Size)
  const actuallyHarvested = Math.min(harvestableWater, tankCapacityL);

  // Water Wasted (litres) = Rain You Can Collect − Water You Can Save
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // Days This Water Will Last (optional) = Water You Can Save / Daily Water Need
  let supplyDays: number | undefined = undefined;
  if (dailyRequirementL && dailyRequirementL > 0) {
    supplyDays = Number((actuallyHarvested / dailyRequirementL).toFixed(1));
  }

  const storageUtilizationRate = tankCapacityL > 0 ? Math.min(100, Math.round((actuallyHarvested / tankCapacityL) * 100)) : 0;
  const harvestEfficiencyRate = harvestableWater > 0 ? Math.round((actuallyHarvested / harvestableWater) * 100) : 100;

  // Plain-language summary sentence formatted for active unit:
  let summarySentence = '';
  let suggestionLine = '';

  const savedFormatted = formatVolumeFull(actuallyHarvested, unit);
  const wastedFormatted = formatVolumeFull(wastedWater, unit);

  if (wastedWater > 0) {
    summarySentence = `Out of the rain that fell on your roof, you can save about ${savedFormatted}. About ${wastedFormatted} will be wasted because your tank isn't big enough.`;
    suggestionLine = `Getting a bigger tank could help you save more water next time it rains.`;
  } else if (harvestableWater === 0) {
    summarySentence = `Please enter your roof size and rainfall to see how much water you can save.`;
    suggestionLine = `Every drop counts! Measure your roof and enter rainfall to begin.`;
  } else if (actuallyHarvested < tankCapacityL) {
    const extraSpace = formatVolumeFull(tankCapacityL - actuallyHarvested, unit);
    summarySentence = `Out of the rain that fell on your roof, you can save all ${savedFormatted} without losing a single drop.`;
    suggestionLine = `Your tank still has room for another ${extraSpace}!`;
  } else {
    summarySentence = `Out of the rain that fell on your roof, you can save about ${savedFormatted}, filling your tank completely to the top.`;
    suggestionLine = `Your tank caught all the rain without any water going to waste.`;
  }

  const savedComparison = getRelatableWaterComparison(
    actuallyHarvested,
    'saved',
    dailyRequirementL,
    tankCapacityL,
    unit
  );

  const wastedComparison = getRelatableWaterComparison(
    wastedWater,
    'wasted',
    dailyRequirementL,
    tankCapacityL,
    unit
  );

  return {
    roofs: roofsBreakdown,
    roofArea: totalRoofArea,
    rainfall: Number(rainfallMm.toFixed(1)),
    potentialWater,
    harvestableWater,
    actuallyHarvested,
    wastedWater,
    tankCapacity: Math.round(tankCapacityL),
    dailyRequirement: dailyRequirementL ? Math.round(dailyRequirementL) : undefined,
    supplyDays,
    efficiency,
    storageUtilizationRate,
    harvestEfficiencyRate,
    summarySentence,
    suggestionLine,
    savedComparison,
    wastedComparison,
    weatherInfo: inputs.weatherInfo,
  };
}

export function getRelatableWaterComparison(
  amount: number, // in litres
  type: 'saved' | 'wasted',
  dailyNeed?: number, // in litres
  userTankCapacity?: number, // in litres
  unit: UnitSystem = 'metric'
): { primaryText: string; icon: string; dailyNeedText?: string } {
  if (amount <= 0) {
    if (type === 'wasted') {
      return {
        primaryText: 'Zero waste! Not a single drop lost — your tank caught all the rain.',
        icon: '🎉',
      };
    }
    return {
      primaryText: 'Enter measurements above to see your water savings.',
      icon: '💧',
    };
  }

  let primaryText = '';
  let icon = '🪣';

  const isImperial = unit === 'imperial';
  const amountGal = litersToGallons(amount);

  if (isImperial) {
    // Imperial comparisons (~4 gal bucket, ~50 gal tub, ~1,000 gal tanker)
    if (amountGal < 3) {
      const glasses = Math.max(1, Math.round(amountGal * 16));
      primaryText = `That's about ${glasses} ${glasses === 1 ? 'glass' : 'glasses'} of drinking water!`;
      icon = '🥛';
    } else if (amountGal < 40) {
      const buckets = Math.max(1, Math.round(amountGal / 4));
      primaryText = `That's about ${buckets} ${buckets === 1 ? 'bucket' : 'buckets'} of water (~4 gal each)!`;
      icon = '🪣';
    } else if (amountGal < 250) {
      const bathtubs = Math.max(1, Math.round(amountGal / 50));
      const buckets = Math.round(amountGal / 4);
      primaryText = `That's about ${buckets} buckets, or roughly ${bathtubs} full ${bathtubs === 1 ? 'bathtub' : 'bathtubs'} (~50 gal each)!`;
      icon = '🛁';
    } else if (amountGal <= 1500) {
      const bathtubs = Math.round(amountGal / 50);
      primaryText = `That's enough to fill roughly ${bathtubs} full bathtubs!`;
      icon = '🛁';
    } else if (amountGal <= 15000) {
      const tankers = Math.max(1, Math.round(amountGal / 1000));
      primaryText = `That's enough to fill about ${tankers} full water delivery tankers (~1,000 gal each)!`;
      icon = '🚛';
    } else {
      const pools = (amountGal / 20000).toFixed(1);
      primaryText = `That's about ${pools} standard backyard swimming pools!`;
      icon = '🏊';
    }
  } else {
    // Metric comparisons (15L bucket, 200L tub, 1,000L tanker)
    if (amount < 10) {
      const glasses = Math.round(amount / 0.25);
      primaryText = `That's about ${glasses} ${glasses === 1 ? 'glass' : 'glasses'} of drinking water!`;
      icon = '🥛';
    } else if (amount < 150) {
      const buckets = Math.max(1, Math.round(amount / 15));
      primaryText = `That's about ${buckets} ${buckets === 1 ? 'bucket' : 'buckets'} of water!`;
      icon = '🪣';
    } else if (amount < 1000) {
      const bathtubs = Math.max(1, Math.round(amount / 150));
      const buckets = Math.round(amount / 15);
      primaryText = `That's about ${buckets} buckets of water, or almost ${bathtubs} full ${bathtubs === 1 ? 'bathtub' : 'bathtubs'}!`;
      icon = '🛁';
    } else if (amount <= 5000) {
      const tankers = Math.round(amount / 1000);
      const bathtubs = Math.round(amount / 150);
      const buckets = Math.round(amount / 15);
      if (amount <= 2000) {
        primaryText = `That's about ${buckets} buckets of water, or almost ${bathtubs} full bathtubs!`;
        icon = '🛁';
      } else {
        primaryText = `That's enough to fill about ${tankers} full water tankers (or almost ${bathtubs} full bathtubs)!`;
        icon = '🚛';
      }
    } else if (amount <= 50000) {
      const tankers = Math.round(amount / 1000);
      if (userTankCapacity && userTankCapacity > 0 && Math.abs(amount - userTankCapacity) < 100) {
        primaryText = `That's enough to fill your entire ${formatVolumeFull(userTankCapacity, unit)} tank to the brim (about ${tankers} water tankers)!`;
        icon = '🛢️';
      } else if (userTankCapacity && userTankCapacity >= 1000 && amount > userTankCapacity) {
        const tankMultiple = Math.round(amount / userTankCapacity);
        if (tankMultiple >= 2) {
          primaryText = `That's about ${tankMultiple} tanks like the one you have (or ${tankers} water tankers)!`;
          icon = '🛢️';
        } else {
          primaryText = `That's enough to fill more than 1 full water tanker (about ${tankers} tankers total)!`;
          icon = '🚛';
        }
      } else {
        const mediumTanks = Math.max(1, Math.round(amount / 5000));
        if (amount < 7000) {
          primaryText = `That's enough to fill more than 1 full water tanker (about ${tankers} tankers total)!`;
        } else {
          primaryText = `That's about ${mediumTanks} standard medium tanks (or ${tankers} water tankers)!`;
        }
        icon = '🚛';
      }
    } else if (amount < 200000) {
      const tankers = Math.round(amount / 1000);
      primaryText = `That's enough water to fill a small village pond (over ${formatNumber(tankers)} water tankers)!`;
      icon = '🏞️';
    } else {
      const pools = (amount / 250000).toFixed(1);
      const tankers = Math.round(amount / 1000);
      primaryText = `That's about ${pools} standard swimming pools (over ${formatNumber(tankers)} water tankers)!`;
      icon = '🏊';
    }
  }

  let dailyNeedText: string | undefined = undefined;
  if (dailyNeed && dailyNeed > 0) {
    const days = Math.round(amount / dailyNeed);
    if (type === 'wasted') {
      dailyNeedText = `This wasted water could have covered your daily needs for ${days} ${days === 1 ? 'day' : 'days'}.`;
    } else {
      dailyNeedText = `This saved water can cover your household daily needs for ${days} ${days === 1 ? 'day' : 'days'}!`;
    }
  }

  return {
    primaryText,
    icon,
    dailyNeedText,
  };
}

export function formatLitre(litres: number): string {
  return `${litres.toLocaleString()}L`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString();
}
