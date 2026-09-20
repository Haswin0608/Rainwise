export interface RainwaterTip {
  id: string;
  icon: string;
  title: string;
  text: string;
  category: 'cleaning' | 'filtration' | 'storage' | 'maintenance' | 'usage';
  triggerCondition?: 'wasted' | 'saved' | 'general';
}

export const RAINWATER_TIPS: RainwaterTip[] = [
  {
    id: 'clean-roof',
    icon: '🧹',
    title: 'Clean Your Roof Early',
    text: 'Clean your roof before the rainy season — leaves and dust can block collection pipes.',
    category: 'cleaning',
    triggerCondition: 'general',
  },
  {
    id: 'mesh-filter',
    icon: '🪣',
    title: 'Keep Water Clean',
    text: 'A simple mesh filter at the tank inlet keeps leaves, twigs, and debris out of your water.',
    category: 'filtration',
    triggerCondition: 'saved',
  },
  {
    id: 'second-tank',
    icon: '🛢️',
    title: 'Consider a Second Tank',
    text: 'If your tank overflows often, consider adding a second tank or a larger one to capture more rain.',
    category: 'storage',
    triggerCondition: 'wasted',
  },
  {
    id: 'redirect-overflow',
    icon: '🌱',
    title: 'Redirect Overflow Water',
    text: 'Overflow water can be redirected to water plants or recharge groundwater instead of going to waste.',
    category: 'usage',
    triggerCondition: 'wasted',
  },
  {
    id: 'check-gutters',
    icon: '🔧',
    title: 'Inspect Gutters & Pipes',
    text: 'Check your gutters and pipes regularly for leaks, sags, or blockages before a big storm.',
    category: 'maintenance',
    triggerCondition: 'general',
  },
  {
    id: 'first-flush',
    icon: '☀️',
    title: 'First-Rain Flush',
    text: 'First rain after a dry spell often washes dust off the roof — consider letting the first few minutes drain away before collecting.',
    category: 'filtration',
    triggerCondition: 'saved',
  },
  {
    id: 'track-rainfall',
    icon: '📅',
    title: 'Track Seasonal Rainfall',
    text: "Track rainfall over a few months to know your area's pattern and plan your tank size better.",
    category: 'maintenance',
    triggerCondition: 'general',
  },
];

export function getContextualTip(wastedWater: number, actuallyHarvested: number): RainwaterTip {
  if (wastedWater > 0) {
    // If water was wasted because tank filled up
    return RAINWATER_TIPS[2]; // "Consider a second tank"
  }
  if (actuallyHarvested > 0) {
    return RAINWATER_TIPS[1]; // "A simple mesh filter at the tank inlet"
  }
  return RAINWATER_TIPS[6]; // "Track rainfall over a few months"
}
