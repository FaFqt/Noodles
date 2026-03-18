import React, { useMemo } from "react";
import { motion } from "motion/react";
import backgroundImage from "../../assets/screens/SatisfactionScreen.png";
import satisfactionFrameAsset from "../../assets/ui/CadreSatisfaction.svg";
import buttonStartAsset from "../../assets/ui/ButtonStart.png"; 
import { useLanguage } from "../context/LanguageContext";

const ASSET_MODULES = import.meta.glob("../../assets/**/*.{png,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function findAssetByFilename(filename: string): string | undefined {
  const found = Object.entries(ASSET_MODULES).find(([path]) =>
    path.endsWith(`/${filename}`)
  );
  return found?.[1];
}

const SCALE = 1;
const s = (value: number) => value * SCALE;

const UI = {
  card: {
    x: s(50),
    y: s(520),
    w: s(326),
    h: s(132),
  },

  title: {
    x: s(64),
    y: s(530),
    w: s(276),
    h: s(28),
  },

  subtitleLine: {
    x: s(110),
    y: s(550),
    w: s(184),
    h: s(1),
  },

  subtitle: {
    x: s(84),
    y: s(560),
    w: s(236),
    h: s(18),
  },

  satisfaction: {
    x: s(108),
    y: s(585),
    w: s(188),
    h: s(22),
  },

  xp: {
    x: s(112),
    y: s(610),
    w: s(180),
    h: s(20),
  },

  continueButton: {
    x: s(112),
    y: s(660),
    w: s(180),
    h: s(50),
  },
} as const;

export type SatisfactionTier =
  | "perfect"
  | "great"
  | "acceptable"
  | "passable"
  | "failed";
type Petal = {
  id: number;
  startX: number;
  drift: number;
  duration: number;
  delay: number;
  size: number;
  rotate: number;
  sway: number;
  opacity: number;
  color: string;
};

interface SatisfactionScreenProps {
  ingredientQuality: number; // 0 - 100
  brothQuality: number; // 0 - 100
  toppingQuality: number; // 0 - 100
  serviceQuality: number; // 0 - 100

  totalTimeSpentSeconds: number;
  targetTotalTimeSeconds: number;

  baseXp?: number;
  didExpire?: boolean;
  onContinue?: () => void;
}

const PETAL_COLORS = ["#ffd7e6", "#ffc6da", "#ffe2ee", "#f7bfd2"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value);
}

function getTierFromQuality(quality: number): SatisfactionTier {
  if (quality >= 88) return "perfect";
  if (quality >= 72) return "great";
  if (quality >= 52) return "acceptable";
  return "passable";
}

function getTierLabel(language: string, tier: SatisfactionTier) {
  if (language === "fr") {
    switch (tier) {
      case "failed":
        return "Échec";
      case "perfect":
        return "⭐⭐⭐ Parfait";
      case "great":
        return "⭐⭐ Super";
      case "acceptable":
        return "⭐ Acceptable";
      case "passable":
        return "Passable";
    }
  }

  switch (tier) {
    case "failed":
      return "Failed";
    case "perfect":
      return "⭐⭐⭐ Perfect";
    case "great":
      return "⭐⭐ Great";
    case "acceptable":
      return "⭐ Acceptable";
    case "passable":
      return "Passable";
  }
}

function getTitle(language: string, tier: SatisfactionTier) {
  if (language === "fr") {
    switch (tier) {
      case "failed":
        return "Le client n'a pas été servi à temps.";
      case "perfect":
        return "Superbe petit restaurant de ramen !!!";
      case "great":
        return "Quel excellent bol de ramen !!";
      case "acceptable":
        return "Un bon ramen !";
      case "passable":
        return "Mouais, ça se mange !";
    }
  }

  switch (tier) {
    case "failed":
      return "The customer was not served in time.";
    case "perfect":
      return "What an amazing little ramen spot!!";
    case "great":
      return "What a delicious bowl of ramen!";
    case "acceptable":
      return "A nice bowl of ramen!";
    case "passable":
      return "Not my best ramen, but it does the job!";
  }
}

