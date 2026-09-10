/**
 * Localised content for the offline generators (chef templates, simulated
 * dish scans, receipts and photo scans). Kept separate from lib/i18n.ts
 * because these are structured records rather than flat UI strings.
 */
import type { Cuisine } from '@/types';

export type ContentLocale = 'en' | 'fr' | 'ar';

/** Replaces %{name} placeholders. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/%\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

/* ------------------------------------------------------------------------ */
/*                              Offline chef                                */
/* ------------------------------------------------------------------------ */

export interface ChefStrings {
  and: string;
  quick: string;
  cuisinePrefix: string;
  cuisineDescription: string;
  cuisineFirstStep: string;
  cuisineFinish: string;
  fallback: { veg: string; crunchy: string; leftover: string; rice: string; quinoa: string };
  ing: Record<
    | 'oliveOil' | 'garlic' | 'saltPepper' | 'lemon' | 'salt' | 'milk' | 'water' | 'butter' | 'onion'
    | 'stock' | 'driedHerbs' | 'chickpeas' | 'lentils' | 'tofu' | 'whiteBeans' | 'mushrooms' | 'rice' | 'quinoa',
    string
  >;
  amount: Record<'toTaste' | 'servings2' | 'cloves2' | 'cup1' | 'tbsp1' | 'tbsp2' | 'tbsp3' | 'tsp1' | 'can1' | 'l1' | 'one' | 'six' | 'forWater', string>;
  skillet: { title: string; description: string; steps: string[] };
  bowl: { title: string; description: string; withDairy: string; steps: string[] };
  frittata: { title: string; description: string; steps: string[] };
  soup: { title: string; description: string; steps: string[] };
  cuisines: Record<Exclude<Cuisine, 'any'>, { label: string; spice: string; finish: string }>;
}

const chefEn: ChefStrings = {
  and: ' and ',
  quick: 'Quick %{title}',
  cuisinePrefix: '%{label} %{title}',
  cuisineDescription: '%{description} Seasoned with %{spice}.',
  cuisineFirstStep: '%{step} Add %{spice}.',
  cuisineFinish: 'Finish with %{finish}.',
  fallback: { veg: 'whatever vegetables you have', crunchy: 'crunchy vegetables', leftover: 'leftover vegetables', rice: 'rice', quinoa: 'quinoa' },
  ing: {
    oliveOil: 'Olive oil', garlic: 'Garlic', saltPepper: 'Salt and pepper', lemon: 'Lemon', salt: 'Salt', milk: 'Milk', water: 'Water',
    butter: 'Butter', onion: 'Onion', stock: 'Vegetable stock', driedHerbs: 'Dried herbs', chickpeas: 'Chickpeas', lentils: 'Lentils',
    tofu: 'Tofu', whiteBeans: 'White beans', mushrooms: 'Mushrooms', rice: 'Rice', quinoa: 'Quinoa',
  },
  amount: { toTaste: 'to taste', servings2: '2 servings', cloves2: '2 cloves', cup1: '1 cup', tbsp1: '1 tbsp', tbsp2: '2 tbsp', tbsp3: '3 tbsp', tsp1: '1 tsp', can1: '1 can', l1: '1 l', one: '1', six: '6', forWater: 'for the water' },
  skillet: {
    title: 'One-pan %{protein} with %{veg}',
    description: 'A weeknight skillet that browns the %{protein} first, then finishes the vegetables in the same pan so nothing goes to waste.',
    steps: [
      'Pat the %{protein} dry and season generously with salt%{spice}.',
      'Heat the olive oil in a large pan over medium-high heat until it shimmers.',
      'Sear the %{protein} without moving it so it browns properly.',
      'Flip, add the garlic and %{veg}, and cook until the vegetables are just tender.',
      'Reduce the heat, cover, and let everything finish cooking through.',
      'Taste, adjust the seasoning, and serve straight from the pan.',
    ],
  },
  bowl: {
    title: '%{base} bowl with %{veg}',
    description: 'Fluffy %{base} topped with %{veg}%{dairy}, finished with a bright lemony dressing.',
    withDairy: ' and a spoon of %{dairy}',
    steps: [
      'Rinse the %{base} and cook it according to the package instructions.',
      'While it cooks, chop the %{veg} into bite-sized pieces.',
      'Whisk the lemon juice with olive oil and a pinch of salt to make a dressing.',
      'Fluff the %{base} and divide it between two bowls.',
      'Pile the vegetables on top%{dairyStep}, and drizzle with the dressing.',
    ],
  },
  frittata: {
    title: 'Everything frittata with %{veg}',
    description: 'The best way to clear the fridge: eggs bind %{veg} into a golden frittata you can eat warm or cold.',
    steps: [
      'Preheat the grill or oven to 200°C (390°F).',
      'Whisk the eggs with the liquid, salt, and pepper.',
      'Warm the fat in an ovenproof pan and soften the %{veg}.',
      'Pour in the eggs and cook gently until the edges set.',
      'Transfer to the oven until the top is puffed and golden.',
      'Rest for a minute, then slice into wedges.',
    ],
  },
  soup: {
    title: 'Rustic %{veg} soup',
    description: 'A forgiving, chunky soup that turns %{veg} into a comforting bowl with a handful of pantry staples.',
    steps: [
      'Dice the onion and chop the vegetables into even chunks.',
      'Soften the onion in olive oil over medium heat.',
      'Add the %{veg} and herbs and stir for a minute.',
      'Pour in the stock, bring to a simmer, and cook until everything is tender.',
      'Blend half the soup for body, or leave it chunky. Season and serve.',
    ],
  },
  cuisines: {
    italian: { label: 'Italian', spice: 'oregano and a pinch of chilli', finish: 'a handful of torn basil and grated parmesan' },
    mediterranean: { label: 'Mediterranean', spice: 'oregano and lemon zest', finish: 'olives, lemon juice, and a drizzle of good olive oil' },
    asian: { label: 'Asian', spice: 'ginger and a splash of soy sauce', finish: 'sliced spring onion and a few drops of sesame oil' },
    mexican: { label: 'Mexican', spice: 'cumin and smoked chilli', finish: 'lime juice and chopped coriander' },
    indian: { label: 'Indian', spice: 'garam masala and turmeric', finish: 'a spoon of yogurt and fresh coriander' },
    middleEastern: { label: 'Middle Eastern', spice: 'cumin and sumac', finish: 'chopped parsley, mint, and a squeeze of lemon' },
    french: { label: 'French', spice: 'thyme and a bay leaf', finish: 'a knob of butter and chopped parsley' },
  },
};

