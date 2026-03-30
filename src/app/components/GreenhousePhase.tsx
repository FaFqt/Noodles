import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';
import GameToolbar from './GameToolbar';
import { useLanguage } from '../context/LanguageContext';
import {
  EMPTY_GREENHOUSE_SEED_STOCK,
  GREENHOUSE_GROWTH_DURATION_MS,
  GREENHOUSE_INGREDIENTS,
  type GreenhouseIngredientId,
  type IngredientRarity,
  type PlayerMarketInventoryId,
} from '../data/market';
import greenhouseBackground from '../../assets/screens/GreenhouseScreen.png';
import plantButtonAsset from '../../assets/ui/PlantButton.svg';
import harvestButtonAsset from '../../assets/ui/HarvestButton.svg';
import frameAsset from '../../assets/ui/Cadre.png';
import seedNumAsset from '../../assets/ui/SeedNum.svg';
import rareAsset from '../../assets/ui/Rare.svg';
import epicAsset from '../../assets/ui/Epic.svg';
import legendaryAsset from '../../assets/ui/Legendary.svg';
import soilAsset from '../../assets/greenhouse/soil.png';
import sproutCornAsset from '../../assets/greenhouse/Corn/sproutCorn.png';
import youngPlantCornAsset from '../../assets/greenhouse/Corn/youngPlantCorn.png';
import matureCornAsset from '../../assets/greenhouse/Corn/matureCorn.png';
import harvestCornAsset from '../../assets/greenhouse/Corn/harvestCorn.png';
import sproutBambooAsset from '../../assets/greenhouse/Bamboo/sproutBamboo.png';
import youngPlantBambooAsset from '../../assets/greenhouse/Bamboo/younfPlantBamboo.png';
import matureBambooAsset from '../../assets/greenhouse/Bamboo/matureBamboo.png';
import harvestBambooAsset from '../../assets/greenhouse/Bamboo/harvestBamboo.png';
import sproutMushroomAsset from '../../assets/greenhouse/Mushroom/sproutMushroom.png';
import youngPlantMushroomAsset from '../../assets/greenhouse/Mushroom/youngPlantMushroom.png';
import matureMushroomAsset from '../../assets/greenhouse/Mushroom/matureMushroom.png';
import harvestMushroomAsset from '../../assets/greenhouse/Mushroom/harvestMushroom.png';
import sproutGarlicAsset from '../../assets/greenhouse/Garlic/sproutGarlic.png';
import youngPlantGarlicAsset from '../../assets/greenhouse/Garlic/youngPlantGarlic.png';
import matureGarlicAsset from '../../assets/greenhouse/Garlic/matureGarlic.png';
import harvestGarlicAsset from '../../assets/greenhouse/Garlic/harvestGarlic.png';
import sproutDragonPepperAsset from '../../assets/greenhouse/DragonPepper/sproutDragonPepper.png';
import youngPlantDragonPepperAsset from '../../assets/greenhouse/DragonPepper/youngPlantDragonPepper.png';
import matureDragonPepperAsset from '../../assets/greenhouse/DragonPepper/matureDragonPepper.png';
import harvestDragonPepperAsset from '../../assets/greenhouse/DragonPepper/harvestDragonPepper.png';
import sproutFireChiliAsset from '../../assets/greenhouse/FireChili/sproutFireChili.png';
import youngPlantFireChiliAsset from '../../assets/greenhouse/FireChili/youngPlantFireChili.png';
import matureFireChiliAsset from '../../assets/greenhouse/FireChili/matureFireChili.png';
import harvestFireChiliAsset from '../../assets/greenhouse/FireChili/harvestFireChili.png';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;
const DEFAULT_STORAGE_KEY = 'greenhouse-ui-state-v2:local';
const SCALE = 1;
const s = (value: number) => value * SCALE;

export type GreenhouseCrop = GreenhouseIngredientId;

type PlotStage = 'empty' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

interface GreenhousePlotState {
  id: string;
  crop: GreenhouseCrop | null;
  plantedAt: number | null;
}

type SeedInventory = Record<GreenhouseCrop, number>;

