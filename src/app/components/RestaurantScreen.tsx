import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import restaurantImage from "../../assets/screens/RestaurantAccueil.png";
import cookButtonImage from "../../assets/ui/ButtonStart.png";
import notificationTipJarAsset from "../../assets/ui/Notification TipJar.svg";
import tipJarAsset from "../../assets/ui/TipJar.png";
import coinLogoAsset from "../../assets/ui/CoinLogo.svg";
import slot1Asset from "../../assets/ui/Slot_1.png";
import slot2LockedAsset from "../../assets/ui/Slot_2locked.png";
import slot3LockedAsset from "../../assets/ui/Slot_3locked.png";
import { useLanguage } from "../context/LanguageContext";
import GameToolbar from "./GameToolbar";

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface RestaurantScreenProps {
  onEnter?: () => void;
  onExit?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  serviceSlotsVisible?: boolean;
  rewardFeaturesUnlocked?: boolean;
  servicePausedUntil?: number | null;
  tipJarTokensAvailable?: number;
  tipJarCollected?: boolean;
  onCollectTipJar?: () => void;
}

type FlyingToken = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
};

const SERVICE_SLOT_COOLDOWN_LABEL = {
  fr: "ATTENTE",
  en: "WAIT",
} as const;

const SCALE = 1;
const s = (value: number) => value * SCALE;

const UI = {
  serviceSlots: [
    { x: s(50), y: s(140), w: s(120), h: s(70), locked: false, asset: slot1Asset },
    { x: s(150), y: s(140), w: s(120), h: s(70), locked: true, asset: slot2LockedAsset },
    { x: s(250), y: s(140), w: s(120), h: s(70), locked: true, asset: slot3LockedAsset },
  ],
  tipJar: {
    x: s(290),
    y: s(330),
    w: s(150),
    h: s(150),
  },
  notification: {
    x: s(290),
    y: s(320),
    w: s(48),
    h: s(48),
  },
  cookButton: {
    x: s(80),
    y: s(650),
    w: s(270),
    h: s(72),
  },
  toolbarCoinTarget: {
    x: s(274),
    y: s(45),
  },
} as const;

const fredokaStyle = {
  fontFamily: "Fredoka, sans-serif",
};

function formatRemaining(seconds: number, language: "fr" | "en") {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const paddedSecs = secs.toString().padStart(2, "0");

  if (language === "fr") {
    return `${mins}m${paddedSecs}s`;
  }

  return `${mins}m ${paddedSecs}s`;
}

