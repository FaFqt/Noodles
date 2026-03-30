import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import GameToolbar from './GameToolbar';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';
import { useLanguage } from '../context/LanguageContext';
import {
  GREENHOUSE_INGREDIENTS,
  MARKET_INGREDIENTS,
  MARKET_ROTATION_DURATION_MS,
  MARKET_ROTATION_SIZE,
  MARKET_ROTATION_STOCK_LIMIT,
  PLAYER_MARKET_INVENTORY_IDS,
  type PlayerMarketInventoryId,
} from '../data/market';
import marketScreenAsset from '../../assets/screens/MarketScreen.png';
import superButtonAsset from '../../assets/ui/SuperButton.svg';
import inventoryButtonAsset from '../../assets/ui/InventoryButton.svg';
import boxMarketPriceAsset from '../../assets/ui/Box_Market_price.svg';
import refreshAsset from '../../assets/ui/Refresh.svg';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;
const DEFAULT_STORAGE_KEY = 'market-ui-state-v1:local';

interface MarketPhaseProps {
  onBack?: () => void;
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  storageKey?: string;
  inventory?: Partial<Record<PlayerMarketInventoryId, number>>;
  onPurchase?: (
    entries: Array<{ ingredientId: PlayerMarketInventoryId; quantity: number }>,
    totalCost: number
  ) => void;
}

type MarketCatalogItem = {
  ingredientId: PlayerMarketInventoryId;
  label: string;
  price: number;
  image: string;
};

type RotationOffer = {
  ingredientId: PlayerMarketInventoryId;
  stock: number;
};

type MarketRotationState = {
  startedAt: number;
  offers: RotationOffer[];
};

type VisibleOffer = MarketCatalogItem &
  RotationOffer & {
    x: number;
    y: number;
    quantityInCart: number;
  };

type DragState = {
  ingredientId: PlayerMarketInventoryId;
  image: string;
  label: string;
  pointerX: number;
  pointerY: number;
};

const UI = {
  header: { x: 30, y: 100, w: 200, h: 50 },
  inventoryButton: { x: 274, y: 108, w: 124, h: 45 },
  offersLabel: { x: 50, y: 300, w: 220, h: 38},
  refreshBadge: { x: 220, y: 340, w: 110, h: 30 },
  cartZone: { x: 28, y: 610, w: 130, h: 100 },
  hintBubble: { x: 148, y: 592, w: 150, h: 78 },
  buyButton: { x: 210, y: 688, w: 190, h: 52 },
  statusToast: { x: 215, y: 662 },
  inventoryPanel: { x: 20, y: 106, w: 390, h: 510 },
  inventoryGrid: { x: 15, y: 120, w: 354, h: 310 },
  inventoryBackButton: { x: 90, y: 584, w: 210, h: 48 },
  offerCard: {
    w: 80,
    h: 43,
    boxW: 68,
    boxH: 68,
    imageW: 38,
    imageH: 30,
    priceTop: 46,
    priceWidth: 52,
    labelBottom: -2,
    labelWidth: 84,
  },
} as const;

const OFFER_POSITIONS = [
  { x: 50, y: 380 },
  { x: 120, y: 380 },
  { x: 190, y: 380 },
  { x: 260, y: 380 },
] as const;

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function clampStock(value: unknown) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MARKET_ROTATION_STOCK_LIMIT, Number(value)));
}

function buildCommonMarketCatalog(language: 'fr' | 'en'): MarketCatalogItem[] {
  const greenhouseCommon = GREENHOUSE_INGREDIENTS.filter((ingredient) =>
    ['corn', 'bamboo', 'mushroom', 'garlic'].includes(ingredient.id)
  ).map((ingredient) => ({
    ingredientId: ingredient.id as PlayerMarketInventoryId,
    label: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
    price: ingredient.marketBuyPrice,
    image: ingredient.image,
  }));

  const marketCommon = MARKET_INGREDIENTS.map((ingredient) => ({
    ingredientId: ingredient.id as PlayerMarketInventoryId,
    label: language === 'fr' ? ingredient.name.fr : ingredient.name.en,
    price: ingredient.marketBuyPrice,
    image: ingredient.image,
  }));

  return [...greenhouseCommon, ...marketCommon];
}

