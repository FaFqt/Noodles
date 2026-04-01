import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import ambientChill1 from "../../assets/audio/ambient-chill-1.mp3";
import ambientChill2 from "../../assets/audio/ambient-chill-2.mp3";
import ambientChill3 from "../../assets/audio/ambient-chill-3.mp3";

type AudioTrack = {
  name: string;
  src: string;
};

interface AudioSettingsContextValue {
  musicEnabled: boolean;
  volume: number;
  currentTrackName: string;
  toggleMusic: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setVolume: (value: number) => void;
}

const AUDIO_STORAGE_KEY = "noodles-audio-settings-v1";
const DEFAULT_VOLUME = 0.4;
const TRACKS: AudioTrack[] = [
  { name: "Aventure Chill I", src: ambientChill1 },
  { name: "Aventure Chill II", src: ambientChill2 },
  { name: "Nastelbom Chill", src: ambientChill3 },
];

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null);

function readStoredAudioSettings() {
  if (typeof window === "undefined") {
    return {
      musicEnabled: true,
      volume: DEFAULT_VOLUME,
    };
  }

  const rawValue = window.localStorage.getItem(AUDIO_STORAGE_KEY);
  if (!rawValue) {
    return {
      musicEnabled: true,
      volume: DEFAULT_VOLUME,
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      musicEnabled?: boolean;
      volume?: number;
    };

    return {
      musicEnabled:
        typeof parsed.musicEnabled === "boolean" ? parsed.musicEnabled : true,
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : DEFAULT_VOLUME,
    };
  } catch {
    return {
      musicEnabled: true,
      volume: DEFAULT_VOLUME,
    };
  }
}

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const storedSettings = readStoredAudioSettings();
  const [musicEnabled, setMusicEnabledState] = useState(storedSettings.musicEnabled);
  const [volume, setVolumeState] = useState(storedSettings.volume);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hasInteractionUnlock, setHasInteractionUnlock] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setMusicEnabledState(enabled);
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabledState((prev) => !prev);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.max(0, Math.min(1, value)));
  }, []);

  const syncPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !musicEnabled || !hasInteractionUnlock) return;

    try {
      await audio.play();
    } catch {
      // Browsers may still reject autoplay until the next trusted gesture.
    }
  }, [hasInteractionUnlock, musicEnabled]);

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src);
    audio.preload = "auto";
    audio.volume = volume;

    const handleEnded = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    };

    audio.addEventListener("ended", handleEnded);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextState = JSON.stringify({
      musicEnabled,
      volume,
    });

    window.localStorage.setItem(AUDIO_STORAGE_KEY, nextState);
  }, [musicEnabled, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockAudio = () => {
      setHasInteractionUnlock(true);
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = TRACKS[currentTrackIndex].src;
    audio.load();
    void syncPlayback();
  }, [currentTrackIndex, syncPlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    void syncPlayback();
  }, [musicEnabled, syncPlayback]);

  useEffect(() => {
    if (!musicEnabled || !hasInteractionUnlock) return;
    void syncPlayback();
  }, [hasInteractionUnlock, musicEnabled, syncPlayback]);

  const value = useMemo<AudioSettingsContextValue>(
    () => ({
      musicEnabled,
      volume,
      currentTrackName: TRACKS[currentTrackIndex]?.name ?? "Chill Playlist",
      toggleMusic,
      setMusicEnabled,
      setVolume,
    }),
    [currentTrackIndex, musicEnabled, setMusicEnabled, setVolume, toggleMusic, volume]
  );

  return (
    <AudioSettingsContext.Provider value={value}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);

  if (!context) {
    throw new Error("useAudioSettings must be used within an AudioSettingsProvider");
  }

  return context;
}