const chefFr: ChefStrings = {
  and: ' et ',
  quick: '%{title} express',
  cuisinePrefix: '%{title} façon %{label}',
  cuisineDescription: '%{description} Relevé avec %{spice}.',
  cuisineFirstStep: '%{step} Ajoutez %{spice}.',
  cuisineFinish: 'Terminez avec %{finish}.',
  fallback: { veg: 'les légumes que vous avez', crunchy: 'légumes croquants', leftover: 'restes de légumes', rice: 'riz', quinoa: 'quinoa' },
  ing: {
    oliveOil: "Huile d'olive", garlic: 'Ail', saltPepper: 'Sel et poivre', lemon: 'Citron', salt: 'Sel', milk: 'Lait', water: 'Eau',
    butter: 'Beurre', onion: 'Oignon', stock: 'Bouillon de légumes', driedHerbs: 'Herbes séchées', chickpeas: 'Pois chiches', lentils: 'Lentilles',
    tofu: 'Tofu', whiteBeans: 'Haricots blancs', mushrooms: 'Champignons', rice: 'Riz', quinoa: 'Quinoa',
  },
  amount: { toTaste: 'selon le goût', servings2: '2 portions', cloves2: '2 gousses', cup1: '1 tasse', tbsp1: '1 c. à soupe', tbsp2: '2 c. à soupe', tbsp3: '3 c. à soupe', tsp1: '1 c. à café', can1: '1 boîte', l1: '1 l', one: '1', six: '6', forWater: "pour l'eau" },
  skillet: {
    title: 'Poêlée de %{protein} aux %{veg}',
    description: 'Un plat de semaine : on saisit d’abord le %{protein}, puis on cuit les légumes dans la même poêle pour ne rien gaspiller.',
    steps: [
      'Épongez le %{protein} et assaisonnez généreusement de sel%{spice}.',
      "Chauffez l'huile d'olive dans une grande poêle à feu moyen-vif.",
      'Saisissez le %{protein} sans le bouger pour qu’il dore bien.',
      "Retournez, ajoutez l'ail et %{veg}, et cuisez jusqu’à ce que les légumes soient juste tendres.",
      'Baissez le feu, couvrez et laissez finir de cuire.',
      'Goûtez, rectifiez l’assaisonnement et servez directement dans la poêle.',
    ],
  },
  bowl: {
    title: 'Bol de %{base} aux %{veg}',
    description: 'Du %{base} moelleux garni de %{veg}%{dairy}, avec une vinaigrette citronnée.',
    withDairy: ' et une cuillère de %{dairy}',
    steps: [
      'Rincez le %{base} et cuisez-le selon les instructions du paquet.',
      'Pendant ce temps, coupez %{veg} en morceaux.',
      "Fouettez le jus de citron avec l'huile d'olive et une pincée de sel pour la vinaigrette.",
      'Égrenez le %{base} et répartissez-le dans deux bols.',
      'Disposez les légumes dessus%{dairyStep}, puis arrosez de vinaigrette.',
    ],
  },
  frittata: {
    title: 'Frittata vide-frigo aux %{veg}',
    description: 'Le meilleur moyen de vider le frigo : les œufs lient %{veg} en une frittata dorée, à manger chaude ou froide.',
    steps: [
      'Préchauffez le gril ou le four à 200°C.',
      'Fouettez les œufs avec le liquide, le sel et le poivre.',
      'Chauffez la matière grasse dans une poêle allant au four et faites revenir %{veg}.',
      'Versez les œufs et cuisez doucement jusqu’à ce que les bords prennent.',
      'Enfournez jusqu’à ce que le dessus soit gonflé et doré.',
      'Laissez reposer une minute, puis coupez en parts.',
    ],
  },
  soup: {
    title: 'Soupe rustique aux %{veg}',
    description: 'Une soupe généreuse qui transforme %{veg} en un bol réconfortant avec quelques basiques.',
    steps: [
      "Émincez l'oignon et coupez les légumes en morceaux réguliers.",
      "Faites fondre l'oignon dans l'huile d'olive à feu moyen.",
      'Ajoutez %{veg} et les herbes et remuez une minute.',
      'Versez le bouillon, portez à frémissement et cuisez jusqu’à ce que tout soit tendre.',
      'Mixez la moitié de la soupe pour l’épaissir, ou laissez-la en morceaux. Assaisonnez et servez.',
    ],
  },
  cuisines: {
    italian: { label: 'italienne', spice: "de l'origan et une pincée de piment", finish: 'du basilic déchiré et du parmesan râpé' },
    mediterranean: { label: 'méditerranéenne', spice: "de l'origan et du zeste de citron", finish: "des olives, du jus de citron et un filet d'huile d'olive" },
    asian: { label: 'asiatique', spice: 'du gingembre et un trait de sauce soja', finish: 'de la ciboule émincée et quelques gouttes d’huile de sésame' },
    mexican: { label: 'mexicaine', spice: 'du cumin et du piment fumé', finish: 'du jus de citron vert et de la coriandre ciselée' },
    indian: { label: 'indienne', spice: 'du garam masala et du curcuma', finish: 'une cuillère de yaourt et de la coriandre fraîche' },
    middleEastern: { label: 'orientale', spice: 'du cumin et du sumac', finish: 'du persil, de la menthe et un filet de citron' },
    french: { label: 'française', spice: 'du thym et une feuille de laurier', finish: 'une noix de beurre et du persil haché' },
  },
};

