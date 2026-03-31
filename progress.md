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

Update
- Replaced the temporary market price tables with an interactive market scene using the `Bench*.png` ingredient art, `SeedNum` price bubbles, a drag-to-cart flow, and a `HarvestButton` purchase CTA showing the current total.
- Market purchases now spend local `Noods`, queue a progress sync, and populate a hidden player market inventory that includes the current common buyable ingredients from both greenhouse and restaurant market sets.
- The hidden market inventory now tracks `corn`, `bamboo`, `mushroom`, `garlic`, `egg`, `pork`, `chicken`, `tofu`, and `shrimp`.

TODO
- Validate the drag-and-drop flow on a real mobile device and tune cart hitbox / button spacing if needed.
- Add visual feedback for insufficient funds directly on the buy button if the current text hint is not explicit enough.
- Expose the hidden market inventory to the rest of the game once recipe consumption and inventory UI are ready.

Update
- Refactored the market scene to use `MarketScreen` as the full background, `Box_Market_price` for product cards, a transparent basket drop zone over the decor basket, and `SuperButton` actions for both stock access and purchase validation.
- Added a rotating common market selection: 4 ingredient types per 2-hour cycle, each capped at `10` units for the active rotation, with local wallet-scoped persistence via a dedicated market UI storage key.
- Added a quick stock screen inside the market flow so players can inspect the hidden market inventory already accumulated from purchases, then return directly to the market.

Update
- Activated the real ingredient-inventory gameplay loop from the market unlock onward: before market unlock the recipe flow ignores ingredient stock, after unlock recipes become stock-gated and consume ingredients when cooking starts.
- Added a starter ingredient pack at inventory activation so the player can cover five recipes broadly while `corn` is intentionally capped to create the first supply bottleneck; reconnect-safe persistence now tracks whether that starter pack was already granted for the wallet.
- Restaurant now exposes a direct inventory button once the market is unlocked, shows a stock warning when no recipe can be crafted, and blocks entering the next recipe-selection step until the player restocks through the market or greenhouse.
- Greenhouse harvest now also feeds the player ingredient inventory for common crops using the configured average yield, while still returning the seed to preserve the farming loop.

TODO
- Validate the exact placement of the 4 offer cards against the provided PDF mockup on a real handset and fine-tune coordinates if the current shelf anchoring needs a few pixels of adjustment.
- Consider surfacing remaining stock more explicitly if `/10` badges feel too subtle once tested on mobile.
- Validate the restaurant inventory button placement on mobile so it doesn’t compete visually with the cook button or tip-jar area.
- If needed later, localize the new stock-blocking helper messages in `App.tsx` instead of keeping the current French-first strings.

Update
- Fixed a startup white-screen regression in `src/app/App.tsx`: the new inventory gating memoization used `isIngredientInventoryActive` before that constant was initialized, which can throw a runtime `ReferenceError` during the first render even though `vite build` succeeds.
- Reordered the unlock/inventory derived constants so `isIngredientInventoryActive` is defined before `craftableRecipeIds` and `displayedRecipeChoices`.

TODO
- Run an in-browser smoke test once Playwright or a local browser session is available; current sandbox still allows `vite build` but does not have `playwright` installed for the `develop-web-game` loop.

Update
- Replaced the market and restaurant inventory entry buttons with `InventoryButton.svg` and moved the restaurant button upward/left to better match the mobile mockup near the counter.
- Kept the inventory text inside the button, offset slightly to the right so it clears the built-in icon area of the asset.

Update
- Aligned the restaurant inventory layout to the same `panel / grid / back button` positions already used by the market inventory view so both screens share the same asset placement.

Update
- Updated progression rewards for levels 7 to 10: Tip Jar tokens continue with `22 / 24 / 26 / 28`, level 7 now grants `1 garlic seed`, level 8 grants `1 bamboo seed`, level 9 grants `1 mushroom seed`, and the old level-7 Dragon Pepper reward was removed.
- Added a level-10 rare-seed reward that resolves randomly to either `Dragon Pepper` or `Fire Chili` when the reward is queued, so the reward screen shows the actual drawn seed.
- Extended local reward inventory persistence to track `bamboo`, `mushroom`, `garlic`, and `fire chili` seeds so these rewards survive reconnects and correctly feed the greenhouse inventory.
- Dojo seed sync now skips the newly added local-only seed crops until the onchain contract/indexed inventory supports them, avoiding noisy sync failures for those rewards.

Update
- Rekeyed the reward art in both `RewardScreen` and `LevelRewardScreen` with `reward.seedCrop` so the level-10 random reward always remounts with the correct image when the draw resolves to `Dragon Pepper` versus `Fire Chili`.

Update
- Audited the Dojo reconnect flow: `PlayerInventory` onchain currently stores `noods_balance` plus a few seed counters only, while the common ingredient inventory remains frontend-local and is not represented in the Cairo models yet.
- Added a reconnect safety guard in `App.tsx`: if Dojo progress is readable but `PlayerInventory` cannot be read, the app now preserves the local cached stats and pauses automatic progress sync instead of falling back to default Noods and risking an overwrite of the onchain balance.
