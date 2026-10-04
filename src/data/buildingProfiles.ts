import { BuildingProfile, BuildingTypeKey, RecommendedSystemPart } from '../types';

/**
 * ══════════════════════════════════════════════════════════════════════
 * BUILDING PROFILES CONFIGURATION
 * ══════════════════════════════════════════════════════════════════════
 * Standard planning estimates for India (editable in Assumptions).
 * Check local building bylaws and a qualified engineer before construction.
 */
export const BUILDING_PROFILES: Record<BuildingTypeKey, BuildingProfile> = {
  house: {
    key: 'house',
    name: 'Individual House',
    icon: '🏠',
    shortDesc: 'Independent villa, row house, or farm home',
    occupancyQuestion: 'How many people live in this house?',
    occupancyPrimaryLabel: 'Number of residents',
    occupancyPrimaryUnit: 'people',
    occupancyPrimaryDefault: 4,
    dailyNonDrinkingUsePerPerson: 40, // 40 L/person/day (flushing, cleaning, garden)
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 7, ideal: 15 },
    usageBreakdown: [
      { task: 'Toilet Flushing', sharePercent: 40, icon: '🚽', description: 'Dual flush cisterns' },
      { task: 'Garden & Plants', sharePercent: 35, icon: '🌱', description: 'Lawn and vegetable patch' },
      { task: 'Floor & Outdoor Cleaning', sharePercent: 25, icon: '🧹', description: 'Porch and yard wash' },
    ],
    focusAreas: ['Garden watering', 'Outdoor cleaning', 'Toilet flushing'],
    priorityTips: [
      'Install a first-flush diverter to dump dust from the dry season before filling your tank.',
      'Route overflow pipes directly into a vegetable bed or a simple gravel soakaway pit.',
      'Clean rooftop surfaces and gutters once before the pre-monsoon showers begin.',
    ],
  },

  apartment: {
    key: 'apartment',
    name: 'Apartment Complex',
    icon: '🏘️',
    shortDesc: 'Residential flats, gated society, or residential tower',
    occupancyQuestion: 'How many flats and residents are in this complex?',
    occupancyPrimaryLabel: 'Total number of residents',
    occupancyPrimaryUnit: 'residents',
    occupancyPrimaryDefault: 60,
    hasSecondaryInput: true,
    secondaryLabel: 'Number of flats / units',
    secondaryUnit: 'flats',
    secondaryDefault: 15,
    secondaryHelper: 'Used to size common manifold and parking wash points',
    dailyNonDrinkingUsePerPerson: 40,
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 10, ideal: 15 },
    usageBreakdown: [
      { task: 'Common Area Flushing', sharePercent: 45, icon: '🚽', description: 'Piped through dual-line plumbing' },
      { task: 'Car & Vehicle Washing', sharePercent: 25, icon: '🚗', description: 'Basement and parking wash taps' },
      { task: 'Society Landscaping', sharePercent: 20, icon: '🌳', description: 'Lawns, trees, and perimeter green' },
      { task: 'Common Floor Mopping', sharePercent: 10, icon: '🧹', description: 'Lobbies and stairwells' },
    ],
    focusAreas: ['Toilet flushing', 'Car washing', 'Landscaping', 'Common areas'],
    priorityTips: [
      'Install dual-line plumbing during construction so harvested rainwater reaches all toilet cisterns.',
      'Place a central underground sump with a level controller pumping up to an overhead non-potable tank.',
      'Build a percolation recharge well so surplus monsoon rain replenishes your borewell aquifer.',
    ],
  },

  office: {
    key: 'office',
    name: 'Office Building',
    icon: '🏢',
    shortDesc: 'Corporate office, tech park, or commercial workplace',
    occupancyQuestion: 'How many employees work in this office?',
    occupancyPrimaryLabel: 'Number of employees',
    occupancyPrimaryUnit: 'employees',
    occupancyPrimaryDefault: 50,
    dailyNonDrinkingUsePerPerson: 25, // 25 L/person/day
    workingDaysPerWeek: 6, // 5 or 6 days
    storageMultiplierDays: { min: 10, ideal: 12 },
    usageBreakdown: [
      { task: 'Restroom Flushing', sharePercent: 55, icon: '🚽', description: 'Sensored dual flush urinals and commodes' },
      { task: 'Campus Landscaping', sharePercent: 25, icon: '🌿', description: 'Outdoor green patches and planters' },
      { task: 'AC Cooling Tower Top-up', sharePercent: 20, icon: '❄️', description: 'Soft rainwater reduces chiller scaling' },
    ],
    focusAreas: ['Toilet flushing', 'Cleaning', 'Landscaping', 'Cooling-tower top-up'],
    priorityTips: [
      'Soft rainwater is ideal for cooling tower make-up because it contains very little dissolved minerals.',
      'Put water meters on rainwater lines to track ESG and green-building water conservation credits.',
      'Program automatic sprinkler cycles for lawns in early mornings to minimize evaporation loss.',
    ],
  },

  school: {
    key: 'school',
    name: 'School / College',
    icon: '🏫',
    shortDesc: 'Primary, secondary, higher secondary school, or college campus',
    occupancyQuestion: 'How many students and staff are on campus?',
    occupancyPrimaryLabel: 'Total students + staff',
    occupancyPrimaryUnit: 'people',
    occupancyPrimaryDefault: 400,
    dailyNonDrinkingUsePerPerson: 20, // 20 L/person/day
    workingDaysPerWeek: 6,
    storageMultiplierDays: { min: 10, ideal: 15 },
    usageBreakdown: [
      { task: 'Restroom Flushing', sharePercent: 50, icon: '🚽', description: 'Student & staff restrooms' },
      { task: 'Playground & Garden', sharePercent: 30, icon: '🌱', description: 'Sports ground borders and trees' },
      { task: 'Classroom & Corridor Mopping', sharePercent: 20, icon: '🧹', description: 'Daily hygiene and floor cleaning' },
    ],
    focusAreas: ['Toilet flushing', 'Gardening', 'Corridor cleaning', 'Rain garden & demo'],
    priorityTips: [
      'Create an educational "Rain Garden" where overflow feeds native trees and students see the water cycle in action.',
      'Use transparent observation pipes at the filter chamber so science classes can observe sediment separation.',
      'Install gravity-fed taps near grounds so pumps are not required during power cuts.',
    ],
  },

  hospital: {
    key: 'hospital',
    name: 'Hospital / Clinic',
    icon: '🏥',
    shortDesc: 'Hospital, nursing home, clinic, or healthcare centre',
    occupancyQuestion: 'How many hospital beds and staff operate here?',
    occupancyPrimaryLabel: 'Number of beds',
    occupancyPrimaryUnit: 'beds',
    occupancyPrimaryDefault: 30,
    hasSecondaryInput: true,
    secondaryLabel: 'Doctors, nurses & support staff',
    secondaryUnit: 'staff',
    secondaryDefault: 20,
    secondaryHelper: 'Staff calculate at 20 L/day, inpatient beds at 100 L/day non-drinking',
    dailyNonDrinkingUsePerPerson: 100, // 100 L/bed/day + 20 L/staff/day
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 10, ideal: 12 },
    usageBreakdown: [
      { task: 'Laundry Pre-Wash', sharePercent: 40, icon: '🧺', description: 'Linen and uniform pre-rinse cycles' },
      { task: 'Sanitation Flushing', sharePercent: 35, icon: '🚽', description: 'Visitor and non-sterile ward toilets' },
      { task: 'Premises Disinfection & Mopping', sharePercent: 25, icon: '🧼', description: 'Outdoor driveways and general corridors' },
    ],
    focusAreas: ['Laundry pre-wash', 'Cleaning', 'Gardening', 'Flushing'],
    safetyNote: '⚠️ STRICT SAFETY RULE: Rainwater must NEVER be used for patient care, OT, clinical washing, or drinking without verified medical-grade treatment.',
    priorityTips: [
      'Color-code all rainwater distribution pipes in distinctive purple to eliminate accidental cross-connections with drinking water lines.',
      'Multi-stage filtration (sand + activated carbon + 5-micron sediment) ensures no staining on laundry linens.',
      'Equip storage sumps with automatic municipal/tanker motorized switchovers for emergency continuity.',
    ],
  },

  hotel: {
    key: 'hotel',
    name: 'Hotel / Resort',
    icon: '🏨',
    shortDesc: 'Hotel, lodge, guest house, or resort',
    occupancyQuestion: 'How many guest rooms does this hotel have?',
    occupancyPrimaryLabel: 'Number of guest rooms',
    occupancyPrimaryUnit: 'rooms',
    occupancyPrimaryDefault: 25,
    hasSecondaryInput: true,
    secondaryLabel: 'Average guests per room',
    secondaryUnit: 'guests/room',
    secondaryDefault: 2,
    secondaryHelper: 'Default is 2 guests per room (60 L/guest/day non-drinking)',
    dailyNonDrinkingUsePerPerson: 60, // 60 L/guest/day
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 10, ideal: 14 },
    usageBreakdown: [
      { task: 'Guest Toilet Flushing', sharePercent: 40, icon: '🚽', description: 'Dual flush in guest bathrooms' },
      { task: 'Hotel Laundry Services', sharePercent: 30, icon: '🧺', description: 'Towel and bed linen washing' },
      { task: 'Resort Lawns & Pool Top-up', sharePercent: 30, icon: '🏊', description: 'Landscaping and water body top-up' },
    ],
    focusAreas: ['Toilet flushing', 'Laundry (treated)', 'Gardening', 'Pool top-up'],
    priorityTips: [
      'Highlight your green credentials with subtle guest-room notices explaining that toilets use harvested rainwater.',
      'Soft rainwater drastically reduces commercial detergent consumption in industrial laundry machines.',
      'Filter and disinfect rainwater before adding to swimming pool or landscape water bodies.',
    ],
  },

  commercial: {
    key: 'commercial',
    name: 'Shopping / Commercial Complex',
    icon: '🛍️',
    shortDesc: 'Shopping mall, retail showroom, supermarket, or market complex',
    occupancyQuestion: 'What is your daily footfall and staff count?',
    occupancyPrimaryLabel: 'Expected visitors per day',
    occupancyPrimaryUnit: 'visitors/day',
    occupancyPrimaryDefault: 300,
    hasSecondaryInput: true,
    secondaryLabel: 'Number of store & maintenance staff',
    secondaryUnit: 'staff',
    secondaryDefault: 25,
    secondaryHelper: 'Visitors calculate at 10 L/day, permanent staff at 25 L/day',
    dailyNonDrinkingUsePerPerson: 10, // 10 L/visitor/day + 25 L/staff/day
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 10, ideal: 14 },
    usageBreakdown: [
      { task: 'Public Restroom Flushing', sharePercent: 60, icon: '🚽', description: 'High-traffic mall and store toilets' },
      { task: 'Atrium & Floor Scrubbing', sharePercent: 25, icon: '🧹', description: 'Nightly automated floor scrubbing' },
      { task: 'HVAC Condenser Misting', sharePercent: 15, icon: '❄️', description: 'Pre-cooling air conditioner intake air' },
    ],
    focusAreas: ['Public flushing', 'Floor scrubbing', 'Landscaping', 'AC cooling top-up'],
    priorityTips: [
      'Heavy footfall makes public restroom flushing the largest non-potable demand; dual flush valves pay back fast.',
      'Use high-volume underground sumps located beneath delivery bays or vehicle parking areas.',
      'Install display screens in the main lobby showing live rainwater litres saved to build brand goodwill.',
    ],
  },

  factory: {
    key: 'factory',
    name: 'Factory / Industrial Shed',
    icon: '🏭',
    shortDesc: 'Manufacturing unit, warehouse, food processing, or industrial shed',
    occupancyQuestion: 'How many workers work here, and is process water needed?',
    occupancyPrimaryLabel: 'Number of workers',
    occupancyPrimaryUnit: 'workers',
    occupancyPrimaryDefault: 60,
    hasSecondaryInput: true,
    secondaryLabel: 'Extra non-drinking process water needed',
    secondaryUnit: 'L/day',
    secondaryDefault: 500,
    secondaryHelper: 'Optional non-potable process water for cooling, washing, or boilers',
    dailyNonDrinkingUsePerPerson: 30, // 30 L/worker/day
    workingDaysPerWeek: 6,
    storageMultiplierDays: { min: 15, ideal: 20 },
    usageBreakdown: [
      { task: 'Industrial Process & Cooling', sharePercent: 45, icon: '⚙️', description: 'Machinery cooling and non-potable processing' },
      { task: 'Worker Toilets & Sanitation', sharePercent: 35, icon: '🚽', description: 'Factory shift restrooms' },
      { task: 'Shop Floor & Truck Wash', sharePercent: 20, icon: '🚚', description: 'Vehicle wash and floor cleaning' },
    ],
    focusAreas: ['Cleaning', 'Machinery cooling', 'Landscaping', 'Non-potable process uses'],
    priorityTips: [
      'Factory roofs are huge! Industrial metal roofs capture 90% of rain with almost zero absorption loss.',
      'A self-cleaning vortex filter handles heavy dust loads from manufacturing yards before water enters tanks.',
      'Pair tanks with a network of groundwater recharge trenches to eliminate monsoon site-flooding.',
    ],
  },

  public: {
    key: 'public',
    name: 'Public / Community Building',
    icon: '🌳',
    shortDesc: 'Community hall, temple/mosque/church, panchayat building, or public library',
    occupancyQuestion: 'How many daily visitors use this community building?',
    occupancyPrimaryLabel: 'Expected visitors per day',
    occupancyPrimaryUnit: 'visitors/day',
    occupancyPrimaryDefault: 150,
    dailyNonDrinkingUsePerPerson: 10, // 10 L/visitor/day
    workingDaysPerWeek: 7,
    storageMultiplierDays: { min: 10, ideal: 14 },
    usageBreakdown: [
      { task: 'Community Gardening', sharePercent: 45, icon: '🌱', description: 'Public parks, flowers, and shade trees' },
      { task: 'Public Sanitation Flushing', sharePercent: 35, icon: '🚽', description: 'Free public and community toilets' },
      { task: 'Compound Cleaning', sharePercent: 20, icon: '🧹', description: 'Prayer hall courtyards and pathways' },
    ],
    focusAreas: ['Gardening', 'Flushing', 'Community recharge pit'],
    priorityTips: [
      'Every community building should have an open recharge well to replenish the surrounding village or ward water table.',
      'Install vandal-resistant brass taps and enclosed storage tanks with secure child-safe manhole lids.',
      'Display community maintenance guidelines in local language near the rainwater filter.',
    ],
  },
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * RECOMMENDED SYSTEM PARTS (Tailored by Building Type)
 * ══════════════════════════════════════════════════════════════════════
 */
