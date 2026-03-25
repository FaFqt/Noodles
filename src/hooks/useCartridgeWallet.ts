import { useState, useEffect, useCallback, useMemo } from 'react';
import { StarkSDK, OnboardStrategy, sepoliaTokens, mainnetTokens } from 'starkzap';

interface CartridgeWalletState {
  wallet: any | null;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  profileName: string | null;
  network: 'sepolia' | 'mainnet';
  error: string | null;
  statusMessage: string | null;
}

function describeCartridgeError(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: unknown;
      shortMessage?: unknown;
      details?: unknown;
      cause?: unknown;
    };

    const candidates = [
      maybeError.message,
      maybeError.shortMessage,
      maybeError.details,
      typeof maybeError.cause === 'object' && maybeError.cause !== null
        ? (maybeError.cause as { message?: unknown }).message
        : null,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return 'Cartridge Controller failed to initialize.';
}

function toUserFacingCartridgeError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('failed to initialize')) {
    return 'Cartridge Controller failed to initialize on this device. Wait a moment, then try again. If no window opens, return to the browser and allow the Cartridge popup.';
  }

  if (normalizedMessage.includes('popup') || normalizedMessage.includes('popups')) {
    return 'Cartridge could not finish opening. Return to the browser and allow the Cartridge popup, then try again.';
  }

  if (normalizedMessage.includes('without starknet address')) {
    return 'Cartridge returned an incomplete session without a Starknet address. Please reopen the Controller and try again.';
  }

  return message;
}

export const useCartridgeWallet = () => {
  const [state, setState] = useState<CartridgeWalletState>({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    profileName: null,
    network: 'sepolia', // Default to sepolia for development
    error: null,
    statusMessage: null,
  });

  const sdk = useMemo(
    () =>
      new StarkSDK({
        network: state.network,
      }),
    [state.network]
  );

  const hydrateWalletState = useCallback(
    async (wallet: any) => {
      const controller =
        typeof wallet?.getController === 'function' ? wallet.getController() : null;
      if (!controller) {
        throw new Error(
          'Cartridge Controller initialized without a live controller instance.'
        );
      }

      const tokens = state.network === 'mainnet' ? mainnetTokens : sepoliaTokens;
      const [balanceAmount, profileName] = await Promise.all([
        wallet.balanceOf(tokens.ETH).catch(() => null),
        typeof wallet.username === 'function'
          ? wallet.username().catch(() => undefined)
          : Promise.resolve(undefined),
      ]);

      const address = typeof wallet.address === 'string' ? wallet.address : null;
      if (!address) {
        throw new Error(
          'Cartridge wallet connected without Starknet address. The mobile session may not have completed.'
        );
      }

      const nextProfileName =
        typeof profileName === 'string' && profileName.trim().length > 0
          ? profileName
          : address
            ? `Chef-${address.slice(-4)}`
            : null;

      setState((prev) => ({
        ...prev,
        wallet,
        isConnected: Boolean(address),
        isConnecting: false,
        address,
        balance: balanceAmount ? balanceAmount.toFormatted() : null,
        profileName: nextProfileName,
        error: null,
        statusMessage: null,
      }));

      return {
        wallet,
        address,
        balance: balanceAmount ? balanceAmount.toFormatted() : null,
        profileName: nextProfileName,
        network: state.network,
      };
    },
    [state.network]
  );

  const connectWallet = useCallback(async () => {
    let slowOpenReminder: number | undefined;

    try {
      setState((prev) => ({
        ...prev,
        isConnecting: true,
        isConnected: false,
        wallet: null,
        address: null,
        balance: null,
        profileName: null,
        error: null,
        statusMessage: 'Initialisation du Cartridge Controller...',
      }));

      if (typeof window !== 'undefined') {
        slowOpenReminder = window.setTimeout(() => {
          setState((prev) =>
            prev.isConnecting
              ? {
                  ...prev,
                  statusMessage:
                    'Le Controller met du temps a s’ouvrir. Sur smartphone, reviens au navigateur et autorise la fenetre Cartridge si besoin.',
                }
              : prev
          );
        }, 2500);
      }

      const { wallet } = await sdk.onboard({
        strategy: OnboardStrategy.Cartridge,
        deploy: 'if_needed',
        onProgress: ({ step }) => {
          const stepMessage =
            step === 'CONNECTED'
              ? 'Session Cartridge ouverte. Verification du compte...'
              : step === 'CHECK_DEPLOYED'
                ? 'Verification du compte Starknet...'
                : step === 'DEPLOYING'
                  ? 'Deploiement du compte Starknet si necessaire...'
                  : step === 'READY'
                    ? 'Connexion terminee. Recuperation du profil...'
                    : step === 'FAILED'
                      ? 'Cartridge a signale un echec pendant l’initialisation.'
                      : 'Initialisation du Cartridge Controller...';

          setState((prev) =>
            prev.isConnecting
              ? {
                  ...prev,
                  statusMessage: stepMessage,
                }
              : prev
          );
        },
      });

      if (typeof window !== 'undefined' && slowOpenReminder) {
        window.clearTimeout(slowOpenReminder);
      }

      setState((prev) => ({
        ...prev,
        statusMessage: 'Connexion confirmee. Recuperation du profil Cartridge...',
      }));

      return hydrateWalletState(wallet);
    } catch (error) {
      if (typeof window !== 'undefined' && slowOpenReminder) {
        window.clearTimeout(slowOpenReminder);
      }

      const detailedMessage = describeCartridgeError(error);
      const userFacingMessage = toUserFacingCartridgeError(detailedMessage);
      console.error('Failed to connect Cartridge wallet:', error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: userFacingMessage,
        statusMessage: null,
      }));
      throw error;
    }
  }, [hydrateWalletState, sdk]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (state.wallet) {
        const controller =
          typeof state.wallet.getController === 'function'
            ? state.wallet.getController()
            : null;

        if (controller?.logout) {
          await controller.logout();
          return;
        }

        await state.wallet.disconnect?.();
      }

      setState((prev) => ({
        wallet: null,
        isConnected: false,
        isConnecting: false,
        address: null,
        balance: null,
        profileName: null,
        network: prev.network,
        error: null,
        statusMessage: null,
      }));
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [state.wallet]);

  const switchNetwork = useCallback((network: 'sepolia' | 'mainnet') => {
    setState((prev) => ({ ...prev, network, error: null, statusMessage: null }));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.wallet) return;

    try {
      const tokens = state.network === 'mainnet' ? mainnetTokens : sepoliaTokens;
      const balance = await state.wallet.balanceOf(tokens.ETH);
      setState((prev) => ({ ...prev, balance: balance.toFormatted() }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.wallet, state.network]);

  const openProfileForWallet = useCallback(async (wallet: any | null | undefined) => {
    if (!wallet?.getController) return false;

    try {
      const controller = wallet.getController();
      if (controller?.openProfile) {
        await controller.openProfile();
        return true;
      }
    } catch (error) {
      console.error('Failed to open Cartridge profile:', error);
    }

    return false;
  }, []);

  const openProfile = useCallback(async () => {
    return openProfileForWallet(state.wallet);
  }, [openProfileForWallet, state.wallet]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    openProfile,
    openProfileForWallet,
    statusMessage: state.statusMessage,
  };
};
