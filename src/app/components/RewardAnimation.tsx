import { motion } from 'motion/react';
import { Sparkles, Heart, Star, TrendingUp } from 'lucide-react';

interface RewardAnimationProps {
  order: any;
  quality: number;
  onComplete: () => void;
}

export function RewardAnimation({ order, quality, onComplete }: RewardAnimationProps) {
  const reactions = [
    { emoji: '😋', text: 'Délicieux!' },
    { emoji: '🤩', text: 'Incroyable!' },
    { emoji: '❤️', text: 'Parfait!' },
    { emoji: '⭐', text: 'Chef étoilé!' }
  ];
  
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  const coins = Math.floor(order.reward * (quality / 100));
  const xpGained = Math.floor(coins * 0.5);

  setTimeout(() => {
    onComplete();
  }, 3000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border-4 border-amber-400 shadow-2xl max-w-md w-full mx-4">
        {/* Client satisfait */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="text-9xl mb-2">{order.clientEmoji}</div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: 3, duration: 0.3 }}
            className="text-6xl"
          >
            {reaction.emoji}
          </motion.div>
        </motion.div>

        {/* Réaction */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-center text-amber-800 mb-6"
        >
          {reaction.text}
        </motion.p>

        {/* Récompenses */}
        <div className="space-y-3">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-4 border-3 border-yellow-300 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">🪙</div>
              <span className="text-xl font-bold text-amber-900">Pièces</span>
            </div>
            <span className="text-2xl font-bold text-white">+{coins}</span>
          </motion.div>

          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-4 border-3 border-green-300 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-green-900">Expérience</span>
            </div>
            <span className="text-2xl font-bold text-white">+{xpGained} XP</span>
          </motion.div>

          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-between bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl p-4 border-3 border-pink-300 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-white fill-white" />
              <span className="text-xl font-bold text-pink-900">Affection</span>
            </div>
            <span className="text-2xl font-bold text-white">+{Math.floor(quality / 20)}</span>
          </motion.div>
        </div>

        {/* Étoiles flottantes */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -200, opacity: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 1.5 }}
            className="absolute text-3xl"
            style={{ 
              left: `${20 + i * 15}%`,
              top: '50%'
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
