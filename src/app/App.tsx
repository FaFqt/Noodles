import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageProvider } from './context/LanguageContext';
import { SplashScreen } from './components/SplashScreen';
import CartridgeConnectScreen from './components/CartridgeConnectScreen';
import { Village } from './components/Village';
import { CookingPhase } from './components/CookingPhase';
import BrothStirPhase from './components/BrothStirPhase';
import ServicePhase from './components/ServicePhase';
import GreenhousePhase from './components/GreenhousePhase';
import MarketPhase from './components/MarketPhase';
import IngredientInventoryScreen from './components/IngredientInventoryScreen';
import SatisfactionScreen, {
  computeSatisfactionResult,
} from './components/SatisfactionScreen';
import RewardScreen from './components/RewardScreen';
import NoodlesRestaurantScreen from './components/RestaurantScreen';
import RecipeSelectionScreen, {
  RecipeSelectionItem,
} from './components/RecipeSelectionScreen';
import { useIsMobile } from './components/ui/use-mobile';
import {
  type ConnectedCartridgeWallet,
  useCartridgeWallet,
} from '../hooks/useCartridgeWallet';
import { ensureCartridgeSessionPolicies } from '../services/cartridgeController';
import type { Order } from './types/order';
import type { PlayerWallet } from './types/playerWallet';
import {
  checkPlayerRegistrationOnDojo,
  claimFeatureUnlockOnDojo,
  grantSeedRewardOnDojo,
  getPlayerSnapshotOnDojo,
  type OnchainPlayerSnapshot,
  registerPlayerOnDojo,
  resetPlayerProgressOnDojo,
  syncIngredientInventoryOnDojo,
  syncPlayerOnDojo,
  syncPlayerProgressOnDojo,
} from '../services/dojoService';
import {
  applyXpGain,
  getXpToNextLevel,
  LEVEL_REWARDS,
  resolveLevelRewardDefinition,
  type LevelRewardDefinition,
  type LevelRewardType,
  type SeedRewardCrop,
} from './data/progression';
import {
  EMPTY_GREENHOUSE_SEED_STOCK,
  EMPTY_PLAYER_MARKET_INGREDIENT_INVENTORY,
  PLAYER_MARKET_INVENTORY_IDS,
  type PlayerMarketInventoryId,
} from './data/market';
import {
  RECIPES,
  SERVICES_PER_DAY,
  getIngredientById,
  getLocalizedText,
  getRecipeById,
  type Recipe,
} from './data/recipes';

// Assets ramen
import ramenSpicy from '../../src/assets/recipes/ramen-spicy.png';
import ramenChicken from '../../src/assets/recipes/ramen-chicken.png';
import ramenCorn from '../../src/assets/recipes/ramen-corn.png';
import ramenDeluxe from '../../src/assets/recipes/ramen-deluxe.png';
import ramenGarlicPork from '../../src/assets/recipes/ramen-pork.png';
import ramenMiso from '../../src/assets/recipes/ramen-miso.png';
import ramenShoyuClassic from '../../src/assets/recipes/ramen-shoyu.png';
import ramenShrimp from '../../src/assets/recipes/ramen-shrimp.png';
import ramenTonkotsu from '../../src/assets/recipes/ramen-tonkotsu.png';
import ramenVeggie from '../../src/assets/recipes/ramen-veggie.png';

type GameState =
  | 'splash'
  | 'cartridgeLoading'
  | 'cartridgeConnect'
  | 'village'
  | 'greenhouse'
  | 'market'
  | 'inventory'
  | 'restaurant'
  | 'recipeSelection'
  | 'cooking'
  | 'brothStir'
  | 'service'
  | 'satisfaction'
  | 'reward';

const RECIPE_IMAGES: Record<string, string> = {
  'ramen-shoyu-classic': ramenShoyuClassic,
  'ramen-miso': ramenMiso,
  'ramen-tonkotsu': ramenTonkotsu,
  'ramen-veggie': ramenVeggie,
  'ramen-chicken': ramenChicken,
  'ramen-spicy': ramenSpicy,
  'ramen-shrimp': ramenShrimp,
  'ramen-garlic-pork': ramenGarlicPork,
  'ramen-corn': ramenCorn,
  'ramen-deluxe': ramenDeluxe,
};

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DOJO_REGISTERED_PLAYERS_STORAGE_KEY = 'dojoRegisteredPlayers';
const WALLET_REWARD_STATE_STORAGE_KEY_PREFIX = 'walletRewardState';
const WALLET_PROGRESS_STATE_STORAGE_KEY_PREFIX = 'walletProgressState';
const GREENHOUSE_STATE_STORAGE_KEY_PREFIX = 'greenhouse-ui-state-v2';
const MARKET_STATE_STORAGE_KEY_PREFIX = 'market-ui-state-v1';
const LEGACY_GREENHOUSE_STATE_STORAGE_KEY = 'greenhouse-ui-state-v1';
const DEV_PROGRESS_RESET_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_RESET === 'true';
const INITIAL_PLAYER_STATS = {
  name: 'Bento-chan',
  level: 1,
  xp: 0,
  xpToNext: getXpToNextLevel(1),
  stars: 4,
  maxStars: 15,
  coins: 10,
};
const INITIAL_PLAYER_INVENTORY = {
  cornSeed: 0,
  bambooSeed: 0,
  mushroomSeed: 0,
  garlicSeed: 0,
  dragonPepperSeed: 0,
  fireChiliSeed: 0,
  moonHerbSeed: 0,
  crystalSalt: 0,
};
const INITIAL_PLAYER_MARKET_INVENTORY = {
  ...EMPTY_PLAYER_MARKET_INGREDIENT_INVENTORY,
};
const STARTER_UNLOCKED_MARKET_INVENTORY = {
  ...INITIAL_PLAYER_MARKET_INVENTORY,
  corn: 5,
  bamboo: 10,
  mushroom: 20,
  garlic: 5,
  egg: 5,
  pork: 10,
  chicken: 10,
  tofu: 10,
  shrimp: 20,
};

function readKnownDojoPlayers() {
  if (typeof window === 'undefined') return new Set<string>();

  const rawValue = window.localStorage.getItem(DOJO_REGISTERED_PLAYERS_STORAGE_KEY);
  if (!rawValue) return new Set<string>();

  try {
    const parsed = JSON.parse(rawValue) as string[];
    return new Set(
      parsed
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map((value) => value.toLowerCase())
    );
  } catch {
    return new Set<string>();
  }
}

interface WalletRewardState {
  claimedLevelRewardIds: string[];
  restaurantRewardFeaturesUnlocked: boolean;
  greenhouseUnlocked: boolean;
  marketUnlocked: boolean;
  ingredientInventoryInitialized: boolean;
  hasPendingIngredientInventorySync: boolean;
  tipJarTokensAvailable: number;
  tipJarCollected: boolean;
  inventory: typeof INITIAL_PLAYER_INVENTORY;
  marketInventory: typeof INITIAL_PLAYER_MARKET_INVENTORY;
}

interface WalletProgressState {
  playerStats: typeof INITIAL_PLAYER_STATS;
  hasPendingProgressSync: boolean;
  updatedAt: number;
}

function getWalletRewardStateStorageKey(walletAddress: string) {
  return `${WALLET_REWARD_STATE_STORAGE_KEY_PREFIX}:${walletAddress.toLowerCase()}`;
}

function readWalletRewardState(walletAddress: string): WalletRewardState | null {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(
    getWalletRewardStateStorageKey(walletAddress)
  );

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<WalletRewardState>;
    const inferredPendingIngredientSync =
      typeof parsed.hasPendingIngredientInventorySync === 'boolean'
        ? parsed.hasPendingIngredientInventorySync
        : PLAYER_MARKET_INVENTORY_IDS.some((ingredientId) =>
            Number(parsed.marketInventory?.[ingredientId] ?? 0) > 0
          );

    return {
      claimedLevelRewardIds: Array.isArray(parsed.claimedLevelRewardIds)
        ? parsed.claimedLevelRewardIds.filter(
            (value): value is string => typeof value === 'string' && value.length > 0
          )
        : [],
      restaurantRewardFeaturesUnlocked: Boolean(
        parsed.restaurantRewardFeaturesUnlocked
      ),
      greenhouseUnlocked: Boolean(parsed.greenhouseUnlocked),
      marketUnlocked: Boolean(parsed.marketUnlocked),
      ingredientInventoryInitialized: Boolean(parsed.ingredientInventoryInitialized),
      hasPendingIngredientInventorySync: inferredPendingIngredientSync,
      tipJarTokensAvailable: Number.isFinite(parsed.tipJarTokensAvailable)
        ? Math.max(0, Number(parsed.tipJarTokensAvailable))
        : 0,
      tipJarCollected: Boolean(parsed.tipJarCollected),
      inventory: {
        cornSeed: Number.isFinite(parsed.inventory?.cornSeed)
          ? Math.max(0, Number(parsed.inventory?.cornSeed))
          : 0,
        bambooSeed: Number.isFinite(parsed.inventory?.bambooSeed)
          ? Math.max(0, Number(parsed.inventory?.bambooSeed))
          : 0,
        mushroomSeed: Number.isFinite(parsed.inventory?.mushroomSeed)
          ? Math.max(0, Number(parsed.inventory?.mushroomSeed))
          : 0,
        garlicSeed: Number.isFinite(parsed.inventory?.garlicSeed)
          ? Math.max(0, Number(parsed.inventory?.garlicSeed))
          : 0,
        dragonPepperSeed: Number.isFinite(parsed.inventory?.dragonPepperSeed)
          ? Math.max(0, Number(parsed.inventory?.dragonPepperSeed))
          : 0,
        fireChiliSeed: Number.isFinite(parsed.inventory?.fireChiliSeed)
          ? Math.max(0, Number(parsed.inventory?.fireChiliSeed))
          : 0,
        moonHerbSeed: Number.isFinite(parsed.inventory?.moonHerbSeed)
          ? Math.max(0, Number(parsed.inventory?.moonHerbSeed))
          : 0,
        crystalSalt: Number.isFinite(parsed.inventory?.crystalSalt)
          ? Math.max(0, Number(parsed.inventory?.crystalSalt))
          : 0,
      },
      marketInventory: PLAYER_MARKET_INVENTORY_IDS.reduce((accumulator, ingredientId) => {
        accumulator[ingredientId] = Number.isFinite(parsed.marketInventory?.[ingredientId])
          ? Math.max(0, Number(parsed.marketInventory?.[ingredientId]))
          : INITIAL_PLAYER_MARKET_INVENTORY[ingredientId];
        return accumulator;
      }, {} as typeof INITIAL_PLAYER_MARKET_INVENTORY),
    };
  } catch {
    return null;
  }
}