function getSubtitle(language: string, tier: SatisfactionTier) {
  if (language === "fr") {
    switch (tier) {
      case "failed":
        return "Temps écoulé. Mission échouée.";
      case "perfect":
        return "Quel délicieux ramen !";
      case "great":
        return "Poppy s'est régalée !";
      case "acceptable":
        return "C'était bon !";
      case "passable":
        return "Heureusement que la vue est belle !";
    }
  }

  switch (tier) {
    case "failed":
      return "Time's up. Mission failed.";
    case "perfect":
      return "What a delicious ramen!";
    case "great":
      return "Poppy really enjoyed it!";
    case "acceptable":
      return "That was good!";
    case "passable":
      return "At least the view is nice!";
  }
}

export function computeSatisfactionResult(params: {
  ingredientQuality: number;
  brothQuality: number;
  toppingQuality: number;
  serviceQuality: number;
  totalTimeSpentSeconds: number;
  targetTotalTimeSeconds: number;
  baseXp: number;
  didExpire?: boolean;
}) {
  const {
    ingredientQuality,
    brothQuality,
    toppingQuality,
    serviceQuality,
    totalTimeSpentSeconds,
    targetTotalTimeSeconds,
    baseXp,
    didExpire = false,
  } = params;

  if (didExpire) {
    return {
      finalQuality: 0,
      earnedXp: 0,
      tier: "failed" as SatisfactionTier,
    };
  }

  // pondération gameplay
  const executionScore =
    ingredientQuality * 0.28 +
    brothQuality * 0.27 +
    toppingQuality * 0.2 +
    serviceQuality * 0.25;

  // bonus/malus temps
  const timeRatio =
    targetTotalTimeSeconds > 0
      ? totalTimeSpentSeconds / targetTotalTimeSeconds
      : 1;

  let timeScore = 100;

  if (timeRatio <= 0.75) {
    timeScore = 100;
  } else if (timeRatio <= 1) {
    timeScore = 100 - (timeRatio - 0.75) * 80;
  } else if (timeRatio <= 1.25) {
    timeScore = 80 - (timeRatio - 1) * 120;
  } else {
    timeScore = 50 - (timeRatio - 1.25) * 120;
  }

  timeScore = clamp(timeScore, 10, 100);

  // score final
  const finalQuality = clamp(executionScore * 0.8 + timeScore * 0.2, 0, 100);

  // XP proportionnel
  const xpMultiplier = clamp(finalQuality / 100, 0.2, 1.2);
  const earnedXp = Math.max(1, round(baseXp * xpMultiplier));

  const tier = getTierFromQuality(finalQuality);

  return {
    finalQuality: round(finalQuality),
    earnedXp,
    tier,
  };
}

function createPetals(count: number): Petal[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    startX: Math.random() * 100,
    drift: 30 + Math.random() * 70,
    duration: 8 + Math.random() * 6,
    delay: Math.random() * 6,
    size: 10 + Math.random() * 10,
    rotate: Math.random() * 180 - 90,
    sway: 12 + Math.random() * 18,
    opacity: 0.45 + Math.random() * 0.35,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
  }));
}

