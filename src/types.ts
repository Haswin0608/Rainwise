export interface CalculatorInputs {
  roofLength: string;
  roofWidth: string;
  rainfall: string;
  efficiency: string;
  tankCapacity: string;
  dailyRequirement: string;
}

export interface CalculationResult {
  roofArea: number; // m²
  rainfall: number; // mm
  potentialWater: number; // L (Total Rain That Falls)
  harvestableWater: number; // L (Rain You Can Actually Collect)
  actuallyHarvested: number; // L (Water You Can Save)
  wastedWater: number; // L (Water Wasted / Losing)
  tankCapacity: number; // L (Your Tank Size)
  dailyRequirement?: number; // L (Daily water need)
  supplyDays?: number; // days (Days This Water Will Last)
  efficiency: number; // %
  storageUtilizationRate: number; // % of tank capacity used
  harvestEfficiencyRate: number; // % of harvestable saved
  summarySentence: string;
  suggestionLine: string;
}

export type PageView = 'home' | 'calculator' | 'results';

export interface FormErrors {
  roofLength?: string;
  roofWidth?: string;
  rainfall?: string;
  efficiency?: string;
  tankCapacity?: string;
  dailyRequirement?: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputs: CalculatorInputs;
}
