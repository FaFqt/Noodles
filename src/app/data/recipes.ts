export const SERVICES_PER_DAY = 5;

export type LocalizedText = {
  fr: string;
  en: string;
};

export type RecipeCategory = 'ramen';
export type CookingType = 'stir';

export type IngredientCategory =
  | 'base'
  | 'protein'
  | 'veggie'
  | 'broth'
  | 'seasoning'
  | 'topping';

export interface Ingredient {
  id: string;
  name: LocalizedText;
  emoji: string;
  category: IngredientCategory;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: LocalizedText;
  emoji: string;
  category: RecipeCategory;
  cookingType: CookingType;
  timer : number; // Durée de cuisson en secondes
  reward: number; // Récompense en pièces pour ce plat

  // Étape 1 : ingrédients à ajouter avant cuisson
  // Les nouilles sont toujours la base commune
  baseIngredientId: string;
  requiredIngredients: RecipeIngredient[];

  // Étape 2 : topping ajouté avant le service
  toppingOptions: string[];

  description: LocalizedText;
}

export const INGREDIENTS: Ingredient[] = [
  // Base
  { id: 'noodles', name: { fr: 'Nouilles', en: 'Noodles' }, emoji: '🍜', category: 'base' },

  // Bouillons
  { id: 'broth-shoyu', name: { fr: 'Bouillon Shoyu', en: 'Shoyu Broth' }, emoji: '🍲', category: 'broth' },
  { id: 'broth-miso', name: { fr: 'Bouillon Miso', en: 'Miso Broth' }, emoji: '🥣', category: 'broth' },
  { id: 'broth-tonkotsu', name: { fr: 'Bouillon Tonkotsu', en: 'Tonkotsu Broth' }, emoji: '🍥', category: 'broth' },
  { id: 'broth-spicy', name: { fr: 'Bouillon Épicé', en: 'Spicy Broth' }, emoji: '🌶️', category: 'broth' },

  // Protéines
  { id: 'egg', name: { fr: 'Œuf', en: 'Egg' }, emoji: '🥚', category: 'protein' },
  { id: 'pork', name: { fr: 'Porc', en: 'Pork' }, emoji: '🥓', category: 'protein' },
  { id: 'chicken', name: { fr: 'Poulet', en: 'Chicken' }, emoji: '🍗', category: 'protein' },
  { id: 'tofu', name: { fr: 'Tofu', en: 'Tofu' }, emoji: '🧈', category: 'protein' },
  { id: 'shrimp', name: { fr: 'Crevettes', en: 'Shrimp' }, emoji: '🦐', category: 'protein' },

  // Légumes / garnitures de cuisson
  { id: 'mushroom', name: { fr: 'Champignons', en: 'Mushrooms' }, emoji: '🍄', category: 'veggie' },
  { id: 'corn', name: { fr: 'Maïs', en: 'Corn' }, emoji: '🌽', category: 'veggie' },
  { id: 'bamboo', name: { fr: 'Pousses de bambou', en: 'Bamboo Shoots' }, emoji: '🎋', category: 'veggie' },
  { id: 'garlic', name: { fr: 'Ail', en: 'Garlic' }, emoji: '🧄', category: 'seasoning' },

  // Toppings finaux
  { id: 'green-onion', name: { fr: 'Oignon vert', en: 'Green Onion' }, emoji: '🧅', category: 'topping' },
  { id: 'nori', name: { fr: 'Nori', en: 'Nori' }, emoji: '🌿', category: 'topping' },
  { id: 'sesame', name: { fr: 'Sésame', en: 'Sesame' }, emoji: '⚪', category: 'topping' },
  { id: 'naruto', name: { fr: 'Naruto', en: 'Naruto' }, emoji: '🍥', category: 'topping' },
];

