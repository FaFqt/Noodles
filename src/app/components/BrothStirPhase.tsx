import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import backgroundImage from "../../assets/screens/BouillonScreen.png";
import GameToolbar from "./GameToolbar";

type Direction = "cw" | "ccw";

interface BrothStirPhaseResult {
  quality: number;
  xpPenalty: number;
  remainingTimeSeconds: number;
  stirProgress: number;
}

interface BrothStirPhaseProps {
  startingTimeLeftSeconds: number;
  onComplete: (result: BrothStirPhaseResult) => void;
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
}

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

const buttonStartAsset = findAssetByFilename("ButtonStart.png");

const SCALE = 1;
const s = (value: number) => value * SCALE;

// Ajuste tout ici manuellement
const UI = {
  contentTop: s(66),

  timerBar: {
    x: s(84),
    y: s(150),
    w: s(236),
    h: s(22),
    fillX: s(14),
    fillY: s(6),
    fillW: s(208),
    fillH: s(10),
    textY: s(5),
  },

  hintBubble: {
    x: s(104),
    y: s(180),
    w: s(198),
    h: s(54),
  },

  potZone: {
    x: s(36),
    y: s(250),
    w: s(332),
    h: s(316),
  },

  stirTouchZone: {
    x: s(88),
    y: s(290),
    w: s(240),
    h: s(180),
  },

  guideOverlay: {
    x: s(86),
    y: s(290),
    w: s(232),
    h: s(174),
  },

  feedback: {
    x: s(120),
    y: s(250),
    w: s(164),
    h: s(24),
  },

  statusLine: {
    x: s(84),
    y: s(478),
    w: s(236),
    h: s(20),
  },

  stirProgressBar: {
    x: s(74),
    y: s(506),
    w: s(256),
    h: s(18),
  },

  validateButton: {
    x: s(102),
    y: s(552),
    w: s(200),
    h: s(58),
  },
} as const;

