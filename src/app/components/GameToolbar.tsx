import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import avatarSvg from "../../assets/ui/Avatar.svg";
import coinBoxSvg from "../../assets/ui/CoinBox.svg";
import coinLogoSvg from "../../assets/ui/CoinLogo.svg";
import lvlStarSvg from "../../assets/ui/LvlStar.svg";
import nameBoxSvg from "../../assets/ui/NameBox.svg";
import returnButtonSvg from "../../assets/ui/ReturnButton.svg";
import settingsSvg from "../../assets/ui/Settings.svg";
import { useAudioSettings } from "../context/AudioSettingsContext";

interface GameToolbarProps {
  playerName?: string;
  coins?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  onBack?: () => void;
  onSettings?: () => void;
  className?: string;
}

const UI = {
  toolbarHeight: 64,

  backButton: {
    x: 10,
    y: 20,
    size: 50,
  },

  settingsButton: {
    x: 354,
    y: 20,
    size: 50,
  },

  settingsPanel: {
    x: 220,
    y: 76,
    w: 186,
  },

  nameBox: {
    x: 85,
    y: 20,
    w: 114,
    h: 30,
  },

  avatar: {
    x: 70,
    y: 20,
    size: 50,
  },

  playerName: {
    x: 122,
    y: 28,
    fontSize: 13,
  },

  xpBar: {
    x: 114,
    y: 48,
    w: 82,
    h: 8,
  },

  xpText: {
    x: 152,
    y: 48,
    fontSize: 8,
  },

  levelStar: {
    x: 187,
    y: 37,
    size: 24,
    fontSize: 11,
  },

  coinBox: {
    x: 252,
    y: 25,
    w: 112,
    h: 40,
  },

  coinLogo: {
    x: 250,
    y: 20,
    size: 50,
  },

  coinsText: {
    x: 310,
    y: 40,
    fontSize: 14,
  },
} as const;

const textStyle: React.CSSProperties = {
  fontFamily: "Fredoka, sans-serif",
  fontWeight: 700,
  color: "#FFFFFF",
  textShadow:
    "0 1px 0 rgba(79,33,14,0.24), 0 0 4px rgba(79,33,14,0.12)",
};

