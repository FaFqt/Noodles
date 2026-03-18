# Noodles

A cozy ramen game prototype built with React, Vite, and Starknet experiments.

Players move through a lightweight gameplay loop: pick a recipe, prepare ingredients, stir the broth, finish the topping gesture, then earn rewards based on speed and quality. The project mixes playful mobile-game UI with early onchain integration work in Cairo/Starknet.

## Overview

`Noodles` is a front-end game prototype with several handcrafted gameplay phases:

- `Splash` and `Village` entry flow
- `Restaurant` hub and recipe selection
- `CookingPhase` for ingredient assembly
- `BrothStirPhase` for rhythm-based broth stirring
- `ServicePhase` for topping/service gesture completion
- `Satisfaction` and `Reward` screens for end-of-run feedback

The repository also includes Cairo contracts and Starknet-related utilities for future gameplay or reward integrations.

## Features

- Bilingual UI support with French and English text
- Multiple ramen recipes with ingredients, rewards, and timers
- Touch-friendly minigames based on drag, stir, and swipe interactions
- Player progression with coins, XP, levels, and service results
- Reward flow and daily service progression
- Cairo contract scaffold for Starknet integration

## Tech Stack

- React 18
- TypeScript
- Vite
- Motion
- Tailwind CSS
- Cairo / Scarb / Starknet Foundry

## Project Structure

```text
src/
  app/
    App.tsx                  # Main game state machine and flow
    components/              # Screens, minigames, shared UI
    context/                 # Language context
    data/                    # Recipes and gameplay data
  assets/                    # UI, screens, ingredients, rewards
  contracts/                 # Cairo contract sources
  hooks/                     # Wallet and contract hooks
  services/                  # Starknet service layer

tests/
  test_noodles_game.cairo    # Cairo test example
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run the front-end locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Cairo and Starknet Commands

If you want to work on the onchain side too:

```bash
npm run cairo-build
npm run cairo-test
npm run starknet-test
```

Helper install scripts are also available:

```bash
npm run install-scarb
npm run install-starknet-foundry
```

## Gameplay Flow

1. Enter the village and access the restaurant.
2. Choose one of the available ramen recipes.
3. Complete the ingredient selection phase.
4. Stir the broth with the requested rhythm and direction.
5. Finish service with the topping swipe gesture.
6. Receive quality-based rewards and progression.

## Notes

- The UI is strongly inspired by a mobile-game presentation style.
- The repo still contains prototype elements and iteration traces from active development.
- Figma was used as an early design reference for parts of the interface flow.

## Related Files

- [App.tsx](src/app/App.tsx)
- [recipes.ts](src/app/data/recipes.ts)
- [NoodlesGame.cairo](src/contracts/NoodlesGame.cairo)
- [STARKNET_INTEGRATION.md](STARKNET_INTEGRATION.md)

## Contributing

Ideas, polish passes, gameplay tweaks, and Starknet integration improvements are all welcome. If you fork the project, feel free to tailor the balancing, visuals, or progression systems to your own ramen universe.

## License

No license is currently defined in this repository.