interface GreenhousePhaseProps {
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  storageKey?: string;
  initialSeedInventory?: SeedInventory;
  onSeedInventoryChange?: (inventory: SeedInventory) => void;
  onHarvestIngredient?: (ingredientId: PlayerMarketInventoryId, quantity: number) => void;
}

const INITIAL_PLOTS: GreenhousePlotState[] = Array.from({ length: 4 }, (_, index) => ({
  id: `plot-${index + 1}`,
  crop: null,
  plantedAt: null,
}));

const DEFAULT_SEEDS: SeedInventory = EMPTY_GREENHOUSE_SEED_STOCK;

const UI = {
  titleCard: { x: s(44), y: s(92), w: s(342), h: s(88) },
  plotCard: {
    w: s(160),
    h: s(130),
    soilX: s(18),
    soilY: s(5),
    soilW: s(124),
    soilH: s(84),
    imageW: s(110),
    imageH: s(110),
    labelX: s(16),
    labelY: s(50),
    timerX: s(16),
    timerY: s(100),
    progressX: s(16),
    progressY: s(115),
    progressW: s(128),
    progressH: s(6),
    actionX: s(16),
    actionY: s(90),
    actionW: s(128),
    actionH: s(30),
  },
  plotLayout: [
    { id: 'plot-1', x: s(50), y: s(310) },
    { id: 'plot-2', x: s(210), y: s(310) },
    { id: 'plot-3', x: s(35), y: s(435) },
    { id: 'plot-4', x: s(225), y: s(435) },
  ],
  inventoryPanel: { x: s(20), y: s(580), w: s(390), h: s(200) },
  inventoryCards: {
    railX: s(10),
    railY: s(90),
    railW: s(370),
    railH: s(136),
    gap: s(2),
    cardW: s(100),
    cardH: s(100),
    badgeH: s(22),
    imageY: s(14),
    imageW: s(52),
    imageH: s(52),
    countW: s(56),
    countH: s(22),
    labelY: s(66),
  },
  statusToast: { x: s(215), y: s(150) },
} as const;

const PLOT_LAYOUT = [
  { id: 'plot-1', x: UI.plotLayout[0].x, y: UI.plotLayout[0].y },
  { id: 'plot-2', x: UI.plotLayout[1].x, y: UI.plotLayout[1].y },
  { id: 'plot-3', x: UI.plotLayout[2].x, y: UI.plotLayout[2].y },
  { id: 'plot-4', x: UI.plotLayout[3].x, y: UI.plotLayout[3].y },
] as const;

const PLANT_PHASE_ASSETS: Partial<
  Record<
    GreenhouseCrop,
    {
      phase2: string;
      phase3: string;
      phase4: string;
      phase5: string;
    }
  >
> = {
  corn: {
    phase2: sproutCornAsset,
    phase3: youngPlantCornAsset,
    phase4: matureCornAsset,
    phase5: harvestCornAsset,
  },
  bamboo: {
    phase2: sproutBambooAsset,
    phase3: youngPlantBambooAsset,
    phase4: matureBambooAsset,
    phase5: harvestBambooAsset,
  },
  mushroom: {
    phase2: sproutMushroomAsset,
    phase3: youngPlantMushroomAsset,
    phase4: matureMushroomAsset,
    phase5: harvestMushroomAsset,
  },
  garlic: {
    phase2: sproutGarlicAsset,
    phase3: youngPlantGarlicAsset,
    phase4: matureGarlicAsset,
    phase5: harvestGarlicAsset,
  },
  dragonpepper: {
    phase2: sproutDragonPepperAsset,
    phase3: youngPlantDragonPepperAsset,
    phase4: matureDragonPepperAsset,
    phase5: harvestDragonPepperAsset,
  },
  firechili: {
    phase2: sproutFireChiliAsset,
    phase3: youngPlantFireChiliAsset,
    phase4: matureFireChiliAsset,
    phase5: harvestFireChiliAsset,
  },
};