const chefAr: ChefStrings = {
  and: ' و',
  quick: '%{title} السريع',
  cuisinePrefix: '%{title} على الطريقة %{label}',
  cuisineDescription: '%{description} متبّل بـ%{spice}.',
  cuisineFirstStep: '%{step} أضف %{spice}.',
  cuisineFinish: 'أنهِ الطبق بـ%{finish}.',
  fallback: { veg: 'ما لديك من خضار', crunchy: 'خضار مقرمشة', leftover: 'بقايا الخضار', rice: 'الأرز', quinoa: 'الكينوا' },
  ing: {
    oliveOil: 'زيت زيتون', garlic: 'ثوم', saltPepper: 'ملح وفلفل', lemon: 'ليمون', salt: 'ملح', milk: 'حليب', water: 'ماء',
    butter: 'زبدة', onion: 'بصل', stock: 'مرق خضار', driedHerbs: 'أعشاب مجففة', chickpeas: 'حمص', lentils: 'عدس',
    tofu: 'توفو', whiteBeans: 'فاصولياء بيضاء', mushrooms: 'فطر', rice: 'أرز', quinoa: 'كينوا',
  },
  amount: { toTaste: 'حسب الذوق', servings2: 'حصتان', cloves2: 'فصّان', cup1: 'كوب', tbsp1: 'ملعقة كبيرة', tbsp2: 'ملعقتان كبيرتان', tbsp3: '3 ملاعق كبيرة', tsp1: 'ملعقة صغيرة', can1: 'علبة', l1: '1 لتر', one: '1', six: '6', forWater: 'للماء' },
  skillet: {
    title: '%{protein} مع %{veg} في مقلاة واحدة',
    description: 'طبق أيام الأسبوع: نحمّر %{protein} أولًا ثم ننضج الخضار في المقلاة نفسها حتى لا يُهدر شيء.',
    steps: [
      'جفّف %{protein} وتبّله بسخاء بالملح%{spice}.',
      'سخّن زيت الزيتون في مقلاة كبيرة على نار متوسطة إلى عالية.',
      'حمّر %{protein} دون تحريكه حتى يكتسب لونًا ذهبيًا.',
      'اقلبه، أضف الثوم و%{veg}، واطبخ حتى تصبح الخضار طرية قليلًا.',
      'خفّف النار، غطِّ المقلاة، ودع كل شيء ينضج تمامًا.',
      'تذوّق، عدّل التتبيل، وقدّم من المقلاة مباشرة.',
    ],
  },
  bowl: {
    title: 'طبق %{base} مع %{veg}',
    description: '%{base} هش مغطى بـ%{veg}%{dairy}، مع صلصة ليمون منعشة.',
    withDairy: ' وملعقة من %{dairy}',
    steps: [
      'اغسل %{base} واطبخه حسب تعليمات العبوة.',
      'أثناء الطبخ، قطّع %{veg} إلى قطع صغيرة.',
      'اخفق عصير الليمون مع زيت الزيتون ورشة ملح لتحضير الصلصة.',
      'فكّك %{base} بالشوكة ووزّعه في طبقين.',
      'ضع الخضار فوقه%{dairyStep}، ثم اسكب الصلصة.',
    ],
  },
  frittata: {
    title: 'فريتاتا الثلاجة مع %{veg}',
    description: 'أفضل طريقة لتفريغ الثلاجة: البيض يجمع %{veg} في فريتاتا ذهبية تؤكل دافئة أو باردة.',
    steps: [
      'سخّن الشواية أو الفرن إلى 200 درجة مئوية.',
      'اخفق البيض مع السائل والملح والفلفل.',
      'سخّن الدهن في مقلاة تصلح للفرن وطرِّ %{veg}.',
      'اسكب البيض واطبخ على نار هادئة حتى تتماسك الأطراف.',
      'انقل إلى الفرن حتى ينتفخ الوجه ويذهب لونه.',
      'اترك دقيقة ثم قطّع إلى شرائح.',
    ],
  },
  soup: {
    title: 'شوربة %{veg} ريفية',
    description: 'شوربة سخية بقطع كبيرة تحوّل %{veg} إلى طبق مريح مع بعض الأساسيات.',
    steps: [
      'قطّع البصل والخضار إلى قطع متساوية.',
      'طرِّ البصل في زيت الزيتون على نار متوسطة.',
      'أضف %{veg} والأعشاب وقلّب لدقيقة.',
      'اسكب المرق، دعه يغلي بهدوء، واطبخ حتى ينضج كل شيء.',
      'اهرس نصف الشوربة لقوام أكثف، أو اتركها كما هي. تبّل وقدّم.',
    ],
  },
  cuisines: {
    italian: { label: 'الإيطالية', spice: 'الأوريغانو ورشة فلفل حار', finish: 'حفنة من الريحان وجبن البارميزان المبشور' },
    mediterranean: { label: 'المتوسطية', spice: 'الأوريغانو وبشر الليمون', finish: 'الزيتون وعصير الليمون ورشة زيت زيتون جيد' },
    asian: { label: 'الآسيوية', spice: 'الزنجبيل ورشة صلصة الصويا', finish: 'البصل الأخضر المقطع وبضع قطرات من زيت السمسم' },
    mexican: { label: 'المكسيكية', spice: 'الكمون والفلفل المدخن', finish: 'عصير الليمون الأخضر والكزبرة المفرومة' },
    indian: { label: 'الهندية', spice: 'الغارام ماسالا والكركم', finish: 'ملعقة من الزبادي والكزبرة الطازجة' },
    middleEastern: { label: 'الشرقية', spice: 'الكمون والسماق', finish: 'البقدونس والنعناع وعصرة ليمون' },
    french: { label: 'الفرنسية', spice: 'الزعتر البري وورقة غار', finish: 'قطعة زبدة والبقدونس المفروم' },
  },
};

export const CHEF: Record<ContentLocale, ChefStrings> = { en: chefEn, fr: chefFr, ar: chefAr };

/* ------------------------------------------------------------------------ */
/*                       Simulated dish recognition                          */
/* ------------------------------------------------------------------------ */

export interface DishText {
  name: string;
  cuisine: string;
  description: string;
  keyIngredients: string[];
  title: string;
  recipeDescription: string;
  /** Ingredient [name, amount] pairs, in the same order for every language. */
  ingredients: Array<[string, string]>;
  steps: string[];
}

