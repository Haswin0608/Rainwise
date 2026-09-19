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
  potentialWater: number; // L
  harvestableWater: number; // L
  actuallyHarvested: number; // L
  wastedWater: number; // L
  tankCapacity: number; // L
  dailyRequirement?: number; // L
  supplyDays?: number; // days
  efficiency: number; // %
  storageUtilizationRate: number; // % of tank capacity used
  harvestEfficiencyRate: number; // % of harvestable saved
  summarySentence: string;
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
