import { CallData, Provider, shortString } from 'starknet';
import type { SeedRewardCrop } from '../app/data/progression';

type RegisterPlayerStatus =
  | 'registered'
  | 'already_registered'
  | 'skipped'
  | 'failed';

type SyncPlayerStatus = 'synced' | 'missing' | 'skipped' | 'failed';
type SyncProgressStatus = 'synced' | 'skipped' | 'failed';
type ResetProgressStatus = 'reset' | 'skipped' | 'failed';
type ClaimUnlockStatus = 'claimed' | 'already_claimed' | 'skipped' | 'failed';
type GrantSeedStatus = 'granted' | 'skipped' | 'failed';

export interface RegisterPlayerResult {
  status: RegisterPlayerStatus;
  message: string;
  txHash?: string | null;
}

export interface SyncPlayerResult {
  status: SyncPlayerStatus;
  message: string;
  txHash?: string | null;
}

export interface SyncProgressResult {
  status: SyncProgressStatus;
  message: string;
  txHash?: string | null;
}

export interface ResetProgressResult {
  status: ResetProgressStatus;
  message: string;
  txHash?: string | null;
}

export interface ClaimUnlockResult {
  status: ClaimUnlockStatus;
  message: string;
  txHash?: string | null;
}

export interface GrantSeedResult {
  status: GrantSeedStatus;
  message: string;
  txHash?: string | null;
}

export interface OnchainPlayerProgress {
  level: number;
  xp: number;
  xpToNext: number;
  updatedAt: number;
}

export interface OnchainPlayerInventory {
  noodsBalance: number;
  cornSeed: number;
  dragonPepperSeed: number;
  moonHerbSeed: number;
  crystalSalt: number;
}

export interface OnchainPlayerUnlocks {
  tipJarUnlocked: boolean;
  greenhouseUnlocked: boolean;
  marketUnlocked: boolean;
}

export interface OnchainPlayerSnapshot {
  progress: OnchainPlayerProgress;
  inventory: OnchainPlayerInventory | null;
  unlocks: OnchainPlayerUnlocks | null;
}

const DOJO_PLAYER_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_PLAYER_SYSTEM_ADDRESS?.trim() ?? '';
const DOJO_UNLOCK_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_UNLOCK_SYSTEM_ADDRESS?.trim() ?? '';
const DOJO_REWARD_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_REWARD_SYSTEM_ADDRESS?.trim() ?? '';
const DOJO_RPC_URL =
  import.meta.env.VITE_DOJO_RPC_URL?.trim() ??
  import.meta.env.VITE_STARKNET_RPC_URL?.trim() ??
  '';
const unsupportedReadEntrypoints = new Set<string>();

function createDojoProvider(network: 'sepolia' | 'mainnet') {
  const nodeUrl =
    DOJO_RPC_URL ||
    (network === 'mainnet'
      ? 'https://api.cartridge.gg/x/starknet/mainnet'
      : 'https://api.cartridge.gg/x/starknet/sepolia');

  return new Provider({ nodeUrl });
}

function normalizeUsernameForFelt(input: string) {
  const asciiOnly = input
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

  const safeName = asciiOnly.length > 0 ? asciiOnly.slice(0, 31) : 'Bento-chan';
  return shortString.encodeShortString(safeName);
}

function feltToNumber(value: string | null | undefined) {
  if (!value) return 0;

  try {
    return Number(BigInt(value));
  } catch {
    return 0;
  }
}

function feltToBoolean(value: string | null | undefined) {
  return value === '0x1' || value === '1';
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: unknown;
      shortMessage?: unknown;
      details?: unknown;
      cause?: unknown;
      data?: unknown;
    };

    const candidates = [
      maybeError.message,
      maybeError.shortMessage,
      maybeError.details,
      maybeError.data,
      typeof maybeError.cause === 'object' && maybeError.cause !== null
        ? (maybeError.cause as { message?: unknown }).message
        : maybeError.cause,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return '';
}

function getUnsupportedEntrypointCacheKey(contractAddress: string, entrypoint: string) {
  return `${contractAddress.toLowerCase()}:${entrypoint}`;
}

function isPlayerAlreadyRegisteredError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes('player_exists') ||
    message.includes('PLAYER_ALREADY_REGISTERED') ||
    message.includes('already registered')
  );
}

function isPlayerMissingError(error: unknown) {
  const message = getErrorMessage(error);

  return message.includes('player_missing') || message.includes('PLAYER_NOT_REGISTERED');
}

function isMissingEntrypointError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes('Entry point') ||
    message.includes('ENTRYPOINT_NOT_FOUND') ||
    message.includes('Requested entry point was not found') ||
    message.includes('Requested entrypoint does not exist in the contract')
  );
}