export const DISHES: Record<ContentLocale, DishText[]> = {
  en: [
    {
      name: 'Couscous with lamb and vegetables', cuisine: 'Tunisian',
      description: 'Steamed semolina couscous topped with slow-cooked lamb, carrots, potatoes, courgettes and chickpeas in a spiced red broth.',
      keyIngredients: ['Couscous', 'Lamb', 'Carrots', 'Chickpeas', 'Tomato paste', 'Harissa'],
      title: 'Tunisian couscous with lamb', recipeDescription: 'The Sunday classic: lamb simmered in a tomato and harissa broth with vegetables, spooned over fluffy couscous.',
      ingredients: [['Couscous', '500 g'], ['Lamb shoulder', '800 g'], ['Onion', '1'], ['Tomato paste', '2 tbsp'], ['Harissa', '1 tbsp'], ['Carrots', '3'], ['Potatoes', '3'], ['Courgette', '2'], ['Chickpeas', '1 can'], ['Olive oil', '3 tbsp'], ['Coriander seeds', '1 tsp'], ['Green chillies', '2']],
      steps: ['Brown the lamb pieces with the chopped onion in olive oil in a large pot.', 'Stir in the tomato paste, harissa, and coriander seeds and cook until dark and fragrant.', 'Cover with water, bring to a simmer, and cook the lamb until tender.', 'Add the carrots and potatoes and simmer, then the courgettes and chickpeas.', 'Meanwhile moisten the couscous, steam it over the broth, and fluff it with a little oil.', 'Pile the couscous on a platter, arrange the meat and vegetables on top, and ladle over the broth. Serve the chillies alongside.'],
    },
    {
      name: 'Shakshuka', cuisine: 'Middle Eastern',
      description: 'Eggs poached in a spiced tomato and pepper sauce, usually served straight from the pan with bread.',
      keyIngredients: ['Eggs', 'Tomatoes', 'Bell pepper', 'Onion', 'Cumin', 'Paprika'],
      title: 'Classic shakshuka', recipeDescription: 'A one-pan brunch or dinner: a rich tomato base, softly set eggs, and plenty of bread for dipping.',
      ingredients: [['Eggs', '4'], ['Canned tomatoes', '400 g'], ['Bell pepper', '1'], ['Onion', '1'], ['Garlic', '2 cloves'], ['Cumin', '1 tsp'], ['Smoked paprika', '1 tsp'], ['Olive oil', '2 tbsp'], ['Bread', 'to serve']],
      steps: ['Dice the onion and pepper and thinly slice the garlic.', 'Soften the onion and pepper in olive oil over medium heat.', 'Add the garlic, cumin, and paprika and stir until fragrant.', 'Pour in the tomatoes, season, and simmer until thick.', 'Make four wells, crack an egg into each, cover, and cook until the whites set.', 'Serve from the pan with warm bread.'],
    },
    {
      name: 'Spaghetti carbonara', cuisine: 'Italian',
      description: 'Pasta coated in a silky sauce of eggs, hard cheese, and cured pork, with black pepper.',
      keyIngredients: ['Spaghetti', 'Eggs', 'Parmesan', 'Bacon', 'Black pepper'],
      title: 'Spaghetti carbonara', recipeDescription: 'No cream needed: the heat of the pasta turns eggs and cheese into a glossy sauce.',
      ingredients: [['Spaghetti', '200 g'], ['Bacon', '100 g'], ['Eggs', '2'], ['Parmesan', '50 g'], ['Black pepper', '1 tsp'], ['Salt', 'for the water']],
      steps: ['Bring a large pot of salted water to the boil and cook the spaghetti until al dente.', 'Meanwhile fry the bacon until crisp, then take the pan off the heat.', 'Whisk the eggs with the grated parmesan and lots of black pepper.', 'Drain the pasta, keeping a cup of cooking water, and toss it into the bacon pan.', 'Off the heat, pour in the egg mixture and toss fast, adding pasta water until glossy.', 'Serve immediately with extra cheese and pepper.'],
    },
    {
      name: 'Chicken tikka masala', cuisine: 'Indian-British',
      description: 'Marinated chicken pieces in a creamy, spiced tomato sauce, served with rice or naan.',
      keyIngredients: ['Chicken', 'Yogurt', 'Tomatoes', 'Garam masala', 'Cream', 'Ginger'],
      title: 'Chicken tikka masala', recipeDescription: 'A weeknight version: yogurt-marinated chicken finished in a fragrant tomato and cream sauce.',
      ingredients: [['Chicken thighs', '600 g'], ['Greek yogurt', '150 g'], ['Garam masala', '2 tsp'], ['Ginger', '1 thumb'], ['Garlic', '3 cloves'], ['Onion', '1'], ['Canned tomatoes', '400 g'], ['Cream', '100 ml'], ['Basmati rice', 'to serve']],
      steps: ['Cut the chicken into chunks and mix with the yogurt, half the garam masala, grated ginger, and garlic.', 'Let it marinate while you prepare the sauce.', 'Fry the onion until golden, then add the remaining spices.', 'Add the tomatoes and simmer until thick.', 'Grill or pan-fry the chicken until charred at the edges.', 'Stir the chicken and cream into the sauce and warm through. Serve with rice.'],
    },
    {
      name: 'Margherita pizza', cuisine: 'Italian',
      description: 'Thin crust with tomato sauce, mozzarella, and fresh basil.',
      keyIngredients: ['Flour', 'Tomatoes', 'Mozzarella', 'Basil', 'Olive oil'],
      title: 'Quick margherita pizza', recipeDescription: 'A no-knead dough that rests while the oven heats, topped simply and baked hot.',
      ingredients: [['Flour', '300 g'], ['Yeast', '1 tsp'], ['Water', '200 ml'], ['Canned tomatoes', '200 g'], ['Mozzarella', '150 g'], ['Basil', 'a handful'], ['Olive oil', '2 tbsp']],
      steps: ['Mix the flour, yeast, a pinch of salt, and water into a shaggy dough.', 'Cover and let the dough rest while the oven heats to its highest setting.', 'Crush the tomatoes with salt and a little olive oil for the sauce.', 'Stretch the dough thin on a floured tray and spread the sauce over it.', 'Tear over the mozzarella and bake until the crust is blistered.', 'Finish with basil leaves and a drizzle of oil.'],
    },
    {
      name: 'Caesar salad', cuisine: 'American',
      description: 'Crisp romaine with a creamy garlic and anchovy dressing, croutons, and parmesan.',
      keyIngredients: ['Lettuce', 'Parmesan', 'Bread', 'Eggs', 'Garlic', 'Lemon'],
      title: 'Caesar salad with crunchy croutons', recipeDescription: 'A proper dressing made from scratch, plus golden croutons from leftover bread.',
      ingredients: [['Lettuce', '1 head'], ['Bread', '2 slices'], ['Parmesan', '40 g'], ['Egg yolk', '1'], ['Garlic', '1 clove'], ['Lemon', '1/2'], ['Olive oil', '4 tbsp'], ['Anchovies', '2 fillets']],
      steps: ['Tear the bread into chunks, toss with oil, and toast until golden.', 'Mash the garlic and anchovies, then whisk with the yolk and lemon juice.', 'Drizzle in the olive oil slowly while whisking to make a creamy dressing.', 'Toss the lettuce with the dressing and most of the parmesan.', 'Top with croutons and the remaining cheese.'],
    },
    {
      name: 'Pad thai', cuisine: 'Thai',
      description: 'Stir-fried rice noodles with egg, tofu or shrimp, peanuts, and a sweet-sour tamarind sauce.',
      keyIngredients: ['Rice noodles', 'Eggs', 'Shrimp', 'Peanuts', 'Lime', 'Soy sauce'],
      title: 'Weeknight pad thai', recipeDescription: 'A fast stir-fry with a pantry-friendly sauce standing in for tamarind.',
      ingredients: [['Rice noodles', '150 g'], ['Shrimp', '200 g'], ['Eggs', '2'], ['Peanuts', '3 tbsp'], ['Soy sauce', '2 tbsp'], ['Sugar', '1 tbsp'], ['Lime', '1'], ['Garlic', '2 cloves'], ['Spring onion', '2']],
      steps: ['Soak the rice noodles in hot water until just pliable, then drain.', 'Mix the soy sauce, sugar, and lime juice for the sauce.', 'Stir-fry the garlic and shrimp over high heat until pink.', 'Push everything aside, scramble the eggs in the pan, then toss together.', 'Add the noodles and sauce and toss until coated and hot.', 'Serve with crushed peanuts, spring onion, and lime wedges.'],
    },
  ],
  fr: [
    {
      name: "Couscous à l'agneau et aux légumes", cuisine: 'Tunisienne',
      description: 'Semoule de couscous vapeur garnie d’agneau mijoté, de carottes, pommes de terre, courgettes et pois chiches dans un bouillon rouge épicé.',
      keyIngredients: ['Couscous', 'Agneau', 'Carottes', 'Pois chiches', 'Concentré de tomate', 'Harissa'],
      title: "Couscous tunisien à l'agneau", recipeDescription: 'Le classique du dimanche : agneau mijoté dans un bouillon tomate-harissa avec des légumes, servi sur un couscous léger.',
      ingredients: [['Couscous', '500 g'], ["Épaule d'agneau", '800 g'], ['Oignon', '1'], ['Concentré de tomate', '2 c. à soupe'], ['Harissa', '1 c. à soupe'], ['Carottes', '3'], ['Pommes de terre', '3'], ['Courgettes', '2'], ['Pois chiches', '1 boîte'], ["Huile d'olive", '3 c. à soupe'], ['Graines de coriandre', '1 c. à café'], ['Piments verts', '2']],
      steps: ["Faites dorer les morceaux d'agneau avec l'oignon haché dans l'huile d'olive, dans une grande marmite.", 'Ajoutez le concentré, la harissa et la coriandre et cuisez jusqu’à ce que le mélange fonce et embaume.', 'Couvrez d’eau, portez à frémissement et cuisez l’agneau jusqu’à tendreté.', 'Ajoutez carottes et pommes de terre, puis courgettes et pois chiches.', 'Pendant ce temps, humectez la semoule, cuisez-la à la vapeur au-dessus du bouillon et égrenez-la avec un peu d’huile.', 'Dressez la semoule sur un plat, disposez viande et légumes dessus et arrosez de bouillon. Servez les piments à côté.'],
    },
    {
      name: 'Chakchouka', cuisine: 'Orientale',
      description: 'Œufs pochés dans une sauce épicée de tomates et poivrons, servis directement dans la poêle avec du pain.',
      keyIngredients: ['Œufs', 'Tomates', 'Poivron', 'Oignon', 'Cumin', 'Paprika'],
      title: 'Chakchouka classique', recipeDescription: 'Un plat unique pour le brunch ou le dîner : une base tomate riche, des œufs mollets et du pain pour saucer.',
      ingredients: [['Œufs', '4'], ['Tomates en boîte', '400 g'], ['Poivron', '1'], ['Oignon', '1'], ['Ail', '2 gousses'], ['Cumin', '1 c. à café'], ['Paprika fumé', '1 c. à café'], ["Huile d'olive", '2 c. à soupe'], ['Pain', 'pour servir']],
      steps: ["Coupez l'oignon et le poivron en dés et émincez l'ail.", "Faites fondre l'oignon et le poivron dans l'huile d'olive à feu moyen.", "Ajoutez l'ail, le cumin et le paprika et remuez jusqu’à ce que ça embaume.", 'Versez les tomates, assaisonnez et laissez épaissir.', 'Creusez quatre puits, cassez un œuf dans chacun, couvrez et cuisez jusqu’à ce que les blancs prennent.', 'Servez dans la poêle avec du pain chaud.'],
    },
    {
      name: 'Spaghetti carbonara', cuisine: 'Italienne',
      description: 'Pâtes enrobées d’une sauce soyeuse aux œufs, fromage sec et charcuterie, avec du poivre noir.',
      keyIngredients: ['Spaghetti', 'Œufs', 'Parmesan', 'Lardons', 'Poivre noir'],
      title: 'Spaghetti carbonara', recipeDescription: 'Sans crème : la chaleur des pâtes transforme œufs et fromage en une sauce brillante.',
      ingredients: [['Spaghetti', '200 g'], ['Lardons', '100 g'], ['Œufs', '2'], ['Parmesan', '50 g'], ['Poivre noir', '1 c. à café'], ['Sel', "pour l'eau"]],
      steps: ["Portez une grande casserole d'eau salée à ébullition et cuisez les spaghetti al dente.", 'Pendant ce temps, faites croustiller les lardons puis retirez la poêle du feu.', 'Fouettez les œufs avec le parmesan râpé et beaucoup de poivre.', "Égouttez les pâtes en gardant une tasse d'eau de cuisson et versez-les dans la poêle.", "Hors du feu, ajoutez le mélange d'œufs et mélangez vite, en ajoutant de l'eau de cuisson jusqu’à ce que ce soit brillant.", 'Servez aussitôt avec du fromage et du poivre.'],
    },
    {
      name: 'Poulet tikka masala', cuisine: 'Indo-britannique',
      description: 'Morceaux de poulet marinés dans une sauce tomate crémeuse et épicée, servis avec du riz ou du naan.',
      keyIngredients: ['Poulet', 'Yaourt', 'Tomates', 'Garam masala', 'Crème', 'Gingembre'],
      title: 'Poulet tikka masala', recipeDescription: 'Version de semaine : poulet mariné au yaourt terminé dans une sauce tomate-crème parfumée.',
      ingredients: [['Hauts de cuisse de poulet', '600 g'], ['Yaourt grec', '150 g'], ['Garam masala', '2 c. à café'], ['Gingembre', '1 morceau'], ['Ail', '3 gousses'], ['Oignon', '1'], ['Tomates en boîte', '400 g'], ['Crème', '100 ml'], ['Riz basmati', 'pour servir']],
      steps: ['Coupez le poulet en morceaux et mélangez-le avec le yaourt, la moitié du garam masala, le gingembre râpé et l’ail.', 'Laissez mariner pendant que vous préparez la sauce.', "Faites dorer l'oignon puis ajoutez le reste des épices.", 'Ajoutez les tomates et laissez épaissir.', 'Grillez ou poêlez le poulet jusqu’à ce que les bords soient caramélisés.', 'Incorporez le poulet et la crème à la sauce et réchauffez. Servez avec du riz.'],
    },
    {
      name: 'Pizza margherita', cuisine: 'Italienne',
      description: 'Pâte fine avec sauce tomate, mozzarella et basilic frais.',
      keyIngredients: ['Farine', 'Tomates', 'Mozzarella', 'Basilic', "Huile d'olive"],
      title: 'Pizza margherita rapide', recipeDescription: 'Une pâte sans pétrissage qui repose pendant que le four chauffe, garnie simplement et cuite à feu vif.',
      ingredients: [['Farine', '300 g'], ['Levure', '1 c. à café'], ['Eau', '200 ml'], ['Tomates en boîte', '200 g'], ['Mozzarella', '150 g'], ['Basilic', 'une poignée'], ["Huile d'olive", '2 c. à soupe']],
      steps: ["Mélangez farine, levure, une pincée de sel et l'eau en une pâte grossière.", 'Couvrez et laissez reposer pendant que le four chauffe au maximum.', "Écrasez les tomates avec du sel et un peu d'huile pour la sauce.", 'Étirez la pâte finement sur une plaque farinée et étalez la sauce.', 'Répartissez la mozzarella et enfournez jusqu’à ce que la croûte cloque.', "Terminez avec des feuilles de basilic et un filet d'huile."],
    },
    {
      name: 'Salade César', cuisine: 'Américaine',
      description: 'Romaine croquante avec une sauce crémeuse à l’ail et aux anchois, des croûtons et du parmesan.',
      keyIngredients: ['Laitue', 'Parmesan', 'Pain', 'Œufs', 'Ail', 'Citron'],
      title: 'Salade César aux croûtons croustillants', recipeDescription: 'Une vraie sauce maison, plus des croûtons dorés faits avec du pain rassis.',
      ingredients: [['Laitue', '1'], ['Pain', '2 tranches'], ['Parmesan', '40 g'], ["Jaune d'œuf", '1'], ['Ail', '1 gousse'], ['Citron', '1/2'], ["Huile d'olive", '4 c. à soupe'], ['Anchois', '2 filets']],
      steps: ["Déchirez le pain en morceaux, enrobez-le d'huile et toastez-le.", "Écrasez l'ail et les anchois, puis fouettez avec le jaune et le jus de citron.", "Versez l'huile en filet en fouettant pour obtenir une sauce crémeuse.", 'Mélangez la laitue avec la sauce et presque tout le parmesan.', 'Ajoutez les croûtons et le reste du fromage.'],
    },
    {
      name: 'Pad thaï', cuisine: 'Thaïlandaise',
      description: 'Nouilles de riz sautées avec œuf, tofu ou crevettes, cacahuètes et une sauce aigre-douce au tamarin.',
      keyIngredients: ['Nouilles de riz', 'Œufs', 'Crevettes', 'Cacahuètes', 'Citron vert', 'Sauce soja'],
      title: 'Pad thaï de semaine', recipeDescription: 'Un sauté rapide avec une sauce de placard à la place du tamarin.',
      ingredients: [['Nouilles de riz', '150 g'], ['Crevettes', '200 g'], ['Œufs', '2'], ['Cacahuètes', '3 c. à soupe'], ['Sauce soja', '2 c. à soupe'], ['Sucre', '1 c. à soupe'], ['Citron vert', '1'], ['Ail', '2 gousses'], ['Ciboule', '2']],
      steps: ["Trempez les nouilles dans l'eau chaude jusqu’à ce qu’elles soient souples, puis égouttez.", 'Mélangez sauce soja, sucre et jus de citron vert pour la sauce.', "Faites sauter l'ail et les crevettes à feu vif jusqu’à ce qu’elles rosissent.", 'Poussez sur le côté, brouillez les œufs dans la poêle, puis mélangez.', 'Ajoutez les nouilles et la sauce et mélangez jusqu’à ce que tout soit chaud.', 'Servez avec des cacahuètes concassées, de la ciboule et des quartiers de citron vert.'],
    },
  ],
  ar: [
    {
      name: 'كسكسي باللحم والخضار', cuisine: 'تونسي',
      description: 'كسكسي مطهو على البخار مع لحم ضأن مطبوخ ببطء وجزر وبطاطا وكوسة وحمص في مرق أحمر متبّل.',
      keyIngredients: ['كسكسي', 'لحم ضأن', 'جزر', 'حمص', 'معجون طماطم', 'هريسة'],
      title: 'كسكسي تونسي باللحم', recipeDescription: 'طبق الأحد الكلاسيكي: لحم ضأن مطهو في مرق الطماطم والهريسة مع الخضار، يُقدَّم فوق كسكسي هش.',
      ingredients: [['كسكسي', '500 غ'], ['كتف ضأن', '800 غ'], ['بصل', '1'], ['معجون طماطم', 'ملعقتان كبيرتان'], ['هريسة', 'ملعقة كبيرة'], ['جزر', '3'], ['بطاطا', '3'], ['كوسة', '2'], ['حمص', 'علبة'], ['زيت زيتون', '3 ملاعق كبيرة'], ['بذور كزبرة', 'ملعقة صغيرة'], ['فلفل أخضر', '2']],
      steps: ['حمّر قطع اللحم مع البصل المفروم في زيت الزيتون في قدر كبير.', 'أضف معجون الطماطم والهريسة وبذور الكزبرة واطبخ حتى يغمق اللون وتفوح الرائحة.', 'غطِّ بالماء، دعه يغلي بهدوء، واطبخ اللحم حتى يطرى.', 'أضف الجزر والبطاطا ثم الكوسة والحمص.', 'في الأثناء بلّل الكسكسي، بخّره فوق المرق، وفكّكه بقليل من الزيت.', 'ضع الكسكسي في صحن كبير، رتّب اللحم والخضار فوقه، واسكب المرق. قدّم الفلفل بجانبه.'],
    },
    {
      name: 'شكشوكة', cuisine: 'شرق أوسطي',
      description: 'بيض مسلوق في صلصة طماطم وفلفل متبّلة، يُقدَّم عادة من المقلاة مع الخبز.',
      keyIngredients: ['بيض', 'طماطم', 'فلفل رومي', 'بصل', 'كمون', 'بابريكا'],
      title: 'شكشوكة كلاسيكية', recipeDescription: 'وجبة في مقلاة واحدة: قاعدة طماطم غنية، بيض طري، وخبز كثير للغمس.',
      ingredients: [['بيض', '4'], ['طماطم معلبة', '400 غ'], ['فلفل رومي', '1'], ['بصل', '1'], ['ثوم', 'فصّان'], ['كمون', 'ملعقة صغيرة'], ['بابريكا مدخنة', 'ملعقة صغيرة'], ['زيت زيتون', 'ملعقتان كبيرتان'], ['خبز', 'للتقديم']],
      steps: ['قطّع البصل والفلفل مكعبات وشرّح الثوم.', 'طرِّ البصل والفلفل في زيت الزيتون على نار متوسطة.', 'أضف الثوم والكمون والبابريكا وقلّب حتى تفوح الرائحة.', 'اسكب الطماطم، تبّل، واطبخ حتى تتكاثف.', 'اصنع أربع حفر، اكسر بيضة في كل واحدة، غطِّ، واطبخ حتى يتماسك البياض.', 'قدّم من المقلاة مع خبز دافئ.'],
    },
    {
      name: 'سباغيتي كاربونارا', cuisine: 'إيطالي',
      description: 'معكرونة مغلفة بصلصة حريرية من البيض والجبن الصلب واللحم المقدد، مع الفلفل الأسود.',
      keyIngredients: ['سباغيتي', 'بيض', 'بارميزان', 'لحم مقدد', 'فلفل أسود'],
      title: 'سباغيتي كاربونارا', recipeDescription: 'بلا كريمة: حرارة المعكرونة تحوّل البيض والجبن إلى صلصة لامعة.',
      ingredients: [['سباغيتي', '200 غ'], ['لحم مقدد', '100 غ'], ['بيض', '2'], ['بارميزان', '50 غ'], ['فلفل أسود', 'ملعقة صغيرة'], ['ملح', 'للماء']],
      steps: ['اغلِ قدرًا كبيرًا من الماء المملح واطبخ السباغيتي حتى تصبح آل دينتي.', 'في الأثناء اقلِ اللحم المقدد حتى يتقرمش ثم ارفع المقلاة عن النار.', 'اخفق البيض مع البارميزان المبشور وكثير من الفلفل الأسود.', 'صفِّ المعكرونة مع الاحتفاظ بكوب من ماء السلق وأضفها إلى المقلاة.', 'بعيدًا عن النار، اسكب خليط البيض وقلّب بسرعة مضيفًا ماء السلق حتى تلمع الصلصة.', 'قدّم فورًا مع مزيد من الجبن والفلفل.'],
    },
    {
      name: 'دجاج تكا ماسالا', cuisine: 'هندي-بريطاني',
      description: 'قطع دجاج متبّلة في صلصة طماطم كريمية متبّلة، تُقدَّم مع الأرز أو خبز النان.',
      keyIngredients: ['دجاج', 'زبادي', 'طماطم', 'غارام ماسالا', 'كريمة', 'زنجبيل'],
      title: 'دجاج تكا ماسالا', recipeDescription: 'نسخة أيام الأسبوع: دجاج متبّل بالزبادي يُنهى في صلصة طماطم وكريمة عطرة.',
      ingredients: [['أفخاذ دجاج', '600 غ'], ['زبادي يوناني', '150 غ'], ['غارام ماسالا', 'ملعقتان صغيرتان'], ['زنجبيل', 'قطعة'], ['ثوم', '3 فصوص'], ['بصل', '1'], ['طماطم معلبة', '400 غ'], ['كريمة', '100 مل'], ['أرز بسمتي', 'للتقديم']],
      steps: ['قطّع الدجاج قطعًا وامزجه مع الزبادي ونصف الغارام ماسالا والزنجبيل المبشور والثوم.', 'اتركه يتتبّل بينما تحضّر الصلصة.', 'اقلِ البصل حتى يذهب لونه ثم أضف بقية التوابل.', 'أضف الطماطم واطبخ حتى تتكاثف.', 'اشوِ الدجاج أو اقله حتى تتفحم أطرافه قليلًا.', 'أضف الدجاج والكريمة إلى الصلصة وسخّن. قدّم مع الأرز.'],
    },
    {
      name: 'بيتزا مارغريتا', cuisine: 'إيطالي',
      description: 'عجينة رقيقة مع صلصة طماطم وموزاريلا وريحان طازج.',
      keyIngredients: ['طحين', 'طماطم', 'موزاريلا', 'ريحان', 'زيت زيتون'],
      title: 'بيتزا مارغريتا سريعة', recipeDescription: 'عجينة بلا عجن ترتاح بينما يسخن الفرن، بإضافات بسيطة وخبز على حرارة عالية.',
      ingredients: [['طحين', '300 غ'], ['خميرة', 'ملعقة صغيرة'], ['ماء', '200 مل'], ['طماطم معلبة', '200 غ'], ['موزاريلا', '150 غ'], ['ريحان', 'حفنة'], ['زيت زيتون', 'ملعقتان كبيرتان']],
      steps: ['اخلط الطحين والخميرة ورشة ملح والماء حتى تتكوّن عجينة خشنة.', 'غطِّ واترك العجينة ترتاح بينما يسخن الفرن على أعلى درجة.', 'اهرس الطماطم مع الملح وقليل من زيت الزيتون للصلصة.', 'افرد العجينة رقيقة على صينية مرشوشة بالطحين وادهنها بالصلصة.', 'وزّع الموزاريلا واخبز حتى تتقرمش الحواف.', 'أنهِ بأوراق الريحان ورشة زيت.'],
    },
    {
      name: 'سلطة سيزر', cuisine: 'أمريكي',
      description: 'خس رومين مقرمش مع صلصة كريمية بالثوم والأنشوجة، وخبز محمص وبارميزان.',
      keyIngredients: ['خس', 'بارميزان', 'خبز', 'بيض', 'ثوم', 'ليمون'],
      title: 'سلطة سيزر مع خبز محمص مقرمش', recipeDescription: 'صلصة حقيقية محضّرة في البيت، مع خبز محمص ذهبي من بقايا الخبز.',
      ingredients: [['خس', 'رأس'], ['خبز', 'شريحتان'], ['بارميزان', '40 غ'], ['صفار بيض', '1'], ['ثوم', 'فص'], ['ليمون', '1/2'], ['زيت زيتون', '4 ملاعق كبيرة'], ['أنشوجة', 'قطعتان']],
      steps: ['قطّع الخبز قطعًا، قلّبه بالزيت، وحمّصه حتى يذهب لونه.', 'اهرس الثوم والأنشوجة ثم اخفق مع الصفار وعصير الليمون.', 'أضف زيت الزيتون ببطء مع الخفق لتحصل على صلصة كريمية.', 'قلّب الخس مع الصلصة ومعظم البارميزان.', 'أضف الخبز المحمص وبقية الجبن.'],
    },
    {
      name: 'باد تاي', cuisine: 'تايلاندي',
      description: 'نودلز أرز مقلية مع البيض والتوفو أو الروبيان والفول السوداني وصلصة التمر الهندي الحلوة الحامضة.',
      keyIngredients: ['نودلز أرز', 'بيض', 'روبيان', 'فول سوداني', 'ليمون أخضر', 'صلصة صويا'],
      title: 'باد تاي أيام الأسبوع', recipeDescription: 'قلي سريع مع صلصة من مكوّنات المخزن بدل التمر الهندي.',
      ingredients: [['نودلز أرز', '150 غ'], ['روبيان', '200 غ'], ['بيض', '2'], ['فول سوداني', '3 ملاعق كبيرة'], ['صلصة صويا', 'ملعقتان كبيرتان'], ['سكر', 'ملعقة كبيرة'], ['ليمون أخضر', '1'], ['ثوم', 'فصّان'], ['بصل أخضر', '2']],
      steps: ['انقع النودلز في ماء ساخن حتى تلين قليلًا ثم صفِّها.', 'اخلط صلصة الصويا والسكر وعصير الليمون الأخضر للصلصة.', 'اقلِ الثوم والروبيان على نار عالية حتى يحمرّ.', 'أزح كل شيء جانبًا، اخفق البيض في المقلاة، ثم اخلط الكل.', 'أضف النودلز والصلصة وقلّب حتى تتغلف وتسخن.', 'قدّم مع الفول السوداني المجروش والبصل الأخضر وشرائح الليمون الأخضر.'],
    },
  ],
};

