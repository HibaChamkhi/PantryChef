import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import type { Language } from '@/types';

/**
 * Translations. Keys are grouped by screen. Plural forms use i18n-js
 * `one` / `other` with a `count` option.
 */
const en = {
  common: {
    cancel: 'Cancel', done: 'Done', save: 'Save', add: 'Add', remove: 'Remove', retry: 'Try again', clear: 'Clear',
    close: 'Close', ok: 'OK', min: 'min', servings: { one: '%{count} serving', other: '%{count} servings' },
    easy: 'Easy', medium: 'Medium', hard: 'Hard', inPantry: '%{have}/%{total} in pantry', simulated: 'Simulated',
    justNow: 'just now', minutesAgo: '%{count}m ago', hoursAgo: '%{count}h ago', daysAgo: '%{count}d ago',
    items: { one: '%{count} item', other: '%{count} items' }, recipes: { one: '%{count} recipe', other: '%{count} recipes' },
    steps: { one: '%{count} step', other: '%{count} steps' }, ingredients: { one: '%{count} ingredient', other: '%{count} ingredients' },
  },
  tabs: { pantry: 'Pantry', scan: 'Scan a dish', shopping: 'Shopping', saved: 'Saved' },
  categories: {
    produce: 'Produce', dairy: 'Dairy & eggs', meat: 'Meat & poultry', seafood: 'Seafood', grains: 'Grains & pasta',
    pantry: 'Pantry staples', spices: 'Herbs & spices', frozen: 'Frozen', beverages: 'Beverages', other: 'Other',
  },
  pantry: {
    title: 'Your pantry', emptySubtitle: 'Add what you have and we will cook something up.',
    readyToCook: '%{items} ready to cook with', expiringSoon: '%{count} expiring soon',
    clearTitle: 'Clear pantry?', clearMessage: 'This removes every item from your inventory.', clearConfirm: 'Clear all',
    addItem: 'Add item', settings: 'Settings', generate: 'Generate recipes', generateEmpty: 'Add ingredients to get recipes',
    plan: 'Plan my week', quickAddPlaceholder: 'Add an ingredient, e.g. 2 tomatoes', quickAddLabel: 'Ingredient name', quickAddButton: 'Add ingredient',
    emptyTitle: 'Your pantry is empty', emptyMessage: 'Add the ingredients you already have, by typing them or snapping a photo. Swipe an item left to remove it.',
    emptyAction: 'Add your first item', useItUp: 'Use it up', useItUpHint: 'These need eating in the next 3 days.', cookThese: 'Cook these first',
  },
  stats: { title: 'This month', used: 'used', wasted: 'wasted', added: 'added', saved: '%{percent}% of what you finished was eaten, not binned.', empty: 'Cook a recipe and mark what you used to start tracking.' },
  row: {
    remove: 'Remove', removeLabel: 'Remove %{name}', expired: 'Expired', useToday: 'Use today', useTomorrow: 'Use tomorrow',
    useInDays: 'Use in %{count} days', goodForDays: 'Good for %{count} days', decrease: 'Decrease quantity', increase: 'Increase quantity',
  },
  addItem: {
    title: 'Add to pantry', typeIt: 'Type it in', snapPhoto: 'Snap a photo', receipt: 'Receipt', ingredient: 'Ingredient',
    namePlaceholder: 'e.g. Cherry tomatoes', nameLabel: 'New ingredient name', quantity: 'Quantity', howMuch: 'How much?', category: 'Category',
    guessed: 'Guessed from the name. Tap a chip to change it.', useBy: 'Use by', noDate: 'No date', days: { one: '%{count} day', other: '%{count} days' },
    week: '1 week', twoWeeks: '2 weeks', month: '1 month', addToPantry: 'Add to pantry', scanBarcode: 'Scan a barcode instead',
    photo: 'Photo', photoTitle: 'Snap your groceries', photoHint: 'Take a photo of your shopping or your fridge shelf and we will pick out the ingredients.',
    receiptTitle: 'Snap a receipt', receiptHint: 'Photograph a grocery receipt and every line becomes a pantry item.',
    takePhoto: 'Take photo', chooseLibrary: 'Choose from library', retryAnalysis: 'Retry analysis', analyzing: 'Looking for ingredients…',
    readingReceipt: 'Reading the receipt…', found: 'Found %{count}', nothingFound: 'Nothing found',
    nothingFoundHint: 'We could not spot any food in that photo. Try another one with better light.',
    addSelected: 'Add %{count}', selectItems: 'Select items to add', differentPhoto: 'Use a different photo',
    simulatedNote: 'Simulated recognition. Add a Claude API key in .env to analyse real photos.', sure: '%{percent}% sure',
    photoAccess: 'Could not open photos', photoAccessHint: 'Check that PantryChef is allowed to access your photos in Settings.',
    cameraAccess: 'Camera access needed', cameraAccessHint: 'Allow PantryChef to use the camera in Settings.',
    cameraUnavailable: 'Camera unavailable', cameraUnavailableHint: 'No camera is available on this device. Try choosing a photo instead.',
  },
  barcode: {
    title: 'Scan a barcode', hint: 'Point the camera at the barcode on a packet. You can also type the number.',
    manualLabel: 'Barcode number', manualPlaceholder: 'e.g. 3017620422003', lookup: 'Look up', looking: 'Looking up product…',
    notFound: 'No product found for that barcode. You can still add it by name.', found: 'Found', brand: 'Brand', addToPantry: 'Add to pantry',
    cameraOff: 'Camera preview is not available here. Type the number below.', scanAgain: 'Scan another',
    networkError: 'Could not reach the product database. Check your connection.',
  },
  recipes: {
    title: 'Recipe ideas', thinking: 'Chef is thinking', thinking1: 'Checking what is expiring first…', thinking2: 'Pairing flavours that belong together…',
    thinking3: 'Writing steps a beginner can follow…', thinking4: 'Plating up three ideas…', ideasTitle: 'Three ideas for tonight',
    using: 'Using %{names}.', andMore: '%{names} and %{count} more', byClaude: 'Cooked up by Claude', offline: 'Offline chef · add an API key for AI recipes',
    snagTitle: 'The kitchen hit a snag', snagMessage: 'Something went wrong while generating recipes.', noRecipesTitle: 'No recipes yet',
    noRecipesMessage: 'Add a few more ingredients to your pantry and try again.', generateAgain: 'Generate again', regenerate: 'Regenerate recipes',
    filters: 'Filters', anyTime: 'Any time', under30: 'Under 30 min', under60: 'Under 1 hour', anyCuisine: 'Any cuisine',
    respecting: 'Respecting: %{list}', noDiet: 'No dietary limits',
  },
  cuisines: { any: 'Any cuisine', italian: 'Italian', mediterranean: 'Mediterranean', asian: 'Asian', mexican: 'Mexican', indian: 'Indian', middleEastern: 'Middle Eastern', french: 'French' },
  detail: {
    ingredients: 'Ingredients · %{have}/%{total} in your pantry', steps: 'Steps', stepsDone: '%{done}/%{steps} done', noTimer: 'No timer needed',
    start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset timer', timerDone: 'Done', ofMinutes: 'of %{count} min',
    startTimer: 'Start timer', pauseTimer: 'Pause timer', dinnerServed: 'Dinner is served', savedNote: 'This recipe is in your saved list.',
    saveHint: 'Enjoyed it? Save it for next time.', saveRecipe: 'Save recipe', removeSaved: 'Remove from saved', notFoundTitle: 'Recipe not found',
    notFoundMessage: 'This recipe is no longer available. Generate a fresh batch from your pantry.', backToPantry: 'Back to pantry',
    servings: 'Servings', addMissing: { one: 'Add %{count} missing item to shopping list', other: 'Add %{count} missing items to shopping list' },
    addedToShopping: { one: 'Added %{count} item to your shopping list.', other: 'Added %{count} items to your shopping list.' },
    allInPantry: 'You have everything for this recipe.', cookedIt: 'I cooked this', cookedTitle: 'What did you use up?',
    cookedMessage: 'Tick the pantry items you finished. We will remove them and count them as saved from the bin.',
    confirmDeduct: { one: 'Remove %{count} item', other: 'Remove %{count} items' }, keepAll: 'Keep everything', nothingMatched: 'None of your pantry items match this recipe.',
    share: 'Share recipe', shareIngredients: 'Ingredients', shareSteps: 'Steps', shareFooter: 'Made with PantryChef',
    decreaseServings: 'Fewer servings', increaseServings: 'More servings',
  },
  scan: {
    title: 'What is this dish?', subtitle: 'Snap a meal you loved and get the recipe, with what you already have marked.',
    emptyTitle: 'Point the camera at a plate', emptyHint: "Restaurant dish, a friend's cooking, a food photo. We name it and write the recipe.",
    takePhoto: 'Take photo of a dish', choosePhoto: 'Choose a dish photo', identifying: 'Identifying the dish…', looksLike: 'Looks like',
    recipesFor: 'Recipes for this dish', noRecipe: 'We could not write a recipe for this photo. Try a clearer shot of the food.',
    simulatedNote: 'Simulated recognition. Add a Claude API key in .env to identify real dishes.', scanAnother: 'Scan another dish',
  },
  shopping: {
    title: 'Shopping list', emptySubtitle: 'Missing ingredients land here.', count: { one: '%{count} to buy', other: '%{count} to buy' }, allDone: 'All bought',
    addPlaceholder: 'Add something to buy', addLabel: 'Shopping item name', addButton: 'Add to list', emptyTitle: 'Nothing to buy',
    emptyMessage: 'Open a recipe and tap "Add missing items" to fill this list, or type an item above.', moveToPantry: { one: 'Move %{count} to pantry', other: 'Move %{count} to pantry' },
    fromRecipe: 'for %{title}', clearList: 'Clear list', clearTitle: 'Clear shopping list?', clearMessage: 'Every item will be removed.', check: 'Mark %{name} as bought', uncheck: 'Mark %{name} as not bought',
  },
  saved: { title: 'Saved recipes', emptySubtitle: 'Your favourites will live here.', emptyTitle: 'No saved recipes yet', emptyMessage: 'Generate recipes from your pantry and tap the bookmark on the ones you want to keep.', goToPantry: 'Go to pantry' },
  plan: {
    title: 'Weekly plan', subtitle: 'Five dinners from your pantry, gaps go to the shopping list.', generate: 'Plan five dinners', regenerate: 'Plan again',
    thinking: 'Planning your week…', emptyTitle: 'No plan yet', emptyMessage: 'Add a few ingredients to your pantry, then plan the week in one tap.',
    addAllMissing: { one: 'Add %{count} missing item to shopping list', other: 'Add %{count} missing items to shopping list' }, allCovered: 'Your pantry covers the whole week.',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], planned: 'Planned %{date}',
  },
  settings: {
    title: 'Settings', diet: 'Diet', dietHint: 'Recipes follow this everywhere in the app.', allergies: 'Avoid', allergiesHint: 'Never suggested in recipes.',
    customAvoidPlaceholder: 'Add something else to avoid', customAvoidLabel: 'Custom avoid item', addAvoid: 'Add', language: 'Language', languageHint: 'The layout switches straight away. Restart the app once to flip the navigation bar as well.',
    reminders: 'Expiry reminders', remindersHint: 'A notification the day before something expires.', remindersOn: 'Reminders on', remindersOff: 'Reminders off',
    remindersScheduled: { one: '%{count} reminder scheduled', other: '%{count} reminders scheduled', zero: 'No reminders scheduled' }, reminderTime: 'Remind me at',
    permissionDenied: 'Notifications are off for PantryChef. Enable them in Settings to get reminders.', about: 'About', version: 'Version %{version}',
    apiKeySet: 'Claude API key configured', apiKeyMissing: 'No Claude API key. Offline chef and simulations are used.',
    diets: { none: 'No restriction', vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', halal: 'Halal', kosher: 'Kosher', glutenFree: 'Gluten free' },
    allergens: { nuts: 'Nuts', dairy: 'Dairy', gluten: 'Gluten', eggs: 'Eggs', shellfish: 'Shellfish', soy: 'Soy', sesame: 'Sesame' },
    languages: { system: 'System default', en: 'English', fr: 'Français', ar: 'العربية' },
    notificationTitle: '%{name} expires soon', notificationBody: 'Use it %{when}. Open PantryChef for recipe ideas.', today: 'today', tomorrow: 'tomorrow',
  },
  stores: {
    title: 'Where to buy', nearby: 'Nearby', online: 'Online', locating: 'Finding your location…', searching: 'Looking for supermarkets nearby…',
    noLocation: 'Location is off for PantryChef. Enable it in Settings to find stores nearby.', noStores: 'No supermarkets found within 3 km.',
    networkError: 'Could not reach the store database. Check your connection.', directions: 'Directions', call: 'Call', website: 'Website',
    count: { one: '%{count} store nearby', other: '%{count} stores nearby' }, mapLabel: 'Map of nearby supermarkets', poweredBy: 'Store data from OpenStreetMap contributors',
    onlineHint: 'Pick a shop. Your list is copied so you can paste it into the search box.', copyList: 'Copy shopping list', copied: 'List copied',
    openStore: 'Open %{name}', searchOn: 'Search "%{item}" on %{name}', emptyList: 'Your shopping list is empty. Add items first.', whereToBuy: 'Where to buy',
    listPreview: 'Your list', refresh: 'Search again',
  },
  errors: {
    generic: 'Something went wrong. Please try again.', noKey: 'No API key configured.', keyRejected: 'The Claude API key was rejected. Check EXPO_PUBLIC_ANTHROPIC_API_KEY.',
    busy: 'The chef is busy right now. Please try again in a minute.', badRequest: 'The request was rejected: %{message}', offline: 'Could not reach the Claude API. Check your connection and try again.',
    apiError: 'The Claude API returned an error (%{status}). Please try again.', cancelled: 'Cancelled.', emptyPantry: 'Add at least one ingredient to your pantry first.',
    declined: 'The chef declined this request. Try adjusting your pantry list.', incomplete: 'The answer came back incomplete. Please try again.', unreadable: 'The chef returned an unreadable answer. Please try again.',
    noSteps: 'The chef returned recipes without steps. Please try again.', photoUnreadable: 'The photo could not be read. Please try another one.', photoDeclined: 'The chef declined to analyse this photo.',
    dishFailed: 'Dish analysis failed. Please try again.', receiptFailed: 'Receipt analysis failed. Please try again.', photoFailed: 'Photo analysis failed. Please try again.', planFailed: 'Something went wrong while planning. Please try again.',
    crashTitle: 'Something burned', notFoundShelf: 'Nothing on this shelf', notFoundHint: 'The screen you were looking for does not exist.',
  },
  misc: { earlier: 'Earlier', later: 'Later', languageName: 'English' },
  units: { pcs: 'pcs', g: 'g', kg: 'kg', ml: 'ml', l: 'l', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', bunch: 'bunch', pack: 'pack' },
};

const fr: typeof en = {
  common: {
    cancel: 'Annuler', done: 'Terminé', save: 'Enregistrer', add: 'Ajouter', remove: 'Retirer', retry: 'Réessayer', clear: 'Vider',
    close: 'Fermer', ok: 'OK', min: 'min', servings: { one: '%{count} portion', other: '%{count} portions' },
    easy: 'Facile', medium: 'Moyen', hard: 'Difficile', inPantry: '%{have}/%{total} au garde-manger', simulated: 'Simulé',
    justNow: "à l'instant", minutesAgo: 'il y a %{count} min', hoursAgo: 'il y a %{count} h', daysAgo: 'il y a %{count} j',
    items: { one: '%{count} article', other: '%{count} articles' }, recipes: { one: '%{count} recette', other: '%{count} recettes' },
    steps: { one: '%{count} étape', other: '%{count} étapes' }, ingredients: { one: '%{count} ingrédient', other: '%{count} ingrédients' },
  },
  tabs: { pantry: 'Garde-manger', scan: 'Scanner un plat', shopping: 'Courses', saved: 'Favoris' },
  categories: {
    produce: 'Fruits & légumes', dairy: 'Laitages & œufs', meat: 'Viande & volaille', seafood: 'Poisson', grains: 'Céréales & pâtes',
    pantry: 'Épicerie', spices: 'Herbes & épices', frozen: 'Surgelés', beverages: 'Boissons', other: 'Autre',
  },
  pantry: {
    title: 'Votre garde-manger', emptySubtitle: 'Ajoutez ce que vous avez et on vous cuisine quelque chose.',
    readyToCook: '%{items} prêts à cuisiner', expiringSoon: '%{count} à consommer vite',
    clearTitle: 'Vider le garde-manger ?', clearMessage: 'Tous les articles seront supprimés.', clearConfirm: 'Tout vider',
    addItem: 'Ajouter', settings: 'Réglages', generate: 'Proposer des recettes', generateEmpty: 'Ajoutez des ingrédients pour des recettes',
    plan: 'Planifier ma semaine', quickAddPlaceholder: 'Ajouter un ingrédient, ex. 2 tomates', quickAddLabel: "Nom de l'ingrédient", quickAddButton: 'Ajouter un ingrédient',
    emptyTitle: 'Votre garde-manger est vide', emptyMessage: 'Ajoutez ce que vous avez déjà, en le tapant ou en prenant une photo. Glissez un article vers la gauche pour le retirer.',
    emptyAction: 'Ajouter un premier article', useItUp: 'À consommer vite', useItUpHint: 'À manger dans les 3 prochains jours.', cookThese: "Cuisiner ceux-ci d'abord",
  },
  stats: { title: 'Ce mois-ci', used: 'utilisés', wasted: 'jetés', added: 'ajoutés', saved: '%{percent}% de ce que vous avez fini a été mangé, pas jeté.', empty: 'Cuisinez une recette et cochez ce que vous avez utilisé pour commencer le suivi.' },
  row: {
    remove: 'Retirer', removeLabel: 'Retirer %{name}', expired: 'Périmé', useToday: "À utiliser aujourd'hui", useTomorrow: 'À utiliser demain',
    useInDays: 'À utiliser sous %{count} jours', goodForDays: 'Bon encore %{count} jours', decrease: 'Diminuer la quantité', increase: 'Augmenter la quantité',
  },
  addItem: {
    title: 'Ajouter au garde-manger', typeIt: 'Saisir', snapPhoto: 'Photo', receipt: 'Ticket', ingredient: 'Ingrédient',
    namePlaceholder: 'ex. Tomates cerises', nameLabel: 'Nom du nouvel ingrédient', quantity: 'Quantité', howMuch: 'Combien ?', category: 'Catégorie',
    guessed: "Deviné d'après le nom. Touchez une puce pour changer.", useBy: 'À consommer avant', noDate: 'Sans date', days: { one: '%{count} jour', other: '%{count} jours' },
    week: '1 semaine', twoWeeks: '2 semaines', month: '1 mois', addToPantry: 'Ajouter au garde-manger', scanBarcode: 'Scanner un code-barres',
    photo: 'Photo', photoTitle: 'Photographiez vos courses', photoHint: 'Prenez en photo vos courses ou une étagère du frigo et on repère les ingrédients.',
    receiptTitle: 'Photographiez un ticket', receiptHint: 'Photographiez un ticket de caisse et chaque ligne devient un article.',
    takePhoto: 'Prendre une photo', chooseLibrary: 'Choisir dans la galerie', retryAnalysis: "Relancer l'analyse", analyzing: 'Recherche des ingrédients…',
    readingReceipt: 'Lecture du ticket…', found: '%{count} trouvés', nothingFound: 'Rien trouvé',
    nothingFoundHint: "Aucun aliment repéré sur cette photo. Essayez avec plus de lumière.",
    addSelected: 'Ajouter %{count}', selectItems: 'Sélectionnez des articles', differentPhoto: 'Autre photo',
    simulatedNote: 'Reconnaissance simulée. Ajoutez une clé API Claude dans .env pour analyser de vraies photos.', sure: 'sûr à %{percent}%',
    photoAccess: "Impossible d'ouvrir les photos", photoAccessHint: 'Vérifiez que PantryChef peut accéder à vos photos dans Réglages.',
    cameraAccess: 'Accès caméra requis', cameraAccessHint: "Autorisez PantryChef à utiliser l'appareil photo dans Réglages.",
    cameraUnavailable: 'Caméra indisponible', cameraUnavailableHint: "Aucune caméra sur cet appareil. Choisissez plutôt une photo.",
  },
  barcode: {
    title: 'Scanner un code-barres', hint: 'Visez le code-barres du paquet. Vous pouvez aussi taper le numéro.',
    manualLabel: 'Numéro du code-barres', manualPlaceholder: 'ex. 3017620422003', lookup: 'Rechercher', looking: 'Recherche du produit…',
    notFound: 'Aucun produit trouvé pour ce code. Vous pouvez l’ajouter par son nom.', found: 'Trouvé', brand: 'Marque', addToPantry: 'Ajouter au garde-manger',
    cameraOff: "L'aperçu caméra n'est pas disponible ici. Tapez le numéro ci-dessous.", scanAgain: 'Scanner un autre',
    networkError: 'Base produits injoignable. Vérifiez votre connexion.',
  },
  recipes: {
    title: 'Idées de recettes', thinking: 'Le chef réfléchit', thinking1: 'On regarde ce qui périme en premier…', thinking2: 'On marie les saveurs…',
    thinking3: 'On rédige des étapes simples…', thinking4: 'On dresse trois idées…', ideasTitle: 'Trois idées pour ce soir',
    using: 'Avec %{names}.', andMore: '%{names} et %{count} autres', byClaude: 'Mijoté par Claude', offline: 'Chef hors ligne · ajoutez une clé API pour des recettes IA',
    snagTitle: 'Petit souci en cuisine', snagMessage: 'Une erreur est survenue pendant la génération.', noRecipesTitle: 'Pas encore de recettes',
    noRecipesMessage: 'Ajoutez quelques ingrédients et réessayez.', generateAgain: 'Générer à nouveau', regenerate: 'Regénérer les recettes',
    filters: 'Filtres', anyTime: 'Sans limite', under30: 'Moins de 30 min', under60: 'Moins d’1 h', anyCuisine: 'Toutes cuisines',
    respecting: 'Respecte : %{list}', noDiet: 'Sans restriction',
  },
  cuisines: { any: 'Toutes cuisines', italian: 'Italienne', mediterranean: 'Méditerranéenne', asian: 'Asiatique', mexican: 'Mexicaine', indian: 'Indienne', middleEastern: 'Moyen-Orient', french: 'Française' },
  detail: {
    ingredients: 'Ingrédients · %{have}/%{total} au garde-manger', steps: 'Étapes', stepsDone: '%{done}/%{steps} faites', noTimer: 'Pas de minuteur',
    start: 'Démarrer', pause: 'Pause', resume: 'Reprendre', reset: 'Réinitialiser le minuteur', timerDone: 'Fini', ofMinutes: 'sur %{count} min',
    startTimer: 'Démarrer le minuteur', pauseTimer: 'Mettre en pause', dinnerServed: 'À table !', savedNote: 'Cette recette est dans vos favoris.',
    saveHint: 'Vous avez aimé ? Gardez-la pour la prochaine fois.', saveRecipe: 'Enregistrer la recette', removeSaved: 'Retirer des favoris', notFoundTitle: 'Recette introuvable',
    notFoundMessage: "Cette recette n'est plus disponible. Générez-en de nouvelles.", backToPantry: 'Retour au garde-manger',
    servings: 'Portions', addMissing: { one: 'Ajouter %{count} manquant aux courses', other: 'Ajouter %{count} manquants aux courses' },
    addedToShopping: { one: '%{count} article ajouté aux courses.', other: '%{count} articles ajoutés aux courses.' },
    allInPantry: 'Vous avez tout pour cette recette.', cookedIt: "Je l'ai cuisinée", cookedTitle: "Qu'avez-vous fini ?",
    cookedMessage: 'Cochez les articles terminés. On les retire et on les compte comme sauvés de la poubelle.',
    confirmDeduct: { one: 'Retirer %{count} article', other: 'Retirer %{count} articles' }, keepAll: 'Tout garder', nothingMatched: 'Aucun article du garde-manger ne correspond.',
    share: 'Partager la recette', shareIngredients: 'Ingrédients', shareSteps: 'Étapes', shareFooter: 'Réalisé avec PantryChef',
    decreaseServings: 'Moins de portions', increaseServings: 'Plus de portions',
  },
  scan: {
    title: 'Quel est ce plat ?', subtitle: "Photographiez un plat que vous avez aimé et obtenez la recette, avec ce que vous avez déjà.",
    emptyTitle: 'Visez une assiette', emptyHint: "Plat de restaurant, cuisine d'un ami, photo de plat. On le nomme et on écrit la recette.",
    takePhoto: 'Photographier un plat', choosePhoto: 'Choisir une photo de plat', identifying: 'Identification du plat…', looksLike: 'On dirait',
    recipesFor: 'Recettes pour ce plat', noRecipe: "Impossible d'écrire une recette pour cette photo. Essayez une photo plus nette.",
    simulatedNote: 'Reconnaissance simulée. Ajoutez une clé API Claude dans .env pour identifier de vrais plats.', scanAnother: 'Scanner un autre plat',
  },
  shopping: {
    title: 'Liste de courses', emptySubtitle: 'Les ingrédients manquants arrivent ici.', count: { one: '%{count} à acheter', other: '%{count} à acheter' }, allDone: 'Tout est acheté',
    addPlaceholder: 'Ajouter un article à acheter', addLabel: "Nom de l'article", addButton: 'Ajouter à la liste', emptyTitle: 'Rien à acheter',
    emptyMessage: 'Ouvrez une recette et touchez « Ajouter les manquants », ou tapez un article ci-dessus.', moveToPantry: { one: 'Ranger %{count} au garde-manger', other: 'Ranger %{count} au garde-manger' },
    fromRecipe: 'pour %{title}', clearList: 'Vider la liste', clearTitle: 'Vider la liste ?', clearMessage: 'Tous les articles seront retirés.', check: 'Marquer %{name} comme acheté', uncheck: 'Marquer %{name} comme non acheté',
  },
  saved: { title: 'Recettes favorites', emptySubtitle: 'Vos favoris vivront ici.', emptyTitle: 'Aucune recette favorite', emptyMessage: 'Générez des recettes et touchez le marque-page sur celles à garder.', goToPantry: 'Aller au garde-manger' },
  plan: {
    title: 'Plan de la semaine', subtitle: 'Cinq dîners avec votre garde-manger, le reste part en courses.', generate: 'Planifier cinq dîners', regenerate: 'Replanifier',
    thinking: 'Planification en cours…', emptyTitle: 'Pas encore de plan', emptyMessage: 'Ajoutez quelques ingrédients, puis planifiez la semaine en un geste.',
    addAllMissing: { one: 'Ajouter %{count} manquant aux courses', other: 'Ajouter %{count} manquants aux courses' }, allCovered: 'Votre garde-manger couvre toute la semaine.',
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], planned: 'Planifié le %{date}',
  },
  settings: {
    title: 'Réglages', diet: 'Régime', dietHint: 'Les recettes le respectent partout dans l’app.', allergies: 'À éviter', allergiesHint: 'Jamais proposés dans les recettes.',
    customAvoidPlaceholder: 'Autre chose à éviter', customAvoidLabel: 'Aliment à éviter', addAvoid: 'Ajouter', language: 'Langue', languageHint: "La mise en page change tout de suite. Redémarrez l'app une fois pour inverser aussi la barre de navigation.",
    reminders: 'Rappels de péremption', remindersHint: 'Une notification la veille de la date limite.', remindersOn: 'Rappels activés', remindersOff: 'Rappels désactivés',
    remindersScheduled: { one: '%{count} rappel programmé', other: '%{count} rappels programmés', zero: 'Aucun rappel programmé' }, reminderTime: 'Me rappeler à',
    permissionDenied: 'Les notifications sont désactivées pour PantryChef. Activez-les dans Réglages.', about: 'À propos', version: 'Version %{version}',
    apiKeySet: 'Clé API Claude configurée', apiKeyMissing: 'Pas de clé API Claude. Chef hors ligne et simulations utilisés.',
    diets: { none: 'Sans restriction', vegetarian: 'Végétarien', vegan: 'Végan', pescatarian: 'Pescétarien', halal: 'Halal', kosher: 'Casher', glutenFree: 'Sans gluten' },
    allergens: { nuts: 'Fruits à coque', dairy: 'Laitages', gluten: 'Gluten', eggs: 'Œufs', shellfish: 'Crustacés', soy: 'Soja', sesame: 'Sésame' },
    languages: { system: 'Langue du système', en: 'English', fr: 'Français', ar: 'العربية' },
    notificationTitle: '%{name} périme bientôt', notificationBody: 'À utiliser %{when}. Ouvrez PantryChef pour des idées.', today: "aujourd'hui", tomorrow: 'demain',
  },
  stores: {
    title: 'Où acheter', nearby: 'À proximité', online: 'En ligne', locating: 'Recherche de votre position…', searching: 'Recherche de supermarchés à proximité…',
    noLocation: 'La localisation est désactivée pour PantryChef. Activez-la dans Réglages pour trouver des magasins.', noStores: 'Aucun supermarché trouvé à moins de 3 km.',
    networkError: 'Base des magasins injoignable. Vérifiez votre connexion.', directions: 'Itinéraire', call: 'Appeler', website: 'Site web',
    count: { one: '%{count} magasin à proximité', other: '%{count} magasins à proximité' }, mapLabel: 'Carte des supermarchés proches', poweredBy: 'Données des contributeurs OpenStreetMap',
    onlineHint: 'Choisissez une enseigne. Votre liste est copiée pour la coller dans la recherche.', copyList: 'Copier la liste de courses', copied: 'Liste copiée',
    openStore: 'Ouvrir %{name}', searchOn: 'Chercher « %{item} » sur %{name}', emptyList: 'Votre liste de courses est vide. Ajoutez des articles.', whereToBuy: 'Où acheter',
    listPreview: 'Votre liste', refresh: 'Relancer la recherche',
  },
  errors: {
    generic: 'Une erreur est survenue. Réessayez.', noKey: 'Aucune clé API configurée.', keyRejected: 'La clé API Claude a été refusée. Vérifiez EXPO_PUBLIC_ANTHROPIC_API_KEY.',
    busy: 'Le chef est occupé. Réessayez dans une minute.', badRequest: 'Requête refusée : %{message}', offline: "Impossible de joindre l'API Claude. Vérifiez votre connexion et réessayez.",
    apiError: "L'API Claude a renvoyé une erreur (%{status}). Réessayez.", cancelled: 'Annulé.', emptyPantry: "Ajoutez d'abord au moins un ingrédient à votre garde-manger.",
    declined: 'Le chef a refusé cette demande. Ajustez votre liste.', incomplete: 'La réponse est incomplète. Réessayez.', unreadable: 'Le chef a renvoyé une réponse illisible. Réessayez.',
    noSteps: 'Le chef a renvoyé des recettes sans étapes. Réessayez.', photoUnreadable: 'La photo est illisible. Essayez-en une autre.', photoDeclined: "Le chef a refusé d'analyser cette photo.",
    dishFailed: "L'analyse du plat a échoué. Réessayez.", receiptFailed: "L'analyse du ticket a échoué. Réessayez.", photoFailed: "L'analyse de la photo a échoué. Réessayez.", planFailed: 'Une erreur est survenue pendant la planification. Réessayez.',
    crashTitle: 'Quelque chose a brûlé', notFoundShelf: 'Rien sur cette étagère', notFoundHint: "L'écran que vous cherchez n'existe pas.",
  },
  misc: { earlier: 'Plus tôt', later: 'Plus tard', languageName: 'French' },
  units: { pcs: 'pcs', g: 'g', kg: 'kg', ml: 'ml', l: 'l', cup: 'tasse', tbsp: 'c. à s.', tsp: 'c. à c.', bunch: 'botte', pack: 'paquet' },
};