const RHYTHM_OPTIONS = [1100, 1350, 1600, 1850, 2100];
const BAD_MOVE_XP_PENALTY = 1; // Mets 0 si tu veux désactiver le malus

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngleDelta(delta: number) {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function formatSeconds(totalSeconds: number) {
  return `${Math.max(0, Math.ceil(totalSeconds))}s`;
}

function rhythmLabel(language: string, cycleMs: number) {
  if (cycleMs <= 1250) return language === "fr" ? "Rapide" : "Fast";
  if (cycleMs <= 1650) return language === "fr" ? "Moyen" : "Medium";
  return language === "fr" ? "Lent" : "Slow";
}

function directionLabel(language: string, direction: Direction) {
  if (language === "fr") {
    return direction === "cw" ? "Sens horaire" : "Sens anti-horaire";
  }
  return direction === "cw" ? "Clockwise" : "Counter-clockwise";
}

function StirGuide({
  direction,
  cycleMs,
}: {
  direction: Direction;
  cycleMs: number;
}) {
  const guidePaths =
    direction === "cw"
      ? {
          topArc: "M 48 118 A 62 62 0 0 1 112 54",
          bottomArc: "M 192 64 A 62 62 0 0 1 126 128",
        }
      : {
          topArc: "M 112 54 A 62 62 0 0 0 48 118",
          bottomArc: "M 126 128 A 62 62 0 0 0 192 64",
        };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: UI.guideOverlay.x,
        top: UI.guideOverlay.y,
        width: UI.guideOverlay.w,
        height: UI.guideOverlay.h,
      }}
      animate={{
        rotate: direction === "cw" ? 360 : -360,
      }}
      transition={{
        duration: cycleMs / 1000,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{
          duration: cycleMs / 1000,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 240 180" className="h-full w-full">
          <defs>
            <marker
              id={`stir-arrow-outer-${direction}`}
              viewBox="0 0 18 18"
              refX="14"
              refY="9"
              markerWidth="18"
              markerHeight="18"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path
                d="M 2 2 L 15 9 L 2 16 Q 6 9 2 2 z"
                fill="#FF8B18"
                stroke="#FF8B18"
                strokeLinejoin="round"
              />
            </marker>
            <marker
              id={`stir-arrow-inner-${direction}`}
              viewBox="0 0 12 12"
              refX="9.5"
              refY="6"
              markerWidth="12"
              markerHeight="12"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path
                d="M 1.5 1.5 L 10 6 L 1.5 10.5 Q 4.75 6 1.5 1.5 z"
                fill="#FFF4DE"
                stroke="#FFF4DE"
                strokeLinejoin="round"
              />
            </marker>
          </defs>
          <path
            d={guidePaths.topArc}
            fill="none"
            stroke="#FF8B18"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#stir-arrow-outer-${direction})`}
          />
          <path
            d={guidePaths.bottomArc}
            fill="none"
            stroke="#FF8B18"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#stir-arrow-outer-${direction})`}
          />
          <path
            d={guidePaths.topArc}
            fill="none"
            stroke="#FFF4DE"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#stir-arrow-inner-${direction})`}
          />
          <path
            d={guidePaths.bottomArc}
            fill="none"
            stroke="#FFF4DE"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#stir-arrow-inner-${direction})`}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function BrothStirPhase({
  startingTimeLeftSeconds,
  onComplete,
  onBack,
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
}: BrothStirPhaseProps) {
  const { language } = useLanguage();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stirZoneRef = useRef<HTMLDivElement | null>(null);

  const [direction] = useState<Direction>(() =>
    Math.random() > 0.5 ? "cw" : "ccw"
  );
  const [cycleMs, setCycleMs] = useState<number>(() => {
    return RHYTHM_OPTIONS[Math.floor(Math.random() * RHYTHM_OPTIONS.length)];
  });

  const [timeLeftMs, setTimeLeftMs] = useState(startingTimeLeftSeconds * 1000);
  const [quality, setQuality] = useState(100);
  const [xpPenalty, setXpPenalty] = useState(0);
  const [stirProgress, setStirProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isValidationUnlocked, setIsValidationUnlocked] = useState(false);

  const trackingRef = useRef<{
    pointerId: number;
    lastAngle: number;
    lastTime: number;
  } | null>(null);

  const penaltyCooldownRef = useRef(0);
  const feedbackCooldownRef = useRef(0);

  const remainingRatio = Math.max(
    0,
    timeLeftMs / (startingTimeLeftSeconds * 1000)
  );
  const displayedStirProgress = isValidationUnlocked
    ? 100
    : clamp(stirProgress, 0, 100);

  const progressColor =
    remainingRatio > 0.66
      ? "#39C56D"
      : remainingRatio > 0.33
      ? "#F3C44D"
      : "#F24D42";

  const currentDirectionLabel = useMemo(
    () => directionLabel(language, direction),
    [language, direction]
  );

  const currentRhythmLabel = useMemo(
    () => rhythmLabel(language, cycleMs),
    [language, cycleMs]
  );

  useEffect(() => {
    if (stirProgress >= 100) {
      setIsValidationUnlocked(true);
    }
  }, [stirProgress]);

  const showFeedback = useCallback((text: string) => {
    const now = Date.now();
    if (now - feedbackCooldownRef.current < 140) return;

    feedbackCooldownRef.current = now;
    setFeedback(text);

    window.clearTimeout((showFeedback as any)._timer);
    (showFeedback as any)._timer = window.setTimeout(() => {
      setFeedback("");
    }, 550);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => Math.max(0, prev - 100));
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeftMs <= 0 && !isCompleted) {
      setIsCompleted(true);
      onComplete({
        quality: Math.round(clamp(quality, 0, 100)),
        xpPenalty,
        remainingTimeSeconds: 0,
        stirProgress: Math.round(stirProgress),
      });
    }
  }, [timeLeftMs, isCompleted, onComplete, quality, xpPenalty, stirProgress]);

  // Le rythme change pendant la phase
  useEffect(() => {
    let timeoutId = 0;

    const pickNextRhythm = (previous: number) => {
      const candidates = RHYTHM_OPTIONS.filter((value) => value !== previous);
      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        setCycleMs((prev) => pickNextRhythm(prev));
        schedule();
      }, 3200 + Math.floor(Math.random() * 1800));
    };

    schedule();

    return () => window.clearTimeout(timeoutId);
  }, []);

  const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = stirZoneRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const evaluateMove = useCallback(
    (delta: number, dtSec: number) => {
      if (Math.abs(delta) < 0.035 || dtSec <= 0) return;

      const signedVelocity = delta / dtSec;
      const absVelocity = Math.abs(signedVelocity);
      const targetVelocity = (Math.PI * 2) / (cycleMs / 1000);

      const expectedSign = direction === "cw" ? 1 : -1;
      const directionOk = signedVelocity * expectedSign > 0;
      const ratio = absVelocity / targetVelocity;
      const tempoOk = ratio >= 0.55 && ratio <= 1.45;

      if (directionOk && tempoOk) {
        const progressGain = clamp(Math.abs(delta) * 18, 0.8, 6);
        setStirProgress((prev) => clamp(prev + progressGain, 0, 100));
        setQuality((prev) => clamp(prev + 0.2, 0, 100));
        showFeedback(language === "fr" ? "Bien joué !" : "Good!");
      } else {
        const now = Date.now();
        if (now - penaltyCooldownRef.current > 180) {
          penaltyCooldownRef.current = now;
          setQuality((prev) => clamp(prev - 1.8, 0, 100));
          setStirProgress((prev) => clamp(prev - 0.8, 0, 100));
          setXpPenalty((prev) => prev + BAD_MOVE_XP_PENALTY);
        }

        if (!directionOk) {
          showFeedback(
            language === "fr" ? "Mauvais sens" : "Wrong direction"
          );
        } else {
          showFeedback(
            ratio < 0.55
              ? language === "fr"
                ? "Trop lent"
                : "Too slow"
              : language === "fr"
              ? "Trop rapide"
              : "Too fast"
          );
        }
      }
    },
    [cycleMs, direction, language, showFeedback]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isValidationUnlocked || isCompleted) return;

    const angle = getAngleFromPointer(e.clientX, e.clientY);
    trackingRef.current = {
      pointerId: e.pointerId,
      lastAngle: angle,
      lastTime: performance.now(),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isValidationUnlocked || isCompleted) return;

    const tracking = trackingRef.current;
    if (!tracking || tracking.pointerId !== e.pointerId) return;

    const currentAngle = getAngleFromPointer(e.clientX, e.clientY);
    const now = performance.now();

    const delta = normalizeAngleDelta(currentAngle - tracking.lastAngle);
    const dtSec = Math.max(16, now - tracking.lastTime) / 1000;

    evaluateMove(delta, dtSec);

    trackingRef.current = {
      pointerId: e.pointerId,
      lastAngle: currentAngle,
      lastTime: now,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const tracking = trackingRef.current;
    if (!tracking || tracking.pointerId !== e.pointerId) return;
    trackingRef.current = null;
  };

  const handleValidate = () => {
    if (!isValidationUnlocked || isCompleted) return;

    setIsCompleted(true);
    onComplete({
      quality: Math.round(clamp(quality, 0, 100)),
      xpPenalty,
      remainingTimeSeconds: Math.ceil(timeLeftMs / 1000),
      stirProgress: 100,
    });
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#f6dfbf]"
    >
      
    <img
        src={backgroundImage}
        alt="Broth stir background"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        />

      <GameToolbar
        playerName={playerName}
        coins={coins}
        level={level}
        xp={xp}
        xpToNext={xpToNext}
        onBack={onBack}
        onSettings={() => console.log("open settings")}
      />

      <div
        className="relative z-10 h-full w-full"
        style={{ paddingTop: UI.contentTop }}
      >
        {/* Time progress */}
        <div
          className="absolute"
          style={{
            left: UI.timerBar.x,
            top: UI.timerBar.y,
            width: UI.timerBar.w,
            height: UI.timerBar.h,
          }}
        >
          <div
            className="absolute rounded-full transition-all"
            style={{
              left: UI.timerBar.fillX,
              top: UI.timerBar.fillY,
              width: UI.timerBar.fillW * remainingRatio,
              height: UI.timerBar.fillH,
              background: progressColor,
              boxShadow: `0 0 8px ${progressColor}66`,
            }}
          />

          <div
            className="absolute left-1/2 -translate-x-1/2 text-center leading-none text-white"
            style={{
              top: UI.timerBar.textY,
              fontFamily: "Fredoka, sans-serif",
              fontSize: s(11),
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {formatSeconds(timeLeftMs / 1000)}
          </div>
        </div>

        {/* Hint bubble */}
        <div
          className="absolute rounded-[18px] bg-[#fff1df] px-4 py-2 text-center shadow-[0_4px_0_rgba(203,168,131,0.45)]"
          style={{
            left: UI.hintBubble.x,
            top: UI.hintBubble.y,
            width: UI.hintBubble.w,
            height: UI.hintBubble.h,
          }}
        >
          <div
            className="text-[14px] leading-none text-[#5c2f15]"
            style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
          >
            {language === "fr" ? "REMUER LE BOUILLON !" : "STIR THE BROTH!"}
          </div>
          <div
            className="mt-[4px] text-[10px] leading-none text-[#5c2f15]"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            {language === "fr" ? "Suivre le rythme" : "Follow the rhythm"}
          </div>
        </div>

        {/* Feedback */}
        {feedback ? (
          <div
            className="absolute rounded-full bg-[#fff7ea]/95 px-3 py-[3px] text-center shadow"
            style={{
              left: UI.feedback.x,
              top: UI.feedback.y,
              width: UI.feedback.w,
              height: UI.feedback.h,
              fontFamily: "Fredoka, sans-serif",
              fontSize: s(10),
              color: "#6a3718",
            }}
          >
            {feedback}
          </div>
        ) : null}

        {isValidationUnlocked && !isCompleted ? (
          <div
            className="absolute rounded-full bg-[#fff7ea]/95 px-3 py-[3px] text-center shadow"
            style={{
              left: UI.feedback.x,
              top: UI.feedback.y + s(28),
              width: UI.feedback.w,
              height: UI.feedback.h,
              fontFamily: "Fredoka, sans-serif",
              fontSize: s(10),
              color: "#2f7a43",
            }}
          >
            {language === "fr"
              ? "Bouillon pret a valider"
              : "Broth ready to validate"}
          </div>
        ) : null}

        {/* Guide overlay */}
        <StirGuide direction={direction} cycleMs={cycleMs} />

        {/* Touch zone */}
        <div
          ref={stirZoneRef}
          className="absolute rounded-full"
          style={{
            left: UI.stirTouchZone.x,
            top: UI.stirTouchZone.y,
            width: UI.stirTouchZone.w,
            height: UI.stirTouchZone.h,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Status line */}
        <div
          className="absolute flex items-center justify-between text-[#fff3e0]"
          style={{
            left: UI.statusLine.x,
            top: UI.statusLine.y,
            width: UI.statusLine.w,
            height: UI.statusLine.h,
            fontFamily: "Fredoka, sans-serif",
            fontSize: s(10),
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          <span>{currentDirectionLabel}</span>
          <span>{currentRhythmLabel}</span>
          <span>
            {language === "fr" ? "Malus XP" : "XP Penalty"}: {xpPenalty}
          </span>
        </div>

        {/* Stir progress */}
        <div
          className="absolute overflow-hidden rounded-full border border-[#5b2b14] bg-[#4a1f10]/65"
          style={{
            left: UI.stirProgressBar.x,
            top: UI.stirProgressBar.y,
            width: UI.stirProgressBar.w,
            height: UI.stirProgressBar.h,
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF9A1A] to-[#FFD24A]"
            style={{ width: `${displayedStirProgress}%` }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-[10px] text-white"
            style={{
              fontFamily: "Fredoka, sans-serif",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {language === "fr" ? "Remuage" : "Stirring"} {Math.round(displayedStirProgress)}%
          </div>
        </div>

        <motion.button
          whileTap={isValidationUnlocked ? { scale: 0.97, y: 2 } : {}}
          whileHover={isValidationUnlocked ? { scale: 1.02 } : {}}
          onClick={handleValidate}
          disabled={!isValidationUnlocked || isCompleted}
          type="button"
          className="absolute disabled:opacity-55"
          style={{
            left: UI.validateButton.x,
            top: UI.validateButton.y,
            width: UI.validateButton.w,
            height: UI.validateButton.h,
            filter:
              "drop-shadow(0 6px 0 #8A4A20) drop-shadow(0 10px 18px rgba(0,0,0,0.22))",
          }}
        >
          {buttonStartAsset ? (
            <img
              src={buttonStartAsset}
              alt={language === "fr" ? "Valider" : "Validate"}
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
              fontSize: s(14),
              color: "#FFFFFF",
              textShadow:
                "0 2px 8px rgba(0,0,0,0.5), 0 0 10px rgba(120,55,10,0.15)",
              letterSpacing: "0.02em",
            }}
          >
            {language === "fr" ? "VALIDER" : "VALIDATE"}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
