import { useMemo } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import ResponsiveGameCanvas from "./ResponsiveGameCanvas";

const DESIGN_WIDTH = 430;
const DESIGN_HEIGHT = 780;

interface CartridgeConnectScreenProps {
  isConnecting: boolean;
  isSyncing?: boolean;
  network: "sepolia" | "mainnet";
  error?: string | null;
  syncMessage?: string | null;
  onConnect: () => Promise<void> | void;
}

export default function CartridgeConnectScreen({
  isConnecting,
  isSyncing = false,
  network,
  error,
  syncMessage,
  onConnect,
}: CartridgeConnectScreenProps) {
  const { language } = useLanguage();

  const helperText = useMemo(
    () =>
      language === "fr"
        ? "Connecte ton wallet Cartridge pour sauvegarder ton profil, ton XP et tes tokens Noods. Pour le moment, la connexion vise Sepolia afin de tester sans risque."
        : "Connect your Cartridge wallet to save your profile, XP, and Noods tokens. For now, the connection targets Sepolia for safe testing.",
    [language]
  );

  return (
    <ResponsiveGameCanvas
      designWidth={DESIGN_WIDTH}
      designHeight={DESIGN_HEIGHT}
      className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,#f6d3a6_0%,#8c4b24_48%,#2a1208_100%)]"
    >
      {({ canvasStyle }) => (
        <div className="absolute inset-0" style={canvasStyle}>
          <div className="absolute inset-x-0 top-[72px] text-center">
            <div
              className="text-[#fff8ef]"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "2rem",
                fontWeight: 700,
                textShadow: "0 4px 18px rgba(0,0,0,0.28)",
              }}
            >
              Cartridge
            </div>
            <div
              className="mt-2 px-10 text-[#fff1de]"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "0.95rem",
                lineHeight: 1.4,
                textShadow: "0 2px 12px rgba(0,0,0,0.22)",
              }}
            >
              {helperText}
            </div>
          </div>

          <div
            className="absolute left-[34px] top-[220px] w-[362px] rounded-[34px] border border-[#f7d8a4]/45 bg-[rgba(54,22,9,0.68)] px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-md"
          >
            <div
              className="text-center text-[#fff7e8]"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              {language === "fr" ? "Connexion wallet" : "Wallet connection"}
            </div>

            <div
              className="mt-6 rounded-[18px] bg-[rgba(255,241,222,0.12)] px-4 py-4 text-[#ffeecf]"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "0.86rem",
                lineHeight: 1.45,
              }}
            >
              {language === "fr"
                ? "Première étape : on relie le vrai wallet Cartridge au jeu. L'XP et les Noods restent locaux pour l'instant, puis onchain viendra ensuite."
                : "First step: connect the real Cartridge wallet to the game. XP and Noods stay local for now, while onchain features can come later."}
            </div>

            <div
              className="mt-4 flex items-center justify-between rounded-[18px] border border-[#f7d8a4]/25 bg-[rgba(255,241,222,0.08)] px-4 py-3 text-[#fff1de]"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "0.92rem",
                fontWeight: 600,
              }}
            >
              <span>{language === "fr" ? "Réseau" : "Network"}</span>
              <span className="rounded-full bg-[rgba(255,214,116,0.18)] px-3 py-1 text-[#ffd97f]">
                {network === "sepolia" ? "Sepolia" : "Mainnet"}
              </span>
            </div>

            {error ? (
              <div
                className="mt-4 rounded-[18px] border border-[#ffb6a3]/35 bg-[rgba(103,24,9,0.42)] px-4 py-3 text-[#ffe1d7]"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.84rem",
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            ) : null}

            {syncMessage ? (
              <div
                className="mt-4 rounded-[18px] border border-[#c7ebb0]/30 bg-[rgba(34,64,18,0.34)] px-4 py-3 text-[#eef9d7]"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: "0.84rem",
                  lineHeight: 1.4,
                }}
              >
                {syncMessage}
              </div>
            ) : null}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void onConnect()}
              disabled={isConnecting || isSyncing}
              className="mt-8 h-[60px] w-full rounded-[22px] bg-[linear-gradient(180deg,#ffcf67_0%,#ea8e30_100%)] text-[#fffdf8] shadow-[0_10px_22px_rgba(0,0,0,0.24)] disabled:opacity-75"
              style={{
                fontFamily: "Fredoka, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
              type="button"
            >
              {isSyncing
                ? language === "fr"
                  ? "Synchronisation..."
                  : "Syncing..."
                : isConnecting
                ? language === "fr"
                  ? "Connexion..."
                  : "Connecting..."
                : language === "fr"
                ? "Se connecter avec Cartridge"
                : "Connect with Cartridge"}
            </motion.button>
          </div>
        </div>
      )}
    </ResponsiveGameCanvas>
  );
}
