import type { Category } from '@/types';

/**
 * Guesses a category from an ingredient name in English, French or Arabic.
 * Earlier entries win, so "garlic powder" resolves to spices before "garlic"
 * resolves to produce.
 */
const KEYWORDS: Array<[Category, string[]]> = [
  [
    'dairy',
    ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta', 'kefir',
      'lait', 'fromage', 'yaourt', 'beurre', 'crème', 'creme', 'œuf', 'oeuf',
      'حليب', 'جبن', 'زبادي', 'لبن', 'زبدة', 'كريمة', 'قشطة', 'بيض'],
  ],
  [
    'meat',
    ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'steak', 'mince', 'ground', 'duck', 'salami', 'chorizo',
      'poulet', 'bœuf', 'boeuf', 'porc', 'dinde', 'agneau', 'lardon', 'saucisse', 'jambon', 'viande', 'merguez', 'canard',
      'دجاج', 'لحم', 'بقر', 'ضأن', 'خروف', 'ديك رومي', 'سجق', 'مرقاز', 'بط', 'كفتة'],
  ],
  [
    'seafood',
    ['salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'fish', 'crab', 'mussel', 'clam', 'squid', 'anchov', 'sardine', 'tilapia',
      'saumon', 'thon', 'crevette', 'cabillaud', 'poisson', 'crabe', 'moule', 'calamar', 'anchois', 'daurade', 'loup',
      'سلمون', 'تونة', 'روبيان', 'جمبري', 'قريدس', 'سمك', 'سردين', 'حبار', 'سلطعون', 'بلح البحر', 'أنشوجة'],
  ],
  [
    'grains',
    ['rice', 'pasta', 'spaghetti', 'penne', 'noodle', 'bread', 'flour', 'oat', 'quinoa', 'couscous', 'tortilla', 'bagel', 'barley', 'bulgur', 'cereal',
      'riz', 'pâtes', 'pates', 'nouille', 'pain', 'farine', 'avoine', 'semoule', 'orge', 'boulgour', 'céréale', 'cereale', 'baguette',
      'أرز', 'رز', 'معكرونة', 'مكرونة', 'سباغيتي', 'نودلز', 'خبز', 'طحين', 'دقيق', 'شوفان', 'كسكسي', 'كسكس', 'برغل', 'شعير', 'سميد'],
  ],
  [
    'spices',
    ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary', 'cinnamon', 'turmeric', 'curry', 'chili', 'chilli', 'garlic powder', 'parsley', 'cilantro', 'coriander', 'dill', 'mint', 'ginger', 'nutmeg', 'bay leaf', 'harissa',
      'sel', 'poivre', 'origan', 'basilic', 'thym', 'romarin', 'cannelle', 'curcuma', 'piment', 'persil', 'coriandre', 'aneth', 'menthe', 'gingembre', 'muscade', 'laurier', 'épice', 'epice', 'ras el hanout', 'tabel',
      'ملح', 'فلفل أسود', 'كمون', 'بابريكا', 'أوريغانو', 'ريحان', 'زعتر', 'قرفة', 'كركم', 'كاري', 'بقدونس', 'كزبرة', 'شبت', 'نعناع', 'زنجبيل', 'جوزة الطيب', 'ورق غار', 'هريسة', 'تابل', 'بهارات', 'توابل'],
  ],
  ['frozen', ['frozen', 'ice cream', 'surgelé', 'surgele', 'congelé', 'congele', 'glace', 'مجمد', 'مثلج', 'آيس كريم']],
  [
    'beverages',
    ['juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'water', 'kombucha', 'lemonade',
      'jus', 'café', 'cafe', 'thé', 'the ', 'eau', 'limonade', 'boisson',
      'عصير', 'قهوة', 'شاي', 'ماء', 'مشروب', 'غازي', 'ليموناضة'],
  ],
  [
    'pantry',
    ['oil', 'vinegar', 'soy sauce', 'sugar', 'honey', 'beans', 'lentil', 'chickpea', 'tomato paste', 'canned', 'stock', 'broth', 'peanut butter', 'jam', 'mustard', 'ketchup', 'mayo', 'coconut milk', 'nuts', 'almond', 'walnut', 'tahini', 'miso', 'sriracha',
      'huile', 'vinaigre', 'sauce soja', 'sucre', 'miel', 'haricot', 'lentille', 'pois chiche', 'concentré', 'concentre', 'conserve', 'bouillon', 'confiture', 'moutarde', 'mayonnaise', 'noix', 'amande', 'olive',
      'زيت', 'خل', 'صلصة صويا', 'سكر', 'عسل', 'فاصوليا', 'فاصولياء', 'لوبيا', 'عدس', 'حمص', 'معجون طماطم', 'معلب', 'مرق', 'مربى', 'خردل', 'كاتشب', 'مايونيز', 'مكسرات', 'لوز', 'جوز', 'طحينة', 'زيتون', 'تونة معلبة'],
  ],
  [
    'produce',
    ['tomato', 'onion', 'garlic', 'potato', 'carrot', 'lettuce', 'spinach', 'kale', 'apple', 'banana', 'lemon', 'lime', 'orange', 'pepper', 'cucumber', 'zucchini', 'courgette', 'broccoli', 'cauliflower', 'mushroom', 'avocado', 'berry', 'berries', 'grape', 'mango', 'pear', 'peach', 'celery', 'cabbage', 'leek', 'corn', 'pea', 'bean', 'eggplant', 'aubergine', 'squash', 'pumpkin', 'herb', 'scallion', 'spring onion', 'chive', 'radish', 'beet', 'sweet potato', 'ginger', 'chili', 'fig', 'date',
      'tomate', 'oignon', 'ail', 'pomme de terre', 'patate', 'carotte', 'laitue', 'salade', 'épinard', 'epinard', 'pomme', 'banane', 'citron', 'poivron', 'concombre', 'brocoli', 'chou', 'champignon', 'avocat', 'fraise', 'framboise', 'raisin', 'mangue', 'poire', 'pêche', 'peche', 'céleri', 'celeri', 'poireau', 'maïs', 'mais', 'petits pois', 'aubergine', 'courge', 'citrouille', 'radis', 'betterave', 'figue', 'datte', 'navet', 'fenouil', 'artichaut',
      'طماطم', 'بندورة', 'بصل', 'ثوم', 'بطاطا', 'بطاطس', 'جزر', 'خس', 'سبانخ', 'تفاح', 'موز', 'ليمون', 'برتقال', 'فلفل', 'خيار', 'كوسة', 'بروكلي', 'قرنبيط', 'فطر', 'أفوكادو', 'فراولة', 'عنب', 'مانجو', 'كمثرى', 'إجاص', 'خوخ', 'كرفس', 'ملفوف', 'كرنب', 'كراث', 'ذرة', 'بازلاء', 'باذنجان', 'قرع', 'يقطين', 'فجل', 'شمندر', 'بطاطا حلوة', 'تين', 'تمر', 'لفت', 'خرشوف', 'بامية', 'خضار', 'خضروات'],
  ],
];

export function categorize(name: string): Category {
  const haystack = name.trim().toLowerCase();
  if (!haystack) return 'other';
  for (const [category, words] of KEYWORDS) {
    if (words.some((word) => haystack.includes(word))) return category;
  }
  return 'other';
}
