import Controller, { type SessionPolicies } from '@cartridge/controller';
import { constants } from 'starknet';

const DEFAULT_NETWORK =
  import.meta.env.VITE_STARKNET_NETWORK?.trim() === 'mainnet' ? 'mainnet' : 'sepolia';

const DOJO_PLAYER_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_PLAYER_SYSTEM_ADDRESS?.trim() ?? '';
const DOJO_UNLOCK_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_UNLOCK_SYSTEM_ADDRESS?.trim() ?? '';
const DOJO_REWARD_SYSTEM_ADDRESS =
  import.meta.env.VITE_DOJO_REWARD_SYSTEM_ADDRESS?.trim() ?? '';

function addContractPolicy(
  contracts: NonNullable<SessionPolicies['contracts']>,
  address: string,
  entrypoints: string[]
) {
  if (!address || address === '0x0' || entrypoints.length === 0) {
    return;
  }

  contracts[address] = {
    methods: entrypoints.map((entrypoint) => ({ entrypoint })),
  };
}

function buildGameSessionPolicies(): SessionPolicies {
  const contracts: NonNullable<SessionPolicies['contracts']> = {};

  addContractPolicy(contracts, DOJO_PLAYER_SYSTEM_ADDRESS, [
    'register_player',
    'touch_login',
    'sync_player_progress',
    'reset_player_progress_for_dev',
  ]);
  addContractPolicy(contracts, DOJO_UNLOCK_SYSTEM_ADDRESS, [
    'claim_tip_jar_unlock',
    'claim_greenhouse_unlock',
  ]);
  addContractPolicy(contracts, DOJO_REWARD_SYSTEM_ADDRESS, ['grant_seed']);

  return { contracts };
}

export const cartridgeDefaultNetwork = DEFAULT_NETWORK;

export function getCartridgeNetworkFromChainId(
  chainId?: bigint | string | null
): 'sepolia' | 'mainnet' {
  if (
    chainId === BigInt(constants.StarknetChainId.SN_MAIN) ||
    chainId === constants.StarknetChainId.SN_MAIN ||
    chainId === '0x534e5f4d41494e'
  ) {
    return 'mainnet';
  }

  return 'sepolia';
}

export const cartridgeSessionPolicies = buildGameSessionPolicies();
let sessionPoliciesReady = false;
let sessionPoliciesRequest: Promise<void> | null = null;

export const cartridgeController = new Controller({
  defaultChainId:
    DEFAULT_NETWORK === 'mainnet'
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA,
  policies: cartridgeSessionPolicies,
  lazyload: true,
  errorDisplayMode: 'notification',
  propagateSessionErrors: true,
});

export async function ensureCartridgeSessionPolicies() {
  if (sessionPoliciesReady) {
    return;
  }

  if (sessionPoliciesRequest) {
    return sessionPoliciesRequest;
  }

  sessionPoliciesRequest = (async () => {
    await cartridgeController.updateSession({
      policies: cartridgeSessionPolicies,
    });
    sessionPoliciesReady = true;
  })();

  try {
    await sessionPoliciesRequest;
  } finally {
    sessionPoliciesRequest = null;
  }
}

export function resetCartridgeSessionPoliciesState() {
  sessionPoliciesReady = false;
  sessionPoliciesRequest = null;
}
