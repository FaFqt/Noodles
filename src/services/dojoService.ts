import { CallData, Provider, shortString } from 'starknet';

type RegisterPlayerStatus =
  | 'registered'
  | 'already_registered'
  | 'skipped'
  | 'failed';

type SyncPlayerStatus = 'synced' | 'missing' | 'skipped' | 'failed';
type SyncProgressStatus = 'synced' | 'skipped' | 'failed';
type ResetProgressStatus = 'reset' | 'skipped' | 'failed';

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

export interface OnchainPlayerProgress {
  level: number;
  xp: number;
  xpToNext: number;
  updatedAt: number;
}

const DOJO_PLAYER_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_PLAYER_SYSTEM_ADDRESS?.trim() ?? '';

function createDojoProvider(network: 'sepolia' | 'mainnet') {
  const nodeUrl =
    network === 'mainnet'
      ? 'https://starknet-mainnet.publicnode.com'
      : 'https://starknet-sepolia.publicnode.com';

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

function isPlayerAlreadyRegisteredError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  return (
    message.includes('player_exists') ||
    message.includes('PLAYER_ALREADY_REGISTERED') ||
    message.includes('already registered')
  );
}

function isPlayerMissingError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  return message.includes('player_missing') || message.includes('PLAYER_NOT_REGISTERED');
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