function createMarketRotation(now = Date.now()): MarketRotationState {
  const selectedIds = shuffleArray(PLAYER_MARKET_INVENTORY_IDS).slice(0, MARKET_ROTATION_SIZE);

  return {
    startedAt: now,
    offers: selectedIds.map((ingredientId) => ({
      ingredientId,
      stock: MARKET_ROTATION_STOCK_LIMIT,
    })),
  };
}

function readStoredRotation(storageKey: string): MarketRotationState | null {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<MarketRotationState>;
    if (!Number.isFinite(parsed.startedAt) || !Array.isArray(parsed.offers)) {
      return null;
    }

    const seen = new Set<string>();
    const offers: RotationOffer[] = [];

    for (const offer of parsed.offers) {
      if (
        !offer ||
        typeof offer.ingredientId !== 'string' ||
        !PLAYER_MARKET_INVENTORY_IDS.includes(offer.ingredientId as PlayerMarketInventoryId) ||
        seen.has(offer.ingredientId)
      ) {
        return null;
      }

      seen.add(offer.ingredientId);
      offers.push({
        ingredientId: offer.ingredientId as PlayerMarketInventoryId,
        stock: clampStock(offer.stock),
      });
    }

    if (offers.length !== MARKET_ROTATION_SIZE) {
      return null;
    }

    return {
      startedAt: Number(parsed.startedAt),
      offers,
    };
  } catch {
    return null;
  }
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}

