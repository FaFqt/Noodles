import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageProvider } from './context/LanguageContext';
import { SplashScreen } from './components/SplashScreen';
import { Village } from './components/Village';
import { CookingPhase } from './components/CookingPhase';
import BrothStirPhase from './components/BrothStirPhase';
import ServicePhase from './components/ServicePhase';
import SatisfactionScreen, {
  computeSatisfactionResult,
} from './components/SatisfactionScreen';
import RewardScreen from './components/RewardScreen';
import NoodlesRestaurantScreen from './components/RestaurantScreen';
import RecipeSelectionScreen, {
  RecipeSelectionItem,
} from './components/RecipeSelectionScreen';
import { useIsMobile } from './components/ui/use-mobile';
import type { Order } from './types/order';
import {
  applyXpGain,
  getXpToNextLevel,
  type LevelRewardDefinition,
} from './data/progression';
import { RECIPES, getRecipeById, SERVICES_PER_DAY } from './data/recipes';

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
  | 'village'
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

export default function App() {
  const RESTAURANT_SERVICE_COOLDOWN_MS = 4 * 60 * 1000;
  const isMobile = useIsMobile();

  const [gameState, setGameState] = useState<GameState>('splash');

  const [playerStats, setPlayerStats] = useState({
    name: 'Bento-chan',
    level: 1,
    xp: 0,
    xpToNext: getXpToNextLevel(1),
    stars: 4,
    maxStars: 15,
    coins: 10,
  });

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
  const [restaurantServiceSlotsVisible, setRestaurantServiceSlotsVisible] =
    useState<boolean>(() => {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem('restaurantServiceSlotsVisible') === 'true';
    });
  const [tipJarTokensAvailable, setTipJarTokensAvailable] = useState(0);
  const [tipJarCollected, setTipJarCollected] = useState(false);
  const [restaurantRewardFeaturesUnlocked, setRestaurantRewardFeaturesUnlocked] =
    useState(false);
  const [claimedLevelRewardIds, setClaimedLevelRewardIds] = useState<string[]>([]);
  const [pendingLevelRewards, setPendingLevelRewards] = useState<
    { reward: LevelRewardDefinition; level: number }[]
  >([]);

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

  const handleStartGame = () => {
    setGameState('village');
  };

  const handleSelectBuilding = (building: string) => {
    if (building === 'restaurant') {
      setGameState('restaurant');
    }
  };

  const handleEnterRestaurant = () => {
    if (restaurantServicePausedUntil && restaurantServicePausedUntil > Date.now()) {
      return;
    }
    setGameState('recipeSelection');
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
        reward,
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
    setGameState('recipeSelection');
  };

  const handleRewardScreenContinue = () => {
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
        setTipJarTokensAvailable((prev) => prev + (reward.tipJarTokens ?? 0));
      }

      if (reward.type === 'coins' && reward.coinsBonus) {
        setPlayerStats((prev) => ({
          ...prev,
          coins: prev.coins + reward.coinsBonus,
        }));
      }

      remainingRewards = pendingLevelRewards.slice(1);
      setPendingLevelRewards(remainingRewards);
    }

    if (remainingRewards.length > 0) {
      setGameState('reward');
      return;
    }

    const cooldownEndsAt = Date.now() + RESTAURANT_SERVICE_COOLDOWN_MS;
    setRestaurantServiceSlotsVisible(true);
    setRestaurantServicePausedUntil(cooldownEndsAt);
    setDayCoinsEarned(0);
    setDayXpEarned(0);
    setDayServiceResults([]);
    setGameState('restaurant');
  };

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

    if (restaurantServiceSlotsVisible) {
      window.localStorage.setItem('restaurantServiceSlotsVisible', 'true');
      return;
    }

    window.localStorage.removeItem('restaurantServiceSlotsVisible');
  }, [restaurantServiceSlotsVisible]);

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

  const handleCollectTipJar = () => {
    if (tipJarTokensAvailable <= 0 || tipJarCollected) return;

    setPlayerStats((prev) => ({
      ...prev,
      coins: prev.coins + tipJarTokensAvailable,
    }));
    setTipJarCollected(true);
    setTipJarTokensAvailable(0);
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

            {gameState === 'village' && (
              <Village onSelectBuilding={handleSelectBuilding} />
            )}

            {gameState === 'restaurant' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <NoodlesRestaurantScreen
                  playerName={playerStats.name}
                  coins={playerStats.coins}
                  level={playerStats.level}
                  xp={playerStats.xp}
                  xpToNext={playerStats.xpToNext}
                  serviceSlotsVisible={restaurantServiceSlotsVisible}
                  rewardFeaturesUnlocked={restaurantRewardFeaturesUnlocked}
                  servicePausedUntil={restaurantServicePausedUntil}
                  tipJarTokensAvailable={tipJarTokensAvailable}
                  tipJarCollected={tipJarCollected}
                  onCollectTipJar={handleCollectTipJar}
                  onEnter={handleEnterRestaurant}
                  onExit={handleExitRestaurant}
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
                  recipes={visibleRecipes}
                  onBack={handleBackToRestaurant}
                  onCook={handleCookSelectedRecipe}
                  progressCurrent={completedServices}
                  progressMax={SERVICES_PER_DAY}
                  playerName={playerStats.name}
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
                  playerName={playerStats.name}
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
                  playerName={playerStats.name}
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
                  playerName={playerStats.name}
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
                key={pendingLevelRewards[0]?.reward.id ?? 'day-summary'}
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
