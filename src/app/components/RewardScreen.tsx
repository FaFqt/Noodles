import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

import restaurantBackground from "../../assets/screens/RestaurantBackgroundScreen.png";
import rewardBoard from "../../assets/ui/RewardBoard.png";
import superButton from "../../assets/ui/SuperButton.svg";
import rewardAssets from "../../assets/ui/RewardAssets.png";
import chestClose from "../../assets/ui/chestClose.png";
import chestOpen from "../../assets/ui/chestOpen.png";
import ResponsiveGameCanvas from "./ResponsiveGameCanvas";
import type { LevelRewardDefinition } from "../data/progression";

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface ServiceResult {
  quality: number; // 0 - 100
  xp: number;
  timeSeconds: number;
}

interface RewardScreenProps {
  services: ServiceResult[]; // 5 services
  reward?: LevelRewardDefinition | null;
  onContinue?: () => void;
}

const SCALE = 1;
const s = (v: number) => v * SCALE;

const UI = {
  board: { x: s(26), y: s(120), w: s(352), h: s(254) },

  boardTitle: { x: s(96), y: s(175), w: s(212), h: s(26) },

  summaryIcons: {
    bowl: { x: s(10), y: s(170), size: s(26) },
    timer: { x: s(114), y: s(226), size: s(26) },
    xp: { x: s(114), y: s(270), size: s(26) },
  },

  summaryValues: {
    quality: { x: s(170), y: s(215), w: s(130), h: s(24) },
    time: { x: s(170), y: s(242), w: s(130), h: s(24) },
    xp: { x: s(170), y: s(272), w: s(130), h: s(24) },
  },

  chest: { x: s(116), y: s(400), w: s(172), h: s(132) },

  rewardAppear: { x: s(100), y: s(185), w: s(200), h: s(120) },

  rewardTitle: { x: s(62), y: s(330), w: s(280), h: s(28) },
  rewardDescription: { x: s(58), y: s(360), w: s(288), h: s(44) },

  button: { x: s(94), y: s(578), w: s(216), h: s(56) },

  glowCenter: { x: s(190), y: s(250) },
} as const;

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDuration(seconds: number, language: string) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins <= 0) return `${secs} ${language === "fr" ? "sec" : "sec"}`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function getGlobalMention(quality: number, language: string) {
  if (language === "fr") {
    if (quality >= 88) return "Parfait";
    if (quality >= 72) return "Super";
    if (quality >= 52) return "Acceptable";
    return "Passable";
  }

  if (quality >= 88) return "Perfect";
  if (quality >= 72) return "Great";
  if (quality >= 52) return "Acceptable";
  return "Passable";
}

