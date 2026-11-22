import React from 'react';
import { motion } from 'framer-motion';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const PhilosophySection: React.FC = () => {
  return (
    <section className="relative py-28 md:py-44 bg-[#242321] text-[#FAF8F4] overflow-hidden">
      {/* Animated ambient lighting */}
      <motion.div
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, #713D43 0%, transparent 60%)',
            'radial-gradient(circle at 40% 60%, #713D43 0%, transparent 55%)',
            'radial-gradient(circle at 60% 40%, #713D43 0%, transparent 60%)',
            'radial-gradient(circle at 50% 50%, #713D43 0%, transparent 60%)'
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col items-center text-center">
          
          {/* Standalone Four-Point Star Emblem with 3D entrance and smooth rotation */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-10 flex flex-col items-center"
          >
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              >
                <StarEmblem size={64} color="#DED4C7" className="drop-shadow-2xl" />
              </motion.div>
              {/* Pulsing halo rings */}
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-20 h-20 border border-[#DED4C7]/20 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 2.4, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute w-20 h-20 border border-[#713D43]/20 rounded-full"
              />
              <div className="absolute inset-0 bg-[#713D43]/30 rounded-full blur-xl pointer-events-none" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-[11px] font-mono tracking-[0.35em] uppercase text-[#DED4C7] mt-3"
            >
              SAME AIR. DIFFERENT VERSIONS OF YOU.
            </motion.div>
          </motion.div>

          {/* Section Headline with word reveal */}
          <div className="max-w-3xl space-y-6">
            <AnimatedText
              text={"YOU MAY FORGET THE MOMENT.\nBUT REMEMBER HOW IT FELT."}
              as="h2"
              className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light tracking-[0.04em] leading-[1.08] [&_.block:last-child]:italic [&_.block:last-child]:font-normal [&_.block:last-child]:text-[#DED4C7]"
              splitBy="word"
              delay={0.2}
            />

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="w-16 h-[1px] bg-[#713D43] mx-auto my-6 origin-center"
            />

            <motion.p
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base sm:text-xl text-[#F3EFE8]/80 font-body font-light leading-relaxed max-w-2xl mx-auto"
            >
              Perfume does not live on glass or paper. It lives in memory. When you walk into a room, your scent precedes you. When you leave, it is the invisible impression you leave behind.
            </motion.p>
          </div>

          {/* Core Philosophy Pillars with staggered entrance */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.4 }
              }
            }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl w-full text-center"
          >
            {[
              { label: 'IDENTITY', text: 'Scent as an intimate expression of self' },
              { label: 'INDIVIDUALITY', text: 'Four moods designed to reflect different days' },
              { label: 'MEMORY', text: 'The olfactory imprint anchored in recollection' },
              { label: 'PRESENCE', text: 'Leaving a subtle mark without overpowering' }
            ].map((pillar, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                  }
                }}
                whileHover={{ y: -4, borderColor: 'rgba(243, 239, 232, 0.3)' }}
                className="p-4 border border-[#F3EFE8]/10 bg-[#FAF8F4]/5 backdrop-blur-xs space-y-1.5 transition-all duration-300"
              >
                <span className="font-mono text-xs tracking-[0.25em] text-[#DED4C7] block">
                  {pillar.label}
                </span>
                <p className="text-xs text-[#FAF8F4]/70 font-body leading-snug">
                  {pillar.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>

      </div>
    </section>
  );
};