export default function NoodlesRestaurantScreen({
  onEnter,
  onExit,
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
  serviceSlotsVisible = false,
  rewardFeaturesUnlocked = false,
  servicePausedUntil = null,
  tipJarTokensAvailable = 0,
  tipJarCollected = false,
  onCollectTipJar,
}: RestaurantScreenProps) {
  const { language, t } = useLanguage();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const collectTimeoutRef = React.useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [flyingTokens, setFlyingTokens] = useState<FlyingToken[]>([]);
  const [isCollectingTipJar, setIsCollectingTipJar] = useState(false);
  const [viewportSize, setViewportSize] = useState({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
  });

  useEffect(() => {
    const updateViewportSize = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      setViewportSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateViewportSize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateViewportSize())
        : null;

    if (rootRef.current && resizeObserver) {
      resizeObserver.observe(rootRef.current);
    }

    window.addEventListener("resize", updateViewportSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const remainingCooldownSeconds = useMemo(() => {
    if (!servicePausedUntil) return 0;
    return Math.max(0, Math.ceil((servicePausedUntil - now) / 1000));
  }, [servicePausedUntil, now]);

  const isServicePaused = remainingCooldownSeconds > 0;
  const canCollectTipJar =
    rewardFeaturesUnlocked && tipJarTokensAvailable > 0 && !tipJarCollected;
  const showTipJarNotification = canCollectTipJar && !isCollectingTipJar;
  const layoutScale = Math.min(
    viewportSize.width / DESIGN_WIDTH,
    viewportSize.height / DESIGN_HEIGHT
  );
  const scaledWidth = DESIGN_WIDTH * layoutScale;
  const scaledHeight = DESIGN_HEIGHT * layoutScale;
  const scaledOffsetX = (viewportSize.width - scaledWidth) / 2;
  const scaledOffsetY = (viewportSize.height - scaledHeight) / 2;

  const handleCookClick = () => {
    if (isServicePaused) return;
    onEnter?.();
  };

  const handleCollectTipJar = () => {
    if (!canCollectTipJar) return;
    setIsCollectingTipJar(true);

    const nextTokens = Array.from({ length: tipJarTokensAvailable }, (_, index) => ({
      id: Date.now() + index,
      startX: UI.tipJar.x + UI.tipJar.w * 0.42,
      startY: UI.tipJar.y + UI.tipJar.h * 0.18,
      endX: UI.toolbarCoinTarget.x,
      endY: UI.toolbarCoinTarget.y,
      delay: index * 0.08,
    }));

    setFlyingTokens(nextTokens);

    collectTimeoutRef.current = window.setTimeout(() => {
      onCollectTipJar?.();
      setFlyingTokens([]);
    }, 900);
  };

  useEffect(() => {
    if (!canCollectTipJar) {
      setIsCollectingTipJar(false);
    }
  }, [canCollectTipJar]);

  useEffect(() => {
    return () => {
      if (collectTimeoutRef.current) {
        window.clearTimeout(collectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#F4E2C7]"
    >
      <img
        src={restaurantImage}
        alt="Restaurant background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5E6]/20 via-transparent to-[#3E210E]/12" />

      <div
        className="absolute inset-0 z-10 text-[#5F3116]"
        style={{
          ...fredokaStyle,
          transform: `translate(${scaledOffsetX}px, ${scaledOffsetY}px) scale(${layoutScale})`,
          transformOrigin: "top left",
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
        }}
      >
        <GameToolbar
          playerName={playerName}
          coins={coins}
          level={level}
          xp={xp}
          xpToNext={xpToNext}
          onBack={onExit}
          onSettings={() => console.log("open settings")}
        />

        <div className="relative h-full w-full">
          {serviceSlotsVisible
            ? UI.serviceSlots.map((slot, index) => {
                const isLocked = slot.locked;
                const slotNumber = index + 1;

                return (
                  <div
                    key={slotNumber}
                    className="absolute"
                    style={{
                      left: slot.x,
                      top: slot.y,
                      width: slot.w,
                      height: slot.h,
                    }}
                  >
                    <img
                      src={slot.asset}
                      alt={`Service slot ${slotNumber}`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />

                    {!isLocked && isServicePaused ? (
                      <div
                        className="absolute bottom-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[#fff3cf]"
                        style={{
                          fontSize: s(10),
                          fontWeight: 700,
                          textShadow: "0 1px 3px rgba(0,0,0,0.45)",
                        }}
                      >
                        {SERVICE_SLOT_COOLDOWN_LABEL[language]}{" "}
                        {formatRemaining(remainingCooldownSeconds, language)}
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}

          {rewardFeaturesUnlocked ? (
            <>
              <AnimatePresence>
                {showTipJarNotification && (
                  <motion.img
                    key="tipjar-notification"
                    src={notificationTipJarAsset}
                    alt="Tip Jar notification"
                    className="absolute"
                    style={{
                      left: UI.notification.x,
                      top: UI.notification.y,
                      width: UI.notification.w,
                      height: UI.notification.h,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: [1, 1.06, 1],
                      y: [0, -4, 0],
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    draggable={false}
                  />
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                whileTap={canCollectTipJar ? { scale: 0.96 } : {}}
                whileHover={canCollectTipJar ? { scale: 1.03 } : {}}
                onClick={handleCollectTipJar}
                disabled={!canCollectTipJar}
                className="absolute bg-transparent"
                style={{
                  left: UI.tipJar.x,
                  top: UI.tipJar.y,
                  width: UI.tipJar.w,
                  height: UI.tipJar.h,
                }}
              >
                <img
                  src={tipJarAsset}
                  alt="Tip Jar"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                {canCollectTipJar ? (
                  <div
                    className="absolute left-1/2 top-[40px] -translate-x-1/2 rounded-full bg-[#ffde6d] px-[6px] py-[1px] text-[#7a3d0f]"
                    style={{
                      fontSize: s(12),
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
                    }}
                  >
                    +{tipJarTokensAvailable}
                  </div>
                ) : null}
              </motion.button>
            </>
          ) : null}

          {flyingTokens.map((token) => (
            <motion.img
              key={token.id}
              src={coinLogoAsset}
              alt="Flying token"
              className="pointer-events-none absolute"
              style={{
                left: token.startX,
                top: token.startY,
                width: 26,
                height: 26,
              }}
              initial={{ opacity: 0, scale: 0.7, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1, 1, 0.8],
                x: token.endX - token.startX,
                y: token.endY - token.startY,
              }}
              transition={{
                duration: 0.8,
                delay: token.delay,
                ease: "easeInOut",
              }}
              draggable={false}
            />
          ))}

          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            whileHover={!isServicePaused ? { scale: 1.03 } : {}}
            whileTap={!isServicePaused ? { scale: 0.97, y: 2 } : {}}
            onClick={handleCookClick}
            disabled={isServicePaused}
            type="button"
            className="absolute z-30 disabled:opacity-65"
            style={{
              left: UI.cookButton.x,
              top: UI.cookButton.y,
              width: UI.cookButton.w,
              height: UI.cookButton.h,
              filter:
                "drop-shadow(0 6px 0 #8A4A20) drop-shadow(0 10px 18px rgba(0,0,0,0.22))",
            }}
          >
            <img
              src={cookButtonImage}
              alt={t("cookRestaurant")}
              draggable={false}
              className="block h-full w-full object-fill"
            />

            <span
              className="absolute inset-0 flex items-center justify-center select-none"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "clamp(1.4rem, 4.2vw, 2rem)",
                color: "#FFFFFF",
                textShadow:
                  "0 2px 8px rgba(0,0,0,0.5), 0 0 10px rgba(120,55,10,0.15)",
                letterSpacing: "0.04em",
              }}
            >
              {isServicePaused
                ? language === "fr"
                  ? "EN ATTENTE"
                  : "PLEASE WAIT"
                : t("cookRestaurant")}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