/* ------------------------------------------------------------------------ */
/*                    Simulated receipts and photo scans                     */
/* ------------------------------------------------------------------------ */

/** Item names for the three simulated receipts; quantities and units live in code. */
export const RECEIPT_NAMES: Record<ContentLocale, string[][]> = {
  en: [
    ['Whole milk', 'Bananas', 'Chicken breast', 'Penne', 'Cheddar cheese', 'Cucumber', 'Olive oil'],
    ['Eggs', 'Tomatoes', 'Onions', 'Canned chickpeas', 'Salmon fillet', 'Greek yogurt'],
    ['Basmati rice', 'Spinach', 'Lemons', 'Feta cheese', 'Garlic', 'Cumin', 'Orange juice', 'Frozen peas'],
  ],
  fr: [
    ['Lait entier', 'Bananes', 'Blanc de poulet', 'Penne', 'Cheddar', 'Concombre', "Huile d'olive"],
    ['Œufs', 'Tomates', 'Oignons', 'Pois chiches en boîte', 'Filet de saumon', 'Yaourt grec'],
    ['Riz basmati', 'Épinards', 'Citrons', 'Feta', 'Ail', 'Cumin', "Jus d'orange", 'Petits pois surgelés'],
  ],
  ar: [
    ['حليب كامل الدسم', 'موز', 'صدر دجاج', 'معكرونة بيني', 'جبن شيدر', 'خيار', 'زيت زيتون'],
    ['بيض', 'طماطم', 'بصل', 'حمص معلب', 'فيليه سلمون', 'زبادي يوناني'],
    ['أرز بسمتي', 'سبانخ', 'ليمون', 'جبن فيتا', 'ثوم', 'كمون', 'عصير برتقال', 'بازلاء مجمدة'],
  ],
};

/** Names for the simulated ingredient photo scan, same order as the pool in code. */
export const VISION_NAMES: Record<ContentLocale, string[]> = {
  en: ['Tomatoes', 'Eggs', 'Cheddar cheese', 'Bell pepper', 'Milk', 'Carrots', 'Onion', 'Chicken breast', 'Spinach', 'Mushrooms', 'Lemons', 'Pasta', 'Broccoli', 'Greek yogurt'],
  fr: ['Tomates', 'Œufs', 'Cheddar', 'Poivron', 'Lait', 'Carottes', 'Oignon', 'Blanc de poulet', 'Épinards', 'Champignons', 'Citrons', 'Pâtes', 'Brocoli', 'Yaourt grec'],
  ar: ['طماطم', 'بيض', 'جبن شيدر', 'فلفل رومي', 'حليب', 'جزر', 'بصل', 'صدر دجاج', 'سبانخ', 'فطر', 'ليمون', 'معكرونة', 'بروكلي', 'زبادي يوناني'],
};
