# Cartridge Guidelines

## Purpose
These guidelines define how Cartridge should be integrated into `Noodles`.
The objective is to keep the wallet experience:

- simple
- mobile-friendly
- safe on Sepolia first
- compatible with progressive Dojo adoption

## Product Rules
- Cartridge is part of onboarding, not a separate advanced feature
- The wallet step must never feel like a blocker without explanation
- The game should remain usable even if onchain sync is temporarily unavailable
- Wallet actions must be understandable from the UI

## Connection Rules
- Use the real Cartridge wallet flow, not mocked addresses
- Default to `Sepolia` during active development
- Keep the first connect screen calm and minimal
- Never overload the first wallet screen with advanced blockchain terminology

## Session Rules
- Differentiate clearly between:
  - local profile state
  - live Cartridge session
  - Dojo onchain registration
- Never restore a wallet profile from local browser storage as if it were a live Cartridge session
- The UI must never imply that a player is fully onchain if only local state exists
- If a live session is inactive, say so explicitly
- On mobile, expose a clear connection status if the Cartridge popup or controller takes time to initialize

## UI Rules
- Show wallet status in the village wallet panel
- Make sync state visible:
  - local only
  - synced onchain
- Allow disconnection from inside the wallet panel
- If a reconnect is needed, explain why in plain language

## Onchain Sync Rules
- First Dojo integration point is `register_player`
- Public read support such as `is_player_registered` should exist for launch-time sync checks
- Do not write XP or minute-to-minute gameplay onchain yet
- Prioritize durable ownership and unlock state first

## Environment Rules
- Frontend integration must be driven by env vars
- Required first address:
  - `VITE_DOJO_PLAYER_SYSTEM_ADDRESS`
- Future addresses should follow the same pattern:
  - `VITE_DOJO_UNLOCK_SYSTEM_ADDRESS`
  - `VITE_DOJO_GREENHOUSE_SYSTEM_ADDRESS`
  - `VITE_DOJO_REWARD_SYSTEM_ADDRESS`

## Deployment Strategy
- Validate Dojo locally on Katana first
- Deploy to Sepolia before any mainnet planning
- Record the deployed system addresses immediately after migration
- Update `.env` and verify the wallet flow end to end after each deployment

## UX Failover Rules
- If Dojo is not configured, wallet connection should still succeed
- If Dojo registration fails, keep the player in the game and explain the sync issue
- If the player is already registered onchain, treat that as a normal success path

## Recommended Next Steps
1. deploy `player_system`
2. wire `VITE_DOJO_PLAYER_SYSTEM_ADDRESS`
3. validate `register_player`
4. validate `is_player_registered` on reload
5. move next to unlocks and greenhouse systems
