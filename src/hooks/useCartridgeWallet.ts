import { useCallback, useEffect, useState } from 'react';
import { constants } from 'starknet';
import {
  cartridgeController,
  cartridgeDefaultNetwork,
  getCartridgeNetworkFromChainId,
} from '../services/cartridgeController';

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

export interface ConnectedCartridgeWallet {
  wallet: any;
  address: string;
  balance: string | null;
  profileName: string;
  network: 'sepolia' | 'mainnet';
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

  if (normalizedMessage.includes('popup') || normalizedMessage.includes('popups')) {
    return 'Cartridge n’a pas pu terminer l’ouverture. Autorise la fenetre Controller puis relance la connexion.';
  }

  if (normalizedMessage.includes('rejected') || normalizedMessage.includes('canceled')) {
    return 'La demande Cartridge a ete annulee avant la creation de la session.';
  }

  if (normalizedMessage.includes('policies')) {
    return 'La session Cartridge n’a pas pu etre autorisee avec les policies du jeu. Reessaie la connexion pour valider l’autorisation unique.';
  }

  if (normalizedMessage.includes('without starknet address')) {
    return 'Cartridge a renvoye une session incomplete sans adresse Starknet exploitable.';
  }

  return message;
}

function getFallbackProfileName(address: string) {
  return `Chef-${address.slice(-4)}`;
}

export const useCartridgeWallet = () => {
  const [state, setState] = useState<CartridgeWalletState>({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    profileName: null,
    network: cartridgeDefaultNetwork,
    error: null,
    statusMessage: null,
  });

  const hydrateWalletState = useCallback(
    async (wallet: any): Promise<ConnectedCartridgeWallet> => {
      const nextAddress =
        typeof wallet?.address === 'string' && wallet.address.length > 0
          ? wallet.address
          : null;

      if (!nextAddress) {
        throw new Error('Cartridge wallet connected without Starknet address.');
      }

      let profileName: string | null = null;
      let nextNetwork = state.network;

      try {
        const username = await cartridgeController.username();
        if (typeof username === 'string' && username.trim().length > 0) {
          profileName = username.trim();
        }
      } catch (error) {
        console.warn('Failed to read Cartridge username:', error);
      }

      try {
        const chainId = await wallet.getChainId?.();
        nextNetwork = getCartridgeNetworkFromChainId(chainId);
      } catch (error) {
        console.warn('Failed to read Cartridge chain id:', error);
      }

      const nextProfileName = profileName ?? getFallbackProfileName(nextAddress);

      setState((prev) => ({
        ...prev,
        wallet,
        isConnected: true,
        isConnecting: false,
        address: nextAddress,
        balance: null,
        profileName: nextProfileName,
        network: nextNetwork,
        error: null,
        statusMessage: null,
      }));

      return {
        wallet,
        address: nextAddress,
        balance: null,
        profileName: nextProfileName,
        network: nextNetwork,
      };
    },
    [state.network]
  );

  const connectWallet = useCallback(async (): Promise<ConnectedCartridgeWallet> => {
    let slowOpenReminder: number | undefined;

    try {
      setState((prev) => ({
        ...prev,
        isConnecting: true,
        error: null,
        statusMessage:
          'Ouverture du Cartridge Controller. Une autorisation unique des actions du jeu peut etre demandee.',
      }));

      if (typeof window !== 'undefined') {
        slowOpenReminder = window.setTimeout(() => {
          setState((prev) =>
            prev.isConnecting
              ? {
                  ...prev,
                  statusMessage:
                    'Le Controller met du temps a s’ouvrir. Reviens au navigateur et autorise la fenetre Cartridge si besoin.',
                }
              : prev
          );
        }, 2500);
      }

      const wallet = await cartridgeController.connect();

      if (!wallet) {
        throw new Error('Cartridge Controller failed to initialize.');
      }

      if (state.network !== cartridgeDefaultNetwork) {
        await cartridgeController.switchStarknetChain(
          state.network === 'mainnet'
            ? constants.StarknetChainId.SN_MAIN
            : constants.StarknetChainId.SN_SEPOLIA
        );
      }

      if (typeof window !== 'undefined' && slowOpenReminder) {
        window.clearTimeout(slowOpenReminder);
      }

      setState((prev) => ({
        ...prev,
        statusMessage: 'Session ouverte. Lecture du profil et des droits de session...',
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
        wallet: null,
        isConnected: false,
        isConnecting: false,
        address: null,
        profileName: null,
        balance: null,
        error: userFacingMessage,
        statusMessage: null,
      }));

      throw error;
    }
  }, [hydrateWalletState, state.network]);

  const disconnectWallet = useCallback(async () => {
    try {
      await cartridgeController.disconnect();
    } catch (error) {
      console.error('Failed to disconnect Cartridge wallet:', error);
    } finally {
      setState({
        wallet: null,
        isConnected: false,
        isConnecting: false,
        address: null,
        balance: null,
        profileName: null,
        network: cartridgeDefaultNetwork,
        error: null,
        statusMessage: null,
      });
    }
  }, []);

  const switchNetwork = useCallback(async (network: 'sepolia' | 'mainnet') => {
    setState((prev) => ({ ...prev, network, error: null, statusMessage: null }));

    if (!state.isConnected) {
      return;
    }

    await cartridgeController.switchStarknetChain(
      network === 'mainnet'
        ? constants.StarknetChainId.SN_MAIN
        : constants.StarknetChainId.SN_SEPOLIA
    );
  }, [state.isConnected]);

  const refreshBalance = useCallback(async () => {
    setState((prev) => ({ ...prev, balance: prev.balance ?? null }));
  }, []);

  const openProfileForWallet = useCallback(async (_wallet: any | null | undefined) => {
    try {
      await cartridgeController.openProfile();
      return true;
    } catch (error) {
      console.error('Failed to open Cartridge profile:', error);
      return false;
    }
  }, []);

  const openProfile = useCallback(async () => {
    return openProfileForWallet(state.wallet);
  }, [openProfileForWallet, state.wallet]);

  useEffect(() => {
    let isCancelled = false;

    const probeExistingSession = async () => {
      try {
        const wallet = await cartridgeController.probe();
        if (!wallet || isCancelled) {
          return;
        }

        await hydrateWalletState(wallet);
      } catch (error) {
        console.error('Failed to probe existing Cartridge session:', error);
      }
    };

    void probeExistingSession();

    return () => {
      isCancelled = true;
    };
  }, [hydrateWalletState]);

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
