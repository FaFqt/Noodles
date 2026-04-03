import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import restaurantImage from "../../assets/screens/RestaurantAccueil.png";
import cookButtonImage from "../../assets/ui/ButtonStart.png";
import notificationTipJarAsset from "../../assets/ui/Notification TipJar.svg";
import tipJarAsset from "../../assets/ui/TipJar.png";
import coinLogoAsset from "../../assets/ui/CoinLogo.svg";
import inventoryButtonAsset from "../../assets/ui/InventoryButton.svg";
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
  inventoryUnlocked?: boolean;
  canStartCooking?: boolean;
  showInventoryNotification?: boolean;
  inventoryStatusMessage?: string | null;
  servicePausedUntil?: number | null;
  tipJarTokensAvailable?: number;
  tipJarCollected?: boolean;
  showProgressReminderCard?: boolean;
  remainingServicesToCompleteDay?: number;
  firstRewardLevel?: number;
  onDismissProgressReminder?: () => void;
  showStarterTutorial?: boolean;
  onDismissStarterTutorial?: () => void;
  onCollectTipJar?: () => void;
  onOpenInventory?: () => void;
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
  inventoryButton: {
    x: s(14),
    y: s(460),
    w: s(124),
    h: s(45),
  },
  inventoryNotification: {
    x: s(10),
    y: s(425),
    w: s(38),
    h: s(38),
  },
  inventoryStatus: {
    x: s(40),
    y: s(548),
    w: s(340),
    h: s(40),
  },
  tutorialCard: {
    x: s(24),
    y: s(420),
    w: s(382),
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
  inventoryUnlocked = false,
  canStartCooking = true,
  showInventoryNotification = false,
  inventoryStatusMessage = null,
  servicePausedUntil = null,
  tipJarTokensAvailable = 0,
  tipJarCollected = false,
  showProgressReminderCard = false,
  remainingServicesToCompleteDay = 1,
  firstRewardLevel = 2,
  onDismissProgressReminder,
  showStarterTutorial = false,
  onDismissStarterTutorial,
  onCollectTipJar,
  onOpenInventory,
}: RestaurantScreenProps) {
  const { language, t } = useLanguage();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const collectTimeoutRef = React.useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [flyingTokens, setFlyingTokens] = useState<FlyingToken[]>([]);
  const [isCollectingTipJar, setIsCollectingTipJar] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
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
  const isTutorialVisible = showStarterTutorial && tutorialStep !== null;
  const isProgressReminderVisible = showProgressReminderCard && !isTutorialVisible;
  const showCookButtonHighlight = isTutorialVisible && tutorialStep === 1;
  const reminderServiceLabel =
    language === "fr"
      ? remainingServicesToCompleteDay > 1
        ? "recettes"
        : "recette"
      : remainingServicesToCompleteDay > 1
        ? "recipes"
        : "recipe";

  const handleCookClick = () => {
    if (tutorialStep === 1 && !isServicePaused && canStartCooking) {
      handleDismissTutorial();
      onEnter?.();
      return;
    }

    if (isTutorialVisible || isServicePaused || !canStartCooking) return;
    onEnter?.();
  };

  const handleProgressReminderPrimaryAction = () => {
    onDismissProgressReminder?.();

    if (!isServicePaused && canStartCooking) {
      onEnter?.();
    }
  };

  const handleDismissTutorial = () => {
    setTutorialStep(null);
    onDismissStarterTutorial?.();
  };

  const handleTutorialPrimaryAction = () => {
    if (tutorialStep === 0) {
      setTutorialStep(1);
      return;
    }

    handleDismissTutorial();
    if (!isServicePaused && canStartCooking) {
      onEnter?.();
    }
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
      collectTimeoutRef.current = null;
    }, 900);
  };

  useEffect(() => {
    if (!canCollectTipJar) {
      setIsCollectingTipJar(false);
      setFlyingTokens([]);
    }
  }, [canCollectTipJar]);

  useEffect(() => {
    if (showStarterTutorial) {
      setTutorialStep(0);
      return;
    }

    setTutorialStep(null);
  }, [showStarterTutorial]);

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
          {showCookButtonHighlight ? (
            <motion.div
              className="pointer-events-none absolute rounded-[30px] border-2 border-[#ffe08f]"
              style={{
                left: UI.cookButton.x - 8,
                top: UI.cookButton.y - 8,
                width: UI.cookButton.w + 16,
                height: UI.cookButton.h + 16,
                zIndex: 45,
                boxShadow: "0 0 0 6px rgba(255,214,116,0.14)",
              }}
              animate={{
                scale: [1, 1.02, 1],
                boxShadow: [
                  "0 0 0 6px rgba(255,214,116,0.14)",
                  "0 0 0 12px rgba(255,214,116,0.1)",
                  "0 0 0 6px rgba(255,214,116,0.14)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}

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
              {showTipJarNotification ? (
                <motion.img
                  key={`tipjar-notification-${tipJarTokensAvailable}`}
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
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  draggable={false}
                />
              ) : null}

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

          {inventoryUnlocked ? (
            <>
              {showInventoryNotification ? (
                <motion.img
                  src={notificationTipJarAsset}
                  alt={language === "fr" ? "Alerte inventaire" : "Inventory alert"}
                  className="absolute"
                  style={{
                    left: UI.inventoryNotification.x,
                    top: UI.inventoryNotification.y,
                    width: UI.inventoryNotification.w,
                    height: UI.inventoryNotification.h,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: [1, 1.05, 1],
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  draggable={false}
                />
              ) : null}

              <motion.button
                type="button"
                whileTap={{ scale: 0.97, y: 2 }}
                onClick={onOpenInventory}
                className="absolute"
                style={{
                  left: UI.inventoryButton.x,
                  top: UI.inventoryButton.y,
                  width: UI.inventoryButton.w,
                  height: UI.inventoryButton.h,
                }}
              >
                <img
                  src={inventoryButtonAsset}
                  alt={language === "fr" ? "Inventaire" : "Inventory"}
                  className="h-full w-full object-fill"
                  draggable={false}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-center text-[#FFFDF8]"
                  style={{
                    fontFamily: "Fredoka, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textShadow: "0 2px 8px rgba(0,0,0,0.34)",
                    transform: "translate(8px, -2px)",
                  }}
                >
                  {language === "fr" ? "INVENTAIRE" : "INVENTORY"}
                </span>
              </motion.button>
            </>
          ) : null}

          {inventoryStatusMessage ? (
            <div
              className="absolute rounded-[18px] bg-[rgba(62,28,11,0.8)] px-4 py-2 text-center text-[#FFF0D8]"
              style={{
                left: UI.inventoryStatus.x,
                top: UI.inventoryStatus.y,
                width: UI.inventoryStatus.w,
                minHeight: UI.inventoryStatus.h,
                fontFamily: "Fredoka, sans-serif",
                fontSize: s(10),
                fontWeight: 700,
                lineHeight: 1.25,
                boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
              }}
            >
              {inventoryStatusMessage}
            </div>
          ) : null}

          {isProgressReminderVisible ? (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute z-40 rounded-[28px] border border-[#ffd896]/45 bg-[rgba(77,34,15,0.92)] px-5 py-5 text-[#fff4df] shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm"
              style={{
                ...fredokaStyle,
                left: UI.tutorialCard.x,
                top: UI.tutorialCard.y,
                width: UI.tutorialCard.w,
              }}
            >
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#ffd990]">
                {language === "fr" ? "Progression" : "Progress"}
              </div>

              <div className="mt-3 text-[1.2rem] font-bold leading-tight text-[#fffaf1]">
                {language === "fr"
                  ? "Tes premieres recompenses sont proches"
                  : "Your first rewards are close"}
              </div>

              <div className="mt-3 text-[0.9rem] leading-[1.45] text-[#ffe8c9]">
                {language === "fr"
                  ? `Encore ${remainingServicesToCompleteDay} ${reminderServiceLabel} pour finir ta premiere journee. Continue a cuisiner et vise le niveau ${firstRewardLevel} pour obtenir tes premieres recompenses.`
                  : `${remainingServicesToCompleteDay} more ${reminderServiceLabel} to finish your first day. Keep cooking and aim for level ${firstRewardLevel} to earn your first rewards.`}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onDismissProgressReminder}
                  className="rounded-full border border-[#ffd896]/35 px-4 py-2 text-[0.82rem] font-semibold text-[#ffe1b2]"
                >
                  {language === "fr" ? "Plus tard" : "Later"}
                </button>

                <button
                  type="button"
                  onClick={handleProgressReminderPrimaryAction}
                  className="rounded-full bg-[linear-gradient(180deg,#ffd56c_0%,#ee9638_100%)] px-5 py-2 text-[0.86rem] font-bold text-[#5c2a10] shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
                >
                  {language === "fr" ? "Retour a la cuisine" : "Back to cooking"}
                </button>
              </div>
            </motion.div>
          ) : null}

          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            whileHover={!isServicePaused ? { scale: 1.03 } : {}}
            whileTap={!isServicePaused ? { scale: 0.97, y: 2 } : {}}
            onClick={handleCookClick}
            disabled={isServicePaused || !canStartCooking}
            type="button"
            className={`absolute ${isTutorialVisible ? "z-50" : "z-30"} disabled:opacity-65`}
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
                : !canStartCooking
                  ? language === "fr"
                    ? "STOCK INSUFFISANT"
                    : "LOW STOCK"
                : t("cookRestaurant")}
            </span>
          </motion.button>

          {isTutorialVisible ? (
            <>
              <div className="absolute inset-0 z-40 bg-[rgba(23,10,4,0.38)]" />

              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute z-50 rounded-[28px] border border-[#ffd896]/45 bg-[rgba(77,34,15,0.92)] px-5 py-5 text-[#fff4df] shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm"
                style={{
                  ...fredokaStyle,
                  left: UI.tutorialCard.x,
                  top: UI.tutorialCard.y,
                  width: UI.tutorialCard.w,
                }}
              >
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#ffd990]">
                  {language === "fr"
                    ? `Tutoriel ${tutorialStep === 0 ? "1/2" : "2/2"}`
                    : `Tutorial ${tutorialStep === 0 ? "1/2" : "2/2"}`}
                </div>

                <div className="mt-3 text-[1.2rem] font-bold leading-tight text-[#fffaf1]">
                  {tutorialStep === 0
                    ? language === "fr"
                      ? "Bienvenue dans ton premier service"
                      : "Welcome to your first service"
                    : language === "fr"
                      ? "Le bouton principal lance la cuisine"
                      : "The main button starts cooking"}
                </div>

                <div className="mt-3 text-[0.9rem] leading-[1.45] text-[#ffe8c9]">
                  {tutorialStep === 0
                    ? language === "fr"
                      ? "Le restaurant est ton point de départ. C’est ici que tu gagnes tes premiers Noods, ton XP, et que tu fais tourner la journée."
                      : "The restaurant is your main starting point. This is where you earn your first Noods, XP, and progress through the day."
                    : language === "fr"
                      ? "Appuie sur CUISINER pour choisir un ramen et démarrer ta première commande. Les autres outils du restaurant se débloquent un peu plus tard."
                      : "Press COOK to pick a ramen and start your first order. The other restaurant tools unlock a little later."}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleDismissTutorial}
                    className="rounded-full border border-[#ffd896]/35 px-4 py-2 text-[0.82rem] font-semibold text-[#ffe1b2]"
                  >
                    {language === "fr" ? "Passer" : "Skip"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTutorialPrimaryAction}
                    className="rounded-full bg-[linear-gradient(180deg,#ffd56c_0%,#ee9638_100%)] px-5 py-2 text-[0.86rem] font-bold text-[#5c2a10] shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
                  >
                    {tutorialStep === 0
                      ? language === "fr"
                        ? "Suivant"
                        : "Next"
                      : language === "fr"
                        ? "Choisir un ramen"
                        : "Choose a ramen"}
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
