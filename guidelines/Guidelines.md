# Noodles Development Guidelines

## Purpose
This document defines the development standards for `Noodles`.
The goal is to keep the project:

- fun and readable as a game
- stable on mobile first
- easy to extend with new gameplay loops
- ready for gradual Starknet integration without forcing onchain logic too early

These rules should be treated as the default engineering baseline for all future work on the project.

## Product Mindset
`Noodles` is a cozy, kawaii, mobile-first ramen game.
Every implementation choice should support these priorities:

- short and satisfying gameplay loops
- clear visual feedback
- strong readability on smartphone screens
- simple onboarding
- low friction wallet experience
- progressive feature unlocks

When a technical choice conflicts with feel, prefer the version that preserves clarity, responsiveness, and player comfort.

## Core Principles
### 1. Mobile First
All gameplay and screens must work on real phones before being considered complete.

- Design primarily for screens between `375x667` and `430x932`
- Always account for iOS and Android safe areas
- Never place critical buttons against the bottom edge without safety padding
- Touch targets should remain easy to tap with a thumb
- Desktop support is secondary and should adapt from the mobile layout, not the reverse

### 2. Responsive By System, Not By Patchwork
Do not fix layout issues page by page with arbitrary offsets if a shared layout solution is possible.

- Use shared wrappers like `ResponsiveGameCanvas` for scene-based screens
- Keep one consistent reference canvas for game screens
- Avoid hardcoding per-device fixes unless there is no cleaner alternative
- If multiple screens share the same problem, fix the underlying pattern once

### 3. Keep Gameplay State Predictable
Game state should be easy to follow and resilient to future features.

- Prefer explicit state names over implicit transitions
- Centralize cross-screen progression logic in the app flow rather than scattering it in components
- Separate transient UI state from long-term progression state
- Use derived values when possible instead of duplicating state

### 4. Prepare for Onchain, But Do Not Over-Onchain
Only move data onchain when it improves the game or product roadmap.

- Wallet connection can happen early
- XP, soft currency, and temporary progression can remain local/offchain until design is stable
- Onchain integrations should be incremental, deliberate, and isolated
- Never couple core UX to an unfinished smart contract flow

## Code Organization
### Frontend Structure
Use clear boundaries between:

- `components`: visual screens and reusable UI
- `data`: static balancing, recipes, progression configs
- `types`: shared domain types
- `hooks`: reusable side-effect or integration logic
- `context`: app-wide providers such as language

When a file starts mixing multiple responsibilities, split it.

### File Size Guidance
- Prefer small to medium files
- If a component exceeds roughly `250-300` lines and mixes layout, logic, and animation, consider extracting helpers or subcomponents
- If a config is edited for balancing, move it into `data/`

### Naming
- Use `PascalCase` for React components and type names
- Use `camelCase` for variables and functions
- Use explicit names such as `restaurantServicePausedUntil` instead of vague names like `cooldown`
- Keep code and comments in English

## UI and UX Rules
### Visual Consistency
The game should feel handcrafted and warm.

- Preserve the cozy/kawaii visual identity
- Avoid generic enterprise UI patterns
- Reuse shared spacing, safe-area, and responsive layout rules
- Keep visual hierarchy obvious: background, gameplay zone, HUD, CTA

### Buttons and Actions
- Primary actions must be obvious and visually dominant
- Avoid multiple competing CTAs on the same screen
- Disabled states must remain readable and understandable
- If a button is disabled, the reason should be inferable from the surrounding UI

### Feedback
Every player action should give feedback quickly.

- Reward progress with visible motion or state changes
- Reflect success, failure, and locked states clearly
- Use lightweight animation to support gameplay, not distract from it

### Accessibility and Readability
- Maintain readable contrast for text and progress bars
- Avoid text over highly detailed backgrounds without overlays or shadows
- Keep small labels readable on low-width screens

## Gameplay Implementation Rules
### Minigames
Minigames must feel forgiving enough on touch devices.

- Prefer generous interaction zones over pixel-perfect precision
- Clamp or lock end states when needed to avoid regressions caused by jitter
- Test swipes, drags, and timing interactions against realistic phone behavior
- Avoid punishing the player for browser chrome, viewport shifts, or mobile input noise

### Progression and Rewards
- Keep progression configs editable from dedicated data files
- Level rewards, unlocks, and day rewards should have distinct responsibilities
- Do not hide balancing values deep inside component code
- Support temporary test reward cycles through config, not one-off hacks

### Timers and Cooldowns
Use absolute timestamps for persistent cooldowns.

- Store end times, not only remaining durations
- Recompute remaining time from `Date.now()`
- Persist cooldowns that must survive refreshes or app restarts

## Wallet and Onchain Guidelines
### Cartridge Integration
Wallet UX should remain simple and game-first.

- Connect the real wallet only where the player understands why
- Keep connection steps short and visually calm
- Surface wallet state in the UI without overwhelming the player
- Allow disconnection and reconnection from a clear place in the game

### Sepolia First
For early blockchain features, use Sepolia before mainnet.

- New onchain features should be validated on Sepolia first
- Separate testnet assumptions from production assumptions
- Do not hardwire mainnet-only behavior too early

### What Can Stay Offchain
Until product design is stable, these may remain local:

- XP
- soft currency
- temporary unlock flow
- mobile UX state

### What Should Be Easy to Move Later
Design the code so these can later be moved behind contracts or indexers:

- player inventory
- premium currency
- unlock ownership
- greenhouse resources
- marketplace actions

## State Management Guidelines
- Keep source of truth close to the app flow
- Avoid duplicating the same progression data in multiple screens
- Persist only the data that truly needs to survive reload
- Be careful with browser-only APIs and always guard `window` access
- Treat local storage as persistence support, not as business logic

## Performance Guidelines
- Optimize first for perceived smoothness on mobile
- Avoid unnecessary re-renders in animation-heavy screens
- Prefer lightweight state updates during drag/swipe interactions
- Heavy assets should be justified and monitored
- If a screen depends on absolute-positioned large images, make sure the interaction layer remains responsive

## Testing and Validation
Every meaningful gameplay or UI change should be validated at three levels:

### 1. Build Safety
- Run a production build after meaningful changes
- Fix type or bundling regressions before moving on

### 2. Device Safety
Test at least these mobile classes regularly:

- compact iPhone size
- modern iPhone size
- Android mid-size device
- tall Android device

### 3. Flow Safety
Verify complete loops, not just isolated screens:

- splash to village
- village to restaurant
- recipe to cooking to broth to service
- satisfaction to reward to restaurant return
- wallet connect, open, disconnect

## Git and Delivery Rules
- Keep commits focused and readable
- Do not mix unrelated refactors with gameplay changes unless necessary
- Use descriptive commit messages that explain the player-facing outcome
- Push stable checkpoints often enough to validate on Vercel/mobile

## Definition of Done
A feature is not done when it only works locally in ideal conditions.
It is done when:

- it builds successfully
- it works on smartphone-sized viewports
- its main states are readable and usable
- it does not break the progression flow
- it is consistent with the visual identity of `Noodles`
- its rules are understandable by the next developer

## Preferred Engineering Behavior
When adding or changing a feature:

1. understand the gameplay purpose first
2. preserve existing feel where it already works well
3. fix systemic layout issues at the right abstraction level
4. keep configs editable and explicit
5. leave the codebase cleaner than before

If a choice is unclear, prefer the option that keeps the game simpler, more maintainable, and more pleasant on mobile.
