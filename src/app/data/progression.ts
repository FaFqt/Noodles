import rewardTipJar from "../../assets/rewards/RewardTipJar.png";
import rewardCorn from "../../assets/rewards/Corn.png";
import seedDragonPepper from "../../assets/rewards/DragonPepper.png";
import rewardMoonHerb from "../../assets/rewards/MoonHerb.png";

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
    id: "level-3-tokens",
    level: 3,
    type: "coins",
    titleFr: "10 tokens bonus",
    titleEn: "10 bonus tokens",
    descriptionFr: "Le chat pourboire reçoit 10 tokens pour le test.",
    descriptionEn: "The Tip Jar receives 10 tokens for testing.",
    image: rewardTipJar,
    tipJarTokens: 10,
  },
  {
    id: "level-4-tokens",
    level: 4,
    type: "coins",
    titleFr: "10 tokens bonus",
    titleEn: "10 bonus tokens",
    descriptionFr: "Encore 10 tokens ajoutés au chat pourboire.",
    descriptionEn: "Another 10 tokens are added to the Tip Jar.",
    image: rewardTipJar,
    tipJarTokens: 10,
  },
  {
    id: "level-5-corn-seed",
    level: 5,
    type: "seed",
    titleFr: "Graines de maïs débloquées",
    titleEn: "Corn seeds unlocked",
    descriptionFr: "Une nouvelle graine de maïs est disponible pour le test.",
    descriptionEn: "A new corn seed is now available for testing.",
    image: rewardCorn,
  },
  {
    id: "level-6-greenhouse",
    level: 6,
    type: "recipe",
    titleFr: "Serre débloquée",
    titleEn: "Greenhouse unlocked",
    descriptionFr: "La serre est marquée comme débloquée pour le test.",
    descriptionEn: "The greenhouse is marked as unlocked for testing.",
    image: rewardMoonHerb,
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
