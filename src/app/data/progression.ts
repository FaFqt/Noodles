import rewardTipJar from "../../assets/rewards/RewardTipJar.png";
import rewardCorn from "../../assets/rewards/Corn.png";
import rewardBamboo from "../../assets/rewards/Bamboo.png";
import rewardMushroom from "../../assets/rewards/Mushroom.png";
import rewardGarlic from "../../assets/rewards/Garlic.png";
import rewardGreenhouse from "../../assets/rewards/RewardGreenhouse.png";
import seedDragonPepper from "../../assets/rewards/DragonPepper.png";
import rewardFireChili from "../../assets/rewards/FireChili.png";
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

export type SeedRewardCrop =
  | "corn"
  | "bamboo"
  | "mushroom"
  | "garlic"
  | "dragonpepper"
  | "firechili"
  | "moonherb";

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
  seedCropOptions?: SeedRewardCrop[];
  seedAmount?: number;
}

const RANDOM_SEED_REWARD_COPY: Record<
  "dragonpepper" | "firechili",
  {
    titleFr: string;
    titleEn: string;
    descriptionFr: string;
    descriptionEn: string;
    image: string;
  }
> = {
  dragonpepper: {
    titleFr: "1 graine de Dragon Pepper offerte",
    titleEn: "1 Dragon Pepper seed granted",
    descriptionFr:
      "1 graine de Dragon Pepper est ajoutee a ton inventaire. Elle servira plus tard aux premieres recettes epiques.",
    descriptionEn:
      "1 Dragon Pepper seed is added to your inventory. It will later help unlock the first epic recipes.",
    image: seedDragonPepper,
  },
  firechili: {
    titleFr: "1 graine de Fire Chili offerte",
    titleEn: "1 Fire Chili seed granted",
    descriptionFr:
      "1 graine de Fire Chili est ajoutee a ton inventaire. Elle servira plus tard aux premieres recettes epiques.",
    descriptionEn:
      "1 Fire Chili seed is added to your inventory. It will later help unlock the first epic recipes.",
    image: rewardFireChili,
  },
};

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
    id: "level-7-garlic-seed",
    level: 7,
    type: "seed",
    titleFr: "1 graine d'ail offerte",
    titleEn: "1 garlic seed granted",
    descriptionFr: "1 graine d'ail est ajoutee a ton inventaire.",
    descriptionEn: "1 garlic seed is added to your inventory.",
    image: rewardGarlic,
    seedCrop: "garlic",
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
  {
    id: "level-8-bamboo-seed",
    level: 8,
    type: "seed",
    titleFr: "1 graine de bamboo offerte",
    titleEn: "1 bamboo seed granted",
    descriptionFr: "1 graine de bamboo est ajoutee a ton inventaire.",
    descriptionEn: "1 bamboo seed is added to your inventory.",
    image: rewardBamboo,
    seedCrop: "bamboo",
    seedAmount: 1,
  },
  {
    id: "level-9-tipjar-tokens",
    level: 9,
    type: "tipjar_tokens",
    titleFr: "26 tokens pour le Tip Jar",
    titleEn: "26 Tip Jar tokens",
    descriptionFr: "26 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "26 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 26,
  },
  {
    id: "level-9-mushroom-seed",
    level: 9,
    type: "seed",
    titleFr: "1 graine de champignon offerte",
    titleEn: "1 mushroom seed granted",
    descriptionFr: "1 graine de champignon est ajoutee a ton inventaire.",
    descriptionEn: "1 mushroom seed is added to your inventory.",
    image: rewardMushroom,
    seedCrop: "mushroom",
    seedAmount: 1,
  },
  {
    id: "level-10-tipjar-tokens",
    level: 10,
    type: "tipjar_tokens",
    titleFr: "28 tokens pour le Tip Jar",
    titleEn: "28 Tip Jar tokens",
    descriptionFr: "28 tokens sont ajoutes au chat pourboire.",
    descriptionEn: "28 tokens are added to the Tip Jar.",
    image: rewardToken,
    tipJarTokens: 28,
  },
  {
    id: "level-10-rare-seed",
    level: 10,
    type: "seed",
    titleFr: "1 graine rare offerte",
    titleEn: "1 rare seed granted",
    descriptionFr:
      "Une graine rare est tiree au hasard entre Dragon Pepper et Fire Chili, pour preparer plus tard les premieres recettes epiques.",
    descriptionEn:
      "A rare seed is drawn at random between Dragon Pepper and Fire Chili to prepare the first epic recipes later.",
    image: seedDragonPepper,
    seedCropOptions: ["dragonpepper", "firechili"],
    seedAmount: 1,
  },
];

export function resolveLevelRewardDefinition(
  reward: LevelRewardDefinition
): LevelRewardDefinition {
  if (reward.seedCrop || !reward.seedCropOptions?.length) {
    return reward;
  }

  const randomIndex = Math.floor(Math.random() * reward.seedCropOptions.length);
  const chosenCrop = reward.seedCropOptions[randomIndex];

  if (chosenCrop === "dragonpepper" || chosenCrop === "firechili") {
    const resolvedCopy = RANDOM_SEED_REWARD_COPY[chosenCrop];

    return {
      ...reward,
      seedCrop: chosenCrop,
      titleFr: resolvedCopy.titleFr,
      titleEn: resolvedCopy.titleEn,
      descriptionFr: resolvedCopy.descriptionFr,
      descriptionEn: resolvedCopy.descriptionEn,
      image: resolvedCopy.image,
    };
  }

  return {
    ...reward,
    seedCrop: chosenCrop,
  };
}

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
