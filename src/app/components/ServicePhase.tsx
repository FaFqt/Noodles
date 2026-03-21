import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import backgroundImage from "../../assets/screens/ServiceScreen.png";
import buttonStartAsset from "../../assets/ui/SuperButton.svg";
import GameToolbar from "./GameToolbar";
const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface ServicePhaseProps {
  startingTimeLeftSeconds: number;
  onComplete: (result: {
    quality: number;
    serviceProgress: number;
    remainingTimeSeconds: number;
  }) => void;
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

const SCALE = 1;
const s = (value: number) => value * SCALE;

const UI = {
  contentTop: s(64),

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
    x: s(102),
    y: s(182),
    w: s(200),
    h: s(54),
  },

  guideZone: {
    x: s(28),
    y: s(280),
    w: s(348),
    h: s(110),
  },

  bowlZone: {
    x: s(58),
    y: s(250),
    w: s(288),
    h: s(190),
  },

  bowlTargetZone: {
    x: s(150),
    y: s(450),
    w: s(108),
    h: s(44),
  },

  progressText: {
    x: s(140),
    y: s(462),
    w: s(124),
    h: s(20),
  },

  validateButton: {
    x: s(105),
    y: s(660),
    w: s(200),
    h: s(58),
  },

  traceStrokeWidth: s(16),
  traceDashStrokeWidth: s(5),
} as const;

type Point = { x: number; y: number };
type ToppingParticle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
  color: string;
  rotate: number;
};

type SettledSesame = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  color: string;
  duration: number;
};

const TOPPING_COLORS = ["#F7E7A8", "#F0D27A", "#D8B25A", "#FFF1C9"];
const SWIPE_TOLERANCE = 44;
const SOFT_TOLERANCE = 60;
const MAX_SAMPLE_STEP = 14;
const SERVICE_VALIDATE_THRESHOLD = 90;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatSeconds(totalSeconds: number) {
  return `${Math.max(0, Math.ceil(totalSeconds))}s`;
}

function sampleQuadraticBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  steps: number
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    points.push({ x, y });
  }
  return points;
}

function buildGuidePoints(width: number, height: number) {
  const p0 = { x: width * 0.06, y: height * 0.70 };
  const p1 = { x: width * 0.25, y: height * 0.95 };
  const p2 = { x: width * 0.46, y: height * 0.52 };

  const p3 = { x: width * 0.68, y: height * 0.18 };
  const p4 = { x: width * 0.94, y: height * 0.56 };

  const first = sampleQuadraticBezier(p0, p1, p2, 28);
  const second = sampleQuadraticBezier(p2, p3, p4, 28);

  return [...first, ...second.slice(1)];
}

function toSvgPath(points: Point[]) {
  if (!points.length) return "";
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    )
    .join(" ");
}

export default function ServicePhase({
  startingTimeLeftSeconds,
  onComplete,
  onBack,
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
}: ServicePhaseProps) {
  const { language } = useLanguage();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
  const lastPointerPointRef = useRef<Point | null>(null);
  const visitedIndicesRef = useRef<number[]>([]);
  const particleIdRef = useRef(0);
  const particleTimeoutsRef = useRef<number[]>([]);

  const [serviceProgress, setServiceProgress] = useState(0);
  const [quality, setQuality] = useState(100);
  const [feedback, setFeedback] = useState("");
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(startingTimeLeftSeconds * 1000);
  const [isCompleted, setIsCompleted] = useState(false);
  const [visitedIndices, setVisitedIndices] = useState<number[]>([]);
  const [sparkPoint, setSparkPoint] = useState<Point | null>(null);
  const [toppingParticles, setToppingParticles] = useState<ToppingParticle[]>(
    []
  );
  const [settledSesame, setSettledSesame] = useState<SettledSesame[]>([]);
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

  const guidePoints = useMemo(
    () => buildGuidePoints(UI.guideZone.w, UI.guideZone.h),
    []
  );

  const guidePath = useMemo(() => toSvgPath(guidePoints), [guidePoints]);

  const completed = serviceProgress >= SERVICE_VALIDATE_THRESHOLD;
  const remainingRatio = Math.max(
    0,
    timeLeftMs / (startingTimeLeftSeconds * 1000)
  );
  const layoutScale = Math.min(
    viewportSize.width / DESIGN_WIDTH,
    viewportSize.height / DESIGN_HEIGHT
  );
  const scaledWidth = DESIGN_WIDTH * layoutScale;
  const scaledHeight = DESIGN_HEIGHT * layoutScale;
  const scaledOffsetX = (viewportSize.width - scaledWidth) / 2;
  const scaledOffsetY = (viewportSize.height - scaledHeight) / 2;
  const progressColor =
    remainingRatio > 0.66
      ? "#39C56D"
      : remainingRatio > 0.33
      ? "#F3C44D"
      : "#F24D42";

  const titleText =
    language === "fr" ? "REPANDRE LE TOPPING !" : "SPREAD THE TOPPING!";

  const subtitleText =
    language === "fr" ? "Suis le geste" : "Follow the gesture";

  const buttonText =
    language === "fr" ? "VALIDER ET SERVIR" : "VALIDATE & SERVE";

  const progressLabel =
    language === "fr"
      ? `Service ${Math.round(serviceProgress)}%`
      : `Serving ${Math.round(serviceProgress)}%`;

  const showFeedback = (text: string) => {
    setFeedback(text);
    window.clearTimeout((showFeedback as any)._timer);
    (showFeedback as any)._timer = window.setTimeout(() => {
      setFeedback("");
    }, 500);
  };

  const spawnToppingParticles = (point: Point) => {
    const burstSize = 7 + Math.floor(Math.random() * 4);
    const targetX =
      UI.bowlTargetZone.x + Math.random() * UI.bowlTargetZone.w;
    const targetY =
      UI.bowlTargetZone.y + Math.random() * UI.bowlTargetZone.h;

    const particles = Array.from({ length: burstSize }, () => {
      const id = particleIdRef.current++;
      const width = 6 + Math.random() * 5;
      const height = 2.5 + Math.random() * 1.8;
      return {
        id,
        x: UI.guideZone.x + point.x + (Math.random() * 22 - 11),
        y: UI.guideZone.y + point.y - 4 + (Math.random() * 10 - 5),
        dx: targetX + (Math.random() * 24 - 12),
        dy: targetY + (Math.random() * 14 - 7),
        width,
        height,
        duration: 0.45 + Math.random() * 0.25,
        delay: Math.random() * 0.08,
        color: TOPPING_COLORS[Math.floor(Math.random() * TOPPING_COLORS.length)],
        rotate: Math.random() * 240 - 120,
      };
    });

    const landedSeeds = Array.from({ length: 3 }, () => {
      const id = particleIdRef.current++;
      return {
        id,
        x: targetX + (Math.random() * 34 - 17),
        y: targetY + (Math.random() * 14 - 7),
        width: 7 + Math.random() * 4,
        height: 3 + Math.random() * 1.5,
        rotate: Math.random() * 180 - 90,
        color: TOPPING_COLORS[Math.floor(Math.random() * TOPPING_COLORS.length)],
        duration: 0.9 + Math.random() * 0.5,
      };
    });

    setToppingParticles((prev) => [...prev, ...particles]);
    setSettledSesame((prev) => [...prev, ...landedSeeds]);

    particles.forEach((particle) => {
      const timeoutId = window.setTimeout(() => {
        setToppingParticles((prev) =>
          prev.filter((item) => item.id !== particle.id)
        );
      }, (particle.duration + particle.delay) * 1000 + 140);

      particleTimeoutsRef.current.push(timeoutId);
    });

    landedSeeds.forEach((seed) => {
      const timeoutId = window.setTimeout(() => {
        setSettledSesame((prev) => prev.filter((item) => item.id !== seed.id));
      }, seed.duration * 1000 + 180);

      particleTimeoutsRef.current.push(timeoutId);
    });
  };

  const updateFromLocalPoint = (localPoint: Point) => {
    let closestIndex = -1;
    let closestDistance = Infinity;

    guidePoints.forEach((point, index) => {
      const d = distance(point, localPoint);
      if (d < closestDistance) {
        closestDistance = d;
        closestIndex = index;
      }
    });

    // Tolérance autour du tracé, avec une zone douce pour éviter un ressenti trop punitif.
    if (closestDistance > SOFT_TOLERANCE) {
      setQuality((prev) => clamp(prev - 0.18, 0, 100));
      return;
    }

    if (closestDistance > SWIPE_TOLERANCE) {
      setQuality((prev) => clamp(prev - 0.08, 0, 100));
      return;
    }

    setSparkPoint(guidePoints[closestIndex]);
    if (visitedIndicesRef.current.includes(closestIndex)) return;

    const previous = visitedIndicesRef.current;
    const next = [...previous, closestIndex].sort((a, b) => a - b);
    visitedIndicesRef.current = next;
    setVisitedIndices(next);
    spawnToppingParticles(guidePoints[closestIndex]);

    // pénalité légère si on saute trop loin
    const last = previous.length ? previous[previous.length - 1] : -1;
    if (last !== -1 && closestIndex > last + 14) {
      setQuality((q) => clamp(q - 0.8, 0, 100));
      showFeedback(language === "fr" ? "Trop brusque" : "Too abrupt");
    }

    const ratio =
      next.length > 0 ? next.length / Math.max(1, guidePoints.length) : 0;
    setServiceProgress(clamp(ratio * 100, 0, 100));
  };

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = guideRef.current?.getBoundingClientRect();
    if (!rect) return;

    const localPoint = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    const previousPoint = lastPointerPointRef.current;
    lastPointerPointRef.current = localPoint;

    if (!previousPoint) {
      updateFromLocalPoint(localPoint);
      return;
    }

    const segmentDistance = distance(previousPoint, localPoint);
    const steps = Math.max(1, Math.ceil(segmentDistance / MAX_SAMPLE_STEP));

    for (let index = 1; index <= steps; index += 1) {
      const t = index / steps;
      updateFromLocalPoint({
        x: previousPoint.x + (localPoint.x - previousPoint.x) * t,
        y: previousPoint.y + (localPoint.y - previousPoint.y) * t,
      });
    }
  };

  useEffect(() => {
    if (!sparkPoint) return;
    const timer = window.setTimeout(() => setSparkPoint(null), 120);
    return () => window.clearTimeout(timer);
  }, [sparkPoint]);

  useEffect(() => {
    if (isCompleted) return;

    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => Math.max(0, prev - 100));
    }, 100);

    return () => window.clearInterval(interval);
  }, [isCompleted]);

  useEffect(() => {
    if (timeLeftMs > 0 || isCompleted) return;

    setIsCompleted(true);
    onComplete({
      quality: Math.round(clamp(quality, 0, 100)),
      serviceProgress: Math.round(clamp(serviceProgress, 0, 100)),
      remainingTimeSeconds: 0,
    });
  }, [isCompleted, onComplete, quality, serviceProgress, timeLeftMs]);

  useEffect(() => {
    return () => {
      particleTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDown(true);
    lastPointerPointRef.current = null;
    updateFromPointer(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
    lastPointerPointRef.current = null;
  };

  const handleValidate = () => {
    if (!completed || isCompleted) return;
    setIsCompleted(true);
    onComplete({
      quality: Math.round(clamp(quality, 0, 100)),
      serviceProgress: Math.round(clamp(serviceProgress, 0, 100)),
      remainingTimeSeconds: Math.ceil(timeLeftMs / 1000),
    });
  };

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#f6dfbf]"
    >
      <img
        src={backgroundImage}
        alt="Service background"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      <div
        className="absolute inset-0 z-10"
        style={{
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
          onBack={onBack}
          onSettings={() => console.log("open settings")}
        />

        <div
          className="relative h-full w-full"
          style={{ paddingTop: UI.contentTop }}
        >
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

          {toppingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.width,
                height: particle.height,
                background: particle.color,
                boxShadow: `0 0 6px ${particle.color}66, 0 1px 2px rgba(120,85,20,0.25)`,
                transformOrigin: "center",
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0.7,
                rotate: 0,
              }}
              animate={{
                x: particle.dx - particle.x,
                y: particle.dy - particle.y,
                opacity: [0, 1, 0.95, 0],
                scale: [0.7, 1, 0.95, 0.85],
                rotate: particle.rotate,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeIn",
              }}
            />
          ))}

          {settledSesame.map((seed) => (
            <motion.div
              key={seed.id}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: seed.x,
                top: seed.y,
                width: seed.width,
                height: seed.height,
                background: seed.color,
                boxShadow: `0 0 4px ${seed.color}55`,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 0.95, 0], scale: [0.7, 1, 1, 0.92], rotate: seed.rotate }}
              transition={{ duration: seed.duration, ease: "easeOut" }}
            />
          ))}

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
              {titleText}
            </div>
            <div
              className="mt-[4px] text-[10px] leading-none text-[#5c2f15]"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {subtitleText}
            </div>
          </div>

          {/* Swipe guide */}
          <div
            ref={guideRef}
            className="absolute"
            style={{
              left: UI.guideZone.x - s(14),
              top: UI.guideZone.y - s(12),
              width: UI.guideZone.w + s(28),
              height: UI.guideZone.h + s(24),
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <svg
              viewBox={`0 0 ${UI.guideZone.w} ${UI.guideZone.h}`}
              className="h-full w-full"
            >
              {/* Tracé orange */}
              <path
                d={guidePath}
                fill="none"
                stroke="#FF8B18"
                strokeWidth={UI.traceStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pointillés verts */}
              <path
                d={guidePath}
                fill="none"
                stroke="#67D45A"
                strokeWidth={UI.traceDashStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12 10"
              />

              {/* Flèche de fin */}
              {guidePoints.length > 1 && (() => {
                const last = guidePoints[guidePoints.length - 1];
                const prev = guidePoints[guidePoints.length - 2];
                const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                const size = 18;

                const p1 = `${last.x},${last.y}`;
                const p2 = `${last.x - size * Math.cos(angle - Math.PI / 6)},${
                  last.y - size * Math.sin(angle - Math.PI / 6)
                }`;
                const p3 = `${last.x - size * Math.cos(angle + Math.PI / 6)},${
                  last.y - size * Math.sin(angle + Math.PI / 6)
                }`;

                return <polygon points={`${p1} ${p2} ${p3}`} fill="#67D45A" />;
              })()}
            </svg>

            {/* Progress highlight */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                viewBox={`0 0 ${UI.guideZone.w} ${UI.guideZone.h}`}
                className="h-full w-full"
              >
                <path
                  d={guidePath}
                  fill="none"
                  stroke="#FFF4DE"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${Math.max(
                    10,
                    (serviceProgress / 100) * 500
                  )} 1000`}
                />
              </svg>
            </motion.div>

            {sparkPoint ? (
              <motion.div
                className="absolute rounded-full bg-white/80 pointer-events-none"
                style={{
                  left: sparkPoint.x - 8,
                  top: sparkPoint.y - 8,
                  width: 16,
                  height: 16,
                }}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            ) : null}
          </div>

          {/* Progress / quality text */}
          <div
            className="absolute text-center text-[#fff6eb]"
            style={{
              left: UI.progressText.x,
              top: UI.progressText.y,
              width: UI.progressText.w,
              height: UI.progressText.h,
              fontFamily: "Fredoka, sans-serif",
              fontSize: s(11),
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {progressLabel} · {language === "fr" ? "Qualité" : "Quality"}{" "}
            {Math.round(quality)}%
          </div>

          {feedback ? (
            <div
              className="absolute left-1/2 top-[474px] -translate-x-1/2 rounded-full bg-[#fff7ea]/95 px-3 py-[3px] text-center shadow"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: s(10),
                color: "#6a3718",
              }}
            >
              {feedback}
            </div>
          ) : null}

          {/* Validate / serve button */}
          <motion.button
            whileTap={completed ? { scale: 0.97, y: 2 } : {}}
            whileHover={completed ? { scale: 1.02 } : {}}
            onClick={handleValidate}
            disabled={!completed}
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
                alt={buttonText}
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
                transform: "translateY(-5px)",
              }}
            >
              {buttonText}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
