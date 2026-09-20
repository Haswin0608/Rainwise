export type UnitSystem = 'metric' | 'imperial';

export interface UnitLabels {
  length: string;
  area: string;
  rainfall: string;
  volume: string;
  temperature: string;
}

export const METRIC_LABELS: UnitLabels = {
  length: 'm',
  area: 'm²',
  rainfall: 'mm',
  volume: 'L',
  temperature: '°C',
};

export const IMPERIAL_LABELS: UnitLabels = {
  length: 'ft',
  area: 'sq ft',
  rainfall: 'in',
  volume: 'gal',
  temperature: '°F',
};

export const CONVERSIONS = {
  METERS_TO_FEET: 3.28084,
  FEET_TO_METERS: 1 / 3.28084,
  MM_TO_INCHES: 0.0393701,
  INCHES_TO_MM: 25.4,
  LITERS_TO_GALLONS: 0.264172,
  GALLONS_TO_LITERS: 1 / 0.264172,
  SQM_TO_SQFT: 10.7639,
  SQFT_TO_SQM: 1 / 10.7639,
};

// Length conversions
export function metersToFeet(m: number): number {
  return m * CONVERSIONS.METERS_TO_FEET;
}

export function feetToMeters(ft: number): number {
  return ft * CONVERSIONS.FEET_TO_METERS;
}

// Rainfall conversions
export function mmToInches(mm: number): number {
  return mm * CONVERSIONS.MM_TO_INCHES;
}

export function inchesToMm(inches: number): number {
  return inches * CONVERSIONS.INCHES_TO_MM;
}

// Volume conversions
export function litersToGallons(l: number): number {
  return l * CONVERSIONS.LITERS_TO_GALLONS;
}

export function gallonsToLiters(gal: number): number {
  return gal * CONVERSIONS.GALLONS_TO_LITERS;
}

// Area conversions
export function sqMetersToSqFeet(sqm: number): number {
  return sqm * CONVERSIONS.SQM_TO_SQFT;
}

export function sqFeetToSqMeters(sqft: number): number {
  return sqft * CONVERSIONS.SQFT_TO_SQM;
}

// Temperature conversions
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

// Formatters
export function formatVolume(liters: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const gal = Math.round(litersToGallons(liters));
    return `${gal.toLocaleString()} gal`;
  }
  return `${Math.round(liters).toLocaleString()} L`;
}

export function formatVolumeFull(liters: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const gal = Math.round(litersToGallons(liters));
    return `${gal.toLocaleString()} gallons`;
  }
  return `${Math.round(liters).toLocaleString()} litres`;
}

export function formatRainfall(mm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const inches = mmToInches(mm);
    // If very small or fractional, show 1 or 2 decimals
    const rounded = inches >= 10 ? inches.toFixed(1) : inches.toFixed(2);
    return `${rounded} in`;
  }
  return `${Math.round(mm * 10) / 10} mm`;
}

export function formatArea(sqMeters: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const sqFt = Math.round(sqMeters * CONVERSIONS.SQM_TO_SQFT);
    return `${sqFt.toLocaleString()} sq ft`;
  }
  return `${Math.round(sqMeters * 10) / 10} m²`;
}

export function formatLength(meters: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const ft = Math.round(metersToFeet(meters) * 10) / 10;
    return `${ft} ft`;
  }
  return `${Math.round(meters * 10) / 10} m`;
}

export function formatTemp(celsius: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${Math.round(celsiusToFahrenheit(celsius))}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function getRelatableBucketComparison(liters: number, system: UnitSystem): { count: number; text: string } {
  if (system === 'imperial') {
    const gallons = litersToGallons(liters);
    const bucketGallons = 4; // standard 4-5 gal utility bucket
    const count = Math.max(1, Math.round(gallons / bucketGallons));
    return {
      count,
      text: `About ${count.toLocaleString()} buckets of water (~4 gal each)`,
    };
  }
  const bucketLiters = 15;
  const count = Math.max(1, Math.round(liters / bucketLiters));
  return {
    count,
    text: `About ${count.toLocaleString()} buckets of water (15L each)`,
  };
}

export function getRelatableBathtubComparison(liters: number, system: UnitSystem): { count: number; text: string } {
  if (system === 'imperial') {
    const gallons = litersToGallons(liters);
    const tubGallons = 50; // standard filled bathtub ~50 gal
    const count = Math.max(1, Math.round(gallons / tubGallons));
    return {
      count,
      text: `Fills about ${count.toLocaleString()} standard bathtubs (~50 gal each)`,
    };
  }
  const tubLiters = 200;
  const count = Math.max(1, Math.round(liters / tubLiters));
  return {
    count,
    text: `Fills about ${count.toLocaleString()} standard bathtubs (200L each)`,
  };
}

export function convertInputs(
  inputs: {
    roofs: Array<{ id: string; name: string; length: string; width: string }>;
    rainfall: string;
    efficiency: string;
    tankCapacity: string;
    dailyRequirement: string;
    weatherInfo?: any;
  },
  fromUnit: UnitSystem,
  toUnit: UnitSystem
) {
  if (fromUnit === toUnit) return inputs;

  const convertLength = (val: string) => {
    if (!val || !val.trim()) return '';
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return val;
    if (toUnit === 'imperial') {
      return (num * CONVERSIONS.METERS_TO_FEET).toFixed(1);
    } else {
      return (num * CONVERSIONS.FEET_TO_METERS).toFixed(1);
    }
  };

  const convertRain = (val: string) => {
    if (!val || !val.trim()) return '';
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return val;
    if (toUnit === 'imperial') {
      const inVal = num * CONVERSIONS.MM_TO_INCHES;
      return inVal >= 10 ? inVal.toFixed(1) : inVal.toFixed(2);
    } else {
      return Math.round(num * CONVERSIONS.INCHES_TO_MM).toString();
    }
  };

  const convertVol = (val: string) => {
    if (!val || !val.trim()) return '';
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return val;
    if (toUnit === 'imperial') {
      return Math.round(num * CONVERSIONS.LITERS_TO_GALLONS).toString();
    } else {
      return Math.round(num * CONVERSIONS.GALLONS_TO_LITERS).toString();
    }
  };

  return {
    ...inputs,
    roofs: (inputs.roofs || []).map((r) => ({
      ...r,
      length: convertLength(r.length),
      width: convertLength(r.width),
    })),
    rainfall: convertRain(inputs.rainfall),
    tankCapacity: convertVol(inputs.tankCapacity),
    dailyRequirement: convertVol(inputs.dailyRequirement),
  };
}

