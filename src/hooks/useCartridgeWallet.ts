import { useState, useEffect, useCallback } from 'react';
import { StarkSDK, OnboardStrategy, sepoliaTokens, mainnetTokens } from 'starkzap';

interface CartridgeWalletState {
  wallet: any | null;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  network: 'sepolia' | 'mainnet';
}

export const useCartridgeWallet = () => {
  const [state, setState] = useState<CartridgeWalletState>({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    network: 'sepolia', // Default to sepolia for development
  });

  // note: the SDK types are somewhat loose; we cast to any to avoid
  // mismatches with the published typings.
  const sdk: any = new StarkSDK({
    network: state.network,
    // Add your Cartridge configuration if needed (typing may not include it)
    // cartridge: { rpcUrl: ... }
  });

  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true }));

      const { wallet } = await sdk.onboard({
        strategy: OnboardStrategy.Cartridge,
        // Cartridge specific configuration
        cartridge: {
          appId: 'noodles-game', // Replace with your app ID
          theme: 'dark',
        },
        deploy: 'if_needed',
      });

      // wallet type is loose; cast to any to access account/address
      const address = (wallet as any)?.account?.address;
      const tokens = state.network === 'mainnet' ? mainnetTokens : sepoliaTokens;
      const balance = await (wallet as any).balanceOf(tokens.ETH);

      setState(prev => ({
        ...prev,
        wallet,
        isConnected: true,
        isConnecting: false,
        address,
        balance: balance.toFormatted(),
      }));

    } catch (error) {
      console.error('Failed to connect Cartridge wallet:', error);
      setState(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, [sdk, state.network]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (state.wallet) {
        // Disconnect logic if available
        setState({
          wallet: null,
          isConnected: false,
          isConnecting: false,
          address: null,
          balance: null,
          network: state.network,
        });
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [state.wallet, state.network]);

  const switchNetwork = useCallback((network: 'sepolia' | 'mainnet') => {
    setState(prev => ({ ...prev, network }));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.wallet) return;

    try {
      const tokens = state.network === 'mainnet' ? mainnetTokens : sepoliaTokens;
      const balance = await state.wallet.balanceOf(tokens.ETH);
      setState(prev => ({ ...prev, balance: balance.toFormatted() }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.wallet, state.network]);

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
  };
};