export const RECIPES: Recipe[] = [
  {
    id: 'ramen-shoyu-classic',
    name: { fr: 'Ramen Shoyu Classique', en: 'Classic Shoyu Ramen' },
    emoji: '🍜',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 20,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-shoyu', quantity: 1 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'pork', quantity: 2 },
      { ingredientId: 'mushroom', quantity: 2 },
    ],
    toppingOptions: ['green-onion', 'naruto'],
    description: {
      fr: 'Un ramen classique, doux et réconfortant.',
      en: 'A classic ramen, mellow and comforting.',
    },
  },
  {
    id: 'ramen-miso',
    name: { fr: 'Ramen Miso', en: 'Miso Ramen' },
    emoji: '🍜',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 21,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-miso', quantity: 1 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'corn', quantity: 2 },
      { ingredientId: 'mushroom', quantity: 3 },
    ],
    toppingOptions: ['green-onion', 'sesame'],
    description: {
      fr: 'Un ramen au miso gourmand avec une touche de maïs.',
      en: 'A rich miso ramen with a touch of corn.',
    },
  },
  {
    id: 'ramen-tonkotsu',
    name: { fr: 'Ramen Tonkotsu', en: 'Tonkotsu Ramen' },
    emoji: '🍜',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 21,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-tonkotsu', quantity: 1 },
      { ingredientId: 'pork', quantity: 2 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'bamboo', quantity: 2 },
    ],
    toppingOptions: ['green-onion', 'nori'],
    description: {
      fr: 'Bouillon riche et généreux avec porc et bambou.',
      en: 'A rich broth with pork and bamboo shoots.',
    },
  },
  {
    id: 'ramen-veggie',
    name: { fr: 'Ramen Végé', en: 'Veggie Ramen' },
    emoji: '🥬',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 22,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-shoyu', quantity: 1 },
      { ingredientId: 'tofu', quantity: 2 },
      { ingredientId: 'mushroom', quantity: 3 },
      { ingredientId: 'corn', quantity: 2 },
    ],
    toppingOptions: ['green-onion', 'sesame'],
    description: {
      fr: 'Une version végétarienne simple et chaleureuse.',
      en: 'A simple and cozy vegetarian version.',
    },
  },
  {
    id: 'ramen-chicken',
    name: { fr: 'Ramen Poulet', en: 'Chicken Ramen' },
    emoji: '🍗',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 22,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-shoyu', quantity: 1 },
      { ingredientId: 'chicken', quantity: 2 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'corn', quantity: 3 },
    ],
    toppingOptions: ['green-onion', 'naruto'],
    description: {
      fr: 'Un ramen au poulet tendre, parfait pour débuter.',
      en: 'A tender chicken ramen, perfect to get started.',
    },
  },
  {
    id: 'ramen-spicy',
    name: { fr: 'Ramen Poulet Épicé', en: 'Spicy Chicken Ramen' },
    emoji: '🌶️',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 21,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-spicy', quantity: 1 },
      { ingredientId: 'chicken', quantity: 2 },
      { ingredientId: 'corn', quantity: 2 },
      { ingredientId: 'garlic', quantity: 1 },
    ],
    toppingOptions: ['green-onion', 'sesame'],
    description: {
      fr: 'Une version relevée avec une touche d’ail.',
      en: 'A spicy version with a hint of garlic.',
    },
  },
  {
    id: 'ramen-shrimp',
    name: { fr: 'Ramen Crevettes', en: 'Shrimp Ramen' },
    emoji: '🦐',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 22,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-shoyu', quantity: 1 },
      { ingredientId: 'shrimp', quantity: 3 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'bamboo', quantity: 2 },
    ],
    toppingOptions: ['nori', 'green-onion'],
    description: {
      fr: 'Un ramen marin léger aux crevettes.',
      en: 'A light seafood ramen with shrimp.',
    },
  },
  {
    id: 'ramen-garlic-pork',
    name: { fr: 'Ramen Porc Aillé', en: 'Garlic Pork Ramen' },
    emoji: '🧄',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 22,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-tonkotsu', quantity: 1 },
      { ingredientId: 'pork', quantity: 2 },
      { ingredientId: 'garlic', quantity: 1 },
      { ingredientId: 'mushroom', quantity: 3 },
    ],
    toppingOptions: ['green-onion', 'sesame'],
    description: {
      fr: 'Un ramen riche au porc avec une note d’ail.',
      en: 'A rich pork ramen with a garlic note.',
    },
  },
  {
    id: 'ramen-corn',
    name: { fr: 'Ramen Maïs Doux', en: 'Sweet Corn Ramen' },
    emoji: '🌽',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 23,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-miso', quantity: 1 },
      { ingredientId: 'corn', quantity: 2 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'mushroom', quantity: 4 },
    ],
    toppingOptions: ['sesame', 'green-onion'],
    description: {
      fr: 'Une recette douce et très accessible.',
      en: 'A gentle and very approachable recipe.',
    },
  },
  {
    id: 'ramen-deluxe',
    name: { fr: 'Ramen Deluxe', en: 'Deluxe Ramen' },
    emoji: '✨',
    category: 'ramen',
    cookingType: 'stir',
    timer : 30,
    reward: 24,
    baseIngredientId: 'noodles',
    requiredIngredients: [
      { ingredientId: 'broth-tonkotsu', quantity: 1 },
      { ingredientId: 'pork', quantity: 2 },
      { ingredientId: 'egg', quantity: 1 },
      { ingredientId: 'shrimp', quantity: 4 },
    ],
    toppingOptions: ['naruto', 'green-onion'],
    description: {
      fr: 'Une recette premium pour les clients exigeants.',
      en: 'A premium recipe for demanding customers.',
    },
  },
];

export function getLocalizedText(
  text: LocalizedText,
  language: 'fr' | 'en'
): string {
  return text[language];
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function getIngredientById(id: string): Ingredient | undefined {
  return INGREDIENTS.find((ingredient) => ingredient.id === id);
}

export function getRecipesByCategory(category: RecipeCategory): Recipe[] {
  return RECIPES.filter((recipe) => recipe.category === category);
}

export function getIngredientsByCategory(category: IngredientCategory): Ingredient[] {
  return INGREDIENTS.filter((ingredient) => ingredient.category === category);
}

export function getRecipeToppings(recipeId: string): Ingredient[] {
  const recipe = getRecipeById(recipeId);
  if (!recipe) return [];

  return recipe.toppingOptions
    .map((toppingId) => getIngredientById(toppingId))
    .filter((ingredient): ingredient is Ingredient => Boolean(ingredient));
}
