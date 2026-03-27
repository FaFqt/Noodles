Original prompt: Mettre en place la phase de serre dans l’UI. Dans un premier temps, pour tester l’UI elle sera disponible dès le premier niveau mais elle serra ensuite disponible à partir du déblocage au niveau 5.

- Added a first `GreenhousePhase` UI screen with 4 plots, seed inventory cards, Plant/Harvest buttons, and timed crop stages for corn and dragonpepper.
- Wired village navigation so the greenhouse building opens the new screen.
- Added a temporary `GREENHOUSE_UI_TEST_ENABLED` flag in `App.tsx` so the greenhouse is reachable immediately for UI testing.
- The greenhouse UI currently persists plots and test seed counts in localStorage under `greenhouse-ui-state-v1`.
- Growth timings currently match the request: 10 minutes for corn, 25 minutes for dragonpepper.
- Seed counts currently start at 2 each inside the greenhouse UI for testing.
- Refactored greenhouse layout around a centralized `UI` design-space object so plot and asset positioning can now be tuned without scattering raw pixel values through JSX.
- The seed inventory now uses a horizontally swipeable frame rail instead of boxed cards, with only corn and dragonpepper exposed for the current test flow.

TODO
- Replace the temporary test unlock flag with the real level-5 unlock gating once the UI is validated.
- Connect greenhouse planting/harvest to the canonical player inventory and eventual on-chain greenhouse state.
- Validate final layout visually on mobile and tune plot positions if the background art suggests tighter anchoring.
- Add visual affordances for multi-seed inventory paging if more than two crops are introduced later.
