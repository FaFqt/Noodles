import { useMemo } from 'react';
import GameToolbar from './GameToolbar';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';
import { useLanguage } from '../context/LanguageContext';
import {
  GREENHOUSE_INGREDIENTS,
  MARKET_INGREDIENTS,
  type PlayerMarketInventoryId,
} from '../data/market';
import restaurantBackground from '../../assets/screens/RestaurantAccueil.png';
import superButtonAsset from '../../assets/ui/SuperButton.svg';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface IngredientInventoryScreenProps {
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  inventory: Partial<Record<PlayerMarketInventoryId, number>>;
}

const UI = {
  panel: { x: 20, y: 106, w: 390, h: 548 },
  grid: { x: 38, y: 186, w: 354 },
  backButton: { x: 110, y: 584, w: 210, h: 48 },
} as const;

export default function IngredientInventoryScreen({
  onBack,
  playerName = 'Bento-chan',
  coins = 10,
  level = 1,
  xp = 0,
  xpToNext = 100,
  inventory,
}: IngredientInventoryScreenProps) {
  const { language } = useLanguage();

  const inventoryEntries = useMemo(() => {
    const greenhouseEntries = GREENHOUSE_INGREDIENTS.filter((ingredient) =>
      ['corn', 'bamboo', 'mushroom', 'garlic'].includes(ingredient.id)
    ).map((ingredient) => ({
      id: ingredient.id as PlayerMarketInventoryId,
      label: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
      image: ingredient.image,
      quantity: Math.max(0, Number(inventory[ingredient.id as PlayerMarketInventoryId] ?? 0)),
    }));

    const marketEntries = MARKET_INGREDIENTS.map((ingredient) => ({
      id: ingredient.id as PlayerMarketInventoryId,
      label: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
      image: ingredient.image,
      quantity: Math.max(0, Number(inventory[ingredient.id] ?? 0)),
    }));

    return [...greenhouseEntries, ...marketEntries];
  }, [inventory, language]);

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#3A1709]"
    >
      {({ canvasStyle }) => (
        <>
          <img
            src={restaurantBackground}
            alt="Inventory background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[rgba(42,16,7,0.34)] backdrop-blur-[2px]" />

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
              className="absolute rounded-[30px] border border-[rgba(255,231,196,0.26)] bg-[rgba(63,29,12,0.82)]"
              style={{
                left: UI.panel.x,
                top: UI.panel.y,
                width: UI.panel.w,
                height: UI.panel.h,
                boxShadow: '0 24px 44px rgba(18,6,2,0.25)',
              }}
            >
              <div
                className="absolute inset-x-0 top-7 text-center text-[22px] text-[#FFF2D8]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
              >
                {language === 'fr' ? 'STOCK INGREDIENTS' : 'INGREDIENT STOCK'}
              </div>

              <div
                className="absolute inset-x-8 top-[64px] text-center text-[11px] leading-[1.3] text-[#F6DBB5]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
              >
                {language === 'fr'
                  ? 'Complete ton stock via le marche ou la serre pour continuer les recettes.'
                  : 'Refill through the market or greenhouse to keep cooking recipes.'}
              </div>

              <div
                className="absolute grid grid-cols-3 gap-2.5"
                style={{
                  left: UI.grid.x,
                  top: UI.grid.y,
                  width: UI.grid.w,
                }}
              >
                {inventoryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative rounded-[20px] border border-[rgba(255,227,186,0.16)] bg-[rgba(255,247,235,0.08)] px-2 pb-2.5 pt-2.5"
                  >
                    <img
                      src={entry.image}
                      alt={entry.label}
                      className="mx-auto h-[50px] w-[50px] object-contain"
                      draggable={false}
                    />
                    <div
                      className="mt-1.5 text-center text-[10px] leading-[1.15] text-[#FFF2D8]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {entry.label}
                    </div>
                    <div
                      className="mt-1.5 text-center text-[12px] text-[#FFDE7B]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      x{entry.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onBack}
                className="absolute"
                style={{
                  left: UI.backButton.x,
                  top: UI.backButton.y,
                  width: UI.backButton.w,
                  height: UI.backButton.h,
                }}
              >
                <img
                  src={superButtonAsset}
                  alt={language === 'fr' ? 'Retour au restaurant' : 'Back to restaurant'}
                  className="h-full w-full object-fill"
                  draggable={false}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center text-center text-[#FFFDF8]"
                  style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textShadow: '0 2px 8px rgba(0,0,0,0.34)',
                    transform: 'translateY(-5px)',
                  }}
                >
                  {language === 'fr' ? 'RETOUR RESTAURANT' : 'BACK TO RESTAURANT'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
