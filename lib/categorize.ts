import type { Category } from '@/types';

const KEYWORDS: Array<[Category, string[]]> = [
  [
    'dairy',
    ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta', 'kefir'],
  ],
  [
    'meat',
    ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'steak', 'mince', 'ground', 'duck', 'salami', 'chorizo'],
  ],
  ['seafood', ['salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'fish', 'crab', 'mussel', 'clam', 'squid', 'anchov', 'sardine', 'tilapia']],
  [
    'grains',
    ['rice', 'pasta', 'spaghetti', 'penne', 'noodle', 'bread', 'flour', 'oat', 'quinoa', 'couscous', 'tortilla', 'bagel', 'barley', 'bulgur', 'cereal'],
  ],
  [
    'spices',
    ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary', 'cinnamon', 'turmeric', 'curry', 'chili', 'chilli', 'garlic powder', 'parsley', 'cilantro', 'coriander', 'dill', 'mint', 'ginger', 'nutmeg', 'bay leaf'],
  ],
  ['frozen', ['frozen', 'ice cream', 'peas (frozen)']],
  ['beverages', ['juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'water', 'kombucha', 'lemonade']],
  [
    'pantry',
    ['oil', 'vinegar', 'soy sauce', 'sugar', 'honey', 'beans', 'lentil', 'chickpea', 'tomato paste', 'canned', 'stock', 'broth', 'peanut butter', 'jam', 'mustard', 'ketchup', 'mayo', 'coconut milk', 'nuts', 'almond', 'walnut', 'tahini', 'miso', 'sriracha'],
  ],
  [
    'produce',
    ['tomato', 'onion', 'garlic', 'potato', 'carrot', 'lettuce', 'spinach', 'kale', 'apple', 'banana', 'lemon', 'lime', 'orange', 'pepper', 'cucumber', 'zucchini', 'courgette', 'broccoli', 'cauliflower', 'mushroom', 'avocado', 'berry', 'berries', 'grape', 'mango', 'pear', 'peach', 'celery', 'cabbage', 'leek', 'corn', 'pea', 'bean', 'eggplant', 'aubergine', 'squash', 'pumpkin', 'herb', 'scallion', 'spring onion', 'chive', 'radish', 'beet', 'sweet potato', 'ginger', 'chili'],
  ],
];

/**
 * Guesses a category from an ingredient name. Earlier entries win, so
 * "garlic powder" resolves to spices before "garlic" resolves to produce.
 */
export function categorize(name: string): Category {
  const haystack = name.trim().toLowerCase();
  if (!haystack) return 'other';
  for (const [category, words] of KEYWORDS) {
    if (words.some((word) => haystack.includes(word))) return category;
  }
  return 'other';
}
