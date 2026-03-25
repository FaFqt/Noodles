import rewardTipJar from "../../assets/rewards/RewardTipJar.png";
import rewardCorn from "../../assets/rewards/Corn.png";
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
  | "seed"
  | "greenhouse_unlock"
  | "coins";

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
  coinsBonus?: number;
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
    descriptionFr: "Le chat pourboire apparaît au restaurant et offre 2 tokens.",
    descriptionEn: "The Tip Jar appears in the restaurant and grants 2 tokens.",
    image: rewardTipJar,
    tipJarTokens: 2,
  },
  {
    id: "level-3-tokens",
    level: 3,
    type: "coins",
    titleFr: "10 Noods bonus",
    titleEn: "10 bonus Noods",
    descriptionFr: "10 Noods sont ajoutes directement a ton solde.",
    descriptionEn: "10 Noods are added directly to your balance.",
    image: rewardToken,
    coinsBonus: 10,
  },
  {
    id: "level-4-tokens",
    level: 4,
    type: "coins",
    titleFr: "10 tokens bonus",
    titleEn: "10 bonus tokens",
    descriptionFr: "Encore 10 tokens ajoutés au chat pourboire.",
    descriptionEn: "Another 10 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 10,
  },
  {
    id: "level-5-corn-seed",
    level: 5,
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
    id: "level-6-greenhouse",
    level: 6,
    type: "greenhouse_unlock",
    titleFr: "Serre débloquée",
    titleEn: "Greenhouse unlocked",
    descriptionFr: "La serre devient accessible dans le village.",
    descriptionEn: "The greenhouse becomes accessible in the village.",
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
