import { motion } from 'motion/react';
import { Clock, AlertCircle } from 'lucide-react';

export interface Order {
  id: number;
  clientName: string;
  clientEmoji: string;
  recipeId: string;
  dishName: string;
  dishEmoji: string;
  timeLeft: number;
  mood: 'happy' | 'neutral' | 'special';
  reward: number;
}

interface ClientOrderProps {
  order: Order;
  onSelect: (order: Order) => void;
  isSelected?: boolean;
}

export function ClientOrder({ order, onSelect, isSelected }: ClientOrderProps) {
  const moodColors = {
    happy: 'from-green-400 to-green-500',
    neutral: 'from-blue-400 to-blue-500',
    special: 'from-purple-400 to-purple-500'
  };

  const moodIcons = {
    happy: '🙂',
    neutral: '😊',
    special: '⭐'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(order)}
      className={`relative bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-3 border-3 shadow-lg transition-all ${
        isSelected ? 'border-green-400 shadow-green-300' : 'border-amber-300'
      }`}
    >
      {/* Alerte urgence */}
      {order.timeLeft < 30 && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className="bg-red-500 rounded-full p-1 border-2 border-white">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      )}

      {/* Client */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl">{order.clientEmoji}</div>
        <div className="flex-1 text-left">
          <div className="font-bold text-xs text-amber-900">{order.clientName}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-amber-700" />
            <span className="text-xs text-amber-700">{order.timeLeft}s</span>
            <span className="ml-1">{moodIcons[order.mood]}</span>
          </div>
        </div>
      </div>

      {/* Plat demandé */}
      <div className="flex items-center gap-2 bg-white rounded-xl p-2 border-2 border-amber-200">
        <div className="text-3xl">{order.dishEmoji}</div>
        <div className="flex-1 text-left">
          <div className="text-xs font-bold text-amber-800">{order.dishName}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className={`flex items-center gap-1 bg-gradient-to-r ${moodColors[order.mood]} rounded-full px-2 py-0.5`}>
              <span className="text-xs font-bold text-white">+{order.reward}</span>
              <span className="text-xs">🪙</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