export const BASE_SYSTEM_PARTS: Array<{
  id: string;
  icon: string;
  name: string;
  explanation: string;
  specialFor?: BuildingTypeKey[];
}> = [
  {
    id: 'catchment',
    icon: '🏠',
    name: 'Roof Catchment & Rainwater Gutters',
    explanation: 'Clean, sloped channels along eaves that collect pure rainwater without pooling.',
  },
  {
    id: 'downpipes',
    icon: '🚰',
    name: 'Downpipes',
    explanation: 'UV-stabilized vertical drainpipes sized to carry peak torrential rainfall safely down.',
  },
  {
    id: 'leaf_screen',
    icon: '🍂',
    name: 'Leaf Screen / Gutter Mesh',
    explanation: 'Stainless-steel wire mesh at gutter outlets preventing dry leaves and birds from entering.',
  },
  {
    id: 'first_flush',
    icon: '💧',
    name: 'First-Flush Diverter',
    explanation: 'Automatically discards the first 1-2 mm of rain which carries rooftop atmospheric dust.',
  },
  {
    id: 'filter',
    icon: '🧪',
    name: 'Sediment & Sand-Carbon Filter',
    explanation: 'Multi-layer mesh or sand filter removing fine suspended silt and roof debris.',
  },
  {
    id: 'storage_tank',
    icon: '🛢️',
    name: 'Clean Storage Tank',
    explanation: 'Food-grade UV-resistant polyethylene or masonry tank with light-tight lid to stop algae.',
  },
  {
    id: 'overflow_pipe',
    icon: '🌊',
    name: 'Overflow Pipe to Recharge Pit or Drain',
    explanation: 'High-level outlet pipe redirecting excess water when the tank reaches 100% capacity.',
  },
  {
    id: 'recharge_pit',
    icon: '🕳️',
    name: 'Groundwater Recharge Pit',
    explanation: 'Percolation pit with gravel, sand, and filter casing to replenish neighbourhood groundwater.',
  },
  {
    id: 'rain_garden',
    icon: '🌿',
    name: 'Rain Garden & Educational Demo (Schools / Public)',
    explanation: 'Shallow vegetated basin where surplus rain nourishes native plants while demonstrating water cycles.',
    specialFor: ['school', 'public'],
  },
  {
    id: 'dual_plumbing',
    icon: '🏢',
    name: 'Dual-Line Plumbing Manifold (Apartments / Offices)',
    explanation: 'Dedicated non-potable distribution line feeding all toilet cisterns and landscape taps.',
    specialFor: ['apartment', 'office', 'commercial'],
  },
  {
    id: 'industrial_filtration',
    icon: '🔬',
    name: 'Industrial Micro-Filtration & Purple Safety Pipes (Hospitals / Factories)',
    explanation: 'High-throughput cartridge filtration and color-coded safety lines to eliminate cross-contamination.',
    specialFor: ['hospital', 'factory', 'hotel'],
  },
];