const ar: typeof en = {
  common: {
    cancel: 'إلغاء', done: 'تم', save: 'حفظ', add: 'إضافة', remove: 'إزالة', retry: 'حاول مجددًا', clear: 'مسح',
    close: 'إغلاق', ok: 'حسنًا', min: 'د', servings: { one: 'حصة واحدة', other: '%{count} حصص' },
    easy: 'سهل', medium: 'متوسط', hard: 'صعب', inPantry: '%{have}/%{total} في المخزن', simulated: 'محاكاة',
    justNow: 'الآن', minutesAgo: 'منذ %{count} د', hoursAgo: 'منذ %{count} س', daysAgo: 'منذ %{count} ي',
    items: { one: 'عنصر واحد', other: '%{count} عناصر' }, recipes: { one: 'وصفة واحدة', other: '%{count} وصفات' },
    steps: { one: 'خطوة واحدة', other: '%{count} خطوات' }, ingredients: { one: 'مكوّن واحد', other: '%{count} مكوّنات' },
  },
  tabs: { pantry: 'المخزن', scan: 'مسح طبق', shopping: 'التسوق', saved: 'المحفوظات' },
  categories: {
    produce: 'خضار وفواكه', dairy: 'ألبان وبيض', meat: 'لحوم ودواجن', seafood: 'مأكولات بحرية', grains: 'حبوب ومعكرونة',
    pantry: 'مواد أساسية', spices: 'أعشاب وتوابل', frozen: 'مجمدات', beverages: 'مشروبات', other: 'أخرى',
  },
  pantry: {
    title: 'مخزنك', emptySubtitle: 'أضف ما لديك وسنطبخ لك شيئًا.',
    readyToCook: '%{items} جاهزة للطبخ', expiringSoon: '%{count} تنتهي قريبًا',
    clearTitle: 'مسح المخزن؟', clearMessage: 'سيُحذف كل عنصر من المخزون.', clearConfirm: 'مسح الكل',
    addItem: 'إضافة عنصر', settings: 'الإعدادات', generate: 'اقترح وصفات', generateEmpty: 'أضف مكوّنات للحصول على وصفات',
    plan: 'خطّط أسبوعي', quickAddPlaceholder: 'أضف مكوّنًا، مثل: 2 طماطم', quickAddLabel: 'اسم المكوّن', quickAddButton: 'إضافة مكوّن',
    emptyTitle: 'مخزنك فارغ', emptyMessage: 'أضف المكوّنات التي لديك بالكتابة أو بالتقاط صورة. اسحب العنصر يسارًا لإزالته.',
    emptyAction: 'أضف أول عنصر', useItUp: 'استهلكه الآن', useItUpHint: 'يجب أكل هذه خلال 3 أيام.', cookThese: 'اطبخ هذه أولًا',
  },
  stats: { title: 'هذا الشهر', used: 'مستخدمة', wasted: 'مهدرة', added: 'مضافة', saved: '%{percent}% مما أنهيته أُكل ولم يُرمَ.', empty: 'اطبخ وصفة وحدّد ما استخدمته لبدء التتبع.' },
  row: {
    remove: 'إزالة', removeLabel: 'إزالة %{name}', expired: 'منتهي', useToday: 'استخدمه اليوم', useTomorrow: 'استخدمه غدًا',
    useInDays: 'استخدمه خلال %{count} أيام', goodForDays: 'صالح لمدة %{count} أيام', decrease: 'تقليل الكمية', increase: 'زيادة الكمية',
  },
  addItem: {
    title: 'إضافة إلى المخزن', typeIt: 'اكتبه', snapPhoto: 'التقط صورة', receipt: 'فاتورة', ingredient: 'المكوّن',
    namePlaceholder: 'مثال: طماطم كرزية', nameLabel: 'اسم المكوّن الجديد', quantity: 'الكمية', howMuch: 'كم؟', category: 'الفئة',
    guessed: 'خُمّنت من الاسم. اضغط على خيار لتغييرها.', useBy: 'يُستهلك قبل', noDate: 'بدون تاريخ', days: { one: 'يوم واحد', other: '%{count} أيام' },
    week: 'أسبوع', twoWeeks: 'أسبوعان', month: 'شهر', addToPantry: 'إضافة إلى المخزن', scanBarcode: 'امسح باركود بدلًا من ذلك',
    photo: 'صورة', photoTitle: 'صوّر مشترياتك', photoHint: 'التقط صورة لمشترياتك أو رف الثلاجة وسنتعرّف على المكوّنات.',
    receiptTitle: 'صوّر فاتورة', receiptHint: 'صوّر فاتورة البقالة وسيصبح كل سطر عنصرًا في المخزن.',
    takePhoto: 'التقط صورة', chooseLibrary: 'اختر من المكتبة', retryAnalysis: 'إعادة التحليل', analyzing: 'جارٍ البحث عن المكوّنات…',
    readingReceipt: 'جارٍ قراءة الفاتورة…', found: 'وُجد %{count}', nothingFound: 'لم يُعثر على شيء',
    nothingFoundHint: 'لم نرصد طعامًا في هذه الصورة. جرّب صورة بإضاءة أفضل.',
    addSelected: 'إضافة %{count}', selectItems: 'اختر عناصر للإضافة', differentPhoto: 'استخدم صورة أخرى',
    simulatedNote: 'تعرّف محاكى. أضف مفتاح Claude API في .env لتحليل صور حقيقية.', sure: 'بنسبة %{percent}%',
    photoAccess: 'تعذّر فتح الصور', photoAccessHint: 'تأكد من السماح لـ PantryChef بالوصول إلى صورك في الإعدادات.',
    cameraAccess: 'مطلوب الوصول للكاميرا', cameraAccessHint: 'اسمح لـ PantryChef باستخدام الكاميرا من الإعدادات.',
    cameraUnavailable: 'الكاميرا غير متاحة', cameraUnavailableHint: 'لا توجد كاميرا على هذا الجهاز. اختر صورة بدلًا من ذلك.',
  },
  barcode: {
    title: 'مسح باركود', hint: 'وجّه الكاميرا نحو الباركود على العبوة. يمكنك أيضًا كتابة الرقم.',
    manualLabel: 'رقم الباركود', manualPlaceholder: 'مثال: 3017620422003', lookup: 'بحث', looking: 'جارٍ البحث عن المنتج…',
    notFound: 'لم يُعثر على منتج بهذا الرقم. يمكنك إضافته بالاسم.', found: 'وُجد', brand: 'العلامة', addToPantry: 'إضافة إلى المخزن',
    cameraOff: 'معاينة الكاميرا غير متاحة هنا. اكتب الرقم أدناه.', scanAgain: 'امسح آخر',
    networkError: 'تعذّر الوصول إلى قاعدة المنتجات. تحقق من الاتصال.',
  },
  recipes: {
    title: 'أفكار وصفات', thinking: 'الشيف يفكّر', thinking1: 'نتحقق مما ينتهي أولًا…', thinking2: 'نوفّق بين النكهات…',
    thinking3: 'نكتب خطوات يفهمها المبتدئ…', thinking4: 'نقدّم ثلاث أفكار…', ideasTitle: 'ثلاث أفكار لهذه الليلة',
    using: 'باستخدام %{names}.', andMore: '%{names} و%{count} أخرى', byClaude: 'من إعداد Claude', offline: 'شيف بلا اتصال · أضف مفتاح API لوصفات ذكية',
    snagTitle: 'حدث خلل في المطبخ', snagMessage: 'حدث خطأ أثناء توليد الوصفات.', noRecipesTitle: 'لا وصفات بعد',
    noRecipesMessage: 'أضف بعض المكوّنات إلى مخزنك وحاول مجددًا.', generateAgain: 'توليد مجددًا', regenerate: 'إعادة توليد الوصفات',
    filters: 'تصفية', anyTime: 'أي وقت', under30: 'أقل من 30 د', under60: 'أقل من ساعة', anyCuisine: 'أي مطبخ',
    respecting: 'مراعاة: %{list}', noDiet: 'بلا قيود غذائية',
  },
  cuisines: { any: 'أي مطبخ', italian: 'إيطالي', mediterranean: 'متوسطي', asian: 'آسيوي', mexican: 'مكسيكي', indian: 'هندي', middleEastern: 'شرق أوسطي', french: 'فرنسي' },
  detail: {
    ingredients: 'المكوّنات · %{have}/%{total} في مخزنك', steps: 'الخطوات', stepsDone: '%{done}/%{steps} أُنجزت', noTimer: 'لا يحتاج مؤقتًا',
    start: 'ابدأ', pause: 'إيقاف', resume: 'استئناف', reset: 'إعادة ضبط المؤقت', timerDone: 'انتهى', ofMinutes: 'من %{count} د',
    startTimer: 'تشغيل المؤقت', pauseTimer: 'إيقاف المؤقت', dinnerServed: 'العشاء جاهز', savedNote: 'هذه الوصفة في محفوظاتك.',
    saveHint: 'أعجبتك؟ احفظها للمرة القادمة.', saveRecipe: 'حفظ الوصفة', removeSaved: 'إزالة من المحفوظات', notFoundTitle: 'الوصفة غير موجودة',
    notFoundMessage: 'هذه الوصفة لم تعد متاحة. ولّد دفعة جديدة من مخزنك.', backToPantry: 'العودة إلى المخزن',
    servings: 'الحصص', addMissing: { one: 'أضف %{count} عنصرًا ناقصًا إلى التسوق', other: 'أضف %{count} عناصر ناقصة إلى التسوق' },
    addedToShopping: { one: 'أُضيف عنصر إلى قائمة التسوق.', other: 'أُضيفت %{count} عناصر إلى قائمة التسوق.' },
    allInPantry: 'لديك كل ما تحتاجه لهذه الوصفة.', cookedIt: 'طبختها', cookedTitle: 'ماذا استهلكت؟',
    cookedMessage: 'حدّد عناصر المخزن التي أنهيتها. سنزيلها ونحسبها كمنقذة من سلة المهملات.',
    confirmDeduct: { one: 'إزالة عنصر واحد', other: 'إزالة %{count} عناصر' }, keepAll: 'احتفظ بالكل', nothingMatched: 'لا يطابق أي عنصر في مخزنك هذه الوصفة.',
    share: 'مشاركة الوصفة', shareIngredients: 'المكوّنات', shareSteps: 'الخطوات', shareFooter: 'صُنع بواسطة PantryChef',
    decreaseServings: 'حصص أقل', increaseServings: 'حصص أكثر',
  },
  scan: {
    title: 'ما هذا الطبق؟', subtitle: 'صوّر وجبة أحببتها واحصل على الوصفة مع تحديد ما لديك.',
    emptyTitle: 'وجّه الكاميرا نحو الطبق', emptyHint: 'طبق مطعم، طبخ صديق، صورة طعام. نسمّيه ونكتب الوصفة.',
    takePhoto: 'صوّر طبقًا', choosePhoto: 'اختر صورة طبق', identifying: 'جارٍ التعرّف على الطبق…', looksLike: 'يبدو أنه',
    recipesFor: 'وصفات لهذا الطبق', noRecipe: 'تعذّر كتابة وصفة لهذه الصورة. جرّب صورة أوضح للطعام.',
    simulatedNote: 'تعرّف محاكى. أضف مفتاح Claude API في .env للتعرّف على أطباق حقيقية.', scanAnother: 'امسح طبقًا آخر',
  },
  shopping: {
    title: 'قائمة التسوق', emptySubtitle: 'المكوّنات الناقصة تظهر هنا.', count: { one: 'عنصر واحد للشراء', other: '%{count} للشراء' }, allDone: 'اشتريت كل شيء',
    addPlaceholder: 'أضف شيئًا لشرائه', addLabel: 'اسم عنصر التسوق', addButton: 'إضافة إلى القائمة', emptyTitle: 'لا شيء للشراء',
    emptyMessage: 'افتح وصفة واضغط «أضف العناصر الناقصة» لملء القائمة، أو اكتب عنصرًا أعلاه.', moveToPantry: { one: 'انقل عنصرًا إلى المخزن', other: 'انقل %{count} إلى المخزن' },
    fromRecipe: 'لـ %{title}', clearList: 'مسح القائمة', clearTitle: 'مسح قائمة التسوق؟', clearMessage: 'سيُزال كل عنصر.', check: 'تحديد %{name} كمُشترى', uncheck: 'تحديد %{name} كغير مُشترى',
  },
  saved: { title: 'الوصفات المحفوظة', emptySubtitle: 'مفضلاتك ستكون هنا.', emptyTitle: 'لا وصفات محفوظة بعد', emptyMessage: 'ولّد وصفات من مخزنك واضغط على علامة الحفظ للاحتفاظ بها.', goToPantry: 'اذهب إلى المخزن' },
  plan: {
    title: 'خطة الأسبوع', subtitle: 'خمسة عشاءات من مخزنك، والنواقص تذهب إلى التسوق.', generate: 'خطّط خمسة عشاءات', regenerate: 'خطّط مجددًا',
    thinking: 'جارٍ تخطيط أسبوعك…', emptyTitle: 'لا خطة بعد', emptyMessage: 'أضف بعض المكوّنات إلى مخزنك ثم خطّط الأسبوع بضغطة.',
    addAllMissing: { one: 'أضف عنصرًا ناقصًا إلى التسوق', other: 'أضف %{count} عناصر ناقصة إلى التسوق' }, allCovered: 'مخزنك يغطي الأسبوع كله.',
    days: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'], planned: 'خُطّط في %{date}',
  },
  settings: {
    title: 'الإعدادات', diet: 'النظام الغذائي', dietHint: 'تلتزم الوصفات به في كل التطبيق.', allergies: 'تجنّب', allergiesHint: 'لن تُقترح في الوصفات أبدًا.',
    customAvoidPlaceholder: 'أضف شيئًا آخر لتجنّبه', customAvoidLabel: 'عنصر مخصص لتجنّبه', addAvoid: 'إضافة', language: 'اللغة', languageHint: 'تتبدّل الواجهة فورًا. أعد تشغيل التطبيق مرة واحدة لقلب شريط التنقل أيضًا.',
    reminders: 'تذكيرات الانتهاء', remindersHint: 'إشعار قبل يوم من انتهاء صلاحية عنصر.', remindersOn: 'التذكيرات مفعّلة', remindersOff: 'التذكيرات معطّلة',
    remindersScheduled: { one: 'تذكير واحد مجدول', other: '%{count} تذكيرات مجدولة', zero: 'لا تذكيرات مجدولة' }, reminderTime: 'ذكّرني في',
    permissionDenied: 'الإشعارات معطّلة لـ PantryChef. فعّلها من الإعدادات للحصول على تذكيرات.', about: 'حول', version: 'الإصدار %{version}',
    apiKeySet: 'مفتاح Claude API مضبوط', apiKeyMissing: 'لا مفتاح Claude API. يُستخدم الشيف بلا اتصال والمحاكاة.',
    diets: { none: 'بلا قيود', vegetarian: 'نباتي', vegan: 'نباتي صرف', pescatarian: 'نباتي مع سمك', halal: 'حلال', kosher: 'كوشر', glutenFree: 'خالٍ من الغلوتين' },
    allergens: { nuts: 'مكسرات', dairy: 'ألبان', gluten: 'غلوتين', eggs: 'بيض', shellfish: 'قشريات', soy: 'صويا', sesame: 'سمسم' },
    languages: { system: 'لغة النظام', en: 'English', fr: 'Français', ar: 'العربية' },
    notificationTitle: '%{name} ينتهي قريبًا', notificationBody: 'استخدمه %{when}. افتح PantryChef لأفكار وصفات.', today: 'اليوم', tomorrow: 'غدًا',
  },
  stores: {
    title: 'أين تشتري', nearby: 'قريب', online: 'عبر الإنترنت', locating: 'جارٍ تحديد موقعك…', searching: 'جارٍ البحث عن متاجر قريبة…',
    noLocation: 'الموقع معطّل لـ PantryChef. فعّله من الإعدادات للعثور على متاجر قريبة.', noStores: 'لم يُعثر على متاجر ضمن 3 كم.',
    networkError: 'تعذّر الوصول إلى قاعدة المتاجر. تحقق من الاتصال.', directions: 'الاتجاهات', call: 'اتصال', website: 'الموقع',
    count: { one: 'متجر واحد قريب', other: '%{count} متاجر قريبة' }, mapLabel: 'خريطة المتاجر القريبة', poweredBy: 'بيانات المتاجر من مساهمي OpenStreetMap',
    onlineHint: 'اختر متجرًا. قائمتك منسوخة لتلصقها في مربع البحث.', copyList: 'نسخ قائمة التسوق', copied: 'تم نسخ القائمة',
    openStore: 'فتح %{name}', searchOn: 'ابحث عن «%{item}» في %{name}', emptyList: 'قائمة التسوق فارغة. أضف عناصر أولًا.', whereToBuy: 'أين تشتري',
    listPreview: 'قائمتك', refresh: 'ابحث مجددًا',
  },
  errors: {
    generic: 'حدث خطأ ما. حاول مجددًا.', noKey: 'لم يُضبط مفتاح API.', keyRejected: 'رُفض مفتاح Claude API. تحقق من EXPO_PUBLIC_ANTHROPIC_API_KEY.',
    busy: 'الشيف مشغول الآن. حاول بعد دقيقة.', badRequest: 'رُفض الطلب: %{message}', offline: 'تعذّر الوصول إلى Claude API. تحقق من الاتصال وحاول مجددًا.',
    apiError: 'أعاد Claude API خطأ (%{status}). حاول مجددًا.', cancelled: 'أُلغي.', emptyPantry: 'أضف مكوّنًا واحدًا على الأقل إلى مخزنك أولًا.',
    declined: 'رفض الشيف هذا الطلب. عدّل قائمة مخزنك.', incomplete: 'عادت الإجابة ناقصة. حاول مجددًا.', unreadable: 'أعاد الشيف إجابة غير مقروءة. حاول مجددًا.',
    noSteps: 'أعاد الشيف وصفات بلا خطوات. حاول مجددًا.', photoUnreadable: 'تعذّرت قراءة الصورة. جرّب صورة أخرى.', photoDeclined: 'رفض الشيف تحليل هذه الصورة.',
    dishFailed: 'فشل تحليل الطبق. حاول مجددًا.', receiptFailed: 'فشل تحليل الفاتورة. حاول مجددًا.', photoFailed: 'فشل تحليل الصورة. حاول مجددًا.', planFailed: 'حدث خطأ أثناء التخطيط. حاول مجددًا.',
    crashTitle: 'شيء ما احترق', notFoundShelf: 'لا شيء على هذا الرف', notFoundHint: 'الشاشة التي تبحث عنها غير موجودة.',
  },
  misc: { earlier: 'أبكر', later: 'لاحقًا', languageName: 'Arabic' },
  units: { pcs: 'قطعة', g: 'غ', kg: 'كغ', ml: 'مل', l: 'ل', cup: 'كوب', tbsp: 'م.ك', tsp: 'م.ص', bunch: 'حزمة', pack: 'عبوة' },
};

export const i18n = new I18n({ en, fr, ar });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const SUPPORTED_LOCALES = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Resolves the effective locale from the user's setting and the device. */
export function resolveLocale(language: Language): Locale {
  if (language !== 'system') return language;
  const device = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as readonly string[]).includes(device) ? (device as Locale) : 'en';
}

export function applyLocale(locale: Locale): void {
  i18n.locale = locale;
}

export function currentLocale(): Locale {
  return (i18n.locale as Locale) ?? 'en';
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === 'ar';
}

/** Translate helper. Values interpolate as %{name}; pass `count` for plurals. */
export function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options);
}

/** Localised short label for a quantity unit. */
export function unitLabel(unit: string): string {
  return i18n.t(`units.${unit}`, { defaultValue: unit });
}

/** English name of the active language, for model prompts. */
export function languageName(): string {
  return i18n.t('misc.languageName');
}

/** Localised day names for the weekly plan, Monday first. */
export function dayName(weekday: number): string {
  const days = i18n.t('plan.days') as unknown;
  return Array.isArray(days) ? String(days[weekday] ?? '') : '';
}

applyLocale(resolveLocale('system'));
