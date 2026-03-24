import { CallData, Provider, shortString } from 'starknet';

type RegisterPlayerStatus =
  | 'registered'
  | 'already_registered'
  | 'skipped'
  | 'failed';

type SyncPlayerStatus = 'synced' | 'missing' | 'skipped' | 'failed';

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
