import rewardTipJar from "../../assets/rewards/RewardTipJar.png";
import seedDragonPepper from "../../assets/rewards/DragonPepper.png";
import seedSakuraMushroom from "../../assets/rewards/SakuraMushroom.png";
import rewardNewRecipe from "../../assets/rewards/GoldenEgg.png";

export interface PlayerStats {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  stars: number;
  maxStars: number;
  coins: number;
}

export type LevelRewardType =
  | "tipjar_unlock"
  | "seed"
  | "recipe"
  | "coins";

export interface LevelRewardDefinition {
  id: string;
  level: number;
  type: LevelRewardType;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  image: string;
  coinsBonus?: number;
  tipJarTokens?: number;
}

export function getXpToNextLevel(level: number) {
  return 100 + Math.max(0, level - 1) * 50;
}

export const LEVEL_REWARDS: LevelRewardDefinition[] = [
  {
    id: "level-2-tipjar",
    level: 2,
    type: "tipjar_unlock",
    titleFr: "Chat pourboire débloqué",
    titleEn: "Tip Jar unlocked",
    descriptionFr: "Le chat pourboire apparaît au restaurant et offre 2 tokens.",
    descriptionEn: "The Tip Jar appears in the restaurant and grants 2 tokens.",
    image: rewardTipJar,
    tipJarTokens: 2,
  },
  {
    id: "level-3-dragon-pepper",
    level: 3,
    type: "seed",
    titleFr: "Dragon Pepper débloqué",
    titleEn: "Dragon Pepper unlocked",
    descriptionFr: "Une graine spéciale rejoint tes futures récompenses.",
    descriptionEn: "A special seed joins your future rewards.",
    image: seedDragonPepper,
  },
  {
    id: "level-4-sakura-mushroom",
    level: 4,
    type: "seed",
    titleFr: "Sakura Mushroom débloqué",
    titleEn: "Sakura Mushroom unlocked",
    descriptionFr: "Une nouvelle culture rare est maintenant disponible.",
    descriptionEn: "A rare new crop is now available.",
    image: seedSakuraMushroom,
  },
  {
    id: "level-5-recipe-special",
    level: 5,
    type: "recipe",
    titleFr: "Nouvelle recette débloquée",
    titleEn: "New recipe unlocked",
    descriptionFr: "Une recette spéciale rejoint le restaurant.",
    descriptionEn: "A special recipe joins the restaurant.",
    image: rewardNewRecipe,
  },
];

export function applyXpGain(
  playerStats: PlayerStats,
  xpGained: number,
  claimedRewardIds: string[]
) {
  let level = playerStats.level;
  let xp = playerStats.xp + xpGained;
  let xpToNext = playerStats.xpToNext;

  const gainedLevels: number[] = [];

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    gainedLevels.push(level);
    xpToNext = getXpToNextLevel(level);
  }

  const unlockedRewards = LEVEL_REWARDS.filter(
    (reward) =>
      gainedLevels.includes(reward.level) &&
      !claimedRewardIds.includes(reward.id)
  );

  return {
    nextStats: {
      ...playerStats,
      level,
      xp,
      xpToNext,
    },
    gainedLevels,
    unlockedRewards,
  };
}
