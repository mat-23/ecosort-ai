/**
 * Waste Categories and their properties
 */
export const WASTE_CATEGORIES = {
  PLASTIC: {
    name: 'Plastic',
    color: 'oklch(0.65 0.15 200)',
    bgColor: 'oklch(0.95 0.05 200)',
    icon: '🥤',
    rate: 250, 
    weight: 0.05,
    co2Offset: 1.5, // kg CO2 saved per unit
    sortingTip: 'Rinse bottles and remove plastic film/sleeves before recycling.',
    keywords: ['bottle', 'cup', 'container', 'plastic', 'packaging', 'wrap', 'bin', 'jug', 'tub', 'polyethylene', 'pvc', 'toy', 'bucket', 'spoon', 'fork', 'straw', 'lid', 'tray']
  },
  METAL: {
    name: 'Metal',
    color: 'oklch(0.6 0.12 180)',
    bgColor: 'oklch(0.92 0.04 180)',
    icon: '🥫',
    rate: 500,
    weight: 0.15,
    co2Offset: 2.1,
    sortingTip: 'Squeeze cans to save space, but leave labels on—they burn off in processing.',
    keywords: ['can', 'tin', 'aluminum', 'metal', 'foil', 'iron', 'steel', 'screw', 'pot', 'pan', 'alloy', 'wire', 'util', 'tool', 'brass', 'copper', 'key', 'coin', 'cap', 'lid']
  },
  PAPER: {
    name: 'Paper',
    color: 'oklch(0.65 0.1 120)',
    bgColor: 'oklch(0.95 0.04 120)',
    icon: '📄',
    rate: 50,
    weight: 0.1,
    co2Offset: 0.8,
    sortingTip: 'Keep paper dry! Wet paper fibers are shorter and harder to recycle.',
    keywords: ['paper', 'cardboard', 'box', 'newspaper', 'magazine', 'book', 'envelope', 'carton', 'flyer', 'folder', 'mail', 'sheet', 'craft', 'tissue', 'napkin', 'receipt', 'bag']
  },
  GLASS: {
    name: 'Glass',
    color: 'oklch(0.65 0.1 220)',
    bgColor: 'oklch(0.95 0.04 220)',
    icon: '🍷',
    rate: 100,
    weight: 0.3,
    co2Offset: 0.3,
    sortingTip: 'Remove metal caps. Glass is 100% recyclable, forever!',
    keywords: ['glass', 'bottle', 'jar', 'mirror', 'window', 'lens', 'goblet', 'flute', 'beaker', 'flask', 'vase']
  },
  ORGANIC: {
    name: 'Organic',
    color: 'oklch(0.55 0.15 140)',
    bgColor: 'oklch(0.92 0.05 140)',
    icon: '🍎',
    rate: 20,
    weight: 0.2,
    co2Offset: 0.5,
    sortingTip: 'Perfect for composting. Avoid adding dairy or meat scraps.',
    keywords: ['food', 'fruit', 'vegetable', 'peel', 'scraps', 'plant', 'leaf', 'flower', 'coffee', 'apple', 'banana', 'orange', 'bread', 'nut', 'seed', 'egg']
  },
  TRASH: {
    name: 'General Trash',
    color: 'oklch(0.5 0.05 150)',
    bgColor: 'oklch(0.9 0.02 150)',
    icon: '🗑️',
    rate: 0,
    weight: 0.1,
    co2Offset: 0.0,
    sortingTip: 'This item cannot be recycled currently. Dispose of responsibly.',
    keywords: []
  }
};

export type WasteCategory = keyof typeof WASTE_CATEGORIES;

/**
 * Maps technical AI labels to user-friendly commercial names
 */
const FRIENDLY_NAMES: Record<string, string> = {
  "pop bottle": "Soda / Soft Drink Bottle",
  "water bottle": "Water Bottle",
  "beer bottle": "Glass Bottle",
  "soda bottle": "Soda Bottle",
  "coffee mug": "Ceramic Mug",
  "ashcan": "Trash Bin",
  "tin can": "Metal Can",
  "aluminum foil": "Aluminum Foil",
  "plastic bag": "Plastic Bag",
  "water jug": "Water Gallon"
};

/**
 * Formats a technical name into a friendly one if available
 */
export function formatItemName(itemName: string): string {
  const lower = itemName.toLowerCase();
  for (const [tech, friendly] of Object.entries(FRIENDLY_NAMES)) {
    if (lower.includes(tech)) return friendly;
  }
  return itemName.charAt(0).toUpperCase() + itemName.slice(1);
}

/**
 * Categorizes an item based on its detected name
 */
export function categorizeItem(itemName: string): WasteCategory {
  const itemLower = itemName.toLowerCase();
  
  for (const [key, category] of Object.entries(WASTE_CATEGORIES)) {
    if (key === 'TRASH') continue;
    if (category.keywords.some(keyword => itemLower.includes(keyword))) {
      return key as WasteCategory;
    }
  }
  
  return 'TRASH';
}

/**
 * Calculates a reward value for an item based on its category
 */
export function calculateReward(category: WasteCategory): number {
  return WASTE_CATEGORIES[category].rate;
}
