import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock3, Star } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getLocalizedText, type LocalizedText } from "../data/recipes";

import ribbonImageFR from "../../assets/ui/RubanFR.svg";
import ribbonImageEN from "../../assets/ui/RubanEN.svg";
import frameImage from "../../assets/ui/Cadre.png";
import backgroundImage from "../../assets/backgrounds/mont-fuji.png";
import woodButtonImage from "../../assets/ui/ButtonStart.png";
import GameToolbar from "./GameToolbar";
import ResponsiveGameCanvas from "./ResponsiveGameCanvas";

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

export interface RecipeSelectionItem {
  id: string;
  name: LocalizedText;
  image: string;
  timer: number;
  reward: number;
  canCook?: boolean;
  missingIngredients?: {
    ingredientId: string;
    image: string;
    missingQuantity: number;
  }[];
}

type DisplayRecipeSelectionItem = RecipeSelectionItem & {
  displayName: string;
};

interface RecipeSelectionScreenProps {
  recipes: RecipeSelectionItem[];
  onBack?: () => void;
  onCook?: (recipeId: string) => void;
  progressCurrent?: number;
  progressMax?: number;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
}

type RecipeFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  scale?: number;
};

const UI = {
  contentTop: 76,

  ribbon: {
    x: 30,
    y: 70,
    w: 368,
    h: 86,
  },

  cardsArea: {
    x: 30,
    y: 150,
    w: 368,
    h: 410,
  },

  recipeFrames: [
    { x: 0, y: 0, w: 176, h: 198, scale: 1 },
    { x: 192, y: 0, w: 176, h: 198, scale: 1 },
    { x: 0, y: 214, w: 176, h: 198, scale: 1 },
    { x: 192, y: 214, w: 176, h: 198, scale: 1 },
  ] as RecipeFrame[],

  footer: {
    x: 30,
    y: 580,
    w: 368,
    h: 56,
  },

  cookButton: {
    x: 80,
    y: 650,
    w: 270,
    h: 72,
  },
} as const;

function formatTimer(seconds: number) {
  return `${seconds}s`;
}

