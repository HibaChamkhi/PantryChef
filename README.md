# PantryChef

Reduce food waste by turning what is already in your fridge into recipes.

Built with Expo SDK 54, Expo Router, TypeScript, NativeWind, and Zustand.

## Run it

```bash
npm install
npx expo run:ios        # builds the native app and opens the simulator
```

After the first native build, `npx expo start` is enough for day-to-day development.

## Features

- **Pantry** with quick add, quantity steppers, expiry hints, swipe to remove, a "Use it up"
  strip for items expiring within three days, and a monthly used-versus-wasted tracker.
- **Add items** by typing, by photographing groceries, by photographing a receipt, or by
  scanning a barcode (Open Food Facts lookup, with manual entry).
- **Recipes** from your pantry, three at a time, with time and cuisine filters, respecting
  the diet and avoid list from Settings. Servings scale the amounts.
- **Cooking view** with step timers, "add missing items to shopping list", "I cooked this"
  to deduct what you used, and sharing.
- **Shopping list** that moves bought items straight into the pantry, plus **Where to buy**:
  supermarkets near you on a map with distances and directions (OpenStreetMap data), and
  region-aware online grocers that open with your list copied to the clipboard.
- **Weekly plan** of five dinners with a one-tap shopping list for the gaps.
- **Scan a dish** to identify a meal and get its recipe.
- **Expiry reminders** as local notifications the day before something expires.
- **English, French, and Arabic** with a language switch in Settings.

## Scan a dish

The Scan tab takes a photo of a cooked meal, names the dish, and writes recipes
for it, marking ingredients you already have. With a Claude API key the photo is
analysed by Claude; without one a deterministic simulation picks from a set of
classic dishes so the flow still works offline.

## AI recipes and photo recognition

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_ANTHROPIC_API_KEY`. With a key,
recipes come from Claude and photos are analysed for ingredients. Without one,
the app falls back to a built-in offline chef and a simulated photo scan, so every
screen still works.

Keys prefixed `EXPO_PUBLIC_` are bundled into the app. Use a backend proxy before
shipping publicly.

## End-to-end UI tests

With Metro running (`npx expo start`) and the iPhone 17 Pro simulator available:

```bash
npm run test:ui
```

This injects an XCUITest target into the generated iOS project (sources in
`e2e/ios/`) and drives the real app: quick add, quantity stepper, the Add Item
form, the photo scan, recipe generation, the cooking view with timers, saving,
swipe to remove, and the dish scan. It expects no API key so the offline chef answers.

## Branding

The logo sources are SVGs in `assets/brand/`. The PNGs in `assets/` (icon,
Android adaptive layers, splash, favicon) are rendered from them at 1024px.
After changing them run `npx expo prebuild --platform ios --clean` and rebuild.

## Structure

- `app/` routes: pantry and saved tabs, add-item modal, recipe list and detail
- `components/` UI kit, inventory rows, recipe cards, step timers
- `store/` persisted Zustand stores (inventory, recipes)
- `services/` Claude API client, offline chef, photo recognition
