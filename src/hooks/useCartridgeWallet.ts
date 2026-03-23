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
      const tokens = state.network === 'mainnet' ? mainnetTokens : sepoliaTokens;
      const [balanceAmount, profileName] = await Promise.all([
        wallet.balanceOf(tokens.ETH).catch(() => null),
        typeof wallet.username === 'function'
          ? wallet.username().catch(() => undefined)
          : Promise.resolve(undefined),
      ]);

      const address = typeof wallet.address === 'string' ? wallet.address : null;
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
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const { wallet } = await sdk.onboard({
        strategy: OnboardStrategy.Cartridge,
        deploy: 'if_needed',
      });

      return hydrateWalletState(wallet);
    } catch (error) {
      console.error('Failed to connect Cartridge wallet:', error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect Cartridge wallet.',
      }));
      throw error;
    }
  }, [hydrateWalletState, sdk]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (state.wallet) {
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
      }));
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [state.wallet]);

  const switchNetwork = useCallback((network: 'sepolia' | 'mainnet') => {
    setState((prev) => ({ ...prev, network, error: null }));
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

  const openProfile = useCallback(async () => {
    if (!state.wallet?.getController) return false;

    try {
      const controller = state.wallet.getController();
      if (controller?.openProfile) {
        await controller.openProfile();
        return true;
      }
    } catch (error) {
      console.error('Failed to open Cartridge profile:', error);
    }

    return false;
  }, [state.wallet]);

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
  };
};
