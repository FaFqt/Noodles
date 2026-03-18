import { Heart, Star, Coins } from 'lucide-react';

interface GameHeaderProps {
  playerName: string;
  level: number;
  xp: number;
  xpToNext: number;
  stars: number;
  maxStars: number;
  coins: number;
}

export function GameHeader({ playerName, level, xp, xpToNext, stars, maxStars, coins }: GameHeaderProps) {
  const xpPercentage = (xp / xpToNext) * 100;

  return (
    <div className="w-full bg-gradient-to-b from-amber-800 to-amber-700 rounded-b-3xl shadow-lg px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Profil joueur */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-3 border-white shadow-md flex items-center justify-center">
            <span className="text-2xl">🐕</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm">{playerName}</span>
            <div className="flex items-center gap-1">
              <div className="bg-amber-900/50 rounded-full px-2 py-0.5 border border-amber-600">
                <span className="text-xs text-amber-100">Lv.{level}</span>
              </div>
              <div className="w-16 h-2 bg-amber-900/50 rounded-full overflow-hidden border border-amber-600">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full px-3 py-1.5 border-2 border-yellow-300 shadow-md">
            <Star className="w-3.5 h-3.5 fill-white text-white" />
            <span className="text-xs font-bold text-amber-900">{stars}/{maxStars}</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full px-3 py-1.5 border-2 border-yellow-300 shadow-md">
            <Coins className="w-3.5 h-3.5 fill-white text-white" />
            <span className="text-xs font-bold text-amber-900">{coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