function readStoredGreenhouseState(
  storageKey: string,
  initialSeedInventory: SeedInventory
) {
  if (typeof window === 'undefined') {
    return {
      plots: INITIAL_PLOTS,
      seeds: initialSeedInventory,
    };
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return {
      plots: INITIAL_PLOTS,
      seeds: initialSeedInventory,
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      plots?: GreenhousePlotState[];
      seeds?: Partial<SeedInventory>;
    };

    const plots = INITIAL_PLOTS.map((plot) => {
      const storedPlot = parsed.plots?.find((item) => item.id === plot.id);
      return {
        id: plot.id,
        crop: GREENHOUSE_INGREDIENTS.some((ingredient) => ingredient.id === storedPlot?.crop)
          ? (storedPlot?.crop as GreenhouseCrop)
          : null,
        plantedAt: Number.isFinite(storedPlot?.plantedAt)
          ? Number(storedPlot?.plantedAt)
          : null,
      };
    });

    return {
      plots,
      seeds: GREENHOUSE_INGREDIENTS.reduce((accumulator, ingredient) => {
        const rawCount = parsed.seeds?.[ingredient.id];
        return {
          ...accumulator,
          [ingredient.id]: Number.isFinite(rawCount)
            ? Math.max(0, Number(rawCount))
            : initialSeedInventory[ingredient.id],
        };
      }, {} as SeedInventory),
    };
  } catch {
    return {
      plots: INITIAL_PLOTS,
      seeds: initialSeedInventory,
    };
  }
}

function formatRemainingTime(ms: number, language: 'fr' | 'en') {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return language === 'fr' ? `${seconds}s restantes` : `${seconds}s left`;
  }

  return language === 'fr'
    ? `${minutes}m ${seconds.toString().padStart(2, '0')}s restantes`
    : `${minutes}m ${seconds.toString().padStart(2, '0')}s left`;
}

function getCropDisplayName(crop: GreenhouseCrop, language: 'fr' | 'en') {
  const cropData = GREENHOUSE_INGREDIENTS.find((ingredient) => ingredient.id === crop);
  if (!cropData) return crop;
  return language === 'fr' ? cropData.name.fr : cropData.name.en;
}

function getRarityBadge(rarity: IngredientRarity) {
  switch (rarity) {
    case 'rare':
      return rareAsset;
    case 'epic':
      return epicAsset;
    case 'legendary':
      return legendaryAsset;
    default:
      return null;
  }
}

function getPlotVisual(plot: GreenhousePlotState, now: number) {
  if (!plot.crop || !plot.plantedAt) {
    return {
      stage: 'empty' as PlotStage,
      image: null,
      progress: 0,
      remainingMs: 0,
      isReady: false,
    };
  }

  const totalDuration = GREENHOUSE_GROWTH_DURATION_MS[plot.crop];
  const elapsed = Math.max(0, now - plot.plantedAt);
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));
  const remainingMs = Math.max(0, totalDuration - elapsed);
  const phaseAssets = PLANT_PHASE_ASSETS[plot.crop];
  const fallbackImage =
    GREENHOUSE_INGREDIENTS.find((ingredient) => ingredient.id === plot.crop)?.image ?? null;

  if (progress >= 1) {
    return {
      stage: 'phase5' as PlotStage,
      image: phaseAssets?.phase5 ?? fallbackImage,
      progress,
      remainingMs,
      isReady: true,
    };
  }

  if (progress >= 0.75) {
    return {
      stage: 'phase4' as PlotStage,
      image: phaseAssets?.phase4 ?? fallbackImage,
      progress,
      remainingMs,
      isReady: false,
    };
  }

  if (progress >= 0.5) {
    return {
      stage: 'phase3' as PlotStage,
      image: phaseAssets?.phase3 ?? fallbackImage,
      progress,
      remainingMs,
      isReady: false,
    };
  }

  if (progress >= 0.25) {
    return {
      stage: 'phase2' as PlotStage,
      image: phaseAssets?.phase2 ?? fallbackImage,
      progress,
      remainingMs,
      isReady: false,
    };
  }

  return {
    stage: 'phase1' as PlotStage,
    image: soilAsset,
    progress,
    remainingMs,
    isReady: false,
  };
}