/**
 * ══════════════════════════════════════════════════════════════════════
 * LOCALIZED STRINGS DICTIONARY
 * ══════════════════════════════════════════════════════════════════════
 * Centralized so Tamil, Hindi, or Kannada translations can be plugged in easily.
 */
export const PLANNER_STRINGS = {
  tagline: 'Before you build, let RainWise design your rainwater system.',
  step1Title: 'What is this building going to be used for?',
  step1Subtitle: 'Pick a category so RainWise can estimate daily non-drinking water needs and storage sizing.',
  step2Title: 'How many people will use it?',
  step3Title: 'How big is the roof?',
  step3Subtitle: 'Your roof area determines how many thousands of litres you can capture every year.',
  step4Title: 'Where is it located?',
  step4Subtitle: 'RainWise loads accurate 7-day live weather and 3-year rainfall history for your exact location.',
  step5Title: 'Do you already have a storage tank in mind?',
  step5Subtitle: 'If you already own a tank, enter its size. Otherwise, click "Suggest one for me".',
  statusNew: '🆕 New building',
  statusExisting: '🏗️ Existing building',
  createPlanBtn: 'Create my RainWise Plan',
  suggestTankBtn: 'Not sure, suggest one for me',
  roofHelper: 'Not sure? Enter the length and width of your roof and we will calculate it.',
  statutoryDisclaimer: 'Rules for rainwater harvesting differ across states and municipalities in India. Check your local civic bylaws and consult a qualified engineer before construction.',
};
