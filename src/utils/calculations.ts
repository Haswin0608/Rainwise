import { CalculatorInputs, CalculationResult, FormErrors, PresetScenario } from '../types';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'suburban',
    name: 'Standard Suburban Home',
    description: '15m × 10m roof, 60mm storm event, 5,000L tank',
    icon: '🏠',
    inputs: {
      roofLength: '15',
      roofWidth: '10',
      rainfall: '60',
      efficiency: '80',
      tankCapacity: '5000',
      dailyRequirement: '250',
    },
  },
  {
    id: 'urban',
    name: 'Compact Urban Townhouse',
    description: '10m × 7m roof, 45mm rain, 2,000L slimline tank',
    icon: '🏢',
    inputs: {
      roofLength: '10',
      roofWidth: '7',
      rainfall: '45',
      efficiency: '85',
      tankCapacity: '2000',
      dailyRequirement: '120',
    },
  },
  {
    id: 'rural',
    name: 'Rural Shed / Homestead',
    description: '24m × 12m metal roof, 80mm rainfall, 15,000L tank',
    icon: '🌾',
    inputs: {
      roofLength: '24',
      roofWidth: '12',
      rainfall: '80',
      efficiency: '90',
      tankCapacity: '15000',
      dailyRequirement: '400',
    },
  },
];

export function validateInputs(inputs: CalculatorInputs): { errors: FormErrors; isValid: boolean } {
  const errors: FormErrors = {};

  const length = parseFloat(inputs.roofLength);
  if (!inputs.roofLength.trim()) {
    errors.roofLength = 'Please enter the length of your roof';
  } else if (isNaN(length) || length <= 0) {
    errors.roofLength = 'Please enter a number greater than 0';
  } else if (length > 1000) {
    errors.roofLength = 'Please enter a roof length under 1,000 metres';
  }

  const width = parseFloat(inputs.roofWidth);
  if (!inputs.roofWidth.trim()) {
    errors.roofWidth = 'Please enter the width of your roof';
  } else if (isNaN(width) || width <= 0) {
    errors.roofWidth = 'Please enter a number greater than 0';
  } else if (width > 1000) {
    errors.roofWidth = 'Please enter a roof width under 1,000 metres';
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

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function calculateHarvesting(inputs: CalculatorInputs): CalculationResult {
  const length = Math.max(0, parseFloat(inputs.roofLength) || 0);
  const width = Math.max(0, parseFloat(inputs.roofWidth) || 0);
  const rainfall = Math.max(0, parseFloat(inputs.rainfall) || 0);
  const efficiency = Math.min(100, Math.max(0, parseFloat(inputs.efficiency) || 80));
  const tankCapacity = Math.max(0, parseFloat(inputs.tankCapacity) || 0);
  const dailyRequirement = inputs.dailyRequirement.trim() ? Math.max(0, parseFloat(inputs.dailyRequirement) || 0) : undefined;

  // 1. Roof Area = Length × Width (m²)
  const roofArea = Number((length * width).toFixed(2));

  // 2. Total Rain That Falls (litres) = Roof Area × Rainfall
  // (1mm of rain on 1m² of roof = about 1 litre of water)
  const potentialWater = Math.round(roofArea * rainfall);

  // 3. Rain You Can Actually Collect (litres) = Total Rain × (Efficiency / 100)
  const harvestableWater = Math.round(potentialWater * (efficiency / 100));

  // 4. Water You Can Save (litres) = MIN(Rain You Can Collect, Tank Size)
  const actuallyHarvested = Math.min(harvestableWater, tankCapacity);

  // 5. Water Wasted (litres) = Rain You Can Collect − Water You Can Save
  // (if your tank is big enough, this is 0)
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // 6. Days This Water Will Last (optional) = Water You Can Save / Daily Water Need
  let supplyDays: number | undefined = undefined;
  if (dailyRequirement && dailyRequirement > 0) {
    supplyDays = Number((actuallyHarvested / dailyRequirement).toFixed(1));
  }

  const storageUtilizationRate = tankCapacity > 0 ? Math.min(100, Math.round((actuallyHarvested / tankCapacity) * 100)) : 0;
  const harvestEfficiencyRate = harvestableWater > 0 ? Math.round((actuallyHarvested / harvestableWater) * 100) : 100;

  // Plain-language summary sentence:
  // e.g.: "Out of the rain that fell on your roof, you can save about 6,400 litres. About 1,400 litres will be wasted because your tank isn't big enough."
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

  return {
    roofArea,
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
  };
}

export function formatLitre(litres: number): string {
  return `${litres.toLocaleString()}L`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString();
}