function getWalletProgressStateStorageKey(walletAddress: string) {
  return `${WALLET_PROGRESS_STATE_STORAGE_KEY_PREFIX}:${walletAddress.toLowerCase()}`;
}

function getGreenhouseStateStorageKey(walletAddress?: string | null) {
  return walletAddress
    ? `${GREENHOUSE_STATE_STORAGE_KEY_PREFIX}:${walletAddress.toLowerCase()}`
    : `${GREENHOUSE_STATE_STORAGE_KEY_PREFIX}:local`;
}

function getMarketStateStorageKey(walletAddress?: string | null) {
  return walletAddress
    ? `${MARKET_STATE_STORAGE_KEY_PREFIX}:${walletAddress.toLowerCase()}`
    : `${MARKET_STATE_STORAGE_KEY_PREFIX}:local`;
}

function readWalletProgressState(walletAddress: string): WalletProgressState | null {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(
    getWalletProgressStateStorageKey(walletAddress)
  );

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<WalletProgressState>;

    if (!parsed.playerStats) {
      return null;
    }

    return {
      playerStats: {
        name:
          typeof parsed.playerStats.name === 'string'
            ? parsed.playerStats.name
            : INITIAL_PLAYER_STATS.name,
        level: Number.isFinite(parsed.playerStats.level)
          ? Math.max(1, Number(parsed.playerStats.level))
          : INITIAL_PLAYER_STATS.level,
        xp: Number.isFinite(parsed.playerStats.xp)
          ? Math.max(0, Number(parsed.playerStats.xp))
          : INITIAL_PLAYER_STATS.xp,
        xpToNext: Number.isFinite(parsed.playerStats.xpToNext)
          ? Math.max(1, Number(parsed.playerStats.xpToNext))
          : INITIAL_PLAYER_STATS.xpToNext,
        stars: Number.isFinite(parsed.playerStats.stars)
          ? Math.max(0, Number(parsed.playerStats.stars))
          : INITIAL_PLAYER_STATS.stars,
        maxStars: Number.isFinite(parsed.playerStats.maxStars)
          ? Math.max(1, Number(parsed.playerStats.maxStars))
          : INITIAL_PLAYER_STATS.maxStars,
        coins: Number.isFinite(parsed.playerStats.coins)
          ? Math.max(0, Number(parsed.playerStats.coins))
          : INITIAL_PLAYER_STATS.coins,
      },
      hasPendingProgressSync: Boolean(parsed.hasPendingProgressSync),
      updatedAt: Number.isFinite(parsed.updatedAt) ? Number(parsed.updatedAt) : 0,
    };
  } catch {
    return null;
  }
}

function getDojoHydrationSummary(snapshot: OnchainPlayerSnapshot | null | undefined) {
  if (!snapshot) return null;

  if (!snapshot.inventory) {
    return 'progression recuperee depuis Dojo';
  }

  return snapshot.inventory.ingredientInventorySupported
    ? 'progression, solde Noods et inventaire ingredients recuperes depuis Dojo'
    : 'progression et solde Noods recuperes depuis Dojo';
}

function getPlayerMarketInventoryFromOnchainInventory(
  inventory?: OnchainPlayerSnapshot['inventory']
) {
  if (!inventory?.ingredientInventorySupported) return null;

  return {
    corn: inventory.corn,
    bamboo: inventory.bamboo,
    mushroom: inventory.mushroom,
    garlic: inventory.garlic,
    egg: inventory.egg,
    pork: inventory.pork,
    chicken: inventory.chicken,
    tofu: inventory.tofu,
    shrimp: inventory.shrimp,
  } satisfies typeof INITIAL_PLAYER_MARKET_INVENTORY;
}

function incrementInventoryValue(
  inventory: typeof INITIAL_PLAYER_INVENTORY,
  crop: SeedRewardCrop,
  amount: number
) {
  if (crop === 'corn') {
    return { ...inventory, cornSeed: inventory.cornSeed + amount };
  }

  if (crop === 'bamboo') {
    return { ...inventory, bambooSeed: inventory.bambooSeed + amount };
  }

  if (crop === 'mushroom') {
    return { ...inventory, mushroomSeed: inventory.mushroomSeed + amount };
  }

  if (crop === 'garlic') {
    return { ...inventory, garlicSeed: inventory.garlicSeed + amount };
  }

  if (crop === 'dragonpepper') {
    return {
      ...inventory,
      dragonPepperSeed: inventory.dragonPepperSeed + amount,
    };
  }

  if (crop === 'firechili') {
    return {
      ...inventory,
      fireChiliSeed: inventory.fireChiliSeed + amount,
    };
  }

  if (crop === 'moonherb') {
    return {
      ...inventory,
      moonHerbSeed: inventory.moonHerbSeed + amount,
    };
  }

  return {
    ...inventory,
    crystalSalt: inventory.crystalSalt + amount,
  };
}

function getGreenhouseSeedInventoryFromPlayerInventory(
  inventory: typeof INITIAL_PLAYER_INVENTORY
) {
  return {
    ...EMPTY_GREENHOUSE_SEED_STOCK,
    corn: inventory.cornSeed,
    bamboo: inventory.bambooSeed,
    mushroom: inventory.mushroomSeed,
    garlic: inventory.garlicSeed,
    dragonpepper: inventory.dragonPepperSeed,
    firechili: inventory.fireChiliSeed,
    moonherb: inventory.moonHerbSeed,
  };
}

function syncRewardSeedInventoryFromGreenhouse(
  inventory: typeof INITIAL_PLAYER_INVENTORY,
  greenhouseInventory: typeof EMPTY_GREENHOUSE_SEED_STOCK
) {
  if (
    inventory.cornSeed === greenhouseInventory.corn &&
    inventory.bambooSeed === greenhouseInventory.bamboo &&
    inventory.mushroomSeed === greenhouseInventory.mushroom &&
    inventory.garlicSeed === greenhouseInventory.garlic &&
    inventory.dragonPepperSeed === greenhouseInventory.dragonpepper &&
    inventory.fireChiliSeed === greenhouseInventory.firechili &&
    inventory.moonHerbSeed === greenhouseInventory.moonherb
  ) {
    return inventory;
  }

  return {
    ...inventory,
    cornSeed: greenhouseInventory.corn,
    bambooSeed: greenhouseInventory.bamboo,
    mushroomSeed: greenhouseInventory.mushroom,
    garlicSeed: greenhouseInventory.garlic,
    dragonPepperSeed: greenhouseInventory.dragonpepper,
    fireChiliSeed: greenhouseInventory.firechili,
    moonHerbSeed: greenhouseInventory.moonherb,
  };
}

function getFirstRewardLevelByType(rewardType: LevelRewardType) {
  const matchingReward = LEVEL_REWARDS.find((reward) => reward.type === rewardType);
  return matchingReward?.level ?? Number.POSITIVE_INFINITY;
}

function hasClaimedRewardType(
  claimedRewardIds: string[],
  rewardType: LevelRewardType
) {
  const matchingRewardIds = new Set(
    LEVEL_REWARDS.filter((reward) => reward.type === rewardType).map((reward) => reward.id)
  );

  return claimedRewardIds.some((rewardId) => matchingRewardIds.has(rewardId));
}

function incrementMarketInventoryValue(
  inventory: typeof INITIAL_PLAYER_MARKET_INVENTORY,
  ingredientId: PlayerMarketInventoryId,
  amount: number
) {
  return {
    ...inventory,
    [ingredientId]: inventory[ingredientId] + amount,
  };
}

function isPlayerMarketIngredientId(value: string): value is PlayerMarketInventoryId {
  return PLAYER_MARKET_INVENTORY_IDS.includes(value as PlayerMarketInventoryId);
}

function getRecipeManagedIngredients(recipe: Pick<Recipe, 'requiredIngredients'>) {
  return recipe.requiredIngredients.filter(
    (ingredient): ingredient is { ingredientId: PlayerMarketInventoryId; quantity: number } =>
      isPlayerMarketIngredientId(ingredient.ingredientId)
  );
}

function canCraftRecipeWithInventory(
  recipe: Pick<Recipe, 'requiredIngredients'>,
  inventory: typeof INITIAL_PLAYER_MARKET_INVENTORY
) {
  return getRecipeManagedIngredients(recipe).every(
    (ingredient) => inventory[ingredient.ingredientId] >= ingredient.quantity
  );
}

