import React from "react";
import { motion } from "motion/react";

import avatarSvg from "../../assets/ui/Avatar.svg";
import coinBoxSvg from "../../assets/ui/CoinBox.svg";
import coinLogoSvg from "../../assets/ui/CoinLogo.svg";
import lvlStarSvg from "../../assets/ui/LvlStar.svg";
import nameBoxSvg from "../../assets/ui/NameBox.svg";
import returnButtonSvg from "../../assets/ui/ReturnButton.svg";
import settingsSvg from "../../assets/ui/Settings.svg";

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
  WebkitTextStroke: "1px #4F210E",
  textShadow: "0 1px 0 rgba(79,33,14,0.35)",
};

export default function GameToolbar({
  playerName = "Bento-chan",
  coins = 10,
  level = 1,
  xp = 4,
  xpToNext = 9,
  onBack,
  onSettings,
  className = "",
}: GameToolbarProps) {
  const xpRatio = Math.max(0, Math.min(1, xpToNext > 0 ? xp / xpToNext : 0));
  const displayPlayerName =
    playerName.length > 12 ? `${playerName.slice(0, 11)}…` : playerName;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-40 ${className}`}
      style={{ height: UI.toolbarHeight }}
    >
      <div className="relative h-full w-full">
        {/* Back */}
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

        {/* Name Box */}
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

        {/* Avatar */}
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

        {/* Player name */}
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

        {/* XP Bar */}
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

        {/* XP Text */}
        <div
          className="absolute -translate-x-1/2 text-center leading-none text-[#FFF3D0]"
          style={{
            ...textStyle,
            WebkitTextStroke: "1px #9F531F",
            textShadow: "none",
            left: UI.xpText.x,
            top: UI.xpText.y,
            fontSize: UI.xpText.fontSize,
          }}
        >
          {xp}/{xpToNext}
        </div>

        {/* Level Star */}
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
              WebkitTextStroke: "1px #9F531F",
              fontSize: UI.levelStar.fontSize,
              paddingTop: 3,
            }}
          >
            {level}
          </div>
        </div>

        {/* Coin box */}
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

        {/* Coin logo */}
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

        {/* Coins text */}
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

        {/* Settings */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={onSettings}
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
      </div>
    </div>
  );
}