function formatRefreshTime(remainingMs: number) {
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function getInventoryCount(
  inventory: Partial<Record<PlayerMarketInventoryId, number>> | undefined,
  ingredientId: PlayerMarketInventoryId
) {
  const nextValue = inventory?.[ingredientId];
  return Number.isFinite(nextValue) ? Math.max(0, Number(nextValue)) : 0;
}

export default function MarketPhase({
  onBack,
  playerName = 'Bento-chan',
  coins = 10,
  level = 1,
  xp = 0,
  xpToNext = 100,
  storageKey = DEFAULT_STORAGE_KEY,
  inventory,
  onPurchase,
}: MarketPhaseProps) {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const [screenMode, setScreenMode] = useState<'market' | 'inventory'>('market');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [cart, setCart] = useState<Partial<Record<PlayerMarketInventoryId, number>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [rotation, setRotation] = useState<MarketRotationState>(
    () => readStoredRotation(storageKey) ?? createMarketRotation()
  );

  const catalog = useMemo(() => buildCommonMarketCatalog(language), [language]);
  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.ingredientId, item])),
    [catalog]
  );

  const visibleOffers = useMemo<VisibleOffer[]>(
    () =>
      rotation.offers.map((offer, index) => {
        const marketItem = catalogById.get(offer.ingredientId);
        const position = OFFER_POSITIONS[index] ?? OFFER_POSITIONS[0];

        return {
          ...marketItem!,
          ...offer,
          x: position.x,
          y: position.y,
          quantityInCart: cart[offer.ingredientId] ?? 0,
        };
      }),
    [cart, catalogById, rotation.offers]
  );

  const cartEntries = useMemo(
    () =>
      visibleOffers
        .filter((offer) => offer.quantityInCart > 0)
        .map((offer) => ({
          ...offer,
          quantity: offer.quantityInCart,
        })),
    [visibleOffers]
  );

  const inventoryEntries = useMemo(
    () =>
      catalog
        .map((item) => ({
          ...item,
          quantity: getInventoryCount(inventory, item.ingredientId),
        }))
        .sort((left, right) => {
          if (right.quantity !== left.quantity) {
            return right.quantity - left.quantity;
          }

          return left.label.localeCompare(right.label);
        }),
    [catalog, inventory]
  );

  const totalCost = useMemo(
    () => cartEntries.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
    [cartEntries]
  );
  const totalUnitsInCart = useMemo(
    () => cartEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    [cartEntries]
  );
  const canAfford = totalCost > 0 && totalCost <= coins;
  const rotationEndsAt = rotation.startedAt + MARKET_ROTATION_DURATION_MS;
  const timeUntilNextRotation = Math.max(0, rotationEndsAt - nowTs);
  const isRotationSoldOut = visibleOffers.every(
    (offer) => offer.stock - offer.quantityInCart <= 0
  );

  useEffect(() => {
    setRotation(readStoredRotation(storageKey) ?? createMarketRotation());
    setCart({});
    setDragState(null);
    setScreenMode('market');
  }, [storageKey]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(storageKey, JSON.stringify(rotation));
  }, [rotation, storageKey]);

  useEffect(() => {
    if (nowTs < rotationEndsAt) return;

    setRotation(createMarketRotation(nowTs));
    setCart({});
    setStatusMessage(
      language === 'fr'
        ? 'Nouvelle rotation du marche disponible.'
        : 'A new market rotation is available.'
    );
  }, [language, nowTs, rotationEndsAt]);

  useEffect(() => {
    if (!statusMessage) return;

    const timeout = window.setTimeout(() => setStatusMessage(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (screenMode === 'inventory') {
      setDragState(null);
    }
  }, [screenMode]);

  useEffect(() => {
    if (!dragState || screenMode !== 'market') return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextScale = rect.width / DESIGN_WIDTH || 1;

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              pointerX: (event.clientX - rect.left) / nextScale,
              pointerY: (event.clientY - rect.top) / nextScale,
            }
          : null
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      const cartRect = cartRef.current?.getBoundingClientRect();

      if (
        cartRect &&
        event.clientX >= cartRect.left &&
        event.clientX <= cartRect.right &&
        event.clientY >= cartRect.top &&
        event.clientY <= cartRect.bottom
      ) {
        setCart((prev) => {
          const visibleOffer = visibleOffers.find(
            (offer) => offer.ingredientId === dragState.ingredientId
          );

          if (!visibleOffer) {
            return prev;
          }

          const nextQuantity = (prev[dragState.ingredientId] ?? 0) + 1;
          if (nextQuantity > visibleOffer.stock) {
            setStatusMessage(
              language === 'fr'
                ? `${dragState.label} n'est plus disponible.`
                : `${dragState.label} is no longer available.`
            );
            return prev;
          }

          setStatusMessage(
            language === 'fr'
              ? `${dragState.label} ajoute au panier.`
              : `${dragState.label} added to cart.`
          );

          return {
            ...prev,
            [dragState.ingredientId]: nextQuantity,
          };
        });
      }

      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, language, screenMode, visibleOffers]);

  const handleStartDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    offer: VisibleOffer
  ) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextScale = rect.width / DESIGN_WIDTH || 1;

    if (offer.stock - offer.quantityInCart <= 0) {
      setStatusMessage(
        language === 'fr'
          ? `${offer.label} est epuise pour cette rotation.`
          : `${offer.label} is sold out for this rotation.`
      );
      return;
    }

    event.preventDefault();

    setDragState({
      ingredientId: offer.ingredientId,
      image: offer.image,
      label: offer.label,
      pointerX: (event.clientX - rect.left) / nextScale,
      pointerY: (event.clientY - rect.top) / nextScale,
    });
  };

  const handleRemoveFromCart = (ingredientId: PlayerMarketInventoryId) => {
    setCart((prev) => {
      const nextQuantity = Math.max(0, (prev[ingredientId] ?? 0) - 1);
      if (nextQuantity === 0) {
        const nextCart = { ...prev };
        delete nextCart[ingredientId];
        return nextCart;
      }

      return {
        ...prev,
        [ingredientId]: nextQuantity,
      };
    });
  };

  const handlePurchase = () => {
    if (!cartEntries.length) return;

    const hasStockMismatch = cartEntries.some((entry) => entry.quantity > entry.stock);
    if (hasStockMismatch) {
      setStatusMessage(
        language === 'fr'
          ? 'Le stock a change. Verifie ton panier.'
          : 'The stock changed. Check your cart.'
      );
      return;
    }

    if (!canAfford) {
      setStatusMessage(language === 'fr' ? 'Pas assez de Noods.' : 'Not enough Noods.');
      return;
    }

    onPurchase?.(
      cartEntries.map((entry) => ({
        ingredientId: entry.ingredientId,
        quantity: entry.quantity,
      })),
      totalCost
    );

    setRotation((prev) => ({
      ...prev,
      offers: prev.offers.map((offer) => ({
        ...offer,
        stock: Math.max(0, offer.stock - (cart[offer.ingredientId] ?? 0)),
      })),
    }));
    setCart({});
    setStatusMessage(
      language === 'fr'
        ? `Achat confirme pour ${totalCost} Noods.`
        : `Purchase confirmed for ${totalCost} Noods.`
    );
  };

  const buyButtonLabel =
    language === 'fr' ? `ACHETER ${totalCost}` : `BUY FOR ${totalCost}`;
  const inventoryButtonLabel = language === 'fr' ? 'INVENTAIRE' : 'INVENTORY';
  const returnToMarketLabel =
    language === 'fr' ? 'RETOUR AU MARCHE' : 'BACK TO MARKET';
  const headerTitle = language === 'fr' ? 'MARCHE' : 'MARKET';
  const commonPurchaseLabel =
    language === 'fr' ? 'Achats ingredients communs' : 'Common ingredient purchases';
  const refreshLabel =
    language === 'fr'
      ? `Refresh : ${formatRefreshTime(timeUntilNextRotation)}`
      : `Refresh: ${formatRefreshTime(timeUntilNextRotation)}`;
  const cartHintMessage = isRotationSoldOut && totalUnitsInCart === 0
    ? language === 'fr'
      ? 'Rotation epuisee. Une nouvelle selection arrive bientot.'
      : 'This rotation is sold out. A new selection is coming soon.'
    : totalUnitsInCart > 0
      ? language === 'fr'
        ? 'Panier pret. Retire un article en touchant son icone.'
        : 'Cart ready. Tap an icon to remove one item.'
      : language === 'fr'
        ? 'Depose ici les ingredients que tu veux acheter.'
        : 'Drop here the ingredients you want to buy.';

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[#2C1306]"
    >
      {({ canvasStyle }) => (
        <>
          <img
            src={marketScreenAsset}
            alt="Market background"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,16,6,0.10)_0%,rgba(53,23,9,0.08)_38%,rgba(37,15,6,0.18)_100%)]" />

          <div ref={canvasRef} className="absolute inset-0 z-10" style={canvasStyle}>
            <GameToolbar
              playerName={playerName}
              coins={coins}
              level={level}
              xp={xp}
              xpToNext={xpToNext}
              onBack={onBack}
              onSettings={() => undefined}
            />

            <AnimatePresence mode="wait">
              {screenMode === 'market' ? (
                <motion.div
                  key="market-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <div
                    className="absolute flex flex-col items-start justify-center rounded-[15px] bg-[rgba(79,40,15,0.62)] px-4 py-3 text-[#FFF2D9] backdrop-blur-[2px]"
                    style={{
                      left: UI.header.x,
                      top: UI.header.y,
                      width: UI.header.w,
                      height: UI.header.h,
                    }}
                  >
                    <div
                      className="text-[24px] leading-none"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {headerTitle}
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => setScreenMode('inventory')}
                    whileTap={{ scale: 0.97, y: 2 }}
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
                      alt={inventoryButtonLabel}
                      className="h-full w-full object-fill"
                      draggable={false}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center text-center text-[11px] text-[#FFFDF8]"
                      style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        textShadow: '0 2px 8px rgba(0,0,0,0.34)',
                        transform: 'translate(8px, -2px)',
                      }}
                    >
                      {inventoryButtonLabel}
                    </span>
                  </motion.button>

                  <div
                    className="absolute rounded-[10px] border border-[rgba(93,130,46,0.55)] bg-[rgba(128,169,69,0.92)] px-4 py-2"
                    style={{
                      left: UI.offersLabel.x,
                      top: UI.offersLabel.y,
                      width: UI.offersLabel.w,
                      height: UI.offersLabel.h,
                    }}
                  >
                      <div
                        className="text-[13px] text-[#5B3514]"
                        style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                      >
                        {commonPurchaseLabel}
                    </div>
                  </div>

                  <div
                    className="absolute"
                    style={{
                      left: UI.refreshBadge.x,
                      top: UI.refreshBadge.y,
                      width: UI.refreshBadge.w,
                      height: UI.refreshBadge.h,
                    }}
                  >
                    <img
                      src={refreshAsset}
                      alt={refreshLabel}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center text-center text-[12px] text-[#FFF6E7]"
                      style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        textShadow: '0 2px 6px rgba(0,0,0,0.28)',
                        transform: 'translate(10px, -1px)',
                      }}
                    >
                      {refreshLabel}
                    </div>
                  </div>

                  {visibleOffers.map((offer) => {
                    const remainingStock = offer.stock - offer.quantityInCart;

                    return (
                      <button
                        key={offer.ingredientId}
                        type="button"
                        onPointerDown={(event) => handleStartDrag(event, offer)}
                        className="absolute touch-none select-none"
                        style={{
                          left: offer.x,
                          top: offer.y,
                          width: UI.offerCard.w,
                          height: UI.offerCard.h,
                        }}
                      >
                        <img
                          src={boxMarketPriceAsset}
                          alt={offer.label}
                          className="absolute left-1/2 top-0 -translate-x-1/2 object-contain"
                          style={{
                            width: UI.offerCard.boxW,
                            height: UI.offerCard.boxH,
                            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))',
                          }}
                          draggable={false}
                        />

                        <img
                          src={offer.image}
                          alt={offer.label}
                          className="absolute left-1/2 object-contain"
                          style={{
                            top: 7,
                            width: UI.offerCard.imageW,
                            height: UI.offerCard.imageH,
                            transform: 'translateX(-50%)',
                          }}
                          draggable={false}
                        />

                        <div
                          className="absolute rounded-full border border-[rgba(123,65,19,0.45)] bg-[#FFF2CC] px-[6px] py-[2px] text-[10px] text-[#8D4E16]"
                          style={{
                            top: -6,
                            right: -2,
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                          }}
                        >
                          {remainingStock}/10
                        </div>

                        <div
                          className="absolute left-1/2 text-center text-[12px] text-[#FFF8EC]"
                          style={{
                            top: UI.offerCard.priceTop,
                            width: UI.offerCard.priceWidth,
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                            lineHeight: 1.05,
                            transform: 'translateX(-50%)',
                            color: '#7C481B',
                          }}
                        >
                          {offer.price}
                        </div>

                        <div
                          className="absolute left-1/2 text-center text-[10px]"
                          style={{
                            bottom: UI.offerCard.labelBottom,
                            width: UI.offerCard.labelWidth,
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                            lineHeight: 1.15,
                            transform: 'translateX(-50%)',
                            color: '#7C481B',
                          }}
                        >
                          {offer.label}
                        </div>

                        {remainingStock <= 0 ? (
                          <div className="absolute inset-x-2 top-2 flex h-[74px] items-center justify-center rounded-[14px] bg-[rgba(73,31,11,0.62)] text-[10px] text-[#FFF0DB]">
                            <span
                              style={{
                                fontFamily: 'Fredoka, sans-serif',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {language === 'fr' ? 'EPUISE' : 'SOLD OUT'}
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}

                  <div
                    ref={cartRef}
                    className="absolute rounded-[28px] border border-[rgba(255,246,228,0.5)] bg-[rgba(255,249,240,0.18)] backdrop-blur-[2px]"
                    style={{
                      left: UI.cartZone.x,
                      top: UI.cartZone.y,
                      width: UI.cartZone.w,
                      height: UI.cartZone.h,
                      boxShadow: '0 10px 24px rgba(25,8,3,0.18)',
                    }}
                  >
                    <div
                      className="absolute left-0 right-0 top-2 text-center text-[11px] text-[#7C481B]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {language === 'fr' ? 'PANIER' : 'BASKET'}
                    </div>

                    <div className="absolute inset-x-2 bottom-5 top-7 flex flex-wrap content-start gap-2">
                      {cartEntries.length ? (
                        cartEntries.map((entry) => (
                          <button
                            key={entry.ingredientId}
                            type="button"
                            onClick={() => handleRemoveFromCart(entry.ingredientId)}
                            className="relative h-[28px] w-[28px] rounded-full bg-[rgba(255,255,255,0.66)]"
                          >
                            <img
                              src={entry.image}
                              alt={entry.label}
                              className="absolute left-1/2 top-1/2 h-[24px] w-[24px] -translate-x-1/2 -translate-y-1/2 object-contain"
                              draggable={false}
                            />
                            <div
                              className="absolute -right-[3px] -top-[3px] min-w-[14px] rounded-full bg-[#B76115] px-[3px] text-[9px] text-[#FFF8F0]"
                              style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                            >
                              {entry.quantity}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div
                          className="flex w-full items-center justify-center text-center text-[10px] leading-[1.25] text-[#8E5625]"
                          style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                        >
                          {language === 'fr' ? 'Depose ici' : 'Drop here'}
                        </div>
                      )}
                    </div>

                    <div
                      className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-[#7C481B]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {language === 'fr' ? 'Total' : 'Total'} {totalCost}
                    </div>
                  </div>

                  <div
                    className="absolute rounded-[22px] border border-[rgba(255,233,193,0.55)] bg-[rgba(93,43,15,0.72)] px-3 py-3 text-[#FFF2D6]"
                    style={{
                      left: UI.hintBubble.x,
                      top: UI.hintBubble.y,
                      width: UI.hintBubble.w,
                      height: UI.hintBubble.h,
                    }}
                  >
                    <div
                      className="text-[11px] leading-[1.35]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
                    >
                      {cartHintMessage}
                    </div>
                    <div className="absolute -left-[10px] bottom-[18px] h-0 w-0 border-b-[12px] border-r-[14px] border-t-[12px] border-b-transparent border-r-[rgba(93,43,15,0.72)] border-t-transparent" />
                  </div>

                  <AnimatePresence>
                    {totalCost > 0 ? (
                      <motion.button
                        key="buy-button"
                        type="button"
                        whileTap={canAfford ? { scale: 0.97, y: 2 } : {}}
                        onClick={handlePurchase}
                        className="absolute"
                        style={{
                          left: UI.buyButton.x,
                          top: UI.buyButton.y,
                          width: UI.buyButton.w,
                          height: UI.buyButton.h,
                          opacity: canAfford ? 1 : 0.7,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: canAfford ? 1 : 0.7, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        <img
                          src={superButtonAsset}
                          alt={buyButtonLabel}
                          className="h-full w-full object-fill"
                          draggable={false}
                        />
                        <span
                          className="absolute inset-0 flex items-center justify-center text-center text-[#FFFDF8]"
                          style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                            textShadow: '0 2px 8px rgba(0,0,0,0.34)',
                            transform: 'translateY(-5px)',
                          }}
                        >
                          {buyButtonLabel}
                        </span>
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="inventory-view"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-[rgba(44,17,7,0.32)] backdrop-blur-[2px]" />

                  <div
                    className="absolute rounded-[30px] border border-[rgba(255,231,196,0.26)] bg-[rgba(63,29,12,0.82)]"
                    style={{
                      left: UI.inventoryPanel.x,
                      top: UI.inventoryPanel.y,
                      width: UI.inventoryPanel.w,
                      height: UI.inventoryPanel.h,
                      boxShadow: '0 24px 44px rgba(18,6,2,0.25)',
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-7 text-center text-[22px] text-[#FFF2D8]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}
                    >
                      {language === 'fr' ? 'STOCK DU MARCHE' : 'MARKET STORAGE'}
                    </div>

                    <div
                      className="absolute inset-x-8 top-[64px] text-center text-[11px] leading-[1.3] text-[#F6DBB5]"
                      style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600 }}
                    >
                      {language === 'fr'
                        ? 'Les ingredients achetes sont prepares ici pour la suite du flux inventaire.'
                        : 'Bought ingredients are prepared here until the full inventory flow is added.'}
                    </div>

                    <div
                      className="absolute grid grid-cols-3 gap-2.5"
                      style={{
                        left: UI.inventoryGrid.x,
                        top: UI.inventoryGrid.y,
                        width: UI.inventoryGrid.w,
                      }}
                    >
                      {inventoryEntries.map((entry) => (
                        <div
                          key={entry.ingredientId}
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

                    <motion.button
                      type="button"
                      onClick={() => setScreenMode('market')}
                      whileTap={{ scale: 0.97, y: 2 }}
                      className="absolute"
                      style={{
                        left: UI.inventoryBackButton.x,
                        top: UI.inventoryBackButton.y,
                        width: UI.inventoryBackButton.w,
                        height: UI.inventoryBackButton.h,
                      }}
                    >
                      <img
                        src={superButtonAsset}
                        alt={returnToMarketLabel}
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
                        {returnToMarketLabel}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {dragState ? (
                <motion.div
                  key={dragState.ingredientId}
                  className="pointer-events-none absolute"
                  style={{
                    left: dragState.pointerX - 34,
                    top: dragState.pointerY - 34,
                    width: 68,
                    height: 68,
                  }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative h-full w-full rounded-full bg-[rgba(83,33,12,0.18)] backdrop-blur-[1px]">
                    <img
                      src={dragState.image}
                      alt={dragState.label}
                      className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.28)]"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {statusMessage ? (
                <motion.div
                  key={statusMessage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute -translate-x-1/2 rounded-full bg-[rgba(55,23,8,0.84)] px-4 py-2 text-center text-[11px] text-[#FFF0D8]"
                  style={{
                    left: UI.statusToast.x,
                    top: UI.statusToast.y,
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {statusMessage}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </>
      )}
    </ResponsiveGameCanvas>
  );
}