function consumeRecipeIngredients(
  inventory: typeof INITIAL_PLAYER_MARKET_INVENTORY,
  recipe: Pick<Recipe, 'requiredIngredients'>
) {
  return getRecipeManagedIngredients(recipe).reduce(
    (nextInventory, ingredient) => ({
      ...nextInventory,
      [ingredient.ingredientId]: Math.max(
        0,
        nextInventory[ingredient.ingredientId] - ingredient.quantity
      ),
    }),
    inventory
  );
}

function mergeStarterInventory(
  inventory: typeof INITIAL_PLAYER_MARKET_INVENTORY
) {
  return PLAYER_MARKET_INVENTORY_IDS.reduce((nextInventory, ingredientId) => {
    nextInventory[ingredientId] = Math.max(
      inventory[ingredientId],
      STARTER_UNLOCKED_MARKET_INVENTORY[ingredientId]
    );
    return nextInventory;
  }, {} as typeof INITIAL_PLAYER_MARKET_INVENTORY);
}

function getMissingManagedIngredients(
  recipe: Pick<Recipe, 'requiredIngredients'>,
  inventory: typeof INITIAL_PLAYER_MARKET_INVENTORY
) {
  return getRecipeManagedIngredients(recipe).filter(
    (ingredient) => inventory[ingredient.ingredientId] < ingredient.quantity
  );
}

function hasSameSyncedProgress(
  left: Pick<typeof INITIAL_PLAYER_STATS, 'level' | 'xp' | 'xpToNext' | 'coins'>,
  right: Pick<typeof INITIAL_PLAYER_STATS, 'level' | 'xp' | 'xpToNext' | 'coins'>
) {
  return (
    left.level === right.level &&
    left.xp === right.xp &&
    left.xpToNext === right.xpToNext &&
    left.coins === right.coins
  );
}

