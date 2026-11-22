import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, ChevronUp, ShieldAlert, ArrowRight } from 'lucide-react';
import { StarEmblem } from '../brand/TraceLogo';

export const SecretArchive50ml: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shakeLock, setShakeLock] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  // Listen for navigation trigger from Navbar to auto-expand
  useEffect(() => {
    const handleOpen = () => {
      setIsExpanded(true);
    };
    window.addEventListener('open-secret-archive', handleOpen);
    return () => window.removeEventListener('open-secret-archive', handleOpen);
  }, []);

  const handleLockAttempt = () => {
    setShakeLock(true);
    setLockNotice('CLEARANCE REQUIRED // ATELIER VAULT CURRENTLY SEALED');
    setTimeout(() => setShakeLock(false), 500);
    setTimeout(() => setLockNotice(null), 3500);
  };

  return (
    <section
      id="archive-50ml"
      className="py-16 md:py-24 bg-[#0B0A09] text-[#FAF8F4] relative overflow-hidden border-t border-b border-[#2A2724]"
    >
      {/* Fallback anchor for old link references */}
      <span id="archive-100ml" className="absolute -top-20 opacity-0 pointer-events-none" />

      {/* Atmospheric radial background aura */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#713D43] rounded-full blur-[160px]" />
      </div>

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #FAF8F4 1px, transparent 1px), linear-gradient(to bottom, #FAF8F4 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* COLLAPSED STATE: Glowing Button */}
        {!isExpanded && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {/* Glowing Interactive Pill Button */}
              <div className="relative inline-block group">
                {/* Pulsing ambient glow layer */}
                <motion.div
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                    scale: [1, 1.04, 1]
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#713D43] via-[#DED4C7] to-[#713D43] opacity-70 blur-lg group-hover:opacity-100 transition duration-500"
                />

                <motion.button
                  onClick={() => setIsExpanded(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative px-8 sm:px-12 py-4 sm:py-5 bg-[#121110] border border-[#DED4C7]/40 rounded-full flex items-center gap-3 sm:gap-4 shadow-2xl cursor-pointer transition-all duration-300 group-hover:border-white"
                  aria-label="Reveal Secret Coming Soon Project"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                  >
                    <StarEmblem size={18} color="#DED4C7" />
                  </motion.div>

                  <span className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-white font-bold">
                    SOMETHING COMING SOON
                  </span>

                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.2, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-[#713D43] shadow-[0_0_8px_#713D43]"
                  />
                </motion.button>
              </div>

              <p className="font-mono text-[10px] sm:text-[11px] text-white/50 tracking-[0.25em] uppercase">
                [ ✦ CLICK TO ACCESS CLASSIFIED ATELIER // HINT: TRACE 50 ]
              </p>
            </motion.div>
          </div>
        )}

        {/* EXPANDED STATE: Smooth Animation Revealing the Locked Vault */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, height: 0 }}
              animate={{ opacity: 1, scale: 1, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.96, height: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              {/* Header inside the expanded card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#171513] border border-[#713D43]/40 text-[10px] font-mono tracking-[0.3em] uppercase text-[#DED4C7]">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-[#713D43]"
                  />
                  <span>// CLASSIFIED ARCHIVE • STRICTLY RESTRICTED</span>
                </div>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-1.5 border border-white/20 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-mono tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>MINIMIZE ARCHIVE</span>
                </button>
              </div>

              {/* Title & Slogan */}
              <div className="text-center mb-10">
                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight">
                  SOMETHING HEAVIER IS COMING.
                </h2>
                <div className="mt-3 inline-block px-4 py-1.5 border border-[#713D43]/50 bg-[#713D43]/15">
                  <span className="font-mono text-xs sm:text-sm text-[#DED4C7] font-bold tracking-[0.25em] uppercase">
                    COMING SOON • HINT: TRACE 50
                  </span>
                </div>
                <p className="mt-3 font-mono text-[11px] sm:text-xs text-white/50 tracking-widest uppercase">
                  CELLAR MATURATION IN PROGRESS • SECRECY PROTOCOL ACTIVE
                </p>
              </div>

              {/* Central Classified Stage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#121110] border border-white/15 p-6 sm:p-10 lg:p-12 shadow-2xl relative">
                
                {/* Dossier Watermark Headers */}
                <div className="absolute top-4 left-4 font-mono text-[9px] text-white/30 uppercase tracking-widest">
                  PROJECT // TRC-50-CLASSIFIED
                </div>
                <div className="absolute top-4 right-4 font-mono text-[9px] text-[#713D43] uppercase tracking-widest font-bold">
                  STATUS // SEALED & RESTRICTED
                </div>

                {/* Left Column: Monolithic 50ml Flacon Silhouette */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
                  <div className="relative w-56 h-80 sm:w-64 sm:h-96 flex items-center justify-center border border-white/15 bg-[#0A0908] overflow-hidden shadow-2xl group">
                    {/* Silhouette Monolith with glow */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(113, 61, 67, 0.2)',
                          '0 0 40px rgba(222, 212, 199, 0.25)',
                          '0 0 20px rgba(113, 61, 67, 0.2)'
                        ]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-24 h-60 sm:w-28 sm:h-72 border border-white/20 bg-gradient-to-b from-[#1C1A17] via-[#100F0E] to-[#0A0908] flex flex-col items-center justify-between p-4 relative"
                    >
                      {/* Heavy cap */}
                      <div className="w-16 h-14 bg-[#1F1D1A] border-b border-white/10 flex items-center justify-center shadow-lg">
                        <StarEmblem size={16} color="#713D43" />
                      </div>

                      {/* Central Star with rotating halo */}
                      <div className="my-auto relative flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                          <StarEmblem size={34} color="#DED4C7" />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute w-12 h-12 border border-[#DED4C7]/40 rounded-full"
                        />
                      </div>

                      {/* Bottle markings: mysterious hint only */}
                      <div className="text-center font-mono text-[9px] text-white/70 tracking-[0.25em] space-y-1">
                        <span className="block font-bold text-white text-[11px]">TRACE</span>
                        <span className="block text-[8px] text-[#DED4C7] font-bold">HINT: 50</span>
                        <span className="block text-[7px] text-[#713D43] font-bold tracking-widest">[ CLASSIFIED ]</span>
                      </div>
                    </motion.div>

                    {/* Watermark Classified Stamp */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="rotate-[-25deg] border-2 border-[#713D43]/60 bg-black/60 px-6 py-2 text-xs font-mono tracking-[0.3em] uppercase text-[#DED4C7] font-bold shadow-2xl backdrop-blur-xs">
                        COMING SOON
                      </div>
                    </div>
                  </div>

                  <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-white/40 text-center">
                    [ CONCEALED ARTIFACT • ATELIER ARCHIVE ]
                  </span>
                </div>

                {/* Right Column: Encrypted Classified Dossier */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono tracking-[0.25em] text-[#713D43] uppercase font-bold block mb-2">
                      // ARCHIVE RECORD: CLASSIFIED
                    </span>
                    <h3 className="font-editorial text-3xl sm:text-4xl text-white tracking-wide">
                      CLASSIFIED INAUGURATION.
                    </h3>

                    {/* Redacted Cipher Blocks to keep it 100% hidden */}
                    <div className="mt-3 space-y-2 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 bg-white/20 w-40 inline-block rounded-xs" />
                        <span className="text-[10px] font-mono text-[#713D43] font-bold tracking-widest">[REDACTED]</span>
                        <span className="h-3.5 bg-white/10 w-24 inline-block rounded-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 bg-white/10 w-28 inline-block rounded-xs" />
                        <span className="h-3.5 bg-white/25 w-48 inline-block rounded-xs" />
                        <span className="h-3.5 bg-white/15 w-16 inline-block rounded-xs" />
                      </div>
                      <p className="pt-1.5 text-xs font-mono text-white/50 tracking-wider">
                        All technical specifications, volume, and notes remain locked in the dark cellar. No details disclosed until public debut.
                      </p>
                    </div>
                  </div>

                  {/* High-Security Locked Vault Card */}
                  <motion.div
                    animate={shakeLock ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="p-6 sm:p-8 border border-[#713D43]/60 bg-black/50 space-y-5 relative overflow-hidden"
                  >
                    {/* Subtle security mesh background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#713D43]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#713D43]/20 border border-[#713D43]/50 shrink-0">
                        <Lock className="w-6 h-6 text-[#DED4C7]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs uppercase tracking-widest text-white font-bold">
                            VAULT STATUS: LOCKED
                          </span>
                          <span className="px-2 py-0.5 bg-[#713D43]/40 border border-[#713D43]/60 text-[9px] font-mono text-[#FAF8F4] font-bold">
                            RESTRICTED
                          </span>
                        </div>
                        <p className="text-xs font-mono text-white/70">
                          CIPHER: <span className="text-[#DED4C7] font-bold">TRACE-50-CELLAR-SEALED</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#141211] border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#DED4C7] font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-[#713D43]" />
                        <span>COMING SOON • HINT: TRACE 50</span>
                      </div>
                      <p className="text-xs font-mono text-white/50 leading-relaxed">
                        Vault cipher is sealed under cellar protocols. Dossier details are concealed until official unveiling.
                      </p>
                    </div>

                    {/* Attempt Unlock / Restricted Action */}
                    <div className="space-y-2">
                      <button
                        onClick={handleLockAttempt}
                        className="w-full py-4 bg-[#1C1A17] hover:bg-[#25221F] border border-[#713D43]/50 text-white font-mono text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-[0.99]"
                      >
                        <Lock className="w-4 h-4 text-[#713D43]" />
                        <span>VAULT LOCKED — RELEASE IMMINENT</span>
                      </button>

                      {lockNotice && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#FCEEF0] bg-[#713D43]/30 border border-[#713D43] py-2 px-3"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-[#FAF8F4]" />
                          <span>{lockNotice}</span>
                        </motion.div>
                      )}

                      <p className="text-center font-mono text-[9px] text-white/40 tracking-wider">
                        SECURED UNDER 30% CONCENTRATION ATELIER PROTOCOLS
                      </p>
                    </div>
                  </motion.div>

                  {/* Footnote & Return Link */}
                  <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40 pt-2 border-t border-white/10 gap-2">
                    <span className="text-[#DED4C7]">STATUS: CELLAR AGING IN PROGRESS</span>
                    <a href="#hero" className="text-white/60 hover:text-white flex items-center gap-1">
                      <span>Return to Atelier</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

// Backwards-compatibility export for any existing references
export const SecretArchive100ml = SecretArchive50ml;
