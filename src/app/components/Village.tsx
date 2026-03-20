import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import villageImage from '../../assets/screens/Village.png';
import buttonImage from '../../assets/ui/ButtonOpen.png';
import { useLanguage } from '../context/LanguageContext';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface VillageProps {
  onSelectBuilding: (building: string) => void;
}

interface Building {
  id: string;
  emoji: string;
  labelKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  locked: boolean;
  color: string;
}

const SCALE = 1;
const s = (value: number) => value * SCALE;

const UI = {
  openButton: {
    x: s(110),
    y: s(440),
    w: s(200),
    h: s(74),
  },
} as const;

const BUILDINGS: Building[] = [
  { id: 'ramen', emoji: '🍜', labelKey: 'restaurant', x: s(130), y: s(250), w: s(160), h: s(200), locked: false, color: '#FF6B35' },
  { id: 'market', emoji: '🛒', labelKey: 'market', x: s(22), y: s(480), w: s(150), h: s(120), locked: false, color: '#8B5E3C' },
  { id: 'greenhouse', emoji: '🌿', labelKey: 'greenhouse', x: s(255), y: s(500), w: s(150), h: s(120), locked: false, color: '#5BAD6F' },
  //{ id: 'library', emoji: '📚', labelKey: 'library', x: s(300), y: s(250), w: s(110), h: s(86), locked: true, color: '#3A6EA5' },
  //{ id: 'friends', emoji: '👥', labelKey: 'friends', x: s(302), y: s(360), w: s(110), h: s(86), locked: true, color: '#A15BA5' },
  //{ id: 'construction', emoji: '🚧', labelKey: 'construction', x: s(150), y: s(470), w: s(110), h: s(86), locked: true, color: '#D1495B' },
];

const PARTICLES = [
  { x: 8, y: 20, emoji: '🌸', delay: 0 },
  { x: 88, y: 15, emoji: '✨', delay: 0.8 },
  { x: 5, y: 60, emoji: '🍀', delay: 1.5 },
  { x: 92, y: 55, emoji: '🌸', delay: 2.2 },
  { x: 50, y: 5, emoji: '⭐', delay: 0.4 },
];

function Particle({ x, y, emoji, delay }: { x: number; y: number; emoji: string; delay: number }) {
  return (
    <motion.div
      animate={{
        y: [0, -18, 0],
        rotate: [0, 8, 0],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className="absolute text-2xl opacity-75 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {emoji}
    </motion.div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.3 }}
      className="fixed left-1/2 -translate-x-1/2 z-[200]"
      style={{
        bottom: 'calc(var(--safe-area-bottom) + 20px)',
        background: 'rgba(20,8,0,0.92)',
        border: '1px solid rgba(255,175,0,0.45)',
        borderRadius: '999px',
        padding: '0.6rem 1.5rem',
        color: '#FFD580',
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '0.95rem',
        backdropFilter: 'blur(10px)',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}
    >
      {msg}
    </motion.div>
  );
}

function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 18 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="absolute z-[25]"
      style={{
        left: UI.openButton.x,
        top: UI.openButton.y,
        width: UI.openButton.w,
        height: UI.openButton.h,
        filter: 'drop-shadow(0 8px 22px rgba(0, 0, 0, 0.35))'
      }}
    >
      <img
        src={buttonImage}
        alt={label}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      <span
        className="absolute inset-0 flex items-center justify-center z-10 select-none"
        style={{
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(1.35rem, 4.2vw, 2.1rem)',
          color: '#FFFFFF',
          textShadow: `
            0 2px 8px rgba(0, 0, 0, 0.45),
            0 0 14px rgba(255, 145, 0, 0.35)
          `,
          letterSpacing: '0.03em'
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function Village({ onSelectBuilding }: VillageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2300);
  }, []);

  const handleBuildingClick = useCallback((b: Building) => {
    if (b.locked) {
      showToast(`🔒 ${t('soon')}`);
    } else {
      setActiveBuilding(b);
    }
  }, [t, showToast]);

  const handleOpen = useCallback(() => {
    if (!activeBuilding) return;
    
    // Navigate to the building
    if (activeBuilding.id === 'ramen') {
      onSelectBuilding('restaurant');
    } else {
      showToast(`${t('openRestaurant')} 🎉`);
    }
    setActiveBuilding(null);
  }, [activeBuilding, onSelectBuilding, t, showToast]);

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const hdrBtn = {
    background: 'rgba(255,255,255,0.15)',
    border: '2px solid rgba(255,255,255,0.35)',
    borderRadius: '999px',
    color: '#fff',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: '0.9rem',
    padding: '0.32rem 0.85rem',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer'
  };

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden"
    >
      {({ canvasStyle }) => (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ background: '#0E1A0A' }}
          onClick={() => setActiveBuilding(null)}
        >
          <img
            src={villageImage}
            alt="Village"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
          />

          <div
            className="absolute top-0 left-0 right-0 h-[16%] z-[2]"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.52), transparent)'
            }}
          />

          <div className="absolute inset-0 z-[3] pointer-events-none">
            {PARTICLES.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </div>

          <div className="absolute inset-0 z-10" style={canvasStyle}>
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  showToast(
                    language === 'fr'
                      ? '🔗 Cartridge Wallet - Bientôt disponible !'
                      : '🔗 Cartridge Wallet - Coming soon!'
                  )
                }
                style={hdrBtn}
              >
                🎮 Wallet
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguage}
                style={hdrBtn}
              >
                {language === 'fr' ? 'EN' : 'FR'}
              </motion.button>
            </div>

            <AnimatePresence>
              {activeBuilding && !activeBuilding.locked && (
                <OpenButton
                  label={t('openRestaurant')}
                  onClick={handleOpen}
                />
              )}
            </AnimatePresence>

            {BUILDINGS.map((b) => (
              <motion.button
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.1 * BUILDINGS.indexOf(b),
                  type: 'spring',
                  stiffness: 220,
                  damping: 18
                }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuildingClick(b);
                }}
                aria-label={t(b.labelKey)}
                className="absolute z-[15] cursor-pointer border-none bg-transparent"
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.w,
                  height: b.h,
                  outline: 'none'
                }}
              >
                <span className="sr-only">{t(b.labelKey)}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {toast && <Toast key={toast} msg={toast} />}
          </AnimatePresence>
        </div>
      )}
    </ResponsiveGameCanvas>
  );
}
