import type { LocalizedText } from './recipes';

import miniCornAsset from '../../assets/ingredients/MiniCorn.png';
import miniBambooAsset from '../../assets/ingredients/MiniBamboo.png';
import miniMushroomAsset from '../../assets/ingredients/MiniMushroom.png';
import miniGarlicAsset from '../../assets/ingredients/MiniGarlic.png';
import dragonPepperAsset from '../../assets/rewards/DragonPepper.png';
import fireChiliAsset from '../../assets/rewards/FireChili.png';
import goldenEggAsset from '../../assets/rewards/GoldenEgg.png';
import honeyBambooAsset from '../../assets/rewards/HoneyBamboo.png';
import sakuraMushroomAsset from '../../assets/rewards/SakuraMushroom.png';
import moonHerbAsset from '../../assets/rewards/MoonHerb.png';
import crystalSaltAsset from '../../assets/rewards/CrystalSalt.png';
import miniEggAsset from '../../assets/ingredients/MiniEgg.png';
import miniPorkAsset from '../../assets/ingredients/MiniPork.png';
import miniChickenAsset from '../../assets/ingredients/MiniChicken.png';
import miniTofuAsset from '../../assets/ingredients/MiniTofu.png';
import miniShrimpAsset from '../../assets/ingredients/MiniShrimp.png';

export type IngredientRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const GREENHOUSE_INGREDIENT_IDS = [
  'corn',
  'bamboo',
  'mushroom',
  'garlic',
  'dragonpepper',
  'firechili',
  'goldenegg',
  'honeybamboo',
  'sakuramushroom',
  'moonherb',
  'crystalsalt',
] as const;

export type GreenhouseIngredientId = (typeof GREENHOUSE_INGREDIENT_IDS)[number];

export const MARKET_INGREDIENT_IDS = ['egg', 'pork', 'chicken', 'tofu', 'shrimp'] as const;

export type MarketIngredientId = (typeof MARKET_INGREDIENT_IDS)[number];

export interface GreenhouseIngredientMarketData {
  id: GreenhouseIngredientId;
  name: LocalizedText;
  rarity: IngredientRarity;
  marketBuyPrice: number;
  seedPrice: number;
  growthTimeMinutes: number;
  averageYield: number;
  averageGreenhouseUnitCost: number;
  resalePrice: number;
  image: string;
}

export interface MarketIngredientData {
  id: MarketIngredientId;
  name: LocalizedText;
  rarity: IngredientRarity;
  marketBuyPrice: number;
  image: string;
}

