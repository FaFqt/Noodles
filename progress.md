Original prompt: Mettre en place la phase de serre dans l’UI. Dans un premier temps, pour tester l’UI elle sera disponible dès le premier niveau mais elle serra ensuite disponible à partir du déblocage au niveau 5.

- Added a first `GreenhousePhase` UI screen with 4 plots, seed inventory cards, Plant/Harvest buttons, and timed crop stages for corn and dragonpepper.
- Wired village navigation so the greenhouse building opens the new screen.
- Added a temporary `GREENHOUSE_UI_TEST_ENABLED` flag in `App.tsx` so the greenhouse is reachable immediately for UI testing.
- The greenhouse UI currently persists plots and test seed counts in localStorage under `greenhouse-ui-state-v1`.
- Growth timings currently match the request: 10 minutes for corn, 25 minutes for dragonpepper.
- Seed counts currently start at 2 each inside the greenhouse UI for testing.
- Refactored greenhouse layout around a centralized `UI` design-space object so plot and asset positioning can now be tuned without scattering raw pixel values through JSX.
- The seed inventory now uses a horizontally swipeable frame rail instead of boxed cards, with only corn and dragonpepper exposed for the current test flow.
- Added a dedicated `market.ts` data file with greenhouse economics (market buy price, seed price, growth time, average yield, unit greenhouse cost, resale price) plus current market-only ingredient prices.
- The greenhouse carousel now exposes the full future seed catalog with `0` counts for locked seeds, while corn and dragonpepper remain the only stocked test seeds.
- The greenhouse growth visuals now support 5 phases (0-25, 25-50, 50-75, 75-100, and 100%) with dedicated plant art for corn, bamboo, mushroom, garlic, dragonpepper, and firechili.
- Test seed stock is temporarily set to `2` for the 6 plants that already have complete growth art, so the UI can be exercised end-to-end.

TODO
- Replace the temporary test unlock flag with the real level-5 unlock gating once the UI is validated.
- Connect greenhouse planting/harvest to the canonical player inventory and eventual on-chain greenhouse state.
- Validate final layout visually on mobile and tune plot positions if the background art suggests tighter anchoring.
- Add visual affordances for multi-seed inventory paging if more than two crops are introduced later.
- Reuse `market.ts` as the single source of truth when the market screen is implemented.
- Add the same 5-phase art pipeline for goldenegg, honeybamboo, sakuramushroom, moonherb, and crystalsalt when those assets exist.
