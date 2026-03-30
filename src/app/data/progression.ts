import rewardTipJar from "../../assets/rewards/RewardTipJar.png";
import rewardCorn from "../../assets/rewards/Corn.png";
import rewardGreenhouse from "../../assets/rewards/RewardGreenhouse.png";
import seedDragonPepper from "../../assets/rewards/DragonPepper.png";
import rewardMoonHerb from "../../assets/rewards/MoonHerb.png";
import rewardToken from "../../assets/rewards/TokenRewards.png";

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
  | "tipjar_tokens"
  | "seed"
  | "greenhouse_unlock"
  | "market_unlock";

export type SeedRewardCrop = "corn" | "dragonpepper" | "moonherb";

export interface LevelRewardDefinition {
  id: string;
  level: number;
  type: LevelRewardType;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  image: string;
  tipJarTokens?: number;
  seedCrop?: SeedRewardCrop;
  seedAmount?: number;
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
    descriptionFr: "Le chat pourboire apparaît au restaurant et offre 12 tokens.",
    descriptionEn: "The Tip Jar appears in the restaurant and grants 12 tokens.",
    image: rewardTipJar,
    tipJarTokens: 12,
  },
  {
    id: "level-3-tipjar-tokens",
    level: 3,
    type: "tipjar_tokens",
    titleFr: "14 tokens pour le Tip Jar",
    titleEn: "14 Tip Jar tokens",
    descriptionFr: "14 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "14 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 14,
  },
  {
    id: "level-4-tipjar-tokens",
    level: 4,
    type: "tipjar_tokens",
    titleFr: "16 tokens pour le Tip Jar",
    titleEn: "16 Tip Jar tokens",
    descriptionFr: "16 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "16 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 16,
  },
  {
    id: "level-4-corn-seed",
    level: 4,
    type: "seed",
    titleFr: "1 graine de maïs offerte",
    titleEn: "1 corn seed granted",
    descriptionFr: "1 graine de maïs est ajoutee a ton inventaire.",
    descriptionEn: "1 corn seed is added to your inventory.",
    image: rewardCorn,
    seedCrop: "corn",
    seedAmount: 1,
  },
  {
    id: "level-5-tipjar-tokens",
    level: 5,
    type: "tipjar_tokens",
    titleFr: "18 tokens pour le Tip Jar",
    titleEn: "18 Tip Jar tokens",
    descriptionFr: "18 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "18 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 18,
  },
  {
    id: "level-5-greenhouse",
    level: 5,
    type: "greenhouse_unlock",
    titleFr: "Serre débloquée",
    titleEn: "Greenhouse unlocked",
    descriptionFr: "La serre devient accessible dans le village.",
    descriptionEn: "The greenhouse becomes accessible in the village.",
    image: rewardGreenhouse,
  },
  {
    id: "level-6-tipjar-tokens",
    level: 6,
    type: "tipjar_tokens",
    titleFr: "20 tokens pour le Tip Jar",
    titleEn: "20 Tip Jar tokens",
    descriptionFr: "20 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "20 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 20,
  },
  {
    id: "level-6-market",
    level: 6,
    type: "market_unlock",
    titleFr: "Marche debloque",
    titleEn: "Market unlocked",
    descriptionFr: "Le marche devient accessible dans le village.",
    descriptionEn: "The market becomes accessible in the village.",
    image: rewardToken,
  },
  {
    id: "level-7-tipjar-tokens",
    level: 7,
    type: "tipjar_tokens",
    titleFr: "22 tokens pour le Tip Jar",
    titleEn: "22 Tip Jar tokens",
    descriptionFr: "22 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "22 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 22,
  },
  {
    id: "level-7-dragonpepper-seed",
    level: 7,
    type: "seed",
    titleFr: "1 graine de Dragon Pepper offerte",
    titleEn: "1 Dragon Pepper seed granted",
    descriptionFr: "1 graine de Dragon Pepper est ajoutee a ton inventaire.",
    descriptionEn: "1 Dragon Pepper seed is added to your inventory.",
    image: seedDragonPepper,
    seedCrop: "dragonpepper",
    seedAmount: 1,
  },
  {
    id: "level-8-tipjar-tokens",
    level: 8,
    type: "tipjar_tokens",
    titleFr: "24 tokens pour le Tip Jar",
    titleEn: "24 Tip Jar tokens",
    descriptionFr: "24 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "24 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 24,
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