export default function SatisfactionScreen({
  ingredientQuality,
  brothQuality,
  toppingQuality,
  serviceQuality,
  totalTimeSpentSeconds,
  targetTotalTimeSeconds,
  baseXp = 85,
  didExpire = false,
  onContinue,
}: SatisfactionScreenProps) {
  const { language } = useLanguage();

  const result = useMemo(() => {
    return computeSatisfactionResult({
      ingredientQuality,
      brothQuality,
      toppingQuality,
      serviceQuality,
      totalTimeSpentSeconds,
      targetTotalTimeSeconds,
      baseXp,
      didExpire,
    });
  }, [
    ingredientQuality,
    brothQuality,
    toppingQuality,
    serviceQuality,
    totalTimeSpentSeconds,
    targetTotalTimeSeconds,
    baseXp,
    didExpire,
  ]);

  const title = getTitle(language, result.tier);
  const subtitle = getSubtitle(language, result.tier);
  const tierLabel = getTierLabel(language, result.tier);
  const continueLabel = language === "fr" ? "CONTINUER" : "CONTINUE";
  const qualityLabel = language === "fr" ? "Qualité" : "Quality";
  const xpLabel = language === "fr" ? "XP" : "XP";
  const petals = useMemo(() => createPetals(18), []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8e2c8]">
      <img
        src={backgroundImage}
        alt="Satisfaction background"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(70,20,5,0.08)]" />

      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute pointer-events-none"
          style={{
            left: `${petal.startX}%`,
            top: -32,
            width: petal.size,
            height: petal.size * 0.72,
            background: petal.color,
            opacity: petal.opacity,
            borderRadius: "75% 35% 70% 40%",
            boxShadow: "0 0 8px rgba(255, 214, 232, 0.35)",
            zIndex: 1,
          }}
          initial={{
            x: 0,
            y: -20,
            rotate: petal.rotate,
          }}
          animate={{
            x: [0, petal.sway, -petal.sway * 0.6, petal.drift],
            y: ["0vh", "40vh", "75vh", "115vh"],
            rotate: [
              petal.rotate,
              petal.rotate + 80,
              petal.rotate - 55,
              petal.rotate + 130,
            ],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Cadre de satisfaction */}
      <div
        className="absolute"
        style={{
          left: UI.card.x,
          top: UI.card.y,
          width: UI.card.w,
          height: UI.card.h,
        }}
      >
        {satisfactionFrameAsset ? (
          <img
            src={satisfactionFrameAsset}
            alt="Cadre satisfaction"
            className="h-full w-full object-fill"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full rounded-[18px] bg-[#f8eadb] shadow-lg" />
        )}
      </div>

      {/* Titre */}
      <div
        className="absolute text-center leading-tight text-[#3d1d12]"
        style={{
          left: UI.title.x,
          top: UI.title.y,
          width: UI.title.w,
          height: UI.title.h,
          fontFamily: "Fredoka, sans-serif",
          fontSize: s(12),
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      {/* Ligne sous-titre */}
      <div
        className="absolute bg-[#8f6c5a]/35"
        style={{
          left: UI.subtitleLine.x,
          top: UI.subtitleLine.y,
          width: UI.subtitleLine.w,
          height: UI.subtitleLine.h,
        }}
      />

      {/* Sous-titre */}
      <div
        className="absolute text-center leading-none text-[#4d2b1a]"
        style={{
          left: UI.subtitle.x,
          top: UI.subtitle.y,
          width: UI.subtitle.w,
          height: UI.subtitle.h,
          fontFamily: "Fredoka, sans-serif",
          fontSize: s(10),
          fontWeight: 600,
        }}
      >
        {subtitle}
      </div>

      {/* Satisfaction */}
      <div
        className="absolute text-center leading-none text-[#3d1d12]"
        style={{
          left: UI.satisfaction.x,
          top: UI.satisfaction.y,
          width: UI.satisfaction.w,
          height: UI.satisfaction.h,
          fontFamily: "Fredoka, sans-serif",
          fontSize: s(11),
          fontWeight: 700,
        }}
      >
        {qualityLabel} : {tierLabel}
      </div>

      {/* XP */}
      <div
        className="absolute text-center leading-none text-[#2a140c]"
        style={{
          left: UI.xp.x,
          top: UI.xp.y,
          width: UI.xp.w,
          height: UI.xp.h,
          fontFamily: "Fredoka, sans-serif",
          fontSize: s(10),
          fontWeight: 700,
        }}
      >
        {xpLabel} : +{result.earnedXp}
      </div>

      {/* Bouton continuer */}
      <motion.button
        whileTap={{ scale: 0.97, y: 2 }}
        whileHover={{ scale: 1.02 }}
        onClick={onContinue}
        type="button"
        className="absolute"
        style={{
          left: UI.continueButton.x,
          top: UI.continueButton.y,
          width: UI.continueButton.w,
          height: UI.continueButton.h,
          filter:
            "drop-shadow(0 6px 0 #8A4A20) drop-shadow(0 10px 18px rgba(0,0,0,0.22))",
        }}
      >
        {buttonStartAsset ? (
          <img
            src={buttonStartAsset}
            alt={continueLabel}
            draggable={false}
            className="h-full w-full object-fill"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-[#b6662b]" />
        )}

        <span
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{
            fontFamily: "Fredoka, sans-serif",
            fontSize: s(12),
            color: "#FFFFFF",
            textShadow:
              "0 2px 8px rgba(0,0,0,0.5), 0 0 10px rgba(120,55,10,0.15)",
            letterSpacing: "0.04em",
          }}
        >
          {continueLabel}
        </span>
      </motion.button>
    </div>
  );
}