function isFeatureAlreadyUnlockedError(error: unknown) {
  const message = getErrorMessage(error);

  return (
    message.includes('FEATURE_ALREADY_UNLOCKED') ||
    message.includes('already unlocked')
  );
}

function getCropTypeValue(crop: SeedRewardCrop) {
  if (crop === 'corn') return 1;
  if (crop === 'dragonpepper') return 2;
  return 3;
}

export async function registerPlayerOnDojo(params: {
  wallet: any;
  username: string;
}): Promise<RegisterPlayerResult> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message:
        'Dojo player system address is not configured yet. Wallet connected successfully; onchain registration was skipped.',
    };
  }

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
        entrypoint: 'register_player',
        calldata: CallData.compile({
          username: normalizeUsernameForFelt(params.username),
        }),
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'registered',
      message: 'Player successfully registered on Dojo.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    if (isPlayerAlreadyRegisteredError(error)) {
      return {
        status: 'already_registered',
        message: 'Player already exists on Dojo.',
      };
    }

    console.error('Failed to register player on Dojo:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error
          ? error.message
          : 'Dojo registration failed after wallet connection.',
    };
  }
}

export async function syncPlayerOnDojo(params: { wallet: any }): Promise<SyncPlayerResult> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message:
        'Dojo player system address is not configured yet. Wallet connected successfully; onchain sync was skipped.',
    };
  }

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
        entrypoint: 'touch_login',
        calldata: [],
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'synced',
      message: 'Player state successfully synced on Dojo.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    if (isPlayerMissingError(error)) {
      return {
        status: 'missing',
        message: 'Player does not exist on Dojo yet.',
      };
    }

    console.error('Failed to sync player on Dojo:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Dojo sync failed after wallet connection.',
    };
  }
}

export async function checkPlayerRegistrationOnDojo(params: {
  playerAddress: string;
  network: 'sepolia' | 'mainnet';
}): Promise<boolean | null> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return null;
  }

  try {
    const provider = createDojoProvider(params.network);
    const result = await provider.callContract({
      contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
      entrypoint: 'is_player_registered',
      calldata: CallData.compile([params.playerAddress]),
    });

    const firstValue = Array.isArray(result) ? result[0] : null;
    return firstValue === '0x1' || firstValue === '1';
  } catch (error) {
    console.error('Failed to check Dojo player registration:', error);
    return null;
  }
}

export async function getPlayerProgressOnDojo(params: {
  playerAddress: string;
  network: 'sepolia' | 'mainnet';
}): Promise<OnchainPlayerProgress | null> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return null;
  }

  try {
    const provider = createDojoProvider(params.network);
    const result = await provider.callContract({
      contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
      entrypoint: 'get_player_progress',
      calldata: CallData.compile([params.playerAddress]),
    });

    if (!Array.isArray(result) || result.length < 5) {
      return null;
    }

    return {
      level: feltToNumber(result[1]),
      xp: feltToNumber(result[2]),
      xpToNext: feltToNumber(result[3]),
      updatedAt: feltToNumber(result[4]),
    };
  } catch (error) {
    console.error('Failed to read Dojo player progress:', error);
    return null;
  }
}

export async function getPlayerInventoryOnDojo(params: {
  playerAddress: string;
  network: 'sepolia' | 'mainnet';
}): Promise<OnchainPlayerInventory | null> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return null;
  }

  const cacheKey = getUnsupportedEntrypointCacheKey(
    DOJO_PLAYER_SYSTEM_ADDRESS,
    'get_player_inventory'
  );

  if (unsupportedReadEntrypoints.has(cacheKey)) {
    return null;
  }

  try {
    const provider = createDojoProvider(params.network);
    const result = await provider.callContract({
      contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
      entrypoint: 'get_player_inventory',
      calldata: CallData.compile([params.playerAddress]),
    });

    if (!Array.isArray(result) || result.length < 6) {
      return null;
    }

    return {
      noodsBalance: feltToNumber(result[1]),
      cornSeed: feltToNumber(result[2]),
      dragonPepperSeed: feltToNumber(result[3]),
      moonHerbSeed: feltToNumber(result[4]),
      crystalSalt: feltToNumber(result[5]),
    };
  } catch (error) {
    if (isMissingEntrypointError(error)) {
      unsupportedReadEntrypoints.add(cacheKey);
      return null;
    }

    console.error('Failed to read Dojo player inventory:', error);
    return null;
  }
}

