# Noodles Dojo Scaffold

This directory contains the first Dojo-oriented onchain architecture for `Noodles`.

## Current Scope
- player profile registration
- permanent feature unlocks
- player inventory
- greenhouse plot state
- daily reward state

## Recommended First Onchain Features
1. `register_player`
2. `claim_tip_jar_unlock`
3. `claim_greenhouse_unlock`
4. `grant_seed`
5. `plant_seed`
6. `harvest_crop`

## Keep Offchain For Now
- XP
- level progression
- per-order quality calculations
- minute-to-minute minigame state
- temporary mobile UI flow

## Next Suggested Steps
1. Install and validate the Dojo toolchain locally
2. Run `sozo build`
3. Fix any syntax/version differences against your installed Dojo version
4. Add integration tests using `dojo_cairo_test`
5. Connect the frontend wallet flow to these systems progressively