export default function GreenhousePhase({
  onBack,
  playerName = 'Bento-chan',
  coins = 10,
  level = 1,
  xp = 0,
  xpToNext = 100,
  storageKey = DEFAULT_STORAGE_KEY,
  initialSeedInventory = DEFAULT_SEEDS,
  onSeedInventoryChange,
  onHarvestIngredient,
}: GreenhousePhaseProps) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  const [selectedPlotId, setSelectedPlotId] = useState(INITIAL_PLOTS[0].id);
  const [inventoryPlotId, setInventoryPlotId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [greenhouseState, setGreenhouseState] = useState(() =>
    readStoredGreenhouseState(storageKey, initialSeedInventory)
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        plots: greenhouseState.plots,
        seeds: greenhouseState.seeds,
      })
    );
  }, [greenhouseState, storageKey]);

  useEffect(() => {
    if (!statusMessage) return;

    const timeout = window.setTimeout(() => setStatusMessage(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    setGreenhouseState((prev) => {
      const nextSeeds = GREENHOUSE_INGREDIENTS.reduce((accumulator, ingredient) => {
        accumulator[ingredient.id] = Math.max(
          prev.seeds[ingredient.id],
          initialSeedInventory[ingredient.id]
        );
        return accumulator;
      }, {} as SeedInventory);

      const hasChanged = GREENHOUSE_INGREDIENTS.some(
        (ingredient) => nextSeeds[ingredient.id] !== prev.seeds[ingredient.id]
      );

      return hasChanged
        ? {
            ...prev,
            seeds: nextSeeds,
          }
        : prev;
    });
  }, [initialSeedInventory]);

  useEffect(() => {
    onSeedInventoryChange?.(greenhouseState.seeds);
  }, [greenhouseState.seeds, onSeedInventoryChange]);

  const plotCards = useMemo(
    () =>
      PLOT_LAYOUT.map((layout) => {
        const plot =
          greenhouseState.plots.find((item) => item.id === layout.id) ?? INITIAL_PLOTS[0];
        return {
          ...layout,
          plot,
          visual: getPlotVisual(plot, now),
        };
      }),
    [greenhouseState.plots, now]
  );

  const inventoryPlot =
    greenhouseState.plots.find((plot) => plot.id === inventoryPlotId) ?? null;

  const cropCards = GREENHOUSE_INGREDIENTS.map((ingredient) => ({
    crop: ingredient.id,
    label: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
    rarityLabel:
      ingredient.rarity === 'common'
        ? language === 'fr'
          ? 'Commun'
          : 'Common'
        : ingredient.rarity === 'rare'
          ? 'Rare'
          : ingredient.rarity === 'epic'
            ? 'Epic'
            : language === 'fr'
              ? 'Legendaire'
              : 'Legendary',
    count: greenhouseState.seeds[ingredient.id],
    image: ingredient.image,
    badge: getRarityBadge(ingredient.rarity),
  }));

  const inventoryPlotLabel = inventoryPlotId
    ? `${language === 'fr' ? 'Parcelle' : 'Plot'} ${inventoryPlotId.split('-')[1]}`
    : null;

  const handleOpenInventory = (plotId: string) => {
    const plot = greenhouseState.plots.find((item) => item.id === plotId);
    if (!plot || plot.crop) return;
    setSelectedPlotId(plotId);
    setInventoryPlotId(plotId);
  };

  const handlePlantSeed = (plotId: string, crop: GreenhouseCrop) => {
    const plot = greenhouseState.plots.find((item) => item.id === plotId);
    if (!plot || plot.crop || greenhouseState.seeds[crop] <= 0) return;

    setGreenhouseState((prev) => ({
      seeds: {
        ...prev.seeds,
        [crop]: Math.max(0, prev.seeds[crop] - 1),
      },
      plots: prev.plots.map((plot) =>
        plot.id === plotId
          ? {
              ...plot,
              crop,
              plantedAt: Date.now(),
            }
          : plot
      ),
    }));
    setInventoryPlotId(null);
    const cropLabel = getCropDisplayName(crop, language === 'fr' ? 'fr' : 'en');
    setStatusMessage(
      language === 'fr' ? `${cropLabel} plante` : `${cropLabel} planted`
    );
  };

  const handleHarvest = (plotId: string) => {
    const plot = greenhouseState.plots.find((item) => item.id === plotId);
    const plotVisual = plot ? getPlotVisual(plot, Date.now()) : null;
    if (!plot || !plot.crop || !plotVisual?.isReady) return;

    const harvestedCrop = plot.crop;
    const harvestedIngredient = GREENHOUSE_INGREDIENTS.find(
      (ingredient) => ingredient.id === harvestedCrop
    );
    const harvestedYield = harvestedIngredient?.averageYield
      ? Math.max(1, Math.round(harvestedIngredient.averageYield))
      : 1;
    setGreenhouseState((prev) => ({
      seeds: {
        ...prev.seeds,
        [harvestedCrop]: prev.seeds[harvestedCrop] + 1,
      },
      plots: prev.plots.map((plot) =>
        plot.id === plotId
          ? {
              ...plot,
              crop: null,
              plantedAt: null,
            }
          : plot
      ),
    }));
    if (
      harvestedIngredient &&
      ['corn', 'bamboo', 'mushroom', 'garlic'].includes(harvestedIngredient.id)
    ) {
      onHarvestIngredient?.(
        harvestedIngredient.id as PlayerMarketInventoryId,
        harvestedYield
      );
    }
    const cropLabel = getCropDisplayName(
      harvestedCrop,
      language === 'fr' ? 'fr' : 'en'
    );
    setStatusMessage(
      language === 'fr'
        ? `${cropLabel} recolte, +${harvestedYield} ingredient${harvestedYield > 1 ? 's' : ''} et +1 graine`
        : `${cropLabel} harvested, +${harvestedYield} ingredient${harvestedYield > 1 ? 's' : ''} and +1 seed`
    );
  };

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#102314]"
    >
      {({ canvasStyle }) => (
        <>
          <img
            src={greenhouseBackground}
            alt="Greenhouse background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,29,12,0.14),rgba(13,22,11,0.28))]" />

          <div className="absolute inset-0 z-10" style={canvasStyle}>
            <GameToolbar
              playerName={playerName}
              coins={coins}
              level={level}
              xp={xp}
              xpToNext={xpToNext}
              onBack={onBack}
              onSettings={() => undefined}
            />

            <div
              className="absolute rounded-[24px] border border-[rgba(242,255,232,0.42)] bg-[rgba(26,60,28,0.72)] px-5 py-4 text-center shadow-[0_18px_30px_rgba(10,24,12,0.28)] backdrop-blur-sm"
              style={{
                left: UI.titleCard.x,
                top: UI.titleCard.y,
                width: UI.titleCard.w,
                height: UI.titleCard.h,
              }}
            >
              <div
                className="text-[22px] leading-none text-[#F5FFE8]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
              >
                {language === 'fr' ? 'PHASE DE SERRE' : 'GREENHOUSE PHASE'}
              </div>
              <div
                className="mt-2 text-[12px] leading-[1.25] text-[#DDF7CB]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
              >
                {language === 'fr'
                  ? 'Plante tes graines, surveille la pousse et recolte quand chaque parcelle est prete.'
                  : 'Plant your seeds, watch them grow, and harvest each plot when it is ready.'}
              </div>
            </div>

            {plotCards.map(({ id, x, y, plot, visual }) => {
              const isSelected = selectedPlotId === id;
              const cropName =
                plot.crop ? getCropDisplayName(plot.crop, language === 'fr' ? 'fr' : 'en') : '';

              return (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlotId(id)}
                  className="absolute overflow-hidden rounded-[28px] text-left"
                  style={{
                    left: x,
                    top: y,
                    width: UI.plotCard.w,
                    height: UI.plotCard.h,
                    boxShadow: isSelected
                      ? '0 16px 28px rgba(11,26,11,0.22)'
                      : '0 14px 24px rgba(11,26,11,0.2)',
                  }}
                >
                  <div
                    className="absolute rounded-[22px]"
                    style={{
                      left: UI.plotCard.soilX,
                      top: UI.plotCard.soilY,
                      width: UI.plotCard.soilW,
                      height: UI.plotCard.soilH,
                    }}
                  >
                    {visual.image ? (
                      <img
                        src={visual.image}
                        alt={cropName}
                        className="absolute inset-0 m-auto object-contain"
                        style={{
                          width: UI.plotCard.imageW,
                          height: UI.plotCard.imageH,
                        }}
                        draggable={false}
                      />
                    ) : null}
                  </div>

                  {visual.isReady ? (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute right-4 top-4 rounded-full bg-[#FFD75C] px-3 py-1 text-[10px] text-[#694111]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {language === 'fr' ? 'PRET' : 'READY'}
                    </motion.div>
                  ) : null}

                  {plot.crop && !visual.isReady ? (
                    <>
                      <div
                        className="absolute text-[10px] text-[#DDF7CB]"
                        style={{
                          left: UI.plotCard.timerX,
                          top: UI.plotCard.timerY,
                          width: UI.plotCard.progressW,
                          fontFamily: 'Fredoka, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        {formatRemainingTime(
                          visual.remainingMs,
                          language === 'fr' ? 'fr' : 'en'
                        )}
                      </div>

                      <div
                        className="absolute overflow-hidden rounded-full bg-[rgba(255,255,255,0.14)]"
                        style={{
                          left: UI.plotCard.progressX,
                          top: UI.plotCard.progressY,
                          width: UI.plotCard.progressW,
                          height: UI.plotCard.progressH,
                        }}
                      >
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#E6FF8C,#A8DF58,#4EB768)]"
                          style={{ width: `${visual.progress * 100}%` }}
                        />
                      </div>
                    </>
                  ) : null}

                  {!plot.crop ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenInventory(id);
                      }}
                      className="absolute"
                      style={{
                        left: UI.plotCard.actionX,
                        top: UI.plotCard.actionY,
                        width: UI.plotCard.actionW,
                        height: UI.plotCard.actionH,
                      }}
                    >
                      <img
                        src={plantButtonAsset}
                        alt="Plant"
                        className="h-full w-full object-fill"
                        draggable={false}
                      />
                      <span
                        className="absolute left-0 right-0 flex justify-center text-center leading-none"
                        style={{
                          top: '50%',
                          fontFamily: 'Fredoka, sans-serif',
                          fontSize: s(10),
                          fontWeight: 700,
                          color: '#FFFDF7',
                          textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                          transform: 'translateY(calc(-50% - 4px))',
                        }}
                      >
                        {language === 'fr' ? 'PLANTER' : 'PLANT'}
                      </span>
                    </motion.button>
                  ) : null}

                  {plot.crop && visual.isReady ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPlotId(id);
                        handleHarvest(id);
                      }}
                      className="absolute"
                      style={{
                        left: UI.plotCard.actionX,
                        top: UI.plotCard.actionY,
                        width: UI.plotCard.actionW,
                        height: UI.plotCard.actionH,
                      }}
                    >
                      <img
                        src={harvestButtonAsset}
                        alt="Harvest"
                        className="h-full w-full object-fill"
                        draggable={false}
                      />
                      <span
                        className="absolute left-0 right-0 flex justify-center text-center leading-none"
                        style={{
                          top: '50%',
                          fontFamily: 'Fredoka, sans-serif',
                          fontSize: s(10),
                          fontWeight: 700,
                          color: '#FFFDF7',
                          textShadow: '0 1px 4px rgba(0,0,0,0.45)',
                          transform: 'translateY(calc(-50% - 4px))',
                        }}
                      >
                        {language === 'fr' ? 'RECOLTER' : 'HARVEST'}
                      </span>
                    </motion.button>
                  ) : null}
                </motion.button>
              );
            })}

            <div
              className="absolute rounded-[30px] border border-[rgba(234,255,222,0.28)] bg-[rgba(17,45,21,0.74)] px-4 py-4 shadow-[0_20px_30px_rgba(9,20,10,0.28)] backdrop-blur-sm"
              style={{
                left: UI.inventoryPanel.x,
                top: UI.inventoryPanel.y,
                width: UI.inventoryPanel.w,
                height: UI.inventoryPanel.h,
                opacity: inventoryPlotId ? 1 : 0,
                pointerEvents: inventoryPlotId ? 'auto' : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-[19px] text-[#F2FFE1]"
                    style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                  >
                    {language === 'fr' ? 'Inventaire graines' : 'Seed inventory'}
                  </div>
                  <div
                    className="mt-1 text-[12px] text-[#D1EAB8]"
                    style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
                  >
                    {inventoryPlotLabel
                      ? language === 'fr'
                        ? `Choisis une graine pour ${inventoryPlotLabel}.`
                        : `Choose a seed for ${inventoryPlotLabel}.`
                      : language === 'fr'
                        ? 'Clique sur Plant pour ouvrir les graines.'
                        : 'Click Plant to open the seed inventory.'}
                  </div>
                  <div
                    className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#EEF9D0]"
                    style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                  >
                    {language === 'fr'
                      ? 'Glisse les cadres pour voir les graines'
                      : 'Swipe the frames to browse seeds'}
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setInventoryPlotId(null)}
                  className="rounded-full bg-[rgba(255,255,255,0.08)] px-3 py-1 text-[11px] text-[#F4FFE1]"
                  style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                >
                  {language === 'fr' ? 'FERMER' : 'CLOSE'}
                </motion.button>
              </div>

              <div
                className="absolute overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  left: UI.inventoryCards.railX,
                  top: UI.inventoryCards.railY,
                  width: UI.inventoryCards.railW,
                  height: UI.inventoryCards.railH,
                  touchAction: 'pan-x',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div
                  className="flex snap-x snap-mandatory"
                  style={{
                    gap: UI.inventoryCards.gap,
                    paddingRight: UI.inventoryCards.gap,
                  }}
                >
                {cropCards.map((cropCard) => {
                  const canPlantThisSeed = Boolean(
                    inventoryPlot && greenhouseState.seeds[cropCard.crop] > 0
                  );

                  return (
                    <motion.button
                      key={cropCard.crop}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        inventoryPlotId && handlePlantSeed(inventoryPlotId, cropCard.crop)
                      }
                      disabled={!canPlantThisSeed}
                      className="relative shrink-0 snap-start overflow-hidden"
                      style={{
                        width: UI.inventoryCards.cardW,
                        height: UI.inventoryCards.cardH,
                        opacity: canPlantThisSeed ? 1 : 0.55,
                        filter: canPlantThisSeed ? 'none' : 'grayscale(0.22)',
                      }}
                    >
                      <img
                        src={frameAsset}
                        alt=""
                        className="absolute inset-0 h-full w-full object-fill"
                        draggable={false}
                      />
                      <img
                        src={cropCard.image}
                        alt={cropCard.label}
                        className="absolute left-1/2 -translate-x-1/2 object-contain"
                        style={{
                          top: UI.inventoryCards.imageY,
                          width: UI.inventoryCards.imageW,
                          height: UI.inventoryCards.imageH,
                        }}
                        draggable={false}
                      />
                      {cropCard.badge ? (
                        <img
                          src={cropCard.badge}
                          alt={cropCard.rarityLabel}
                          className="absolute right-[10px] top-[10px] w-auto"
                          style={{ height: UI.inventoryCards.badgeH }}
                          draggable={false}
                        />
                      ) : null}
                      <div
                        className="absolute bottom-[30px] left-0 right-0 text-center text-[12px] text-[#FFF7E8]"
                        style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                      >
                        {cropCard.label}
                      </div>
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: 8,
                          width: UI.inventoryCards.countW,
                          height: UI.inventoryCards.countH,
                        }}
                      >
                        <img
                          src={seedNumAsset}
                          alt="Seed count"
                          className="absolute inset-0 h-full w-full object-contain"
                          draggable={false}
                        />
                        <div
                          className="absolute left-0 right-0 flex justify-center text-center leading-none text-[11px] text-[#FFFCEB]"
                          style={{
                            top: '50%',
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                            transform: 'translateY(calc(-50% - 3px))',
                          }}
                        >
                          x{cropCard.count}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                </div>
              </div>
            </div>

            {statusMessage ? (
              <div
                className="absolute -translate-x-1/2 rounded-full bg-[rgba(19,45,20,0.88)] px-5 py-2 text-[12px] text-[#EEFFD8] shadow-[0_10px_20px_rgba(8,20,9,0.24)]"
                style={{
                  left: UI.statusToast.x,
                  top: UI.statusToast.y,
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                }}
              >
                {statusMessage}
              </div>
            ) : null}
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