function RecipeCard({
  recipe,
  selected,
  onSelect,
  frame,
  language,
}: {
  recipe: DisplayRecipeSelectionItem;
  selected: boolean;
  onSelect: (id: string) => void;
  frame: RecipeFrame;
  language: "fr" | "en";
}) {
  const scale = frame.scale ?? 1;
  const isCookable = recipe.canCook ?? true;
  const missingIngredients = recipe.missingIngredients ?? [];

  return (
    <motion.button
      whileTap={{ scale: 0.87 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onSelect(recipe.id)}
      type="button"
      className="absolute"
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <img
        src={frameImage}
        alt="Cadre recette"
        className="h-full w-full object-fill select-none"
        draggable={false}
      />

      <div className="absolute inset-0 flex flex-col px-[7%] pt-[7%] pb-[7%]">
        <div
          className="min-h-[30px] text-center uppercase leading-tight text-black"
          style={{
            fontFamily: "Fredoka, sans-serif",
            fontSize: "0.92rem",
            opacity: isCookable ? 1 : 0.76,
          }}
        >
          {recipe.displayName}
        </div>

        <div
          className="mt-[1%] flex justify-center"
          style={{
            filter: isCookable ? "none" : "blur(3px) saturate(0.72)",
            opacity: isCookable ? 1 : 0.45,
          }}
        >
          <img
            src={recipe.image}
            alt={recipe.displayName}
            className="w-[66%] max-w-[118px] object-contain select-none"
            draggable={false}
          />
        </div>

        <div className="mt-[10%] flex items-end justify-center gap-2">
          <div className="min-h-[44px] flex-1">
            {isCookable ? (
              <div
                className="flex flex-col gap-1"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.9rem",
                }}
              >
                <div className="flex items-center gap-2 text-[#F7777D]">
                  <Clock3 size={15} />
                  <span>{formatTimer(recipe.timer)}</span>
                </div>

                <div className="flex items-center gap-2 text-[#F1A642]">
                  <Star size={15} fill="currentColor" />
                  <span>{recipe.reward} XP</span>
                </div>
              </div>
            ) : (
              <div
                className="flex min-h-[44px] flex-wrap items-center justify-center gap-x-2 gap-y-1"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.72rem",
                }}
              >
                {missingIngredients.map((ingredient) => (
                  <div
                    key={`${recipe.id}-${ingredient.ingredientId}`}
                    className="flex items-center gap-1 rounded-full bg-[rgba(67,33,17,0.18)] px-1.5 py-1 text-[#5F3116]"
                  >
                    <img
                      src={ingredient.image}
                      alt={ingredient.ingredientId}
                      className="h-5 w-5 object-contain select-none"
                      draggable={false}
                    />
                    <span>x{ingredient.missingQuantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isCookable ? (
            <div
              className={`mb-1 flex h-9 w-9 items-center justify-center rounded-full no-border ${
                selected
                  ? "border-[#5F8F13] bg-[#8CCB20]"
                  : "border-[#4D4138] bg-[#F8F3ED]"
              }`}
            >
              {selected ? (
                <span
                  className="text-xl text-white"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  ✓
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {!isCookable ? (
        <div
          className="pointer-events-none absolute inset-x-[10%] top-[36%] rounded-full bg-[rgba(60,26,12,0.82)] px-2 py-1 text-center text-[#FFF0D8]"
          style={{
            fontFamily: "Fredoka, sans-serif",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
          }}
        >
          {language === "fr" ? "STOCK INSUFFISANT" : "LOW STOCK"}
        </div>
      ) : null}
    </motion.button>
  );
}

export default function RecipeSelectionScreen({
  recipes,
  onBack,
  onCook,
  progressCurrent = 0,
  progressMax = 5,
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
}: RecipeSelectionScreenProps) {
  const { language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [recipes]);

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedId) ?? null,
    [recipes, selectedId]
  );
  const canCookSelectedRecipe = Boolean(selectedRecipe && (selectedRecipe.canCook ?? true));

  const ribbonImage = language === "fr" ? ribbonImageFR : ribbonImageEN;
  const inProgressText = language === "fr" ? "En cours" : "In Progress";
  const cookText = language === "fr" ? "CUISINER" : "COOK";

  const displayRecipes = useMemo<DisplayRecipeSelectionItem[]>(
    () =>
      recipes.map((recipe) => ({
        ...recipe,
        displayName: getLocalizedText(recipe.name, language),
      })),
    [recipes, language]
  );

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#4E220F]"
    >
      {({ canvasStyle }) => (
        <>
          <img
            src={backgroundImage}
            alt="Background restaurant"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-[rgba(80,30,10,0.28)] backdrop-blur-[3px]" />

          <div className="absolute inset-0 z-10" style={canvasStyle}>
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
                  left: UI.ribbon.x,
                  top: UI.ribbon.y,
                  width: UI.ribbon.w,
                  height: UI.ribbon.h,
                }}
              >
                <img
                  src={ribbonImage}
                  alt="Ruban"
                  className="h-full w-full object-contain select-none"
                  draggable={false}
                />
              </div>

              <div
                className="absolute"
                style={{
                  left: UI.cardsArea.x,
                  top: UI.cardsArea.y,
                  width: UI.cardsArea.w,
                  height: UI.cardsArea.h,
                }}
              >
                {displayRecipes.slice(0, 4).map((recipe, index) => {
                  const frame = UI.recipeFrames[index];
                  if (!frame) return null;

                  return (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      selected={selectedId === recipe.id}
                      onSelect={setSelectedId}
                      frame={frame}
                      language={language}
                    />
                  );
                })}
              </div>

              <div
                className="absolute rounded-[22px] border-[3px] border-[#7E431D] bg-[rgba(109,52,21,0.9)] px-4 py-2.5 shadow-[0_6px_0_#5D2C12]"
                style={{
                  left: UI.footer.x,
                  top: UI.footer.y,
                  width: UI.footer.w,
                  height: UI.footer.h,
                }}
              >
                <div className="flex h-full items-center justify-between gap-3 text-white">
                  <div
                    style={{
                      fontFamily: "Fredoka, sans-serif",
                      fontSize: "1.1rem",
                    }}
                  >
                    {inProgressText} : {progressCurrent}/{progressMax}
                  </div>

                  <div
                    className="flex items-center gap-2 text-[#FFD05C]"
                    style={{
                      fontFamily: "Fredoka, sans-serif",
                      fontSize: "1.1rem",
                    }}
                  >
                    <Star size={20} fill="currentColor" />
                    <span>+{selectedRecipe?.reward ?? 0}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={selectedId && canCookSelectedRecipe ? { scale: 0.97, y: 2 } : {}}
                whileHover={selectedId && canCookSelectedRecipe ? { scale: 1.02 } : {}}
                onClick={() => selectedId && onCook?.(selectedId)}
                disabled={!selectedId || !canCookSelectedRecipe}
                type="button"
                className="absolute disabled:opacity-60"
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
                  src={woodButtonImage}
                  alt={cookText}
                  draggable={false}
                  className="h-full w-full object-fill"
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
                  {!selectedId
                    ? cookText
                    : canCookSelectedRecipe
                      ? cookText
                      : language === "fr"
                        ? "STOCK INSUFFISANT"
                        : "LOW STOCK"}
                </span>
              </motion.button>
            </div>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
