import { motion } from "motion/react";
import restaurantBackground from "../../assets/screens/RestaurantBackgroundScreen.png";
import rewardBoard from "../../assets/ui/RewardBoard.png";
import superButton from "../../assets/ui/SuperButton.svg";
import ResponsiveGameCanvas from "./ResponsiveGameCanvas";
import { useLanguage } from "../context/LanguageContext";
import type { LevelRewardDefinition } from "../data/progression";

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

const UI = {
  board: { x: 38, y: 126, w: 354, h: 250 },
  levelTitle: { x: 92, y: 162, w: 246, h: 28 },
  rewardImage: { x: 116, y: 214, w: 196, h: 136 },
  rewardTitle: { x: 62, y: 416, w: 306, h: 30 },
  rewardDescription: { x: 58, y: 452, w: 314, h: 52 },
  button: { x: 94, y: 592, w: 216, h: 56 },
} as const;

interface LevelRewardScreenProps {
  reward: LevelRewardDefinition;
  level: number;
  onContinue?: () => void;
}

export default function LevelRewardScreen({
  reward,
  level,
  onContinue,
}: LevelRewardScreenProps) {
  const { language } = useLanguage();

  const title = language === "fr" ? reward.titleFr : reward.titleEn;
  const description =
    language === "fr" ? reward.descriptionFr : reward.descriptionEn;
  const levelLabel =
    language === "fr" ? `NIVEAU ${level} ATTEINT !` : `LEVEL ${level} REACHED!`;
  const continueLabel = language === "fr" ? "CONTINUER" : "CONTINUE";

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
            alt="Reward background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            style={{
              filter: "blur(3px) brightness(0.92)",
              transform: "scale(1.04)",
            }}
          />

          <div className="absolute inset-0 bg-[rgba(50,20,8,0.22)]" />

          <div className="absolute inset-0 z-10" style={canvasStyle}>
            <div
              className="absolute"
              style={{
                left: UI.board.x,
                top: UI.board.y,
                width: UI.board.w,
                height: UI.board.h,
              }}
            >
              <img
                src={rewardBoard}
                alt="Reward board"
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>

            <div
              className="absolute text-center text-white"
              style={{
                left: UI.levelTitle.x,
                top: UI.levelTitle.y,
                width: UI.levelTitle.w,
                height: UI.levelTitle.h,
                fontFamily: "Fredoka, sans-serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                textShadow: "0 2px 6px rgba(0,0,0,0.35)",
              }}
            >
              {levelLabel}
            </div>

            <div
              className="absolute flex items-center justify-center"
              style={{
                left: UI.rewardImage.x,
                top: UI.rewardImage.y,
                width: UI.rewardImage.w,
                height: UI.rewardImage.h,
                filter:
                  "drop-shadow(0 0 18px rgba(255,214,98,0.45)) drop-shadow(0 6px 18px rgba(0,0,0,0.22))",
              }}
            >
              <motion.img
                key={`${reward.id}-${reward.seedCrop ?? 'default'}`}
                src={reward.image}
                alt={title}
                draggable={false}
                className="max-h-full max-w-full object-contain"
                initial={{ opacity: 0, scale: 0.7, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              />
            </div>

            <div
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
              {title}
            </div>

            <div
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
              {description}
            </div>

            <motion.button
              whileTap={{ scale: 0.97, y: 2 }}
              whileHover={{ scale: 1.02 }}
              onClick={onContinue}
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
                alt={continueLabel}
                draggable={false}
                className="h-full w-full object-fill"
              />

              <span
                className="absolute inset-0 flex items-center justify-center text-center"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#fffdf8",
                  textShadow:
                    "0 2px 8px rgba(0,0,0,0.35), 0 0 10px rgba(255,215,80,0.18)",
                  letterSpacing: "0.02em",
                  paddingInline: "16px",
                  transform: "translateY(-6px)",
                }}
              >
                {continueLabel}
              </span>
            </motion.button>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
