import { CalculatorInputs, CalculationResult, FormErrors, PresetScenario, RoofAreaBreakdown, RoofError } from '../types';

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

export function validateInputs(inputs: CalculatorInputs): { errors: FormErrors; isValid: boolean } {
  const errors: FormErrors = {};
  const roofErrors: Record<string, RoofError> = {};
  let hasRoofErrors = false;

  const roofs = inputs.roofs && inputs.roofs.length > 0
    ? inputs.roofs
    : [{ id: '1', name: 'Roof 1', length: '', width: '' }];

  roofs.forEach((roof) => {
    const rErr: RoofError = {};
    const length = parseFloat(roof.length);
    if (!roof.length.trim()) {
      rErr.length = 'Please enter the length of this roof';
    } else if (isNaN(length) || length <= 0) {
      rErr.length = 'Please enter a number greater than 0';
    } else if (length > 1000) {
      rErr.length = 'Please enter a roof length under 1,000 metres';
    }

    const width = parseFloat(roof.width);
    if (!roof.width.trim()) {
      rErr.width = 'Please enter the width of this roof';
    } else if (isNaN(width) || width <= 0) {
      rErr.width = 'Please enter a number greater than 0';
    } else if (width > 1000) {
      rErr.width = 'Please enter a roof width under 1,000 metres';
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
  } else if (rain > 2000) {
    errors.rainfall = 'Please enter a rainfall amount under 2,000 mm';
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
  } else if (tank > 10000000) {
    errors.tankCapacity = 'Please enter a tank size under 10,000,000 litres';
  }

  if (inputs.dailyRequirement.trim()) {
    const daily = parseFloat(inputs.dailyRequirement);
    if (isNaN(daily) || daily <= 0) {
      errors.dailyRequirement = 'Please enter a number greater than 0';
    } else if (daily > 100000) {
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

export function calculateHarvesting(inputs: CalculatorInputs): CalculationResult {
  const rainfall = Math.max(0, parseFloat(inputs.rainfall) || 0);
  const efficiency = Math.min(100, Math.max(0, parseFloat(inputs.efficiency) || 80));
  const tankCapacity = Math.max(0, parseFloat(inputs.tankCapacity) || 0);
  const dailyRequirement = inputs.dailyRequirement.trim() ? Math.max(0, parseFloat(inputs.dailyRequirement) || 0) : undefined;

  // Calculate the area of each roof separately:
  // Roof Area (per roof) = Length × Width
  const roofsBreakdown: RoofAreaBreakdown[] = (inputs.roofs || []).map((roof, index) => {
    const l = Math.max(0, parseFloat(roof.length) || 0);
    const w = Math.max(0, parseFloat(roof.width) || 0);
    const a = Number((l * w).toFixed(2));
    return {
      id: roof.id,
      name: roof.name || `Roof ${index + 1}`,
      length: l,
      width: w,
      area: a,
    };
  });

  // Total Roof Area = sum of all roof areas added
  const totalRoofArea = Number(
    roofsBreakdown.reduce((sum, r) => sum + r.area, 0).toFixed(2)
  );

  // Total Rain That Falls (litres) = Total Roof Area × Rainfall
  // (1mm of rain on 1m² of roof = about 1 litre of water)
  const potentialWater = Math.round(totalRoofArea * rainfall);

  // Rain You Can Actually Collect (litres) = Total Rain × (Efficiency / 100)
  const harvestableWater = Math.round(potentialWater * (efficiency / 100));

  // Water You Can Save (litres) = MIN(Rain You Can Collect, Tank Size)
  const actuallyHarvested = Math.min(harvestableWater, tankCapacity);

  // Water Wasted (litres) = Rain You Can Collect − Water You Can Save
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // Days This Water Will Last (optional) = Water You Can Save / Daily Water Need
  let supplyDays: number | undefined = undefined;
  if (dailyRequirement && dailyRequirement > 0) {
    supplyDays = Number((actuallyHarvested / dailyRequirement).toFixed(1));
  }

  const storageUtilizationRate = tankCapacity > 0 ? Math.min(100, Math.round((actuallyHarvested / tankCapacity) * 100)) : 0;
  const harvestEfficiencyRate = harvestableWater > 0 ? Math.round((actuallyHarvested / harvestableWater) * 100) : 100;

  // Plain-language summary sentence:
  let summarySentence = '';
  let suggestionLine = '';

  const savedFormatted = formatNumber(actuallyHarvested);
  const wastedFormatted = formatNumber(wastedWater);

  if (wastedWater > 0) {
    summarySentence = `Out of the rain that fell on your roof, you can save about ${savedFormatted} litres. About ${wastedFormatted} litres will be wasted because your tank isn't big enough.`;
    suggestionLine = `Getting a bigger tank could help you save more water next time it rains.`;
  } else if (harvestableWater === 0) {
    summarySentence = `Please enter your roof size and rainfall to see how much water you can save.`;
    suggestionLine = `Every drop counts! Measure your roof and enter rainfall to begin.`;
  } else if (actuallyHarvested < tankCapacity) {
    const extraSpace = formatNumber(tankCapacity - actuallyHarvested);
    summarySentence = `Out of the rain that fell on your roof, you can save all ${savedFormatted} litres without losing a single drop.`;
    suggestionLine = `Your tank still has room for another ${extraSpace} litres of water!`;
  } else {
    summarySentence = `Out of the rain that fell on your roof, you can save about ${savedFormatted} litres, filling your tank completely to the top.`;
    suggestionLine = `Your tank caught all the rain without any water going to waste.`;
  }

  const savedComparison = getRelatableWaterComparison(
    actuallyHarvested,
    'saved',
    dailyRequirement,
    tankCapacity
  );

  const wastedComparison = getRelatableWaterComparison(
    wastedWater,
    'wasted',
    dailyRequirement,
    tankCapacity
  );

  return {
    roofs: roofsBreakdown,
    roofArea: totalRoofArea,
    rainfall,
    potentialWater,
    harvestableWater,
    actuallyHarvested,
    wastedWater,
    tankCapacity,
    dailyRequirement,
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
  amount: number,
  type: 'saved' | 'wasted',
  dailyNeed?: number,
  userTankCapacity?: number
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

  // Logic matching the reference table:
  // - Under 10 L → show in glasses
  // - 10 L – 150 L → show in buckets
  // - 150 L – 1,000 L → show in bathtubs (or buckets + bathtubs)
  // - 1,000 L – 5,000 L → show in water tankers or medium tanks
  // - 5,000 L – 50,000 L → show as a fraction/multiple of a medium tank (or tankers)
  // - Above 50,000 L → show as a small pond/lake or swimming pool
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
      primaryText = `That's enough to fill your entire ${formatNumber(userTankCapacity)}L tank to the brim (about ${tankers} water tankers)!`;
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
