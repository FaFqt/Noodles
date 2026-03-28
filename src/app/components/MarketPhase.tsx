import React, { useMemo } from 'react';
import GameToolbar from './GameToolbar';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';
import { useLanguage } from '../context/LanguageContext';
import { GREENHOUSE_INGREDIENTS, MARKET_INGREDIENTS } from '../data/market';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;
const SCALE = 1;
const s = (value: number) => value * SCALE;

interface MarketPhaseProps {
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
}

const UI = {
  hero: { x: s(22), y: s(96), w: s(386), h: s(114) },
  greenhousePanel: { x: s(22), y: s(226), w: s(386), h: s(212) },
  marketPanel: { x: s(22), y: s(452), w: s(386), h: s(248) },
} as const;

function getRarityLabel(rarity: string, language: 'fr' | 'en') {
  if (rarity === 'common') {
    return language === 'fr' ? 'Commun' : 'Common';
  }

  if (rarity === 'rare') {
    return 'Rare';
  }

  if (rarity === 'epic') {
    return 'Epic';
  }

  return language === 'fr' ? 'Legendaire' : 'Legendary';
}

function PriceTable({
  title,
  subtitle,
  rows,
  language,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    id: string;
    name: string;
    rarity: string;
    price: number;
  }>;
  language: 'fr' | 'en';
}) {
  return (
    <div className="absolute inset-0 rounded-[28px] border border-[rgba(255,240,211,0.22)] bg-[rgba(45,22,8,0.76)] px-4 py-4 shadow-[0_16px_40px_rgba(13,5,2,0.28)] backdrop-blur-md">
      <div
        className="text-[19px] leading-none text-[#FFF2D8]"
        style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
      >
        {title}
      </div>
      <div
        className="mt-2 text-[11px] leading-[1.35] text-[#F1D9B4]"
        style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 500 }}
      >
        {subtitle}
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-[rgba(255,235,204,0.16)] bg-[rgba(255,248,235,0.06)]">
        <div
          className="grid grid-cols-[1.6fr_1fr_0.9fr] border-b border-[rgba(255,235,204,0.14)] bg-[rgba(255,224,173,0.08)] px-3 py-2 text-[10px] uppercase tracking-[0.08em] text-[#F5D9AF]"
          style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
        >
          <div>{language === 'fr' ? 'Ingredient' : 'Ingredient'}</div>
          <div>{language === 'fr' ? 'Rarete' : 'Rarity'}</div>
          <div className="text-right">{language === 'fr' ? 'Prix' : 'Price'}</div>
        </div>

        <div className="divide-y divide-[rgba(255,235,204,0.1)]">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.6fr_1fr_0.9fr] items-center px-3 py-2 text-[12px] text-[#FFF7EA]"
              style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
            >
              <div>{row.name}</div>
              <div className="text-[#F7D8A2]">{row.rarity}</div>
              <div className="text-right text-[#FFF1CF]">{row.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketPhase({
  onBack,
  playerName = 'Bento-chan',
  coins = 10,
  level = 1,
  xp = 0,
  xpToNext = 100,
}: MarketPhaseProps) {
  const { language } = useLanguage();

  const greenhouseRows = useMemo(
    () =>
      GREENHOUSE_INGREDIENTS.filter((ingredient) => ingredient.rarity === 'common').map(
        (ingredient) => ({
          id: ingredient.id,
          name: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
          rarity: getRarityLabel(ingredient.rarity, language),
          price: ingredient.marketBuyPrice,
        })
      ),
    [language]
  );

  const marketRows = useMemo(
    () =>
      MARKET_INGREDIENTS.filter((ingredient) => ingredient.rarity === 'common').map(
        (ingredient) => ({
          id: ingredient.id,
          name: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
          rarity: getRarityLabel(ingredient.rarity, language),
          price: ingredient.marketBuyPrice,
        })
      ),
    [language]
  );

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#2B1307]"
    >
      {({ canvasStyle }) => (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,206,142,0.22),transparent_34%),linear-gradient(180deg,#6A3416_0%,#3E1D0B_42%,#1C0D06_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:26px_26px] opacity-25" />

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
              className="absolute rounded-[28px] border border-[rgba(255,237,214,0.26)] bg-[rgba(60,28,11,0.74)] px-5 py-4 text-center shadow-[0_20px_44px_rgba(10,3,1,0.25)] backdrop-blur-md"
              style={{
                left: UI.hero.x,
                top: UI.hero.y,
                width: UI.hero.w,
                height: UI.hero.h,
              }}
            >
              <div
                className="text-[24px] leading-none text-[#FFF3DE]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
              >
                {language === 'fr' ? 'MARCHE TEST' : 'TEST MARKET'}
              </div>
              <div
                className="mt-3 text-[12px] leading-[1.35] text-[#F6DFBC]"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
              >
                {language === 'fr'
                  ? 'Reference des prix d achat pour les ingredients communs du village.'
                  : 'Reference buy prices for the village common ingredients.'}
              </div>
            </div>

            <div
              className="absolute"
              style={{
                left: UI.greenhousePanel.x,
                top: UI.greenhousePanel.y,
                width: UI.greenhousePanel.w,
                height: UI.greenhousePanel.h,
              }}
            >
              <PriceTable
                title={language === 'fr' ? 'Greenhouse / Market' : 'Greenhouse / Market'}
                subtitle={
                  language === 'fr'
                    ? 'Ingredients communs cultivables en serre.'
                    : 'Common ingredients that can be grown in the greenhouse.'
                }
                rows={greenhouseRows}
                language={language}
              />
            </div>

            <div
              className="absolute"
              style={{
                left: UI.marketPanel.x,
                top: UI.marketPanel.y,
                width: UI.marketPanel.w,
                height: UI.marketPanel.h,
              }}
            >
              <PriceTable
                title={language === 'fr' ? 'Market' : 'Market'}
                subtitle={
                  language === 'fr'
                    ? 'Ingredients communs achetables directement.'
                    : 'Common ingredients available for direct purchase.'
                }
                rows={marketRows}
                language={language}
              />
            </div>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