export default function GameToolbar({
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
  onBack,
  className = "",
}: GameToolbarProps) {
  const xpRatio = Math.max(0, Math.min(1, xpToNext > 0 ? xp / xpToNext : 0));
  const displayPlayerName =
    playerName.length > 12 ? `${playerName.slice(0, 11)}…` : playerName;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    musicEnabled,
    volume,
    currentTrackName,
    setMusicEnabled,
    setVolume,
  } = useAudioSettings();

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const clickedInsidePanel = settingsPanelRef.current?.contains(target);
      const clickedButton = settingsButtonRef.current?.contains(target);

      if (clickedInsidePanel || clickedButton) return;
      setIsSettingsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isSettingsOpen]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-40 ${className}`}
      style={{ height: UI.toolbarHeight }}
    >
      <div className="relative h-full w-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={onBack}
          className="pointer-events-auto absolute"
          style={{
            left: UI.backButton.x,
            top: UI.backButton.y,
            width: UI.backButton.size,
            height: UI.backButton.size,
          }}
        >
          <img
            src={returnButtonSvg}
            alt="Back"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </motion.button>

        <div
          className="absolute"
          style={{
            left: UI.nameBox.x,
            top: UI.nameBox.y,
            width: UI.nameBox.w,
            height: UI.nameBox.h,
          }}
        >
          <img
            src={nameBoxSvg}
            alt="Name box"
            className="absolute inset-0 h-full w-full object-fill"
            draggable={false}
          />
        </div>

        <div
          className="absolute"
          style={{
            left: UI.avatar.x,
            top: UI.avatar.y,
            width: UI.avatar.size,
            height: UI.avatar.size,
          }}
        >
          <img
            src={avatarSvg}
            alt="Avatar"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <div
          className="absolute truncate leading-none"
          style={{
            ...textStyle,
            left: UI.playerName.x,
            top: UI.playerName.y,
            fontSize: UI.playerName.fontSize,
            width: 92,
          }}
        >
          {displayPlayerName}
        </div>

        <div
          className="absolute overflow-hidden rounded-full border border-[#8F4C1C] bg-[#7A3B17] shadow-[inset_0_1px_2px_rgba(255,236,181,0.24)]"
          style={{
            left: UI.xpBar.x,
            top: UI.xpBar.y,
            width: UI.xpBar.w,
            height: UI.xpBar.h,
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFF29A] via-[#FFD85A] to-[#F08A2B] shadow-[0_0_8px_rgba(255,222,112,0.45)]"
            style={{ width: `${xpRatio * 100}%` }}
          />
        </div>

        <div
          className="absolute -translate-x-1/2 text-center leading-none text-[#FFF3D0]"
          style={{
            ...textStyle,
            textShadow: "none",
            left: UI.xpText.x,
            top: UI.xpText.y,
            fontSize: UI.xpText.fontSize,
          }}
        >
          {xp}/{xpToNext}
        </div>

        <div
          className="absolute"
          style={{
            left: UI.levelStar.x,
            top: UI.levelStar.y,
            width: UI.levelStar.size,
            height: UI.levelStar.size,
          }}
        >
          <img
            src={lvlStarSvg}
            alt="Level"
            className="h-full w-full object-contain"
            draggable={false}
          />
          <div
            className="absolute inset-0 flex items-center justify-center leading-none"
            style={{
              ...textStyle,
              fontSize: UI.levelStar.fontSize,
              paddingTop: 3,
            }}
          >
            {level}
          </div>
        </div>

        <div
          className="absolute"
          style={{
            left: UI.coinBox.x,
            top: UI.coinBox.y,
            width: UI.coinBox.w,
            height: UI.coinBox.h,
          }}
        >
          <img
            src={coinBoxSvg}
            alt="Coins"
            className="absolute inset-0 h-full w-full object-fill"
            draggable={false}
          />
        </div>

        <div
          className="absolute"
          style={{
            left: UI.coinLogo.x,
            top: UI.coinLogo.y,
            width: UI.coinLogo.size,
            height: UI.coinLogo.size,
          }}
        >
          <img
            src={coinLogoSvg}
            alt="Coin logo"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center leading-none"
          style={{
            ...textStyle,
            left: UI.coinsText.x,
            top: UI.coinsText.y,
            fontSize: UI.coinsText.fontSize,
          }}
        >
          {coins}
        </div>

        <motion.button
          ref={settingsButtonRef}
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          className="pointer-events-auto absolute"
          style={{
            left: UI.settingsButton.x,
            top: UI.settingsButton.y,
            width: UI.settingsButton.size,
            height: UI.settingsButton.size,
          }}
        >
          <img
            src={settingsSvg}
            alt="Settings"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </motion.button>

        <AnimatePresence>
          {isSettingsOpen ? (
            <motion.div
              ref={settingsPanelRef}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto absolute rounded-[22px] border border-[rgba(255,222,173,0.22)] bg-[rgba(62,28,11,0.94)] px-4 py-4 shadow-[0_18px_28px_rgba(0,0,0,0.28)] backdrop-blur-sm"
              style={{
                left: UI.settingsPanel.x,
                top: UI.settingsPanel.y,
                width: UI.settingsPanel.w,
              }}
            >
              <div
                className="text-[13px] text-[#FFF2D8]"
                style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
              >
                MUSIC SETTINGS
              </div>

              <div
                className="mt-1 text-[10px] text-[#F7D5AE]"
                style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600 }}
              >
                {currentTrackName}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMusicEnabled(!musicEnabled)}
                  className={`rounded-full px-3 py-1.5 text-[11px] ${
                    musicEnabled
                      ? "bg-[#54C75A] text-white"
                      : "bg-[rgba(255,255,255,0.1)] text-[#FFE8C4]"
                  }`}
                  style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
                >
                  {musicEnabled ? "MUSIC ON" : "MUSIC OFF"}
                </button>

                <div
                  className="text-[11px] text-[#FFE8C4]"
                  style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
                >
                  {Math.round(volume * 100)}%
                </div>
              </div>

              <div className="mt-3">
                <div
                  className="mb-1 text-[10px] text-[#F7D5AE]"
                  style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700 }}
                >
                  VOLUME
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(volume * 100)}
                  onChange={(event) => setVolume(Number(event.target.value) / 100)}
                  className="w-full accent-[#FFCF5B]"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
