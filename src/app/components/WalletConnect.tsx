import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useCartridgeWallet } from '../../hooks/useCartridgeWallet';
import { Button } from './ui/button';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  className = '',
}) => {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    profileName,
    network,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useCartridgeWallet();

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      if (result?.address && onConnect) {
        onConnect(result.address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 ${className}`}
      >
        {/* Network Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
          <div className={`w-2 h-2 rounded-full ${
            network === 'mainnet' ? 'bg-green-500' : 'bg-orange-500'
          }`} />
          <span className="text-sm font-medium capitalize">{network}</span>
        </div>

        {/* Balance */}
        {balance && (
          <div className="px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
            <span className="text-sm font-medium">{balance} ETH</span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="font-mono text-sm">
            {profileName ?? formatAddress(address)}
          </span>
        </div>

        {/* Disconnect Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Disconnect
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            Connect Cartridge Wallet
          </>
        )}
      </Button>

      {/* Network Switcher */}
      <div className="flex gap-2 mt-3">
        <Button
          variant={network === 'sepolia' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchNetwork('sepolia')}
          className="text-xs"
        >
          Sepolia
        </Button>
        <Button
          variant={network === 'mainnet' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchNetwork('mainnet')}
          className="text-xs"
        >
          Mainnet
        </Button>
      </div>
    </motion.div>
  );
};
