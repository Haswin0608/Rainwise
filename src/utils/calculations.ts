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
    errors.roofLength = 'Roof length is required';
  } else if (isNaN(length) || length <= 0) {
    errors.roofLength = 'Please enter a positive length in metres';
  } else if (length > 1000) {
    errors.roofLength = 'Length must be realistic (under 1,000m)';
  }

  const width = parseFloat(inputs.roofWidth);
  if (!inputs.roofWidth.trim()) {
    errors.roofWidth = 'Roof width is required';
  } else if (isNaN(width) || width <= 0) {
    errors.roofWidth = 'Please enter a positive width in metres';
  } else if (width > 1000) {
    errors.roofWidth = 'Width must be realistic (under 1,000m)';
  }

  const rain = parseFloat(inputs.rainfall);
  if (!inputs.rainfall.trim()) {
    errors.rainfall = 'Rainfall amount is required';
  } else if (isNaN(rain) || rain <= 0) {
    errors.rainfall = 'Please enter a positive rainfall in mm';
  } else if (rain > 2000) {
    errors.rainfall = 'Rainfall must be realistic (under 2,000mm)';
  }

  const eff = parseFloat(inputs.efficiency);
  if (!inputs.efficiency.trim()) {
    errors.efficiency = 'Collection efficiency is required';
  } else if (isNaN(eff) || eff <= 0) {
    errors.efficiency = 'Efficiency must be greater than 0%';
  } else if (eff > 100) {
    errors.efficiency = 'Efficiency cannot exceed 100%';
  }

  const tank = parseFloat(inputs.tankCapacity);
  if (!inputs.tankCapacity.trim()) {
    errors.tankCapacity = 'Storage tank capacity is required';
  } else if (isNaN(tank) || tank <= 0) {
    errors.tankCapacity = 'Tank capacity must be a positive number';
  } else if (tank > 10000000) {
    errors.tankCapacity = 'Capacity must be under 10,000,000 litres';
  }

  if (inputs.dailyRequirement.trim()) {
    const daily = parseFloat(inputs.dailyRequirement);
    if (isNaN(daily) || daily <= 0) {
      errors.dailyRequirement = 'Daily requirement must be a positive number';
    } else if (daily > 100000) {
      errors.dailyRequirement = 'Please enter a realistic daily value';
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

  // 1. Roof Area (Mensuration): Area = Length × Width (m²)
  const roofArea = Number((length * width).toFixed(2));

  // 2. Potential Rainwater (Unit Conversion):
  // 1 mm of rain over 1 m² = 0.001 m × 1 m² = 0.001 m³ = 1 Litre
  // Potential (L) = Roof Area × Rainfall
  const potentialWater = Math.round(roofArea * rainfall);

  // 3. Harvestable Rainwater (Percentage):
  // Harvestable (L) = Potential Rainwater × (Efficiency / 100)
  const harvestableWater = Math.round(potentialWater * (efficiency / 100));

  // 4. Actually Harvested (Comparison/Min function):
  // Actually Harvested (L) = MIN(Harvestable Rainwater, Tank Capacity)
  const actuallyHarvested = Math.min(harvestableWater, tankCapacity);

  // 5. Wasted Water (Subtraction):
  // Wasted (L) = Harvestable Rainwater − Actually Harvested (if Harvestable <= Tank Capacity, Wasted = 0)
  const wastedWater = Math.max(0, harvestableWater - actuallyHarvested);

  // 6. Water Supply Days (optional, Division):
  // Supply Days = Actually Harvested / Daily Water Requirement
  let supplyDays: number | undefined = undefined;
  if (dailyRequirement && dailyRequirement > 0) {
    supplyDays = Number((actuallyHarvested / dailyRequirement).toFixed(1));
  }

  // Storage utilization & efficiency metrics
  const storageUtilizationRate = tankCapacity > 0 ? Math.min(100, Math.round((actuallyHarvested / tankCapacity) * 100)) : 0;
  const harvestEfficiencyRate = harvestableWater > 0 ? Math.round((actuallyHarvested / harvestableWater) * 100) : 100;

  // Auto-generated summary sentence according to specs:
  // e.g.: "You could harvest approximately 6,400L. About 1,400L would be wasted due to tank capacity limits."
  let summarySentence = '';
  const formattedHarvested = formatLitre(actuallyHarvested);
  const formattedWasted = formatLitre(wastedWater);

  if (wastedWater > 0) {
    summarySentence = `You could harvest approximately ${formattedHarvested}. About ${formattedWasted} would be wasted due to tank capacity limits.`;
  } else if (harvestableWater === 0) {
    summarySentence = `No rainfall collected with current parameters. Please enter roof dimensions and rainfall to calculate.`;
  } else if (actuallyHarvested < tankCapacity) {
    const remainingTank = formatLitre(tankCapacity - actuallyHarvested);
    summarySentence = `You could harvest all ${formattedHarvested} of harvestable water with zero overflow. Your tank has ${remainingTank} of reserve capacity remaining.`;
  } else {
    summarySentence = `You could harvest approximately ${formattedHarvested}, perfectly utilizing 100% of your tank capacity with zero waste.`;
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
  };
}

export function formatLitre(litres: number): string {
  return `${litres.toLocaleString()}L`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString();
}