function Sparkles({
  centerX,
  centerY,
}: {
  centerX: number;
  centerY: number;
}) {
  const particles = [
    { x: -70, y: -50, delay: 0 },
    { x: -34, y: -82, delay: 0.12 },
    { x: 0, y: -96, delay: 0.22 },
    { x: 42, y: -74, delay: 0.32 },
    { x: 78, y: -40, delay: 0.12 },
    { x: -80, y: 0, delay: 0.28 },
    { x: 82, y: 8, delay: 0.18 },
    { x: -56, y: 52, delay: 0.2 },
    { x: 0, y: 72, delay: 0.36 },
    { x: 58, y: 48, delay: 0.1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            left: centerX + particle.x,
            top: centerY + particle.y,
          }}
          initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.2, 1, 0.5],
            rotate: [0, 20, 45],
            y: [0, -8, -14],
          }}
          transition={{
            duration: 1.1,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: 0.7,
            ease: "easeOut",
          }}
        >
          <div
            className="h-[16px] w-[16px]"
            style={{
              background:
                "radial-gradient(circle, rgba(255,244,180,1) 0%, rgba(255,211,84,0.95) 45%, rgba(255,211,84,0) 80%)",
              clipPath:
                "polygon(50% 0%, 61% 38%, 100% 50%, 61% 62%, 50% 100%, 39% 62%, 0% 50%, 39% 38%)",
              filter: "drop-shadow(0 0 10px rgba(255,211,84,0.6))",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function RewardScreen({
  services,
  reward,
  onContinue,
}: RewardScreenProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState<"summary" | "reward">("summary");
  const hasReward = Boolean(reward);

  const globalStats = useMemo(() => {
    const qualityAvg = average(services.map((service) => service.quality));
    const totalTime = services.reduce((sum, service) => sum + service.timeSeconds, 0);
    const totalXp = services.reduce((sum, service) => sum + service.xp, 0);

    return {
      qualityAvg: Math.round(qualityAvg),
      totalTime,
      totalXp,
      mention: getGlobalMention(qualityAvg, language),
    };
  }, [services, language]);

  const title = language === "fr" ? "FIN DE JOURNEE" : "DAY COMPLETE";

  const discoverLabel =
    language === "fr" ? "OUVRIR LE TRESOR" : "OPEN THE CHEST";

  const continueLabel =
    language === "fr" ? "CONTINUER" : "CONTINUE";

  const qualityText =
    language === "fr"
      ? `${globalStats.mention}`
      : `${globalStats.mention}`;

  const rewardTitle = reward
    ? language === "fr"
      ? reward.titleFr
      : reward.titleEn
    : "";

  const rewardDescription = reward
    ? language === "fr"
      ? reward.descriptionFr
      : reward.descriptionEn
    : "";

  const handlePrimaryAction = () => {
    if (step === "summary" && hasReward) {
      setStep("reward");
      return;
    }

    onContinue?.();
  };

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#1f0d05]"
    >
      {({ canvasStyle }) => (
        <>
          <img
            src={restaurantBackground}
            alt="Restaurant background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            style={{
              filter: "blur(3px) brightness(0.92)",
              transform: "scale(1.04)",
            }}
          />

          <div className="absolute inset-0 bg-[rgba(50,20,8,0.22)]" />

          <div className="absolute inset-0 z-10" style={canvasStyle}>
        {/* Board */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute"
          style={{
            left: UI.board.x,
            top: UI.board.y,
            width: UI.board.w,
            height: UI.board.h,
          }}
        >
          {step === "summary" ? (
            <img
              src={rewardBoard}
              alt="Reward board"
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : null}

          <div
            className="absolute text-center text-white"
            style={{
              left: UI.boardTitle.x - UI.board.x,
              top: UI.boardTitle.y - UI.board.y,
              width: UI.boardTitle.w,
              height: UI.boardTitle.h,
              fontFamily: "Fredoka, sans-serif",
              fontSize: "1.05rem",
              fontWeight: 700,
              textShadow: "0 2px 6px rgba(0,0,0,0.35)",
            }}
          >
            {title}
          </div>

          <AnimatePresence mode="wait">
            {step === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <img
                  src={rewardAssets}
                  alt="Reward summary icons"
                  className="absolute"
                  draggable={false}
                  style={{
                    left: UI.summaryIcons.bowl.x - UI.board.x,
                    top: UI.summaryIcons.bowl.y - UI.board.y,
                    width: 350,
                    height: 150,
                    objectFit: "contain",
                  }}
                />

                <div
                  className="absolute text-[#2f160c]"
                  style={{
                    left: UI.summaryValues.quality.x - UI.board.x,
                    top: UI.summaryValues.quality.y - UI.board.y,
                    width: UI.summaryValues.quality.w,
                    height: UI.summaryValues.quality.h,
                    fontFamily: "Fredoka, sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                >
                  {qualityText}
                </div>

                <div
                  className="absolute text-[#2f160c]"
                  style={{
                    left: UI.summaryValues.time.x - UI.board.x,
                    top: UI.summaryValues.time.y - UI.board.y,
                    width: UI.summaryValues.time.w,
                    height: UI.summaryValues.time.h,
                    fontFamily: "Fredoka, sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                >
                  {formatDuration(globalStats.totalTime, language)}
                </div>

                <div
                  className="absolute text-[#2f160c]"
                  style={{
                    left: UI.summaryValues.xp.x - UI.board.x,
                    top: UI.summaryValues.xp.y - UI.board.y,
                    width: UI.summaryValues.xp.w,
                    height: UI.summaryValues.xp.h,
                    fontFamily: "Fredoka, sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                >
                  +{globalStats.totalXp} XP
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Reward title/description */}
        <AnimatePresence mode="wait">
          {step === "reward" && reward && (
            <motion.div
              key={`reward-copy-${reward.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute text-center text-[#fff7e8]"
                style={{
                  left: UI.rewardTitle.x,
                  top: UI.rewardTitle.y,
                  width: UI.rewardTitle.w,
                  height: UI.rewardTitle.h,
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {rewardTitle}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="absolute text-center text-[#fff1de]"
                style={{
                  left: UI.rewardDescription.x,
                  top: UI.rewardDescription.y,
                  width: UI.rewardDescription.w,
                  height: UI.rewardDescription.h,
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  lineHeight: 1.25,
                  textShadow: "0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                {rewardDescription}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chest */}
        <div
          className="absolute"
          style={{
            left: UI.chest.x,
            top: UI.chest.y,
            width: UI.chest.w,
            height: UI.chest.h,
          }}
        >
          <AnimatePresence mode="wait">
            {step === "summary" && hasReward ? (
              <motion.img
                key="closed"
                src={chestClose}
                alt="Closed chest"
                draggable={false}
                className="h-full w-full object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.22 }}
              />
            ) : hasReward ? (
              <motion.img
                key={`open-${reward?.id ?? "reward"}`}
                src={chestOpen}
                alt="Open chest"
                draggable={false}
                className="h-full w-full object-contain"
                initial={{ opacity: 0, scale: 0.86, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Appearing reward + sparkles */}
        <AnimatePresence mode="wait">
          {step === "reward" && reward && (
            <motion.div
              key={`reward-asset-${reward.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Sparkles
                centerX={UI.glowCenter.x}
                centerY={UI.glowCenter.y}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.08,
                  type: "spring",
                  stiffness: 210,
                  damping: 14,
                }}
                className="absolute flex items-center justify-center"
                style={{
                  left: UI.rewardAppear.x,
                  top: UI.rewardAppear.y,
                  width: UI.rewardAppear.w,
                  height: UI.rewardAppear.h,
                  filter:
                    "drop-shadow(0 0 18px rgba(255,214,98,0.45)) drop-shadow(0 6px 18px rgba(0,0,0,0.22))",
                }}
                >
                  <img
                    src={reward.image}
                  alt={rewardTitle}
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                  />
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          whileTap={{ scale: 0.97, y: 2 }}
          whileHover={{ scale: 1.02 }}
          onClick={handlePrimaryAction}
          className="absolute"
          style={{
            left: UI.button.x,
            top: UI.button.y,
            width: UI.button.w,
            height: UI.button.h,
            filter:
              "drop-shadow(0 6px 0 rgba(164,96,20,0.8)) drop-shadow(0 10px 18px rgba(0,0,0,0.22))",
          }}
          type="button"
        >
          <img
            src={superButton}
            alt="Reward button"
            draggable={false}
            className="h-full w-full object-fill"
          />

          <span
            className="absolute inset-0 flex items-center justify-center text-center"
            style={{
              fontFamily: "Fredoka, sans-serif",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#fffdf8",
              textShadow:
                "0 2px 8px rgba(0,0,0,0.35), 0 0 10px rgba(255,215,80,0.18)",
              letterSpacing: "0.02em",
              paddingInline: "16px",
              transform: "translateY(-6px)",
            }}
          >
            {step === "summary" && hasReward ? discoverLabel : continueLabel}
          </span>
        </motion.button>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
