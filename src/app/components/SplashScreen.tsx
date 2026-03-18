import { motion } from 'motion/react';
import splashImage from '../../assets/screens/SplashScreen.png';
import buttonImage from '../../assets/ui/ButtonStart.png';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Image de fond */}
      <img 
        src={splashImage} 
        alt="Noodles Game"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient du bas pour meilleure lisibilité */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[38%] z-[2]"
        style={{
          background: 'linear-gradient(to top, rgba(12,3,0,0.96) 0%, rgba(12,3,0,0.55) 65%, transparent 100%)'
        }}
      />

      {/* Particules flottantes */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        {[
          { x: 8, y: 20, emoji: '🌸', delay: 0 },
          { x: 88, y: 15, emoji: '✨', delay: 0.8 },
          { x: 5, y: 60, emoji: '🍀', delay: 1.5 },
          { x: 92, y: 55, emoji: '🌸', delay: 2.2 },
          { x: 50, y: 5, emoji: '⭐', delay: 0.4 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 4,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute text-2xl opacity-75"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </div>

      {/* Bouton de langue - Un seul bouton qui toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-20 bg-white/15 border-2 border-white/35 backdrop-blur-md rounded-full px-4 py-2 text-white font-bold transition-colors hover:bg-white/25"
        style={{
          fontFamily: 'Fredoka, sans-serif'
        }}
      >
        {language === 'fr' ? 'EN' : 'FR'}
      </motion.button>

      {/* CTA Zone - Bouton JOUER/PLAY positionné en bas */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-12 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Tagline au-dessus du bouton */}
          <p 
            className="text-center tracking-wider"
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '1rem',
              color: 'rgba(255,225,150,0.82)',
              letterSpacing: '0.07em'
            }}
          >
            {t('tagline')}
          </p>

          {/* Bouton JOUER/PLAY */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.3, duration: 0.8 }}
            whileHover={{ scale: 1.045 }}
            whileTap={{ scale: 0.93 }}
            onClick={onStart}
            className="relative w-[250px] h-[72px]"
            style={{
              filter: 'drop-shadow(0 6px 24px rgba(0, 0, 0, 0.45))',
              animation: 'pulseGlow 2.6s infinite'
            }}
          >
            {/* Image du bouton en bois */}
            <img 
              src={buttonImage} 
              alt="Button"
              className="absolute inset-0 w-full h-full object-fill rounded-full"
            />
            
            {/* Texte JOUER/PLAY par-dessus le bouton */}
            <span 
              className="absolute inset-0 flex items-center justify-center text-4xl font-bold tracking-wider z-10"
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: `
                  0 2px 10px rgba(0, 0, 0, 0.65),
                  0 0 22px rgba(255, 145, 0, 0.75)
                `,
                letterSpacing: '0.06em'
              }}
            >
              {t('play')}
            </span>
          </motion.button>

          {/* Badge Starknet × Cartridge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 bg-white/8 border border-white/20 backdrop-blur-md rounded-full px-4 py-2"
          >
            <span 
              className="text-xs"
              style={{
                fontFamily: 'Fredoka, sans-serif',
                color: 'rgba(255,195,90,0.9)'
              }}
            >
              ⚡ {t('powered')}
            </span>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 18px rgba(255,175,0,0.55)) drop-shadow(0 6px 24px rgba(0,0,0,0.45));
          }
          50% {
            filter: drop-shadow(0 0 36px rgba(255,175,0,0.9)) drop-shadow(0 6px 32px rgba(0,0,0,0.45));
          }
        }
      `}</style>
    </div>
  );
}