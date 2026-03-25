import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import villageImage from '../../assets/screens/Village.png';
import buttonImage from '../../assets/ui/ButtonOpen.png';
import { useLanguage } from '../context/LanguageContext';
import ResponsiveGameCanvas from './ResponsiveGameCanvas';
import type { PlayerWallet } from '../types/playerWallet';

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface VillageProps {
  onSelectBuilding: (building: string) => void;
  playerWallet?: PlayerWallet | null;
  isWalletConnected?: boolean;
  onOpenWalletProfile?: () => Promise<boolean> | boolean;
  onDisconnectWallet?: () => Promise<void> | void;
  walletStats?: {
    xp: number;
    xpToNext: number;
    noods: number;
    level: number;
  };
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

function shortenAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Village({
  onSelectBuilding,
  playerWallet,
  isWalletConnected = false,
  onOpenWalletProfile,
  onDisconnectWallet,
  walletStats,
}: VillageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const isDojoSynced = Boolean(playerWallet?.dojoRegistered);
  const walletSessionLabel = isDojoSynced
    ? language === 'fr'
      ? 'Synchronise onchain'
      : 'Synced onchain'
    : isWalletConnected
      ? language === 'fr'
        ? 'Wallet connecte, sync en attente'
        : 'Wallet connected, sync pending'
      : language === 'fr'
        ? 'Profil local uniquement'
        : 'Local profile only';
  const canOpenWalletProfile = Boolean(
    playerWallet && onOpenWalletProfile && (isWalletConnected || isDojoSynced)
  );

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

  useEffect(() => {
    if (!walletOpen || !playerWallet || isWalletConnected) return;

    showToast(
      isDojoSynced
        ? language === 'fr'
          ? 'Session Cartridge inactive. Reconnecte le wallet pour ouvrir le profil.'
          : 'Cartridge session is inactive. Reconnect the wallet to open the profile.'
        : language === 'fr'
          ? 'Profil local detecte. Reconnecte Cartridge pour acceder au wallet et lancer la sync onchain.'
          : 'Local profile detected. Reconnect Cartridge to access the wallet and start onchain sync.'
    );
  }, [walletOpen, playerWallet, isWalletConnected, isDojoSynced, language, showToast]);

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
                onClick={() => setWalletOpen(true)}
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

            <AnimatePresence>
              {walletOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[80] flex items-center justify-center bg-[rgba(14,8,2,0.48)] px-6"
                  onClick={() => setWalletOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.96 }}
                    transition={{ duration: 0.24 }}
                    className="w-full max-w-[340px] rounded-[28px] border border-[#f8d9a7]/40 bg-[rgba(46,20,8,0.88)] px-6 py-6 text-[#fff0d4] shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className="text-center"
                      style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                      }}
                    >
                      Cartridge Wallet
                    </div>

                    {playerWallet ? (
                      <>
                        <div className="mt-4 flex items-center justify-center">
                          <div
                            className={`rounded-full px-4 py-2 text-[0.8rem] font-semibold ${
                              isDojoSynced
                                ? 'border border-[#c9ef98]/40 bg-[rgba(54,95,20,0.34)] text-[#ebffd0]'
                                : 'border border-[#f2d39c]/35 bg-[rgba(89,58,14,0.34)] text-[#ffe9bc]'
                            }`}
                            style={{ fontFamily: 'Fredoka, sans-serif' }}
                          >
                            {walletSessionLabel}
                          </div>
                        </div>

                        <div
                          className="mt-5 rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-4"
                          style={{ fontFamily: 'Fredoka, sans-serif' }}
                        >
                          <div className="text-[0.82rem] text-[#f3dcb5]">
                            {language === 'fr' ? 'Profil' : 'Profile'}
                          </div>
                          <div className="mt-1 text-[1rem] font-semibold text-white">
                            {playerWallet.profileName}
                          </div>
                          <div className="mt-3 text-[0.82rem] text-[#f3dcb5]">
                            {language === 'fr' ? 'Adresse' : 'Address'}
                          </div>
                          <div className="mt-1 text-[0.92rem] font-semibold text-white">
                            {shortenAddress(playerWallet.address)}
                          </div>
                          <div className="mt-3 text-[0.82rem] text-[#f3dcb5]">
                            {language === 'fr' ? 'Statut Dojo' : 'Dojo status'}
                          </div>
                          <div className="mt-1 text-[0.92rem] font-semibold text-white">
                            {isDojoSynced
                              ? language === 'fr'
                                ? 'Compte enregistre sur Dojo'
                                : 'Player registered on Dojo'
                              : isWalletConnected
                                ? language === 'fr'
                                  ? 'Wallet Cartridge connecte, synchronisation Dojo en attente'
                                  : 'Cartridge wallet connected, Dojo sync pending'
                              : language === 'fr'
                                ? 'Pas encore synchronise onchain'
                                : 'Not synced onchain yet'}
                          </div>
                        </div>

                        {walletStats ? (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-3">
                              <div className="text-[0.8rem] text-[#f3dcb5]">
                                {language === 'fr' ? 'Niveau' : 'Level'}
                              </div>
                              <div className="mt-1 font-semibold text-white">
                                {walletStats.level}
                              </div>
                            </div>
                            <div className="rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-3">
                              <div className="text-[0.8rem] text-[#f3dcb5]">
                                XP
                              </div>
                              <div className="mt-1 font-semibold text-white">
                                {walletStats.xp}/{walletStats.xpToNext}
                              </div>
                            </div>
                            <div className="rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-3">
                              <div className="text-[0.8rem] text-[#f3dcb5]">
                                Noods
                              </div>
                              <div className="mt-1 font-semibold text-white">
                                {walletStats.noods}
                              </div>
                            </div>
                            <div className="rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-3">
                              <div className="text-[0.8rem] text-[#f3dcb5]">
                                {language === 'fr' ? 'Réseau' : 'Network'}
                              </div>
                              <div className="mt-1 font-semibold uppercase text-white">
                                {playerWallet.network}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {!isWalletConnected ? (
                          <div
                            className={`mt-4 rounded-[18px] px-4 py-3 text-[0.84rem] ${
                              isDojoSynced
                                ? 'border border-[#bde0ff]/30 bg-[rgba(20,51,84,0.34)] text-[#ddefff]'
                                : 'border border-[#f2d39c]/35 bg-[rgba(89,58,14,0.28)] text-[#ffe8bf]'
                            }`}
                            style={{
                              fontFamily: 'Fredoka, sans-serif',
                              lineHeight: 1.4,
                            }}
                          >
                            {isDojoSynced
                              ? language === 'fr'
                                ? 'La session live Cartridge est inactive. Tu peux reconnecter le wallet pour rouvrir ton profil.'
                                : 'The live Cartridge session is inactive. Reconnect the wallet to reopen your profile.'
                              : language === 'fr'
                                ? 'Ce profil est encore local. Reconnecte Cartridge depuis l’ecran de connexion pour acceder au wallet et lancer la synchronisation onchain.'
                                : 'This profile is still local. Reconnect Cartridge from the connect screen to access the wallet and start onchain sync.'}
                          </div>
                        ) : null}

                        {canOpenWalletProfile ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (!onOpenWalletProfile) return;
                              void onOpenWalletProfile();
                            }}
                            className="mt-4 h-[48px] w-full rounded-[18px] border border-[#f8d9a7]/35 bg-[rgba(255,241,222,0.08)] text-white"
                            style={{
                              fontFamily: 'Fredoka, sans-serif',
                              fontWeight: 700,
                            }}
                            type="button"
                          >
                            {language === 'fr'
                              ? isWalletConnected
                                ? 'Ouvrir le wallet Cartridge'
                                : 'Reconnecter et ouvrir'
                              : isWalletConnected
                                ? 'Open Cartridge wallet'
                                : 'Reconnect and open'}
                          </motion.button>
                        ) : null}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setWalletOpen(false);
                            if (!onDisconnectWallet) return;
                            void onDisconnectWallet();
                          }}
                          disabled={!playerWallet || !onDisconnectWallet}
                          className="mt-3 h-[48px] w-full rounded-[18px] border border-[#ffb8a6]/35 bg-[rgba(120,28,10,0.36)] text-[#fff1ea] disabled:opacity-45"
                          style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                          }}
                          type="button"
                        >
                          {language === 'fr'
                            ? 'Déconnecter Cartridge'
                            : 'Disconnect Cartridge'}
                        </motion.button>
                      </>
                    ) : (
                      <div
                        className="mt-5 rounded-[18px] bg-[rgba(255,241,222,0.1)] px-4 py-4 text-center text-[0.95rem]"
                        style={{ fontFamily: 'Fredoka, sans-serif' }}
                      >
                        {language === 'fr'
                          ? "Aucun wallet Cartridge n'est connecte."
                          : 'No Cartridge wallet is connected.'}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setWalletOpen(false)}
                      className="mt-5 h-[50px] w-full rounded-[18px] bg-[linear-gradient(180deg,#ffcf67_0%,#ea8e30_100%)] text-white"
                      style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      }}
                      type="button"
                    >
                      {language === 'fr' ? 'Fermer' : 'Close'}
                    </motion.button>
                  </motion.div>
                </motion.div>
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