export const GREENHOUSE_INGREDIENTS: GreenhouseIngredientMarketData[] = [
  {
    id: 'corn',
    name: { fr: 'Maïs doux', en: 'Sweet Corn' },
    rarity: 'common',
    marketBuyPrice: 5,
    seedPrice: 1,
    growthTimeMinutes: 10,
    averageYield: 3,
    averageGreenhouseUnitCost: 0.33,
    resalePrice: 2,
    image: miniCornAsset,
  },
  {
    id: 'bamboo',
    name: { fr: 'Bamboo', en: 'Bamboo' },
    rarity: 'common',
    marketBuyPrice: 5,
    seedPrice: 1,
    growthTimeMinutes: 12,
    averageYield: 4,
    averageGreenhouseUnitCost: 0.25,
    resalePrice: 2,
    image: miniBambooAsset,
  },
  {
    id: 'mushroom',
    name: { fr: 'Champignons', en: 'Mushrooms' },
    rarity: 'common',
    marketBuyPrice: 5,
    seedPrice: 1,
    growthTimeMinutes: 14,
    averageYield: 5,
    averageGreenhouseUnitCost: 0.2,
    resalePrice: 2,
    image: miniMushroomAsset,
  },
  {
    id: 'garlic',
    name: { fr: 'Ail', en: 'Garlic' },
    rarity: 'common',
    marketBuyPrice: 3,
    seedPrice: 2,
    growthTimeMinutes: 8,
    averageYield: 5,
    averageGreenhouseUnitCost: 0.4,
    resalePrice: 1,
    image: miniGarlicAsset,
  },
  {
    id: 'dragonpepper',
    name: { fr: 'Dragon Pepper', en: 'Dragon Pepper' },
    rarity: 'rare',
    marketBuyPrice: 15,
    seedPrice: 5,
    growthTimeMinutes: 25,
    averageYield: 3,
    averageGreenhouseUnitCost: 1.67,
    resalePrice: 6,
    image: dragonPepperAsset,
  },
  {
    id: 'firechili',
    name: { fr: 'Fire Chili', en: 'Fire Chili' },
    rarity: 'rare',
    marketBuyPrice: 18,
    seedPrice: 6,
    growthTimeMinutes: 30,
    averageYield: 3,
    averageGreenhouseUnitCost: 2,
    resalePrice: 7,
    image: fireChiliAsset,
  },
  {
    id: 'goldenegg',
    name: { fr: 'Golden Egg', en: 'Golden Egg' },
    rarity: 'epic',
    marketBuyPrice: 40,
    seedPrice: 15,
    growthTimeMinutes: 60,
    averageYield: 2,
    averageGreenhouseUnitCost: 7.5,
    resalePrice: 18,
    image: goldenEggAsset,
  },
  {
    id: 'honeybamboo',
    name: { fr: 'Honey Bamboo', en: 'Honey Bamboo' },
    rarity: 'epic',
    marketBuyPrice: 45,
    seedPrice: 18,
    growthTimeMinutes: 70,
    averageYield: 2,
    averageGreenhouseUnitCost: 9,
    resalePrice: 20,
    image: honeyBambooAsset,
  },
  {
    id: 'sakuramushroom',
    name: { fr: 'Sakura Mushroom', en: 'Sakura Mushroom' },
    rarity: 'epic',
    marketBuyPrice: 50,
    seedPrice: 20,
    growthTimeMinutes: 80,
    averageYield: 2,
    averageGreenhouseUnitCost: 10,
    resalePrice: 22,
    image: sakuraMushroomAsset,
  },
  {
    id: 'moonherb',
    name: { fr: 'Moon Herb', en: 'Moon Herb' },
    rarity: 'legendary',
    marketBuyPrice: 120,
    seedPrice: 50,
    growthTimeMinutes: 180,
    averageYield: 2,
    averageGreenhouseUnitCost: 25,
    resalePrice: 55,
    image: moonHerbAsset,
  },
  {
    id: 'crystalsalt',
    name: { fr: 'Crystal Salt', en: 'Crystal Salt' },
    rarity: 'legendary',
    marketBuyPrice: 150,
    seedPrice: 60,
    growthTimeMinutes: 210,
    averageYield: 2,
    averageGreenhouseUnitCost: 30,
    resalePrice: 65,
    image: crystalSaltAsset,
  },
];

export const MARKET_INGREDIENTS: MarketIngredientData[] = [
  {
    id: 'egg',
    name: { fr: 'Œuf', en: 'Egg' },
    rarity: 'common',
    marketBuyPrice: 6,
    image: miniEggAsset,
  },
  {
    id: 'pork',
    name: { fr: 'Porc', en: 'Pork' },
    rarity: 'common',
    marketBuyPrice: 8,
    image: miniPorkAsset,
  },
  {
    id: 'chicken',
    name: { fr: 'Poulet', en: 'Chicken' },
    rarity: 'common',
    marketBuyPrice: 7,
    image: miniChickenAsset,
  },
  {
    id: 'tofu',
    name: { fr: 'Tofu', en: 'Tofu' },
    rarity: 'common',
    marketBuyPrice: 5,
    image: miniTofuAsset,
  },
  {
    id: 'shrimp',
    name: { fr: 'Crevettes', en: 'Shrimp' },
    rarity: 'common',
    marketBuyPrice: 9,
    image: miniShrimpAsset,
  },
];

export const GREENHOUSE_GROWTH_DURATION_MS: Record<GreenhouseIngredientId, number> =
  GREENHOUSE_INGREDIENTS.reduce(
    (accumulator, ingredient) => ({
      ...accumulator,
      [ingredient.id]: ingredient.growthTimeMinutes * 60 * 1000,
    }),
    {} as Record<GreenhouseIngredientId, number>
  );

export const EMPTY_GREENHOUSE_SEED_STOCK: Record<GreenhouseIngredientId, number> =
  GREENHOUSE_INGREDIENT_IDS.reduce(
    (accumulator, ingredientId) => ({
      ...accumulator,
      [ingredientId]: 0,
    }),
    {} as Record<GreenhouseIngredientId, number>
  );

export const EMPTY_PLAYER_MARKET_INGREDIENT_INVENTORY: Record<MarketIngredientId, number> =
  MARKET_INGREDIENT_IDS.reduce(
    (accumulator, ingredientId) => ({
      ...accumulator,
      [ingredientId]: 0,
    }),
    {} as Record<MarketIngredientId, number>
  );
