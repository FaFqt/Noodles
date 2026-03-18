# 🥢 Noodles Game - Intégration Starknet & Cartridge

Un jeu mobile de gestion de restaurant de nouilles intégré à la blockchain Starknet avec wallet Cartridge.

## ✨ Fonctionnalités

- 🎮 **Gameplay**: Gestion de commandes clients avec système de notation par étoiles
- ⛓️ **Blockchain**: Intégration Starknet pour la persistance des scores et récompenses
- 👛 **Wallet**: Connexion Cartridge pour une expérience utilisateur fluide
- 🎨 **UI/UX**: Interface moderne avec animations et design cohérent

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
# Installer les dépendances npm
npm install

# Installer Scarb (compilateur Cairo)
npm run install-scarb

# Installer Starknet Foundry (tests & déploiement)
npm run install-starknet-foundry
```

### 2. Configuration

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier les valeurs dans .env selon vos besoins
```

### 3. Développement

```bash
# Lancer le serveur de développement
npm run dev

# Compiler les contrats Cairo
npm run cairo-build

# Tester les contrats
npm run starknet-test
```

## 📁 Architecture

```
src/
├── components/
│   ├── WalletConnect.tsx          # Connexion wallet Cartridge
│   └── ...                        # Autres composants UI
├── hooks/
│   ├── useCartridgeWallet.ts      # Gestion du wallet
│   └── useNoodlesGameContract.ts  # Interactions contrat
├── services/
│   └── starknetService.ts         # Service Starknet
└── contracts/
    ├── NoodlesGame.cairo          # Contrat principal
    └── README.md                  # Guide d'intégration

tests/
└── test_noodles_game.cairo        # Tests du contrat

guidelines/
└── Cairo-Coding-Rules.md         # Règles de développement Cairo
```

## 🎯 Utilisation du Wallet

### Connexion automatique

```tsx
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <WalletConnect
      onConnect={(address) => {
        console.log('Wallet connecté:', address);
        // Sauvegarder l'adresse ou initialiser le jeu
      }}
      onDisconnect={() => {
        console.log('Wallet déconnecté');
        // Nettoyer l'état du jeu
      }}
    />
  );
}
```

### Interactions avec le contrat

```tsx
import { useNoodlesGameContract } from './hooks/useNoodlesGameContract';

function OrderSystem() {
  const { completeOrder, getPlayerScore } = useNoodlesGameContract();

  const handleOrderComplete = async (orderId, quality) => {
    try {
      await completeOrder(orderId, quality);
      const newScore = await getPlayerScore(playerAddress);
      // Mettre à jour l'UI avec le nouveau score
    } catch (error) {
      // Gérer les erreurs (insuffisant de gas, etc.)
    }
  };
}
```

## 🔧 Développement Cairo

### Structure du contrat

Le contrat `NoodlesGame.cairo` gère :
- **Scores des joueurs** et niveaux
- **Système de récompenses** (pièces, expérience)
- **Suivi des commandes** complétées
- **Événements** pour l'indexation off-chain

### Tests

```bash
# Tests unitaires Cairo
npm run cairo-test

# Tests d'intégration Starknet
npm run starknet-test
```

### Déploiement

```bash
# Déployer sur Sepolia (testnet)
npm run starknet-deploy -- --network sepolia

# Déployer sur Mainnet
npm run starknet-deploy -- --network mainnet
```

## 🌐 Réseaux

- **Sepolia**: Réseau de test (recommandé pour le développement)
- **Mainnet**: Réseau principal Starknet

Changer de réseau dans `.env` :
```env
VITE_STARKNET_NETWORK=sepolia  # ou mainnet
```

## 🔐 Sécurité

- ✅ **Vérification des adresses** avant chaque transaction
- ✅ **Estimations de frais** avant exécution
- ✅ **Gestion d'erreurs** complète
- ✅ **Pas de clés privées** stockées dans le code

## 📚 Ressources

- [📖 Documentation Starknet](https://docs.starknet.io/)
- [🎮 Guide Cartridge](https://docs.cartridge.gg/)
- [⚡ Starkzap SDK](https://docs.starknet.io/build/starkzap/)
- [📝 Règles Cairo](./guidelines/Cairo-Coding-Rules.md)

## 🤝 Contribution

1. Suivre les [règles de codage Cairo](./guidelines/Cairo-Coding-Rules.md)
2. Tester toutes les modifications
3. Utiliser des commits descriptifs
4. Documenter les nouvelles fonctionnalités

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails.