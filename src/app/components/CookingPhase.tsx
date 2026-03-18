import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { INGREDIENTS, getLocalizedText, type LocalizedText } from "../data/recipes";

import chooseFR from "../../assets/ui/ChooseFR.svg";
import chooseEN from "../../assets/ui/ChooseEN.svg";
import orderFR from "../../assets/ui/OrderFR.svg";
import orderEN from "../../assets/ui/OrderEN.svg";

import benchBamboo from "../../assets/ingredients/BenchBamboo.png";
import benchChicken from "../../assets/ingredients/BenchChicken.png";
import benchCorn from "../../assets/ingredients/BenchCorn.png";
import benchEgg from "../../assets/ingredients/BenchEgg.png";
import benchGarlic from "../../assets/ingredients/BenchGarlic.png";
import benchMushroom from "../../assets/ingredients/BenchMushroom.png";
import benchPork from "../../assets/ingredients/BenchPork.png";
import benchShrimp from "../../assets/ingredients/BenchShrimp.png";
import benchTofu from "../../assets/ingredients/BenchTofu.png";

import backgroundImage from "../../assets/screens/ChoiceScreen.png";
import woodButtonImage from "../../assets/ui/ButtonStart.png";
import checkAsset from "../../assets/ui/Check.svg";
import GameToolbar from "./GameToolbar";


type RequiredIngredient =
  | string
  | {
      ingredientId: string;
      quantity: number;
    };

interface CookingRecipeLike {
  id: string;
  name: LocalizedText;
  emoji?: string;
  description?: LocalizedText;
  baseIngredientId?: string;
  requiredIngredients: RequiredIngredient[];
  timer?: number;
  timeLimitSeconds?: number;
}

interface CookingPhaseProps {
  recipe: CookingRecipeLike;
  onComplete: (result: {
    quality: number;
    remainingTimeSeconds: number;
  }) => void;
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
}

type DragState = {
  ingredientId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
};

type BowlDrop = {
  ingredientId: string;
  droppedAt: number;
};

type BowlFlash = "idle" | "ok" | "bad";

const SCALE = 1.04;
const s = (value: number) => value * SCALE;

const UI = {
  //contentTop: s(66),

  contentTop: s(76),

  orderLabel: {
    x: s(18),
    y: s(70),
    w: s(250),
    h: s(120),
  },

  orderSlots: {
    x: s(60),
    y: s(105),
    w: s(240),
    h: s(58),
    itemSize: s(44),
    gap: s(10),
  },

  chooseBubble: {
    x: s(115),
    y: s(180),
    w: s(174),
    h: s(50),
  },

  timerBar: {
    x: s(76),
    y: s(220),
    w: s(252),
    h: s(24),
    fillX: s(16),
    fillY: s(7),
    fillW: s(220),
    fillH: s(10),
    textY: s(11),
  },

  bowlDropZone: {
    x: s(112),
    y: s(240),
    w: s(180),
    h: s(120),
  },

  bowlDropPreview: {
    x: s(132),
    y: s(250),
    w: s(140),
    h: s(38),
    item: s(26),
    gap: s(6),
  },

  benchArea: {
    x: s(62),
    y: s(390),
    w: s(300),
    h: s(220),
  },

  benchSlots: [
    { x: s(0), y: s(0), w: s(64), h: s(64), scale: 1 },
    { x: s(106), y: s(0), w: s(64), h: s(64), scale: 1 },
    { x: s(212), y: s(0), w: s(64), h: s(64), scale: 1 },

    { x: s(0), y: s(76), w: s(64), h: s(64), scale: 1 },
    { x: s(106), y: s(76), w: s(64), h: s(64), scale: 1 },
    { x: s(212), y: s(76), w: s(64), h: s(64), scale: 1 },

    { x: s(0), y: s(152), w: s(64), h: s(64), scale: 1 },
    { x: s(106), y: s(152), w: s(64), h: s(64), scale: 1 },
    { x: s(212), y: s(152), w: s(64), h: s(64), scale: 1 },
  ],

  validateButton: {
    x: s(104),
    y: s(610),
    w: s(196),
    h: s(56),
  },

  feedback: {
    x: s(84),
    y: s(300),
    w: s(236),
    h: s(28),
  },
} as const;

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

const INGREDIENT_STEM: Record<string, string> = {
  egg: "Egg",
  pork: "Pork",
  chicken: "Chicken",
  tofu: "Tofu",
  shrimp: "Shrimp",
  mushroom: "Mushroom",
  corn: "Corn",
  bamboo: "Bamboo",
  garlic: "Garlic",
  "green-onion": "GreenOnion",
  nori: "Nori",
  fishcake: "Fishcake",
};

const FIXED_BENCH_POOL = [
  "bamboo",
  "chicken",
  "corn",
  "egg",
  "garlic",
  "mushroom",
  "pork",
  "shrimp",
  "tofu",
];

function getMiniAsset(ingredientId: string): string | undefined {
  const stem = INGREDIENT_STEM[ingredientId];
  if (!stem) return undefined;
  return findAssetByFilename(`Mini${stem}.png`);
}

function getBenchAsset(ingredientId: string): string | undefined {
  const stem = INGREDIENT_STEM[ingredientId];
  if (!stem) return undefined;
  return findAssetByFilename(`Bench${stem}.png`);
}

function normalizeRequiredIngredients(
  requiredIngredients: RequiredIngredient[]
): { ingredientId: string; quantity: number }[] {
  return requiredIngredients.map((item) =>
    typeof item === "string"
      ? { ingredientId: item, quantity: 1 }
      : {
          ingredientId: item.ingredientId,
          quantity: item.quantity ?? 1,
        }
  );
}

function ingredientMeta(ingredientId: string) {
  return INGREDIENTS.find((item) => item.id === ingredientId);
}

function ingredientDisplayName(ingredientId: string, language: "fr" | "en") {
  const ingredient = ingredientMeta(ingredientId);
  return ingredient ? getLocalizedText(ingredient.name, language) : ingredientId;
}

function ingredientEmoji(ingredientId: string) {
  return ingredientMeta(ingredientId)?.emoji ?? "🍥";
}

function formatSeconds(totalSeconds: number) {
  return `${Math.max(0, Math.ceil(totalSeconds))}s`;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function BenchTile({
  ingredientId,
  onPointerDown,
  completed,
  language,
}: {
  ingredientId: string;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  completed: boolean;
  language: "fr" | "en";
}) {
  const benchAsset = getBenchAsset(ingredientId);

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      className={`relative flex h-full w-full items-center justify-center rounded-[16px] border-[2px] bg-transparent ${
        completed
          ? "border-[#95c65a] shadow-[0_0_0_4px_rgba(149,198,90,0.3)]"
          : "border-transparent shadow-none"
      }`}
      style={{ touchAction: "none" }}
    >
      {benchAsset ? (
        <img
          src={benchAsset}
          alt={ingredientDisplayName(ingredientId, language)}
          className="max-h-[100%] max-w-[95%] object-contain select-none"
          draggable={false}
        />
      ) : (
        <div
          className="text-[34px]"
          style={{ fontFamily: "Fredoka, sans-serif" }}
        >
          {ingredientEmoji(ingredientId)}
        </div>
      )}
    </button>
  );
}

function CommandItem({
  ingredientId,
  current,
  quantity,
  language,
}: {
  ingredientId: string;
  current: number;
  quantity: number;
  language: "fr" | "en";
}) {
  const isComplete = current >= quantity;
  const miniAsset = getMiniAsset(ingredientId);

  return (
    <div className="flex flex-col items-center justify-start">
      <div className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-[12px] bg-[#f2d9c4] shadow-inner">
        {miniAsset ? (
          <img
            src={miniAsset}
            alt={ingredientDisplayName(ingredientId, language)}
            className="max-h-[80%] max-w-[80%] object-contain select-none"
            draggable={false}
          />
        ) : (
          <div
            className="text-[24px]"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            {ingredientEmoji(ingredientId)}
          </div>
        )}
      </div>

      <div
        className="mt-[2px] text-[18px] leading-none text-[#6f2f15]"
        style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
      >
        {current}/{quantity}
      </div>

      <div className="mt-[2px] flex h-[18px] items-center justify-center">
        {isComplete && checkAsset ? (
          <img
            src={checkAsset}
            alt="done"
            className="h-[18px] w-[18px] object-contain"
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  );
}

export function CookingPhase({
  recipe,
  onComplete,
  onBack,
  playerName = "Bento-chan",
  coins = 500,
  level = 1,
  xp = 4,
  xpToNext = 9,
}: CookingPhaseProps) {
  const { language } = useLanguage();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const bowlRef = useRef<HTMLDivElement | null>(null);

  const normalizedRequirements = useMemo(
    () => normalizeRequiredIngredients(recipe.requiredIngredients ?? []),
    [recipe.requiredIngredients]
  );

  // On n'affiche pas dans la bulle ce qui est déjà dans le bol de base
  const commandRequirements = useMemo(() => {
    return normalizedRequirements.filter((item) => {
      if (item.ingredientId === recipe.baseIngredientId) return false;
      if (item.ingredientId.startsWith("broth")) return false;
      return true;
    });
  }, [normalizedRequirements, recipe.baseIngredientId]);

  const initialCounts = useMemo(() => {
    return Object.fromEntries(
      commandRequirements.map((item) => [item.ingredientId, 0])
    ) as Record<string, number>;
  }, [commandRequirements]);

  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [bowlDrops, setBowlDrops] = useState<BowlDrop[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [bowlFlash, setBowlFlash] = useState<BowlFlash>("idle");

  const timeLimitSeconds =
    (recipe as any).timeLimitSeconds ??
    (recipe as any).timer ??
    76;

  const [timeLeftMs, setTimeLeftMs] = useState(timeLimitSeconds * 1000);

  useEffect(() => {
    setCounts(initialCounts);
    setBowlDrops([]);
    setDrag(null);
    setFeedback("");
    setBowlFlash("idle");
    setTimeLeftMs(timeLimitSeconds * 1000);
  }, [recipe.id, initialCounts, timeLimitSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = Math.max(0, prev - 100);
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeftMs <= 0) {
      onComplete({
        quality: 0,
        remainingTimeSeconds: 0,
      });
    }
  }, [timeLeftMs, onComplete]);

  const remainingRatio = Math.max(0, timeLeftMs / (timeLimitSeconds * 1000));

  const timerColor =
    remainingRatio > 0.66
      ? "#39C56D"
      : remainingRatio > 0.33
      ? "#F3C44D"
      : "#F24D42";

  const benchIngredientIds = useMemo(() => {
    const requiredIds = commandRequirements.map((item) => item.ingredientId);
    return shuffleArray(
      Array.from(new Set([...requiredIds, ...FIXED_BENCH_POOL]))
    ).slice(0, 9);
  }, [commandRequirements, recipe.id]);

  const isRecipeComplete = commandRequirements.every(
    (item) => (counts[item.ingredientId] ?? 0) >= item.quantity
  );

  const orderBubbleAsset = language === "fr" ? orderFR : orderEN;
  const chooseBubbleAsset = language === "fr" ? chooseFR : chooseEN;

  const startDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    ingredientId: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rootRect = rootRef.current?.getBoundingClientRect();
    if (!rootRect) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    setDrag({
      ingredientId,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
    });
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const rootRect = rootRef.current?.getBoundingClientRect();
    if (!rootRect) return;

    setDrag((prev) =>
      prev
        ? {
            ...prev,
            x: e.clientX - rootRect.left - prev.offsetX,
            y: e.clientY - rootRect.top - prev.offsetY,
          }
        : null
    );
  };

  const showFeedback = (text: string, flash: BowlFlash) => {
    setFeedback(text);
    setBowlFlash(flash);
    window.clearTimeout((showFeedback as any)._timer);
    (showFeedback as any)._timer = window.setTimeout(() => {
      setFeedback("");
      setBowlFlash("idle");
    }, 900);
  };

  const handleIngredientDrop = (ingredientId: string) => {
    const requirement = commandRequirements.find(
      (item) => item.ingredientId === ingredientId
    );

    if (!requirement) {
      showFeedback(
        language === "fr"
          ? `${ingredientDisplayName(ingredientId, language)} n'est pas requis`
          : `${ingredientDisplayName(ingredientId, language)} is not required`,
        "bad"
      );
      return;
    }

    const currentCount = counts[ingredientId] ?? 0;

    if (currentCount >= requirement.quantity) {
      showFeedback(
        language === "fr"
          ? `${ingredientDisplayName(ingredientId, language)} déjà complété`
          : `${ingredientDisplayName(ingredientId, language)} already completed`,
        "bad"
      );
      return;
    }

    setCounts((prev) => ({
      ...prev,
      [ingredientId]: (prev[ingredientId] ?? 0) + 1,
    }));

    setBowlDrops((prev) => [
      ...prev,
      { ingredientId, droppedAt: Date.now() },
    ]);

    showFeedback(
      language === "fr"
        ? `${ingredientDisplayName(ingredientId, language)} ajouté`
        : `${ingredientDisplayName(ingredientId, language)} added`,
      "ok"
    );
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.pointerId !== e.pointerId) return;

    const bowlRect = bowlRef.current?.getBoundingClientRect();
    const insideBowl =
      bowlRect &&
      e.clientX >= bowlRect.left &&
      e.clientX <= bowlRect.right &&
      e.clientY >= bowlRect.top &&
      e.clientY <= bowlRect.bottom;

    if (insideBowl) {
      handleIngredientDrop(drag.ingredientId);
    }

    setDrag(null);
  };

  const handleValidate = () => {
    if (!isRecipeComplete) return;

    const quality = Math.max(0, Math.round(remainingRatio * 100));
    onComplete({
      quality,
      remainingTimeSeconds: Math.ceil(timeLeftMs / 1000),
    });
  };

  const bowlGlowClass =
    bowlFlash === "ok"
      ? "shadow-[0_0_0_6px_rgba(57,197,109,0.16)]"
      : bowlFlash === "bad"
      ? "shadow-[0_0_0_6px_rgba(242,77,66,0.16)]"
      : "";

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#F4E2C7]"
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <img
        src={backgroundImage}
        alt="Restaurant background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5E6]/20 via-transparent to-[#3E210E]/12" />

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
        {/* Command bubble */}
        <img
          src={orderBubbleAsset}
          alt={language === "fr" ? "Commande" : "Order"}
          className="absolute"
          style={{
            left: UI.orderLabel.x,
            top: UI.orderLabel.y,
            width: UI.orderLabel.w,
            height: UI.orderLabel.h,
          }}
          draggable={false}
        />

        <div
          className="absolute flex items-start"
          style={{
            left: UI.orderSlots.x,
            top: UI.orderSlots.y,
            width: UI.orderSlots.w,
            height: UI.orderSlots.h,
            gap: UI.orderSlots.gap,
          }}
        >
          {commandRequirements.map((item) => (
            <div
              key={item.ingredientId}
              style={{ width: UI.orderSlots.itemSize }}
              className="flex justify-center"
            >
              <CommandItem
                ingredientId={item.ingredientId}
                current={counts[item.ingredientId] ?? 0}
                quantity={item.quantity}
                language={language}
              />
            </div>
          ))}
        </div>

        {/* Choose bubble FR/EN */}
        <div
          className="absolute"
          style={{
            left: UI.chooseBubble.x,
            top: UI.chooseBubble.y,
            width: UI.chooseBubble.w,
            height: UI.chooseBubble.h,
          }}
        >
          {chooseBubbleAsset ? (
            <img
              src={chooseBubbleAsset}
              alt={language === "fr" ? "Choisir" : "Choose ingredients"}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div
              className="rounded-full bg-[#fff1df] px-4 py-2 text-center text-[#6a3718] shadow"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {language === "fr"
                ? "PIOCHE LES INGRÉDIENTS !"
                : "PICK THE INGREDIENTS!"}
            </div>
          )}
        </div>

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
              background: timerColor,
              boxShadow: `0 0 10px ${timerColor}55`,
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

        {/* Bowl drop zone */}
        <div
          ref={bowlRef}
          className={`absolute rounded-full ${bowlGlowClass}`}
          style={{
            left: UI.bowlDropZone.x,
            top: UI.bowlDropZone.y,
            width: UI.bowlDropZone.w,
            height: UI.bowlDropZone.h,
          }}
        />

        {/* Tiny dropped previews */}
        <div
          className="absolute flex flex-wrap items-center justify-center"
          style={{
            left: UI.bowlDropPreview.x,
            top: UI.bowlDropPreview.y,
            width: UI.bowlDropPreview.w,
            height: UI.bowlDropPreview.h,
            gap: UI.bowlDropPreview.gap,
          }}
        >
          {bowlDrops.slice(-5).map((item, index) => {
            const miniAsset = getMiniAsset(item.ingredientId);
            return (
              <div
                key={`${item.ingredientId}-${item.droppedAt}-${index}`}
                className="flex items-center justify-center rounded-full bg-[#fff2df]/90"
                style={{
                  width: UI.bowlDropPreview.item,
                  height: UI.bowlDropPreview.item,
                }}
              >
                {miniAsset ? (
                  <img
                    src={miniAsset}
                    alt={ingredientDisplayName(item.ingredientId, language)}
                    className="max-h-[70%] max-w-[70%] object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="text-[14px]">
                    {ingredientEmoji(item.ingredientId)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bench area */}
        <div
          className="absolute"
          style={{
            left: UI.benchArea.x,
            top: UI.benchArea.y,
            width: UI.benchArea.w,
            height: UI.benchArea.h,
          }}
        >
          {benchIngredientIds.map((ingredientId, index) => {
            const slot = UI.benchSlots[index];
            if (!slot) return null;

            const requirement = commandRequirements.find(
              (item) => item.ingredientId === ingredientId
            );

            const isCompleted =
              requirement &&
              (counts[ingredientId] ?? 0) >= requirement.quantity;

            return (
              <div
                key={`${ingredientId}-${index}`}
                className="absolute"
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: slot.w,
                  height: slot.h,
                  transform: `scale(${slot.scale ?? 1})`,
                  transformOrigin: "top left",
                }}
              >
                <BenchTile
                  ingredientId={ingredientId}
                  completed={Boolean(isCompleted)}
                  language={language}
                  onPointerDown={(e) => startDrag(e, ingredientId)}
                />
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback ? (
            <motion.div
              key={feedback}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute rounded-full bg-[#fff1de]/95 px-4 py-1 text-center shadow"
              style={{
                left: UI.feedback.x,
                top: UI.feedback.y,
                width: UI.feedback.w,
                height: UI.feedback.h,
                fontFamily: "Fredoka, sans-serif",
                fontSize: s(11),
                color: bowlFlash === "bad" ? "#be3e2f" : "#5e3a1d",
              }}
            >
              {feedback}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Validate */}
        <motion.button
          whileTap={isRecipeComplete ? { scale: 0.97, y: 2 } : {}}
          whileHover={isRecipeComplete ? { scale: 1.02 } : {}}
          onClick={handleValidate}
          disabled={!isRecipeComplete}
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
          
          <img
              src={woodButtonImage}
              alt={language === "fr" ? "Valider" : "Validate"}
              draggable={false}
              className="h-full w-full object-fill"
            />
          
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
            {language === "fr" ? "VALIDER LA RECETTE" : "VALIDATE RECIPE"}
          </span>
        </motion.button>
      </div>

      {/* Drag ghost */}
      {drag ? (
        <div
          className="pointer-events-none absolute z-[90]"
          style={{
            left: drag.x,
            top: drag.y,
            width: s(88),
            height: s(64),
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-[16px] border-[2px] border-transparent bg-transparent opacity-95">
            {getBenchAsset(drag.ingredientId) ? (
              <img
                src={getBenchAsset(drag.ingredientId)}
                alt={ingredientDisplayName(drag.ingredientId, language)}
                className="max-h-[100%] max-w-[95%] object-contain"
                draggable={false}
              />
            ) : (
              <div
                className="text-[28px]"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {ingredientEmoji(drag.ingredientId)}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
