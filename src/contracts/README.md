# Intégration Starknet & Cartridge Wallet

Ce guide explique comment intégrer la blockchain Starknet et le wallet Cartridge dans votre jeu Noodles.

## 📁 Structure des fichiers créés

```
src/
├── components/
│   └── WalletConnect.tsx          # Composant de connexion wallet
├── hooks/
│   ├── useCartridgeWallet.ts      # Hook pour gérer Cartridge wallet
│   └── useNoodlesGameContract.ts  # Hook pour interagir avec le contrat
├── services/
│   └── starknetService.ts         # Service Starknet centralisé
└── contracts/
    └── NoodlesGame.cairo          # Contrat Starknet du jeu
```

## 🚀 Utilisation

### 1. Connexion au Wallet Cartridge

```tsx
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <div>
      <WalletConnect
        onConnect={(address) => console.log('Connected:', address)}
        onDisconnect={() => console.log('Disconnected')}
      />
    </div>
  );
}
```

### 2. Utilisation du Hook Wallet

```tsx
import { useCartridgeWallet } from './hooks/useCartridgeWallet';

function GameComponent() {
  const {
    wallet,
    isConnected,
    address,
    balance,
    connectWallet,
    disconnectWallet
  } = useCartridgeWallet();

  if (!isConnected) {
    return <button onClick={connectWallet}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} ETH</p>
    </div>
  );
}
```

### 3. Interaction avec le Contrat

```tsx
import { useNoodlesGameContract } from './hooks/useNoodlesGameContract';

function OrderCompletion() {
  const { completeOrder, getPlayerScore } = useNoodlesGameContract();

  const handleCompleteOrder = async (orderId: string, quality: number) => {
    try {
      await completeOrder(orderId, quality);
      const score = await getPlayerScore(walletAddress);
      console.log('New score:', score);
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  return (
    <button onClick={() => handleCompleteOrder('123', 5)}>
      Complete Order (5 stars)
    </button>
  );
}
```

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Cartridge Configuration
VITE_CARTRIDGE_APP_ID=your-app-id
VITE_STARKNET_NETWORK=sepolia  # ou mainnet
```

### 2. Configuration des Contrats

Dans `src/services/starknetService.ts`, mettez à jour les adresses des contrats :

```typescript
export const CONTRACTS = {
  NOODLES_GAME: {
    address: '0x1234...abcd', // Adresse du contrat déployé
    abi: [...], // ABI compilé du contrat
  },
  // ...
};
```

## 🛠️ Déploiement du Contrat

### 1. Compiler le contrat

```bash
# Installer Scarb si nécessaire
curl --proto '=https' --tlsv1.2 -sSf https://install.scarb.sh | sh

# Initialiser le projet Cairo
scarb init

# Compiler
scarb build
```

### 2. Déployer sur Starknet

```bash
# Installer Starknet Foundry
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/installation/scripts/install.sh | sh

# Déployer
snforge deploy
```

## 🔧 Développement

### Tests

```bash
# Tests unitaires
scarb test

# Tests d'intégration
snforge test
```

### Debugging

- Utilisez le réseau Sepolia pour les tests
- Vérifiez les transactions sur [StarkScan](https://sepolia.starkscan.co/)
- Utilisez les logs de console pour déboguer les interactions wallet

## 📚 Ressources

- [Documentation Starknet](https://docs.starknet.io/)
- [Documentation Cartridge](https://docs.cartridge.gg/)
- [Starkzap Documentation](https://docs.starknet.io/build/starkzap/)
- [Cairo Coding Rules](./guidelines/Cairo-Coding-Rules.md)

## 🔐 Sécurité

- Toujours vérifier les adresses des contrats avant les interactions
- Implémenter des confirmations utilisateur pour les transactions
- Utiliser des montants raisonnables pour les tests initiaux
- Ne jamais stocker de clés privées dans le code