export interface RoofSection {
  id: string;
  name: string;
  length: string;
  width: string;
}

export interface CalculatorInputs {
  roofs: RoofSection[];
  rainfall: string;
  efficiency: string;
  tankCapacity: string;
  dailyRequirement: string;
}

export interface RoofAreaBreakdown {
  id: string;
  name: string;
  length: number;
  width: number;
  area: number;
}

export interface CalculationResult {
  roofs: RoofAreaBreakdown[];
  roofArea: number; // Combined total m²
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

export interface RoofError {
  length?: string;
  width?: string;
}

export interface FormErrors {
  roofs?: Record<string, RoofError>;
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