export default function App() {
  const RESTAURANT_SERVICE_COOLDOWN_MS = 4 * 60 * 1000;
  const isMobile = useIsMobile();
  const {
    wallet: cartridgeWallet,
    isConnected: isCartridgeConnected,
    isConnecting: isCartridgeConnecting,
    address: cartridgeAddress,
    balance: cartridgeBalance,
    profileName: cartridgeProfileName,
    network: cartridgeNetwork,
    error: cartridgeError,
    statusMessage: cartridgeStatusMessage,
    connectWallet,
    disconnectWallet,
    openProfile: openCartridgeProfile,
    openProfileForWallet,
  } = useCartridgeWallet();

  const [gameState, setGameState] = useState<GameState>('splash');

  const [playerStats, setPlayerStats] = useState(INITIAL_PLAYER_STATS);
  const [playerWallet, setPlayerWallet] = useState<PlayerWallet | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [cookingPhaseQuality, setCookingPhaseQuality] = useState<number | null>(null);
  const [brothStirQuality, setBrothStirQuality] = useState<number | null>(null);
  const [cookingTimeLeftSeconds, setCookingTimeLeftSeconds] = useState<number | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    order: Order;
    quality: number;
    ingredientQuality: number;
    brothQuality: number;
    toppingQuality: number;
    serviceQuality: number;
    totalTimeSpentSeconds: number;
    targetTotalTimeSeconds: number;
    didExpire: boolean;
  } | null>(null);

  const [orderIdCounter, setOrderIdCounter] = useState(1);
  const [completedServices, setCompletedServices] = useState(0);
  const [dayCoinsEarned, setDayCoinsEarned] = useState(0);
  const [dayXpEarned, setDayXpEarned] = useState(0);
  const [dayServiceResults, setDayServiceResults] = useState<
    { quality: number; xp: number; timeSeconds: number }[]
  >([]);
  const [restaurantServicePausedUntil, setRestaurantServicePausedUntil] =
    useState<number | null>(() => {
      if (typeof window === 'undefined') return null;

      const rawValue = window.localStorage.getItem('restaurantServicePausedUntil');
      if (!rawValue) return null;

      const parsedValue = Number(rawValue);
      if (!Number.isFinite(parsedValue)) return null;

      return parsedValue > Date.now() ? parsedValue : null;
    });
  const [completedRestaurantDays, setCompletedRestaurantDays] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;

    const rawValue = window.localStorage.getItem('completedRestaurantDays');
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  });
  const [tipJarTokensAvailable, setTipJarTokensAvailable] = useState(0);
  const [tipJarCollected, setTipJarCollected] = useState(false);
  const [restaurantRewardFeaturesUnlocked, setRestaurantRewardFeaturesUnlocked] =
    useState(false);
  const [greenhouseUnlocked, setGreenhouseUnlocked] = useState(false);
  const [marketUnlocked, setMarketUnlocked] = useState(false);
  const [ingredientInventoryInitialized, setIngredientInventoryInitialized] = useState(false);
  const [playerInventory, setPlayerInventory] = useState(INITIAL_PLAYER_INVENTORY);
  const [playerMarketInventory, setPlayerMarketInventory] = useState(
    INITIAL_PLAYER_MARKET_INVENTORY
  );
  const [claimedLevelRewardIds, setClaimedLevelRewardIds] = useState<string[]>([]);
  const [pendingLevelRewards, setPendingLevelRewards] = useState<
    { reward: LevelRewardDefinition; level: number }[]
  >([]);
  const [walletSyncMessage, setWalletSyncMessage] = useState<string | null>(null);
  const [restaurantInventoryMessage, setRestaurantInventoryMessage] = useState<string | null>(
    null
  );
  const [dojoRegistrationConfirmed, setDojoRegistrationConfirmed] = useState(false);
  const [knownDojoPlayers, setKnownDojoPlayers] = useState<Set<string>>(readKnownDojoPlayers);
  const [isWalletSyncing, setIsWalletSyncing] = useState(false);
  const [hasHydratedOnchainProgress, setHasHydratedOnchainProgress] = useState(false);
  const [hasPendingProgressSync, setHasPendingProgressSync] = useState(false);
  const [hasPendingIngredientInventorySync, setHasPendingIngredientInventorySync] =
    useState(false);
  const bootstrappedWalletAddressRef = useRef<string | null>(null);
  const hasStartedWalletLoadingRef = useRef(false);
  const progressSyncInFlightRef = useRef(false);
  const progressSyncQueuedWhileInFlightRef = useRef(false);
  const latestQueuedProgressSyncReasonRef = useRef('initialisation');
  const latestPlayerStatsRef = useRef(playerStats);
  const hasPendingProgressSyncRef = useRef(hasPendingProgressSync);
  const ingredientInventorySyncInFlightRef = useRef(false);
  const latestQueuedIngredientInventorySyncReasonRef = useRef('initialisation');
  const latestPlayerMarketInventoryRef = useRef(playerMarketInventory);
  const hasPendingIngredientInventorySyncRef = useRef(hasPendingIngredientInventorySync);

  const allRecipeCards: RecipeSelectionItem[] = useMemo(
    () =>
      RECIPES.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        image: RECIPE_IMAGES[recipe.id],
        timer: recipe.timer,
        reward: recipe.reward,
      })),
    []
  );

  const [visibleRecipes, setVisibleRecipes] = useState<RecipeSelectionItem[]>(
    shuffleArray(
      RECIPES.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        image: RECIPE_IMAGES[recipe.id],
        timer: recipe.timer,
        reward: recipe.reward,
      }))
    ).slice(0, 4)
  );
  const displayPlayerName = playerWallet?.profileName ?? playerStats.name;
  const greenhouseStorageKey = getGreenhouseStateStorageKey(playerWallet?.address);
  const marketStorageKey = getMarketStateStorageKey(playerWallet?.address);
  const tipJarUnlockLevel = getFirstRewardLevelByType('tipjar_unlock');
  const greenhouseUnlockLevel = getFirstRewardLevelByType('greenhouse_unlock');
  const marketUnlockLevel = getFirstRewardLevelByType('market_unlock');
  const ingredientInventoryActivationLevel = Math.max(6, marketUnlockLevel);
  const isTipJarUnlocked =
    restaurantRewardFeaturesUnlocked ||
    playerStats.level >= tipJarUnlockLevel ||
    hasClaimedRewardType(claimedLevelRewardIds, 'tipjar_unlock');
  const isGreenhouseAccessible =
    greenhouseUnlocked ||
    playerStats.level >= greenhouseUnlockLevel ||
    hasClaimedRewardType(claimedLevelRewardIds, 'greenhouse_unlock');
  const isMarketAccessible =
    marketUnlocked ||
    playerStats.level >= marketUnlockLevel ||
    hasClaimedRewardType(claimedLevelRewardIds, 'market_unlock');
  const isIngredientInventoryActive =
    ingredientInventoryInitialized ||
    isMarketAccessible ||
    playerStats.level >= ingredientInventoryActivationLevel;
  const craftableRecipeIds = useMemo(
    () =>
      new Set(
        RECIPES.filter(
          (recipe) =>
            !isIngredientInventoryActive ||
            canCraftRecipeWithInventory(recipe, playerMarketInventory)
        ).map((recipe) => recipe.id)
      ),
    [isIngredientInventoryActive, playerMarketInventory]
  );
  const hasCraftableRecipes = craftableRecipeIds.size > 0;
  const displayedRecipeChoices = useMemo(() => {
    if (!isIngredientInventoryActive) {
      return visibleRecipes;
    }

    const visibleCraftable = visibleRecipes.filter((recipe) =>
      craftableRecipeIds.has(recipe.id)
    );
    const visibleIds = new Set(visibleCraftable.map((recipe) => recipe.id));
    const fallbackRecipes = allRecipeCards.filter(
      (recipe) => craftableRecipeIds.has(recipe.id) && !visibleIds.has(recipe.id)
    );

    return [...visibleCraftable, ...fallbackRecipes].slice(0, 4);
  }, [allRecipeCards, craftableRecipeIds, isIngredientInventoryActive, visibleRecipes]);
  const canSyncProgressOnDojo =
    Boolean(cartridgeWallet) &&
    isCartridgeConnected &&
    Boolean(playerWallet?.dojoRegistered) &&
    hasHydratedOnchainProgress;

  useEffect(() => {
    if (!isIngredientInventoryActive || ingredientInventoryInitialized) return;

    setPlayerMarketInventory((prev) => mergeStarterInventory(prev));
    setIngredientInventoryInitialized(true);
    setHasPendingIngredientInventorySync(true);
    latestQueuedIngredientInventorySyncReasonRef.current = 'starter_pack_niveau_6';
    setRestaurantInventoryMessage(
      'L’inventaire ingredients est actif. Le maïs devient maintenant ta premiere ressource sous tension.'
    );
  }, [ingredientInventoryInitialized, isIngredientInventoryActive]);

  useEffect(() => {
    latestPlayerStatsRef.current = playerStats;
  }, [playerStats]);

  useEffect(() => {
    hasPendingProgressSyncRef.current = hasPendingProgressSync;
  }, [hasPendingProgressSync]);

  useEffect(() => {
    latestPlayerMarketInventoryRef.current = playerMarketInventory;
  }, [playerMarketInventory]);

  useEffect(() => {
    hasPendingIngredientInventorySyncRef.current = hasPendingIngredientInventorySync;
  }, [hasPendingIngredientInventorySync]);

  useEffect(() => {
    if (!restaurantInventoryMessage) return;

    const timeout = window.setTimeout(() => {
      setRestaurantInventoryMessage(null);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [restaurantInventoryMessage]);

  const restoreWalletRewardState = useCallback(
    (walletAddress: string, onchainSnapshot?: OnchainPlayerSnapshot | null) => {
      const storedState = readWalletRewardState(walletAddress);
      const onchainMarketInventory = getPlayerMarketInventoryFromOnchainInventory(
        onchainSnapshot?.inventory
      );
      const inferredTipJarUnlocked =
        Boolean(storedState?.restaurantRewardFeaturesUnlocked) ||
        Boolean(onchainSnapshot?.unlocks?.tipJarUnlocked) ||
        (onchainSnapshot?.progress.level ?? playerStats.level) >= tipJarUnlockLevel ||
        hasClaimedRewardType(storedState?.claimedLevelRewardIds ?? [], 'tipjar_unlock');
      const inferredGreenhouseUnlocked =
        Boolean(storedState?.greenhouseUnlocked) ||
        Boolean(onchainSnapshot?.unlocks?.greenhouseUnlocked) ||
        (onchainSnapshot?.progress.level ?? playerStats.level) >= greenhouseUnlockLevel ||
        hasClaimedRewardType(storedState?.claimedLevelRewardIds ?? [], 'greenhouse_unlock');
      const inferredMarketUnlocked =
        Boolean(storedState?.marketUnlocked) ||
        Boolean(onchainSnapshot?.unlocks?.marketUnlocked) ||
        (onchainSnapshot?.progress.level ?? playerStats.level) >= marketUnlockLevel ||
        hasClaimedRewardType(storedState?.claimedLevelRewardIds ?? [], 'market_unlock');
      const inferredIngredientInventoryInitialized =
        Boolean(storedState?.ingredientInventoryInitialized) ||
        Boolean(onchainSnapshot?.unlocks?.ingredientInventoryReady);
      const nextInventory = {
        cornSeed: Math.max(
          storedState?.inventory.cornSeed ?? 0,
          onchainSnapshot?.inventory?.cornSeed ?? 0
        ),
        bambooSeed: Math.max(storedState?.inventory.bambooSeed ?? 0, 0),
        mushroomSeed: Math.max(storedState?.inventory.mushroomSeed ?? 0, 0),
        garlicSeed: Math.max(storedState?.inventory.garlicSeed ?? 0, 0),
        dragonPepperSeed: Math.max(
          storedState?.inventory.dragonPepperSeed ?? 0,
          onchainSnapshot?.inventory?.dragonPepperSeed ?? 0
        ),
        fireChiliSeed: Math.max(storedState?.inventory.fireChiliSeed ?? 0, 0),
        moonHerbSeed: Math.max(
          storedState?.inventory.moonHerbSeed ?? 0,
          onchainSnapshot?.inventory?.moonHerbSeed ?? 0
        ),
        crystalSalt: Math.max(
          storedState?.inventory.crystalSalt ?? 0,
          onchainSnapshot?.inventory?.crystalSalt ?? 0
        ),
      };
      const nextMarketInventory =
        storedState?.hasPendingIngredientInventorySync || !onchainMarketInventory
          ? storedState?.marketInventory ?? INITIAL_PLAYER_MARKET_INVENTORY
          : onchainMarketInventory;

      setClaimedLevelRewardIds(storedState?.claimedLevelRewardIds ?? []);
      setRestaurantRewardFeaturesUnlocked(inferredTipJarUnlocked);
      setGreenhouseUnlocked(inferredGreenhouseUnlocked);
      setMarketUnlocked(inferredMarketUnlocked);
      setIngredientInventoryInitialized(inferredIngredientInventoryInitialized);
      setHasPendingIngredientInventorySync(
        Boolean(storedState?.hasPendingIngredientInventorySync)
      );
      setTipJarTokensAvailable(storedState?.tipJarTokensAvailable ?? 0);
      setTipJarCollected(storedState?.tipJarCollected ?? false);
      setPlayerInventory(nextInventory);
      setPlayerMarketInventory(nextMarketInventory);
      setPendingLevelRewards([]);
    },
    [greenhouseUnlockLevel, marketUnlockLevel, playerStats.level, tipJarUnlockLevel]
  );

  const restoreWalletProgressState = useCallback(
    (walletAddress: string, onchainSnapshot?: OnchainPlayerSnapshot | null) => {
      const storedState = readWalletProgressState(walletAddress);

      if (!storedState) {
        if (onchainSnapshot) {
          setPlayerStats((prev) => ({
            ...prev,
            level: onchainSnapshot.progress.level || INITIAL_PLAYER_STATS.level,
            xp: onchainSnapshot.progress.xp,
            xpToNext:
              onchainSnapshot.progress.xpToNext || INITIAL_PLAYER_STATS.xpToNext,
            coins: onchainSnapshot.inventory?.noodsBalance ?? prev.coins,
          }));
        } else {
          setPlayerStats((prev) => ({
            ...INITIAL_PLAYER_STATS,
            name: prev.name,
          }));
        }
        setHasPendingProgressSync(false);
        return;
      }

      if (!onchainSnapshot) {
        setPlayerStats(storedState.playerStats);
        setHasPendingProgressSync(storedState.hasPendingProgressSync);
        return;
      }

      const shouldUseLocalProgress = storedState.hasPendingProgressSync;

      if (shouldUseLocalProgress) {
        setPlayerStats(storedState.playerStats);
      } else {
        setPlayerStats((prev) => ({
          ...prev,
          level: onchainSnapshot.progress.level || INITIAL_PLAYER_STATS.level,
          xp: onchainSnapshot.progress.xp,
          xpToNext:
            onchainSnapshot.progress.xpToNext || INITIAL_PLAYER_STATS.xpToNext,
          coins:
            onchainSnapshot.inventory?.noodsBalance ?? storedState.playerStats.coins,
        }));
      }

      setHasPendingProgressSync(storedState.hasPendingProgressSync);
    },
    []
  );

  const clearWalletConnectionState = useCallback(() => {
    setWalletSyncMessage(null);
    setPlayerWallet(null);
    setDojoRegistrationConfirmed(false);
    setHasHydratedOnchainProgress(false);
    setHasPendingIngredientInventorySync(false);
  }, []);

  const queueProgressSync = useCallback((reason: string) => {
    latestQueuedProgressSyncReasonRef.current = reason;
    progressSyncQueuedWhileInFlightRef.current = true;
    setHasPendingProgressSync(true);
  }, []);

  const queueIngredientInventorySync = useCallback((reason: string) => {
    latestQueuedIngredientInventorySyncReasonRef.current = reason;
    setHasPendingIngredientInventorySync(true);
  }, []);

  const flushProgressSyncQueue = useCallback(
    async (triggerLabel: string) => {
      if (!hasPendingProgressSyncRef.current || !canSyncProgressOnDojo || !cartridgeWallet) {
        return;
      }

      if (progressSyncInFlightRef.current) {
        progressSyncQueuedWhileInFlightRef.current = true;
        return;
      }

      progressSyncInFlightRef.current = true;

      try {
        while (hasPendingProgressSyncRef.current && canSyncProgressOnDojo) {
          progressSyncQueuedWhileInFlightRef.current = false;
          const snapshot = latestPlayerStatsRef.current;
          const syncReason = latestQueuedProgressSyncReasonRef.current || triggerLabel;
          const result = await syncPlayerProgressOnDojo({
            wallet: cartridgeWallet,
            level: snapshot.level,
            xp: snapshot.xp,
            xpToNext: snapshot.xpToNext,
            noodsBalance: snapshot.coins,
          });

          if (result.status === 'failed') {
            setWalletSyncMessage(
              `La sync onchain (${syncReason}) a echoue: ${result.message}`
            );
            return;
          }

          if (result.status === 'skipped') {
            setWalletSyncMessage(
              `La sync onchain (${syncReason}) a ete ignoree: ${result.message}`
            );
            setHasPendingProgressSync(false);
            return;
          }

          const latestProgress = latestPlayerStatsRef.current;
          const hasNewerProgress =
            progressSyncQueuedWhileInFlightRef.current ||
            !hasSameSyncedProgress(snapshot, latestProgress);

          if (!hasNewerProgress) {
            setHasPendingProgressSync(false);
            return;
          }
        }
      } finally {
        progressSyncInFlightRef.current = false;
      }
    },
    [
      cartridgeWallet,
      isCartridgeConnected,
      canSyncProgressOnDojo,
      playerWallet?.dojoRegistered,
      hasHydratedOnchainProgress,
    ]
  );

  const flushIngredientInventorySyncQueue = useCallback(
    async (triggerLabel: string) => {
      if (
        !hasPendingIngredientInventorySyncRef.current ||
        !canSyncProgressOnDojo ||
        !cartridgeWallet
      ) {
        return;
      }

      if (ingredientInventorySyncInFlightRef.current) {
        return;
      }

      ingredientInventorySyncInFlightRef.current = true;

      try {
        const inventorySnapshot = latestPlayerMarketInventoryRef.current;
        const syncReason =
          latestQueuedIngredientInventorySyncReasonRef.current || triggerLabel;
        const result = await syncIngredientInventoryOnDojo({
          wallet: cartridgeWallet,
          inventory: inventorySnapshot,
        });

        if (result.status === 'failed') {
          setWalletSyncMessage(
            `La sync inventaire onchain (${syncReason}) a echoue: ${result.message}`
          );
          return;
        }

        if (result.status === 'skipped') {
          setWalletSyncMessage(
            `La sync inventaire onchain (${syncReason}) a ete ignoree: ${result.message}`
          );
        }

        setHasPendingIngredientInventorySync(false);
      } finally {
        ingredientInventorySyncInFlightRef.current = false;
      }
    },
    [canSyncProgressOnDojo, cartridgeWallet]
  );

  const handleStartGame = () => {
    setWalletSyncMessage(null);
    hasStartedWalletLoadingRef.current = false;
    setGameState('cartridgeLoading');
  };

  const hydrateProgressFromDojo = useCallback(
    async (params: { playerAddress: string; network: 'sepolia' | 'mainnet' }) => {
      const onchainSnapshot = await getPlayerSnapshotOnDojo(params);

      if (!onchainSnapshot) {
        setHasHydratedOnchainProgress(false);
        setWalletSyncMessage(
          'Le wallet est connecte, mais la progression onchain n’a pas pu etre relue. La sync automatique reste en pause pour eviter tout ecrasement.'
        );
        return null;
      }

      if (!onchainSnapshot.inventory) {
        setHasHydratedOnchainProgress(false);
        setWalletSyncMessage(
          'La progression Dojo a ete retrouvee, mais l’inventaire onchain n’a pas pu etre relu. La sync automatique est mise en pause pour eviter d’ecraser les Noods.'
        );
        return onchainSnapshot;
      }

      setHasHydratedOnchainProgress(true);
      return onchainSnapshot;
    },
    []
  );

  const bootstrapWalletSession = useCallback(
    async (result: ConnectedCartridgeWallet) => {
      setIsWalletSyncing(true);

      try {
        await ensureCartridgeSessionPolicies();

        const normalizedAddress = result.address.toLowerCase();
        restoreWalletRewardState(result.address, null);
        const cachedWalletMatches =
          playerWallet?.address?.toLowerCase() === normalizedAddress &&
          playerWallet?.dojoRegistered;
        const knownPlayerMatches = knownDojoPlayers.has(normalizedAddress);
        const remoteRegistrationState =
          cachedWalletMatches || knownPlayerMatches
            ? true
            : await checkPlayerRegistrationOnDojo({
                playerAddress: result.address,
                network: result.network,
              });

        if (remoteRegistrationState === true) {
          const dojoSync = await syncPlayerOnDojo({ wallet: result.wallet });

          if (dojoSync.status === 'missing') {
            setKnownDojoPlayers((prev) => {
              const next = new Set(prev);
              next.delete(normalizedAddress);
              return next;
            });
          } else if (dojoSync.status === 'failed') {
            setWalletSyncMessage(
              `Session Cartridge ouverte, mais le signal login Dojo a echoue: ${dojoSync.message}`
            );
          }

          if (dojoSync.status !== 'missing') {
            setDojoRegistrationConfirmed(true);
            setKnownDojoPlayers((prev) => {
              const next = new Set(prev);
              next.add(normalizedAddress);
              return next;
            });
            const onchainSnapshot = await hydrateProgressFromDojo({
              playerAddress: result.address,
              network: result.network,
            });
            restoreWalletProgressState(result.address, onchainSnapshot);
            restoreWalletRewardState(result.address, onchainSnapshot);
            const hydrationSummary = getDojoHydrationSummary(onchainSnapshot);
            if (hydrationSummary) {
              setWalletSyncMessage(
                dojoSync.status === 'synced'
                  ? `Compte joueur retrouve, session Dojo rafraichie et ${hydrationSummary}.`
                  : `Compte joueur et ${hydrationSummary}.`
              );
            }
            setGameState('village');
            return;
          }
        }

        if (remoteRegistrationState === null) {
          const dojoSync = await syncPlayerOnDojo({ wallet: result.wallet });

          if (dojoSync.status === 'synced') {
            setDojoRegistrationConfirmed(true);
            setKnownDojoPlayers((prev) => {
              const next = new Set(prev);
              next.add(normalizedAddress);
              return next;
            });
            const onchainSnapshot = await hydrateProgressFromDojo({
              playerAddress: result.address,
              network: result.network,
            });
            restoreWalletProgressState(result.address, onchainSnapshot);
            restoreWalletRewardState(result.address, onchainSnapshot);
            const hydrationSummary = getDojoHydrationSummary(onchainSnapshot);
            if (hydrationSummary) {
              setWalletSyncMessage(`Etat onchain verifie et ${hydrationSummary}.`);
            }
            setGameState('village');
            return;
          }

          if (dojoSync.status === 'failed') {
            setDojoRegistrationConfirmed(false);
            setWalletSyncMessage(
              `Wallet reconnecte, mais la synchronisation Dojo a echoue: ${dojoSync.message}`
            );
            setGameState('village');
            return;
          }
        }

        const dojoRegistration = await registerPlayerOnDojo({
          wallet: result.wallet,
          username: result.profileName,
        });

        if (
          dojoRegistration.status === 'registered' ||
          dojoRegistration.status === 'already_registered'
        ) {
          setDojoRegistrationConfirmed(true);
          setKnownDojoPlayers((prev) => {
            const next = new Set(prev);
            next.add(normalizedAddress);
            return next;
          });
          const onchainSnapshot = await hydrateProgressFromDojo({
            playerAddress: result.address,
            network: result.network,
          });
          restoreWalletProgressState(result.address, onchainSnapshot);
          restoreWalletRewardState(result.address, onchainSnapshot);
          const hydrationSummary = getDojoHydrationSummary(onchainSnapshot);
          setWalletSyncMessage(
            dojoRegistration.status === 'registered'
              ? onchainSnapshot
                ? hydrationSummary
                  ? `Compte joueur enregistre et ${hydrationSummary}.`
                  : 'Compte joueur enregistre et progression initialisee depuis Dojo.'
                : 'Compte joueur enregistre sur Dojo, mais la lecture de progression a echoue.'
              : onchainSnapshot
                ? hydrationSummary
                  ? `Compte joueur deja present et ${hydrationSummary}.`
                  : 'Compte joueur deja present et progression recuperee depuis Dojo.'
                : 'Compte joueur deja present sur Dojo, mais la lecture de progression a echoue.'
          );
        } else if (dojoRegistration.status === 'skipped') {
          setDojoRegistrationConfirmed(false);
          setHasHydratedOnchainProgress(false);
          setWalletSyncMessage(
            'Wallet connecte. L’enregistrement Dojo sera active quand l’adresse du system sera configuree.'
          );
        } else {
          setDojoRegistrationConfirmed(false);
          setHasHydratedOnchainProgress(false);
          setWalletSyncMessage(
            `Wallet connecte, mais l’enregistrement Dojo a echoue: ${dojoRegistration.message}`
          );
        }

        setGameState('village');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Session Cartridge indisponible.';
        setDojoRegistrationConfirmed(false);
        setWalletSyncMessage(
          `La session Cartridge du jeu n’a pas pu etre preparee: ${message}`
        );
        setGameState('cartridgeConnect');
      } finally {
        setIsWalletSyncing(false);
      }
    },
    [
      hydrateProgressFromDojo,
      knownDojoPlayers,
      playerWallet?.address,
      playerWallet?.dojoRegistered,
      restoreWalletProgressState,
      restoreWalletRewardState,
    ]
  );

  const handleWalletConnected = async () => {
    try {
      const result = await connectWallet();

      if (result?.wallet && result.address) {
        bootstrappedWalletAddressRef.current = result.address.toLowerCase();
        await bootstrapWalletSession(result);
        return;
      }

      setWalletSyncMessage(
        'La session Cartridge est revenue incomplète. Le wallet n’a pas fourni d’adresse Starknet exploitable.'
      );
    } catch {
      if (gameState === 'cartridgeLoading') {
        setGameState('cartridgeConnect');
      }
      // The hook already exposes a user-facing error string.
    }
  };

  const handleOpenWalletProfile = async () => {
    try {
      let walletToOpen: any | null = null;

      if (!isCartridgeConnected) {
        const result = await connectWallet();
        walletToOpen = result?.wallet ?? null;
      }

      const didOpen = walletToOpen
        ? await openProfileForWallet(walletToOpen)
        : await openCartridgeProfile();

      if (!didOpen) {
        setWalletSyncMessage(
          'La session Cartridge a bien ete reconnectee, mais le profil n’a pas pu etre ouvert automatiquement.'
        );
      }
    } catch {
      // The hook already exposes the error state for the connect screen.
    }
  };

  const handleWalletDisconnect = async () => {
    bootstrappedWalletAddressRef.current = null;
    hasStartedWalletLoadingRef.current = false;
    clearWalletConnectionState();
    setWalletSyncMessage(null);
    setGameState('cartridgeConnect');
    await disconnectWallet();
  };

  const handleSelectBuilding = (building: string) => {
    if (building === 'restaurant') {
      setGameState('restaurant');
      return;
    }

    if (building === 'greenhouse') {
      setGameState('greenhouse');
      return;
    }

    if (building === 'market') {
      setGameState('market');
    }
  };

  const handleResetProgressForDev = async () => {
    if (!cartridgeWallet || !playerWallet?.dojoRegistered) {
      setWalletSyncMessage(
        'Le reset dev exige une session Cartridge active et un profil deja synchronise onchain.'
      );
      return;
    }

    const resetResult = await resetPlayerProgressOnDojo({ wallet: cartridgeWallet });

    if (resetResult.status === 'failed') {
      setWalletSyncMessage(`Le reset dev a echoue: ${resetResult.message}`);
      return;
    }

    if (typeof window !== 'undefined' && playerWallet?.address) {
      window.localStorage.removeItem(getWalletRewardStateStorageKey(playerWallet.address));
      window.localStorage.removeItem(getWalletProgressStateStorageKey(playerWallet.address));
      window.localStorage.removeItem(getGreenhouseStateStorageKey(playerWallet.address));
      window.localStorage.removeItem(getMarketStateStorageKey(playerWallet.address));
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_GREENHOUSE_STATE_STORAGE_KEY);
    }

    progressSyncQueuedWhileInFlightRef.current = false;
    setPlayerStats((prev) => ({
      ...INITIAL_PLAYER_STATS,
      name: prev.name,
    }));
    setCompletedServices(0);
    setDayCoinsEarned(0);
    setDayXpEarned(0);
    setDayServiceResults([]);
    setCompletedRestaurantDays(0);
    setRestaurantServicePausedUntil(null);
    setTipJarTokensAvailable(0);
    setTipJarCollected(false);
    setRestaurantRewardFeaturesUnlocked(false);
    setGreenhouseUnlocked(false);
    setMarketUnlocked(false);
    setIngredientInventoryInitialized(false);
    setPlayerInventory(INITIAL_PLAYER_INVENTORY);
    setPlayerMarketInventory(INITIAL_PLAYER_MARKET_INVENTORY);
    setClaimedLevelRewardIds([]);
    setPendingLevelRewards([]);
    setHasPendingProgressSync(false);
    setHasPendingIngredientInventorySync(false);
    setHasHydratedOnchainProgress(true);
    setWalletSyncMessage(
      resetResult.status === 'reset'
        ? 'Progression remise a zero pour le dev. Retour a l’etat initial.'
        : resetResult.message
    );
  };

  const handleEnterRestaurant = () => {
    if (restaurantServicePausedUntil && restaurantServicePausedUntil > Date.now()) {
      return;
    }

    if (isIngredientInventoryActive && !hasCraftableRecipes) {
      setRestaurantInventoryMessage(
        'Stock insuffisant. Achete ou recolte des ingredients avant de relancer la journee.'
      );
      return;
    }

    setGameState('recipeSelection');
  };

  const handleExitGreenhouse = () => {
    setGameState('village');
  };

  const handleExitMarket = () => {
    setGameState('village');
  };

  const handleOpenIngredientInventory = () => {
    setGameState('inventory');
  };

  const handleBackFromIngredientInventory = () => {
    setGameState('restaurant');
  };

  const handleMarketPurchase = (
    entries: Array<{ ingredientId: PlayerMarketInventoryId; quantity: number }>,
    totalCost: number
  ) => {
    if (!entries.length || totalCost <= 0) return;

    setPlayerStats((prev) => {
      if (prev.coins < totalCost) {
        return prev;
      }

      return {
        ...prev,
        coins: prev.coins - totalCost,
      };
    });

    setPlayerMarketInventory((prev) =>
      entries.reduce(
        (nextInventory, entry) =>
          incrementMarketInventoryValue(nextInventory, entry.ingredientId, entry.quantity),
        prev
      )
    );

    queueProgressSync('achat_marche');
    queueIngredientInventorySync('achat_marche');
  };

  const handleExitRestaurant = () => {
    setGameState('village');
  };

  const handleBackToRestaurant = () => {
    setGameState('restaurant');
  };

  const createOrderFromRecipe = (recipeId: string): Order | null => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return null;

    const card = allRecipeCards.find((item) => item.id === recipeId);

    const newId = orderIdCounter;
    setOrderIdCounter((prev) => prev + 1);

    return {
      id: newId,
      clientName: 'Client du jour',
      clientEmoji: '🍜',
      recipeId: recipe.id,
      dishName: recipe.name.en,
      dishEmoji: recipe.emoji,
      timeLeft: card?.timer ?? 60,
      mood: 'happy',
      reward: card?.reward ?? 75,
    };
  };

  const handleCookSelectedRecipe = (recipeId: string) => {
    const recipe = getRecipeById(recipeId);
    const order = createOrderFromRecipe(recipeId);

    if (!recipe || !order) return;

    if (isIngredientInventoryActive && !canCraftRecipeWithInventory(recipe, playerMarketInventory)) {
      const missingIngredient = getMissingManagedIngredients(recipe, playerMarketInventory)[0];
      const missingIngredientLabel = missingIngredient
        ? getLocalizedText(
            getIngredientById(missingIngredient.ingredientId)?.name ?? {
              fr: missingIngredient.ingredientId,
              en: missingIngredient.ingredientId,
            },
            'fr'
          )
        : 'ingredients';

      setRestaurantInventoryMessage(
        `Stock insuffisant pour cette recette. Il te manque ${missingIngredientLabel}.`
      );
      setGameState('restaurant');
      return;
    }

    if (isIngredientInventoryActive) {
      setPlayerMarketInventory((prev) => consumeRecipeIngredients(prev, recipe));
      queueIngredientInventorySync('consommation_recette');
    }

    setSelectedRecipe(recipe);
    setSelectedOrder(order);
    setGameState('cooking');
  };

  const handleCookingComplete = (result: {
    quality: number;
    remainingTimeSeconds: number;
  }) => {
    setCookingPhaseQuality(result.quality);
    setCookingTimeLeftSeconds(result.remainingTimeSeconds);
    setGameState('brothStir');
  };

  const handleBrothStirComplete = (result: {
    quality: number;
    xpPenalty: number;
    remainingTimeSeconds: number;
    stirProgress: number;
  }) => {
    setBrothStirQuality(result.quality);
    setCookingTimeLeftSeconds(result.remainingTimeSeconds);
    setGameState('service');
  };

  const handleServiceComplete = (result: {
    quality: number;
    serviceProgress: number;
    remainingTimeSeconds: number;
  }) => {
    if (!selectedOrder) return;

    const qualities = [
      cookingPhaseQuality ?? 0,
      brothStirQuality ?? 0,
      result.quality,
    ];
    const finalQuality = Math.round(
      qualities.reduce((sum, value) => sum + value, 0) / qualities.length
    );

    const targetTotalTimeSeconds = selectedRecipe?.timer ?? selectedOrder.timeLeft ?? 60;
    const totalTimeSpentSeconds = Math.max(
      0,
      targetTotalTimeSeconds - result.remainingTimeSeconds
    );
    const didExpire = result.remainingTimeSeconds <= 0;

    setCompletedOrder({
      order: selectedOrder,
      quality: finalQuality,
      ingredientQuality: cookingPhaseQuality ?? 0,
      brothQuality: brothStirQuality ?? 0,
      toppingQuality: result.quality,
      serviceQuality: result.quality,
      totalTimeSpentSeconds,
      targetTotalTimeSeconds,
      didExpire,
    });
    setGameState('satisfaction');
  };

  const refillRecipePool = (usedRecipeId: string) => {
    setVisibleRecipes((prev) => {
      const remaining = prev.filter((recipe) => recipe.id !== usedRecipeId);
      const remainingIds = new Set(remaining.map((recipe) => recipe.id));

      const candidates = shuffleArray(
        allRecipeCards.filter((recipe) => !remainingIds.has(recipe.id))
      );

      const nextRecipe = candidates.find((recipe) => recipe.id !== usedRecipeId);

      if (!nextRecipe) return remaining;

      return [...remaining, nextRecipe];
    });
  };

  const handleRewardComplete = () => {
    if (!completedOrder) return;

    const satisfactionResult = computeSatisfactionResult({
      ingredientQuality: completedOrder.ingredientQuality,
      brothQuality: completedOrder.brothQuality,
      toppingQuality: completedOrder.toppingQuality,
      serviceQuality: completedOrder.serviceQuality,
      totalTimeSpentSeconds: completedOrder.totalTimeSpentSeconds,
      targetTotalTimeSeconds: completedOrder.targetTotalTimeSeconds,
      baseXp: completedOrder.order.reward,
      didExpire: completedOrder.didExpire,
    });
    const finalRewardQuality = satisfactionResult.finalQuality;
    const xpGained = satisfactionResult.earnedXp;

    let newlyUnlockedRewards: { reward: LevelRewardDefinition; level: number }[] = [];

    setPlayerStats((prev) => {
      const progression = applyXpGain(prev, xpGained, claimedLevelRewardIds);

      newlyUnlockedRewards = progression.unlockedRewards.map((reward) => ({
        reward: resolveLevelRewardDefinition(reward),
        level: reward.level,
      }));

      return {
        ...progression.nextStats,
        stars: Math.min(
          prev.maxStars,
          prev.stars + (finalRewardQuality > 80 ? 1 : 0)
        ),
      };
    });

    refillRecipePool(completedOrder.order.recipeId);
    const updatedDayXp = dayXpEarned + xpGained;
    const updatedDayResults = [
      ...dayServiceResults,
      {
        quality: finalRewardQuality,
        xp: xpGained,
        timeSeconds: completedOrder.totalTimeSpentSeconds,
      },
    ];
    const updatedPendingRewards = [
      ...pendingLevelRewards,
      ...newlyUnlockedRewards,
    ];

    setDayXpEarned(updatedDayXp);
    setDayServiceResults(updatedDayResults);
    setPendingLevelRewards(updatedPendingRewards);
    queueProgressSync('xp_service_terminee');

    const nextCompletedServices = completedServices + 1;

    setCompletedOrder(null);
    setSelectedOrder(null);
    setSelectedRecipe(null);
    setCookingPhaseQuality(null);
    setBrothStirQuality(null);
    setCookingTimeLeftSeconds(null);

    if (nextCompletedServices >= SERVICES_PER_DAY) {
      setCompletedServices(0);
      setGameState('reward');
      return;
    }

    setCompletedServices(nextCompletedServices);
    if (isIngredientInventoryActive && !hasCraftableRecipes) {
      setRestaurantInventoryMessage(
        'Journee en pause: tu dois reconstituer ton stock avant la prochaine recette.'
      );
      setGameState('restaurant');
      return;
    }

    setGameState('recipeSelection');
  };

  const handleRewardScreenContinue = async () => {
    const currentRewardEntry = pendingLevelRewards[0];
    let remainingRewards = pendingLevelRewards;

    if (currentRewardEntry) {
      const { reward } = currentRewardEntry;

      if (!claimedLevelRewardIds.includes(reward.id)) {
        setClaimedLevelRewardIds((prev) => [...prev, reward.id]);
      }

      if (reward.type === 'tipjar_unlock') {
        setRestaurantRewardFeaturesUnlocked(true);
        setTipJarCollected(false);

        if (cartridgeWallet && playerWallet?.dojoRegistered) {
          const result = await claimFeatureUnlockOnDojo({
            wallet: cartridgeWallet,
            feature: 'tip_jar',
          });

          if (result.status === 'failed') {
            setWalletSyncMessage(`La sync onchain du Tip Jar a echoue: ${result.message}`);
          }
        }
      }

      if (reward.tipJarTokens) {
        setTipJarCollected(false);
        setTipJarTokensAvailable((prev) => prev + reward.tipJarTokens!);
      }

      if (reward.type === 'seed' && reward.seedCrop && reward.seedAmount) {
        setPlayerInventory((prev) =>
          incrementInventoryValue(prev, reward.seedCrop!, reward.seedAmount!)
        );

        if (cartridgeWallet && playerWallet?.dojoRegistered) {
          const result = await grantSeedRewardOnDojo({
            wallet: cartridgeWallet,
            crop: reward.seedCrop,
            amount: reward.seedAmount,
          });

          if (result.status === 'failed') {
            setWalletSyncMessage(
              `La sync onchain de la graine ${reward.seedCrop} a echoue: ${result.message}`
            );
          }
        }
      }

      if (reward.type === 'greenhouse_unlock') {
        setGreenhouseUnlocked(true);

        if (cartridgeWallet && playerWallet?.dojoRegistered) {
          const result = await claimFeatureUnlockOnDojo({
            wallet: cartridgeWallet,
            feature: 'greenhouse',
          });

          if (result.status === 'failed') {
            setWalletSyncMessage(
              `La sync onchain du unlock greenhouse a echoue: ${result.message}`
            );
          }
        }
      }

      if (reward.type === 'market_unlock') {
        setMarketUnlocked(true);

        if (cartridgeWallet && playerWallet?.dojoRegistered) {
          const result = await claimFeatureUnlockOnDojo({
            wallet: cartridgeWallet,
            feature: 'market',
          });

          if (result.status === 'failed') {
            setWalletSyncMessage(
              `La sync onchain du unlock market a echoue: ${result.message}`
            );
          }
        }
      }

      remainingRewards = pendingLevelRewards.slice(1);
      setPendingLevelRewards(remainingRewards);
    }

    if (remainingRewards.length > 0) {
      setGameState('reward');
      return;
    }

    const cooldownEndsAt = Date.now() + RESTAURANT_SERVICE_COOLDOWN_MS;
    setCompletedRestaurantDays((prev) => prev + 1);
    setRestaurantServicePausedUntil(cooldownEndsAt);
    setDayCoinsEarned(0);
    setDayXpEarned(0);
    setDayServiceResults([]);
    setGameState('restaurant');
  };

  useEffect(() => {
    if (gameState !== 'cartridgeLoading') {
      hasStartedWalletLoadingRef.current = false;
      return;
    }

    if (
      hasStartedWalletLoadingRef.current ||
      isCartridgeConnected ||
      isCartridgeConnecting ||
      isWalletSyncing
    ) {
      return;
    }

    hasStartedWalletLoadingRef.current = true;
    void handleWalletConnected();
  }, [
    gameState,
    isCartridgeConnected,
    isCartridgeConnecting,
    isWalletSyncing,
  ]);

  useEffect(() => {
    if (gameState === 'splash') {
      return;
    }

    if (!isCartridgeConnected || !cartridgeWallet || !cartridgeAddress) {
      bootstrappedWalletAddressRef.current = null;
      return;
    }

    const normalizedAddress = cartridgeAddress.toLowerCase();
    if (bootstrappedWalletAddressRef.current === normalizedAddress) {
      return;
    }

    bootstrappedWalletAddressRef.current = normalizedAddress;

    void bootstrapWalletSession({
      wallet: cartridgeWallet,
      address: cartridgeAddress,
      balance: cartridgeBalance,
      profileName:
        cartridgeProfileName ??
        playerWallet?.profileName ??
        `Chef-${cartridgeAddress.slice(-4)}`,
      network: cartridgeNetwork,
    });
  }, [
    bootstrapWalletSession,
    cartridgeAddress,
    cartridgeBalance,
    cartridgeNetwork,
    cartridgeProfileName,
    cartridgeWallet,
    gameState,
    isCartridgeConnected,
    playerWallet?.profileName,
  ]);

  useEffect(() => {
    if (!cartridgeAddress || !isCartridgeConnected) {
      setPlayerWallet(null);
      setDojoRegistrationConfirmed(false);
      setHasHydratedOnchainProgress(false);
      return;
    }

    const nextProfileName = cartridgeProfileName ?? playerStats.name;

    setPlayerWallet((prev) => ({
      provider: 'cartridge',
      profileName: nextProfileName,
      address: cartridgeAddress,
      network: cartridgeNetwork,
      connectedAt: prev?.connectedAt ?? Date.now(),
      balance: cartridgeBalance,
      dojoRegistered: dojoRegistrationConfirmed || prev?.dojoRegistered || false,
    }));

    setPlayerStats((prev) =>
      prev.name === nextProfileName
        ? prev
        : {
            ...prev,
            name: nextProfileName,
          }
    );
  }, [
    cartridgeAddress,
    cartridgeBalance,
    isCartridgeConnected,
    cartridgeNetwork,
    cartridgeProfileName,
    dojoRegistrationConfirmed,
    playerStats.name,
  ]);

  useEffect(() => {
    if (!playerWallet?.address) return;

    let isCancelled = false;

    const syncDojoRegistration = async () => {
      const isRegistered = await checkPlayerRegistrationOnDojo({
        playerAddress: playerWallet.address,
        network: playerWallet.network,
      });

      if (isCancelled || isRegistered === null) return;

      setDojoRegistrationConfirmed(isRegistered);
      if (isRegistered) {
        setKnownDojoPlayers((prev) => {
          const next = new Set(prev);
          next.add(playerWallet.address.toLowerCase());
          return next;
        });
      }
      setPlayerWallet((prev) =>
        prev
          ? {
              ...prev,
              dojoRegistered: isRegistered,
            }
          : prev
      );
    };

    void syncDojoRegistration();

    return () => {
      isCancelled = true;
    };
  }, [playerWallet?.address, playerWallet?.network]);

  useEffect(() => {
    if (!hasPendingProgressSync) return;
    void flushProgressSyncQueue('etat_local_mis_a_jour');
  }, [
    canSyncProgressOnDojo,
    flushProgressSyncQueue,
    hasPendingProgressSync,
    playerStats.coins,
    playerStats.level,
    playerStats.xp,
    playerStats.xpToNext,
  ]);

  useEffect(() => {
    if (!hasPendingIngredientInventorySync) return;
    void flushIngredientInventorySyncQueue('inventaire_local_mis_a_jour');
  }, [
    canSyncProgressOnDojo,
    flushIngredientInventorySyncQueue,
    hasPendingIngredientInventorySync,
    playerMarketInventory,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      DOJO_REGISTERED_PLAYERS_STORAGE_KEY,
      JSON.stringify(Array.from(knownDojoPlayers))
    );
  }, [knownDojoPlayers]);

  useEffect(() => {
    if (typeof window === 'undefined' || !playerWallet?.address) return;

    const nextState: WalletRewardState = {
      claimedLevelRewardIds,
      restaurantRewardFeaturesUnlocked: isTipJarUnlocked,
      greenhouseUnlocked,
      marketUnlocked,
      ingredientInventoryInitialized,
      hasPendingIngredientInventorySync,
      tipJarTokensAvailable,
      tipJarCollected,
      inventory: playerInventory,
      marketInventory: playerMarketInventory,
    };

    window.localStorage.setItem(
      getWalletRewardStateStorageKey(playerWallet.address),
      JSON.stringify(nextState)
    );
  }, [
    claimedLevelRewardIds,
    greenhouseUnlocked,
    hasPendingIngredientInventorySync,
    ingredientInventoryInitialized,
    isTipJarUnlocked,
    marketUnlocked,
    playerInventory,
    playerMarketInventory,
    playerWallet?.address,
    tipJarCollected,
    tipJarTokensAvailable,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !playerWallet?.address || isWalletSyncing) return;

    const nextState: WalletProgressState = {
      playerStats,
      hasPendingProgressSync,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(
      getWalletProgressStateStorageKey(playerWallet.address),
      JSON.stringify(nextState)
    );
  }, [hasPendingProgressSync, isWalletSyncing, playerStats, playerWallet?.address]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (restaurantServicePausedUntil && restaurantServicePausedUntil > Date.now()) {
      window.localStorage.setItem(
        'restaurantServicePausedUntil',
        String(restaurantServicePausedUntil)
      );
      return;
    }

    window.localStorage.removeItem('restaurantServicePausedUntil');
  }, [restaurantServicePausedUntil]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      'completedRestaurantDays',
      String(completedRestaurantDays)
    );
  }, [completedRestaurantDays]);

  useEffect(() => {
    if (!restaurantServicePausedUntil) return;

    const remainingMs = restaurantServicePausedUntil - Date.now();
    if (remainingMs <= 0) {
      setRestaurantServicePausedUntil(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRestaurantServicePausedUntil(null);
    }, remainingMs + 50);

    return () => window.clearTimeout(timeout);
  }, [restaurantServicePausedUntil]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePageHide = () => {
      if (hasPendingProgressSync) {
        void flushProgressSyncQueue('fermeture_app');
      }
      if (hasPendingIngredientInventorySyncRef.current) {
        void flushIngredientInventorySyncQueue('fermeture_app');
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [flushIngredientInventorySyncQueue, flushProgressSyncQueue, hasPendingProgressSync]);

  const handleCollectTipJar = () => {
    if (tipJarTokensAvailable <= 0 || tipJarCollected) return;

    setPlayerStats((prev) => ({
      ...prev,
      coins: prev.coins + tipJarTokensAvailable,
    }));
    setTipJarCollected(true);
    setTipJarTokensAvailable(0);
    queueProgressSync('collecte_tip_jar');
  };

  return (
    <LanguageProvider>
      <div
        className={`flex bg-[#1c0d04] ${
          isMobile
            ? 'min-h-dvh w-full items-stretch justify-stretch p-0'
            : 'min-h-screen items-center justify-center p-4 md:p-6'
        }`}
        style={
          isMobile
            ? {
                paddingTop: "var(--safe-area-top)",
                paddingRight: "var(--safe-area-right)",
                paddingBottom: "calc(var(--safe-area-bottom) + 12px)",
                paddingLeft: "var(--safe-area-left)",
              }
            : undefined
        }
      >
        <div
          className={`relative mx-auto overflow-hidden bg-[#F4E2C7] ${
            isMobile
              ? 'min-h-0 w-full max-w-none flex-1 rounded-none border-0 shadow-none'
              : 'aspect-[9/16] w-full max-w-[430px] rounded-[34px] border-[6px] border-[#8D4B24] shadow-2xl'
          }`}
          style={
            isMobile
              ? {
                  minHeight:
                    'calc(100dvh - var(--safe-area-top) - var(--safe-area-bottom) - 12px)',
                }
              : undefined
          }
        >
          {!isMobile ? (
            <div className="absolute top-0 left-1/2 z-50 h-5 w-32 -translate-x-1/2 rounded-b-2xl bg-[#2b1408]" />
          ) : null}

          <AnimatePresence mode="wait">
            {gameState === 'splash' && (
              <SplashScreen onStart={handleStartGame} />
            )}

            {gameState === 'cartridgeLoading' && (
              <CartridgeConnectScreen
                variant="loading"
                isConnecting={isCartridgeConnecting}
                isSyncing={isWalletSyncing}
                network={cartridgeNetwork}
                error={cartridgeError}
                statusMessage={cartridgeStatusMessage}
                syncMessage={walletSyncMessage}
                onConnect={handleWalletConnected}
              />
            )}

            {gameState === 'cartridgeConnect' && (
              <CartridgeConnectScreen
                isConnecting={isCartridgeConnecting}
                isSyncing={isWalletSyncing}
                network={cartridgeNetwork}
                error={cartridgeError}
                statusMessage={cartridgeStatusMessage}
                syncMessage={walletSyncMessage}
                onConnect={handleWalletConnected}
              />
            )}

            {gameState === 'village' && (
              <Village
                onSelectBuilding={handleSelectBuilding}
                greenhouseUnlocked={isGreenhouseAccessible}
                marketUnlocked={isMarketAccessible}
                playerWallet={playerWallet}
                isWalletConnected={isCartridgeConnected}
                onOpenWalletProfile={handleOpenWalletProfile}
                onDisconnectWallet={handleWalletDisconnect}
                canResetProgress={DEV_PROGRESS_RESET_ENABLED}
                onResetProgress={handleResetProgressForDev}
                walletStats={{
                  xp: playerStats.xp,
                  xpToNext: playerStats.xpToNext,
                  noods: playerStats.coins,
                  level: playerStats.level,
                }}
              />
            )}

            {gameState === 'greenhouse' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <GreenhousePhase
                  key={greenhouseStorageKey}
                  onBack={handleExitGreenhouse}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                  storageKey={greenhouseStorageKey}
                  initialSeedInventory={getGreenhouseSeedInventoryFromPlayerInventory(
                    playerInventory
                  )}
                  onSeedInventoryChange={(seedInventory) => {
                    setPlayerInventory((prev) =>
                      syncRewardSeedInventoryFromGreenhouse(prev, seedInventory)
                    );
                  }}
                  onHarvestIngredient={(ingredientId, quantity) => {
                    setPlayerMarketInventory((prev) =>
                      incrementMarketInventoryValue(prev, ingredientId, quantity)
                    );
                    queueIngredientInventorySync('recolte_serre');
                  }}
                />
              </motion.div>
            )}

            {gameState === 'market' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <MarketPhase
                  key={marketStorageKey}
                  onBack={handleExitMarket}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                  storageKey={marketStorageKey}
                  inventory={playerMarketInventory}
                  onPurchase={handleMarketPurchase}
                />
              </motion.div>
            )}

            {gameState === 'restaurant' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <NoodlesRestaurantScreen
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                  serviceSlotsVisible={completedRestaurantDays > 0}
                  rewardFeaturesUnlocked={isTipJarUnlocked}
                  inventoryUnlocked={isIngredientInventoryActive}
                  canStartCooking={!isIngredientInventoryActive || hasCraftableRecipes}
                  inventoryStatusMessage={restaurantInventoryMessage}
                  servicePausedUntil={restaurantServicePausedUntil}
                  tipJarTokensAvailable={tipJarTokensAvailable}
                  tipJarCollected={tipJarCollected}
                  onCollectTipJar={handleCollectTipJar}
                  onOpenInventory={handleOpenIngredientInventory}
                  onEnter={handleEnterRestaurant}
                  onExit={handleExitRestaurant}
                />
              </motion.div>
            )}

            {gameState === 'inventory' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <IngredientInventoryScreen
                  onBack={handleBackFromIngredientInventory}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                  inventory={playerMarketInventory}
                />
              </motion.div>
            )}

            {gameState === 'recipeSelection' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <RecipeSelectionScreen
                  recipes={displayedRecipeChoices}
                  onBack={handleBackToRestaurant}
                  onCook={handleCookSelectedRecipe}
                  progressCurrent={completedServices}
                  progressMax={SERVICES_PER_DAY}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                />
              </motion.div>
            )}

            {gameState === 'cooking' && selectedRecipe && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="h-full w-full"
              >
                <CookingPhase
                  recipe={selectedRecipe}
                  onComplete={handleCookingComplete}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                />
              </motion.div>
            )}

            {gameState === 'brothStir' && selectedRecipe && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="h-full w-full"
              >
                <BrothStirPhase
                  startingTimeLeftSeconds={
                    cookingTimeLeftSeconds ?? selectedRecipe.timer ?? 60
                  }
                  onComplete={handleBrothStirComplete}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                />
              </motion.div>
            )}

            {gameState === 'service' && selectedRecipe && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="h-full w-full"
              >
                <ServicePhase
                  startingTimeLeftSeconds={
                    cookingTimeLeftSeconds ?? selectedRecipe.timer ?? 60
                  }
                  onComplete={handleServiceComplete}
                  playerName={displayPlayerName}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                />
              </motion.div>
            )}

            {gameState === 'satisfaction' && completedOrder && (
              <SatisfactionScreen
                ingredientQuality={completedOrder.ingredientQuality}
                brothQuality={completedOrder.brothQuality}
                toppingQuality={completedOrder.toppingQuality}
                serviceQuality={completedOrder.serviceQuality}
                totalTimeSpentSeconds={completedOrder.totalTimeSpentSeconds}
                targetTotalTimeSeconds={completedOrder.targetTotalTimeSeconds}
                baseXp={completedOrder.order.reward}
                didExpire={completedOrder.didExpire}
                onContinue={handleRewardComplete}
              />
            )}

            {gameState === 'reward' && dayServiceResults.length > 0 && (
              <RewardScreen
                services={dayServiceResults}
                reward={pendingLevelRewards[0]?.reward ?? null}
                onContinue={handleRewardScreenContinue}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </LanguageProvider>
  );
}
