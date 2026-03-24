# Noodles Dojo Deployment

This guide prepares the `Noodles` Dojo world for:

- local development with Katana
- Sepolia deployment
- frontend integration through Vite env vars

## Current Reality

At the moment:

- the Dojo scaffold compiles with `scarb build`
- `sozo` and `katana` are not installed yet on this machine
- the frontend is already ready to use `VITE_DOJO_PLAYER_SYSTEM_ADDRESS`

That means the next practical step is installing the Dojo toolchain, then deploying the world and wiring the deployed addresses back into the frontend.

## 1. Install the Dojo Toolchain

You need:

- `sozo`
- `katana`

Check they are available:

```bash
sozo --version
katana --version
```

## 2. Local Development Deployment

### Start Katana

From the repo root:

```bash
npm run dojo:katana
```

Or manually:

```bash
katana --dev --dev.no-fee
```

### Build the world

```bash
npm run dojo:build
```

### Inspect the deployment

```bash
npm run dojo:inspect
```

### Migrate locally

```bash
npm run dojo:migrate:dev
```

This uses:

- [dojo_dev.toml](/Users/fabien/Documents/starknet/Projet%20Noodles/Sandbox/Noodles_v0.1/dojo/dojo_dev.toml)

## 3. Sepolia Deployment

### Configure the Sepolia profile

Keep [dojo_sepolia.toml](/Users/fabien/Documents/starknet/Projet%20Noodles/Sandbox/Noodles_v0.1/dojo/dojo_sepolia.toml) free of secrets.

Create a local file from:

- [dojo/.env.sepolia.example](/Users/fabien/Documents/starknet/Projet%20Noodles/Sandbox/Noodles_v0.1/dojo/.env.sepolia.example)

Example:

```bash
cp dojo/.env.sepolia.example dojo/.env.sepolia
```

Then fill in:

- `DOJO_ACCOUNT_ADDRESS`
- `DOJO_PRIVATE_KEY`

These variables are read directly by `sozo migrate`:

- `DOJO_ACCOUNT_ADDRESS`
- `DOJO_PRIVATE_KEY`
- optional `STARKNET_RPC_URL`

Before migrating, load them into your shell:

```bash
set -a
source .env.sepolia
set +a
```

### Build with Sepolia profile

From `dojo/`:

```bash
sozo build --profile sepolia
```

### Deploy to Sepolia

From the repo root:

```bash
npm run dojo:migrate:sepolia
```

Or manually:

```bash
cd dojo
set -a
source .env.sepolia
set +a
sozo migrate --profile sepolia
```

## 4. Capture the System Addresses

After migration, note the deployed addresses for:

- `noodles-player_system`
- `noodles-unlock_system`
- `noodles-greenhouse_system`
- `noodles-reward_system`

The frontend currently needs at least:

- `noodles-player_system`

because it uses:

- `register_player`
- `is_player_registered`

## 5. Wire the Frontend

Update your local `.env`:

```env
VITE_STARKNET_NETWORK=sepolia
VITE_DOJO_PLAYER_SYSTEM_ADDRESS=0x...
```

Optional future values:

```env
VITE_DOJO_UNLOCK_SYSTEM_ADDRESS=0x...
VITE_DOJO_GREENHOUSE_SYSTEM_ADDRESS=0x...
VITE_DOJO_REWARD_SYSTEM_ADDRESS=0x...
```

Then rebuild the frontend:

```bash
npm run build
```

## 6. What Happens in the Game

Once `VITE_DOJO_PLAYER_SYSTEM_ADDRESS` is set:

- the Cartridge connect flow will try `register_player`
- the app will also query `is_player_registered` on startup
- the wallet panel in the village will show whether the profile is synced onchain

## 7. Recommended First Validation

After Sepolia deployment, validate this order:

1. connect Cartridge wallet
2. connect flow succeeds
3. `register_player` is called
4. reload the app
5. wallet panel still shows the player as synced onchain

## 8. Next Addresses to Wire

After `player_system`, the most useful next steps are:

- `unlock_system`
- `greenhouse_system`

That will let the village and greenhouse use real Dojo state instead of local-only unlock logic.