export async function getPlayerUnlocksOnDojo(params: {
  playerAddress: string;
  network: 'sepolia' | 'mainnet';
}): Promise<OnchainPlayerUnlocks | null> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return null;
  }

  const cacheKey = getUnsupportedEntrypointCacheKey(
    DOJO_PLAYER_SYSTEM_ADDRESS,
    'get_player_unlocks'
  );

  if (unsupportedReadEntrypoints.has(cacheKey)) {
    return null;
  }

  try {
    const provider = createDojoProvider(params.network);
    const result = await provider.callContract({
      contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
      entrypoint: 'get_player_unlocks',
      calldata: CallData.compile([params.playerAddress]),
    });

    if (!Array.isArray(result) || result.length < 4) {
      return null;
    }

    return {
      tipJarUnlocked: feltToBoolean(result[1]),
      greenhouseUnlocked: feltToBoolean(result[2]),
      marketUnlocked: feltToBoolean(result[3]),
    };
  } catch (error) {
    if (isMissingEntrypointError(error)) {
      unsupportedReadEntrypoints.add(cacheKey);
      return null;
    }

    console.error('Failed to read Dojo player unlocks:', error);
    return null;
  }
}

export async function getPlayerSnapshotOnDojo(params: {
  playerAddress: string;
  network: 'sepolia' | 'mainnet';
}): Promise<OnchainPlayerSnapshot | null> {
  const progress = await getPlayerProgressOnDojo(params);

  if (!progress) {
    return null;
  }

  const [inventory, unlocks] = await Promise.all([
    getPlayerInventoryOnDojo(params),
    getPlayerUnlocksOnDojo(params),
  ]);

  return {
    progress,
    inventory,
    unlocks,
  };
}

export async function claimFeatureUnlockOnDojo(params: {
  wallet: any;
  feature: 'tip_jar' | 'greenhouse' | 'market';
}): Promise<ClaimUnlockResult> {
  if (!DOJO_UNLOCK_SYSTEM_ADDRESS || DOJO_UNLOCK_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message: 'Dojo unlock system address is not configured yet. Unlock sync was skipped.',
    };
  }

  const entrypoint =
    params.feature === 'tip_jar'
      ? 'claim_tip_jar_unlock'
      : params.feature === 'greenhouse'
        ? 'claim_greenhouse_unlock'
        : 'claim_market_unlock';

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_UNLOCK_SYSTEM_ADDRESS,
        entrypoint,
        calldata: [],
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'claimed',
      message: 'Feature unlock synced on Dojo.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    if (isFeatureAlreadyUnlockedError(error)) {
      return {
        status: 'already_claimed',
        message: 'Feature already unlocked on Dojo.',
      };
    }

    console.error('Failed to sync Dojo feature unlock:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Dojo feature unlock sync failed.',
    };
  }
}

export async function grantSeedRewardOnDojo(params: {
  wallet: any;
  crop: SeedRewardCrop;
  amount: number;
}): Promise<GrantSeedResult> {
  if (!DOJO_REWARD_SYSTEM_ADDRESS || DOJO_REWARD_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message: 'Dojo reward system address is not configured yet. Seed reward sync was skipped.',
    };
  }

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_REWARD_SYSTEM_ADDRESS,
        entrypoint: 'grant_seed',
        calldata: CallData.compile({
          crop_type: getCropTypeValue(params.crop),
          amount: params.amount,
        }),
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'granted',
      message: 'Seed reward synced on Dojo.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    console.error('Failed to sync Dojo seed reward:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Dojo seed reward sync failed.',
    };
  }
}

export async function syncPlayerProgressOnDojo(params: {
  wallet: any;
  level: number;
  xp: number;
  xpToNext: number;
  noodsBalance: number;
}): Promise<SyncProgressResult> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message: 'Dojo player system address is not configured yet. Progress sync was skipped.',
    };
  }

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
        entrypoint: 'sync_player_progress',
        calldata: CallData.compile({
          level: params.level,
          xp: params.xp,
          xp_to_next: params.xpToNext,
          noods_balance: params.noodsBalance,
        }),
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'synced',
      message: 'Player progress synced on Dojo.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    console.error('Failed to sync player progress on Dojo:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Dojo progress sync failed after wallet update.',
    };
  }
}

export async function resetPlayerProgressOnDojo(params: {
  wallet: any;
}): Promise<ResetProgressResult> {
  if (!DOJO_PLAYER_SYSTEM_ADDRESS || DOJO_PLAYER_SYSTEM_ADDRESS === '0x0') {
    return {
      status: 'skipped',
      message: 'Dojo player system address is not configured yet. Progress reset was skipped.',
    };
  }

  try {
    const tx = await params.wallet.execute([
      {
        contractAddress: DOJO_PLAYER_SYSTEM_ADDRESS,
        entrypoint: 'reset_player_progress_for_dev',
        calldata: [],
      },
    ]);

    if (typeof tx?.wait === 'function') {
      await tx.wait();
    }

    return {
      status: 'reset',
      message: 'Player progress reset on Dojo for development.',
      txHash: tx?.hash ?? tx?.transaction_hash ?? null,
    };
  } catch (error) {
    console.error('Failed to reset player progress on Dojo:', error);

    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Dojo progress reset failed in development mode.',
    };
  }
}
