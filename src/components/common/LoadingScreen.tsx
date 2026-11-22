import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarEmblem } from '../brand/TraceLogo';

interface LoadingScreenProps {
  onComplete?: () => void;
}

const brandLetters = 'TRACE'.split('');

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [phase, setPhase] = useState<'star' | 'text' | 'counting'>('star');

  useEffect(() => {
    // Phase 1: Star reveal (0-600ms)
    const t1 = setTimeout(() => setPhase('text'), 600);
    // Phase 2: Text reveal (600-1200ms)  
    const t2 = setTimeout(() => setPhase('counting'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'counting') return;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsLoaded(true);
            if (onComplete) onComplete();
          }, 400);
          return 100;
        }
        const increment = Math.max(1, Math.floor((100 - prev) / 5) + Math.floor(Math.random() * 10));
        return Math.min(100, prev + increment);
      });
    }, 50);

    return () => clearInterval(timer);
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            clipPath: 'inset(0 0 100% 0)',
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-[#0A0908] text-[#FAF8F4] overflow-hidden select-none pointer-events-auto"
        >
          {/* Ambient grain texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }} />
          
          {/* Top metadata */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-between items-center text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#DED4C7]/40"
          >
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#713D43]"
              />
              TRACE // HAUTE PARFUMERIE
            </span>
            <span>EXTRAIT ELIXIRS — 30% OIL</span>
          </motion.div>

          {/* Center: Star + Brand Name with staggered character reveal */}
          <div className="flex flex-col items-center justify-center my-auto space-y-8 text-center">
            {/* Rotating star with expansion pulse */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ 
                scale: phase === 'star' ? [0, 1.2, 1] : 1, 
                rotate: phase === 'star' ? [-180, 0] : [0, 360],
                opacity: 1
              }}
              transition={phase === 'star' 
                ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                : { rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.3 } }
              }
              className="relative"
            >
              <StarEmblem size={48} color="#DED4C7" />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <StarEmblem size={48} color="#713D43" className="opacity-40" />
              </motion.div>
            </motion.div>

            {/* Character-by-character "TRACE" reveal */}
            <div className="overflow-hidden">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                {brandLetters.map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 80, opacity: 0, rotateX: -90 }}
                    animate={phase !== 'star' ? { y: 0, opacity: 1, rotateX: 0 } : {}}
                    transition={{ 
                      duration: 0.6, 
                      delay: i * 0.08, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    className="font-editorial text-5xl sm:text-7xl tracking-[0.35em] font-light inline-block"
                    style={{ perspective: '800px' }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            </div>
            
            {/* Subtitle fade in */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={phase === 'counting' ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-mono text-[10px] sm:text-xs tracking-[0.4em] uppercase text-[#DED4C7]/50"
            >
              30% OIL CONCENTRATION • 18–24 HRS STAY
            </motion.p>
          </div>

          {/* Bottom: Counter & Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline font-mono text-xs sm:text-sm">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-[#DED4C7]/30 tracking-widest uppercase"
              >
                INITIALISING ARCHIVE // BATCH 01
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-3xl sm:text-4xl font-extralight text-[#FAF8F4] font-mono tabular-nums"
              >
                {progress.toString().padStart(3, '0')}
              </motion.span>
            </div>

            {/* Dual progress lines */}
            <div className="space-y-1">
              <div className="w-full h-[1px] bg-white/5 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#713D43] via-[#DED4C7] to-[#FAF8F4]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
              <div className="w-full h-[1px] bg-white/5 overflow-hidden relative">
                <motion.div
                  className="h-full bg-[#713D43]/60"
                  style={{ width: `${Math.min(progress * 1.2, 100)}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-[#DED4C7]/25 uppercase">
              <span>DISCOVERY SET 4 × 5ML // ₹799 (CODE: TRACE2026 → ₹699)</span>
              <span>EST. 2026</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
