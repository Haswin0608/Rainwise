export interface IndianCityData {
  id: string;
  name: string;
  state: string;
  annualRainfallMm: number;
  monthlyRainfallMm: number[]; // Jan through Dec
  description: string;
}

export const INDIAN_CITIES: IndianCityData[] = [
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    annualRainfallMm: 1400,
    // Northeast monsoon peak in Oct-Nov
    monthlyRainfallMm: [25, 10, 8, 15, 40, 55, 100, 140, 150, 310, 375, 172],
    description: 'Coastal climate with heavy Northeast monsoon rain in Oct-Nov.',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    annualRainfallMm: 2400,
    // Intense Southwest monsoon June-Sept
    monthlyRainfallMm: [1, 1, 1, 2, 15, 520, 850, 590, 340, 70, 8, 2],
    description: 'Heavy Southwest monsoon rains between June and September.',
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    annualRainfallMm: 800,
    // Monsoon peak July-August
    monthlyRainfallMm: [18, 20, 15, 12, 25, 75, 240, 250, 120, 15, 5, 5],
    description: 'Semi-arid climate with concentrated downpours in July & August.',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    annualRainfallMm: 970,
    // Steady showers May through October
    monthlyRainfallMm: [5, 7, 15, 45, 110, 90, 115, 145, 180, 175, 65, 18],
    description: 'Moderate climate with twin rainy peaks in May and Sept-Oct.',
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    annualRainfallMm: 1800,
    monthlyRainfallMm: [12, 25, 35, 60, 140, 300, 400, 380, 320, 110, 15, 3],
    description: 'Tropical wet-and-dry with generous monsoon showers.',
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    annualRainfallMm: 700,
    monthlyRainfallMm: [10, 10, 20, 50, 70, 40, 50, 45, 65, 170, 140, 30],
    description: 'Rain-shadow region with pleasant climate and Oct-Nov rainfall.',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    annualRainfallMm: 650,
    monthlyRainfallMm: [8, 10, 5, 5, 15, 65, 220, 230, 80, 10, 2, 0],
    description: 'Dry climate with brief monsoon downpours where saving water is crucial.',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    annualRainfallMm: 850,
    monthlyRainfallMm: [3, 6, 12, 22, 35, 120, 180, 210, 170, 80, 10, 2],
    description: 'Deccan plateau with monsoon rains mostly between June and September.',
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    annualRainfallMm: 750,
    monthlyRainfallMm: [1, 1, 3, 15, 35, 160, 230, 160, 110, 30, 5, 0],
    description: 'Moderate rainfall mostly arriving with the Southwest monsoon.',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    annualRainfallMm: 800,
    monthlyRainfallMm: [2, 1, 1, 2, 8, 95, 330, 250, 100, 10, 1, 0],
    description: 'Dry winters and hot summers, with nearly all rain in July and August.',
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    annualRainfallMm: 3100,
    monthlyRainfallMm: [20, 25, 45, 110, 320, 720, 650, 420, 320, 280, 160, 30],
    description: 'Very high rainfall with extended monsoon seasons.',
  },
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
