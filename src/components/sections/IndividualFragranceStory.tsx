import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, Layers, Droplets, Wind, ArrowRight } from 'lucide-react';
import type { FragranceProduct } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatINR } from '../../utils/storeLogic';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const IndividualFragranceStory: React.FC = () => {
  const { fragrances, discoverySet, featuredCoupon, discoveryDiscountedPrice } = useStoreConfig();
  const [activeIdx, setActiveIdx] = useState(0);
  const fragrance: FragranceProduct = fragrances[activeIdx];
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // Pure luxury warm charcoal & stone palette (ZERO blue tint, 100% natural photo presentation)
  const themes = [
    {
      bgDark: '#131211',
      bgCard: '#1B1A18',
      accent: '#DED4C7',
      textLight: '#FAF8F4',
      badge: 'border-[#DED4C7]/30 bg-white/5 text-[#DED4C7]'
    },
    {
      bgDark: '#131211',
      bgCard: '#1B1A18',
      accent: '#B7A99A',
      textLight: '#FAF8F4',
      badge: 'border-[#B7A99A]/30 bg-white/5 text-[#DED4C7]'
    },
    {
      bgDark: '#161314',
      bgCard: '#201A1C',
      accent: '#A86E77',
      textLight: '#FAF8F4',
      badge: 'border-[#A86E77]/30 bg-white/5 text-[#E0ACB4]'
    },
    {
      bgDark: '#141210',
      bgCard: '#1E1A16',
      accent: '#C99A6B',
      textLight: '#FAF8F4',
      badge: 'border-[#C99A6B]/30 bg-white/5 text-[#DFC19E]'
    }
  ];

  const currentTheme = themes[activeIdx];

  const handleAddDiscoverySet = () => {
    addItem({
      id: discoverySet.id,
      name: discoverySet.name,
      category: discoverySet.subtitle,
      price: discoverySet.price,
      image: '/assets/discovery-box-new.jpg',
      volume: discoverySet.configuration
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <section
      id="expressions"
      className="py-24 md:py-36 transition-colors duration-500 relative overflow-hidden bg-[#131211]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with luxury typography & masked text reveal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6 border-b border-white/10 pb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] mb-3 text-white/70"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#713D43] animate-ping" />
              <span>// THE EXTRAIT ELIXIR QUADRANT</span>
              <span>•</span>
              <span className="text-[#DED4C7] font-bold">[ 30% OIL DENSITY ]</span>
            </motion.div>
            
            <AnimatedText
              text={"FOUR ELIXIRS.\n18–24 HOURS UNBROKEN STAY."}
              as="h2"
              className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight [&_.block:last-child]:italic [&_.block:last-child]:font-normal [&_.block:last-child]:text-[#DED4C7]"
              splitBy="word"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-md font-mono text-xs text-white/60 space-y-1"
          >
            <p className="text-white font-medium">// FORMULATION: 30% PURE EXTRAIT CONCENTRATION</p>
            <p>// MACERATION: 120–150 DAYS CELLARED IN DARK CHAMBERS</p>
            <p className="text-white/80 pt-1 font-body text-sm">
              Engineered with extreme oil density to anchor tightly to skin warmth and fabric fibers without premature evaporation.
            </p>
          </motion.div>
        </div>

        {/* Dialed / 2authenticators Luxury Pill Tabs with interactive feedback */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-12 gap-3 no-scrollbar">
          {fragrances.map((f, i) => {
            const isActive = activeIdx === i;
            return (
              <motion.button
                key={f.id}
                onClick={() => setActiveIdx(i)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group px-6 py-3.5 border transition-all duration-300 flex items-center gap-3 cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-white text-[#121110] border-white shadow-2xl scale-[1.02]'
                    : 'bg-white/5 text-white/70 border-white/15 hover:border-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-xs transition-colors ${
                  isActive ? 'bg-[#121110] text-white' : 'bg-white/10 text-white/60'
                }`}>
                  0{i + 1}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-medium">
                  {f.name.replace(' ELIXIR', '')}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-wider hidden md:inline opacity-70 ${
                  isActive ? 'text-[#121110]' : 'text-white/50'
                }`}>
                  [30% EXTRAIT]
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic Story Showcase Card with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={fragrance.id}
            initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/15 p-6 sm:p-10 lg:p-12 shadow-2xl relative"
            style={{ backgroundColor: currentTheme.bgCard }}
          >
            {/* Top technical corner marks */}
            <div className="absolute top-3 left-3 font-mono text-[9px] text-white/30 uppercase tracking-widest">
              + TRC // ELIXIR_SPEC_0{activeIdx + 1}
            </div>
            <div className="absolute top-3 right-3 font-mono text-[9px] text-white/30 uppercase tracking-widest">
              30% OIL PURITY CERTIFIED +
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Direct Pristine High-Resolution Photo (NO BLUE, NO TINT, NO GLOW OVERLAY) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-full max-w-[320px] sm:max-w-[360px] h-[490px] flex items-center justify-center bg-[#151413] border border-white/20 overflow-hidden shadow-2xl group">
                  {/* Direct High-Resolution Elemental Sanctuary Photograph with zero tint */}
                  <motion.img
                    src={fragrance.panelImage}
                    alt={`TRACE 0${activeIdx + 1} ${fragrance.name} in elemental sanctuary`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106 brightness-100 contrast-100"
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Clean Technical Tag at bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] font-mono text-white/90 bg-[#121110]/95 backdrop-blur-md px-3 py-1.5 border border-white/15 z-20">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <StarEmblem size={10} color="#DED4C7" />
                      30% OIL EXTRAIT
                    </span>
                    <span className="text-[#DED4C7] font-bold">18–24 HRS STAY</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Technical Dashboard & Architecture */}
              <div className="lg:col-span-7 space-y-6 text-white">
                
                {/* Header & Category */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 border text-xs font-mono uppercase tracking-widest ${currentTheme.badge}`}>
                      {fragrance.category.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-0.5 border border-white/20 bg-white/5 text-xs font-mono uppercase tracking-widest text-white/90 font-bold">
                      NO. {fragrance.number}
                    </span>
                    <span className="px-2.5 py-0.5 border border-[#713D43]/40 bg-[#713D43]/20 text-xs font-mono uppercase tracking-widest text-[#FCEEF0] font-bold">
                      18–24 HOURS
                    </span>
                  </div>

                  <h3 className="font-editorial text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white font-light">
                    {fragrance.name}
                  </h3>

                  <p className="mt-2 text-base sm:text-lg font-light text-white/80 font-body leading-relaxed">
                    "{fragrance.tagline}"
                  </p>
                </div>

                {/* Technical Specifications Table */}
                <div className="border border-white/15 divide-y divide-white/10 bg-black/20 font-mono text-xs">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-white/40 uppercase tracking-wider">// OIL CONCENTRATION</span>
                    <span className="sm:col-span-2 text-white font-bold flex items-center justify-between">
                      <span className="text-[#DED4C7]">{fragrance.metrics.concentration}</span>
                      <span className="text-[10px] text-white/40 uppercase font-mono">Pure Oil Density</span>
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-white/40 uppercase tracking-wider">// VERIFIED LONGEVITY</span>
                    <span className="sm:col-span-2 text-white font-bold text-[#DED4C7]">{fragrance.metrics.longevity}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-white/40 uppercase tracking-wider">// EXTRACTION QUALITY</span>
                    <span className="sm:col-span-2 text-white font-medium">{fragrance.metrics.oilPurity}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <span className="text-white/40 uppercase tracking-wider">// CELLAR MACERATION</span>
                    <span className="sm:col-span-2 text-white font-medium">{fragrance.metrics.maceration}</span>
                  </motion.div>
                </div>

                {/* Fragrance Notes Architecture */}
                <div className="space-y-3">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60 block">
                    // RAW BOTANICAL ARCHITECTURE & ACCORDS
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <motion.div
                      whileHover={{ y: -3, borderColor: 'rgba(255,255,255,0.3)' }}
                      className="p-3.5 border border-white/15 bg-black/25 transition-all"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                        <Wind className="w-3 h-3" />
                        <span>TOP NOTES</span>
                      </div>
                      <p className="font-body text-xs text-white font-medium">
                        {fragrance.notes.top.join(' • ')}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -3, borderColor: 'rgba(255,255,255,0.3)' }}
                      className="p-3.5 border border-white/15 bg-black/25 transition-all"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                        <Droplets className="w-3 h-3" />
                        <span>HEART NOTES</span>
                      </div>
                      <p className="font-body text-xs text-white font-medium">
                        {fragrance.notes.heart.join(' • ')}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -3, borderColor: 'rgba(255,255,255,0.3)' }}
                      className="p-3.5 border border-white/15 bg-black/25 transition-all"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                        <Layers className="w-3 h-3" />
                        <span>BASE NOTES</span>
                      </div>
                      <p className="font-body text-xs text-white font-medium">
                        {fragrance.notes.base.join(' • ')}
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* 50ml Status & Discovery Set Conversion Action */}
                <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {discoverySet.formattedPrice}
                      </span>
                      {featuredCoupon && discoveryDiscountedPrice !== null && (
                        <span className="font-mono text-xs text-[#713D43] bg-[#713D43]/20 px-2 py-0.5 border border-[#713D43]/40 font-bold">
                          {formatINR(discoveryDiscountedPrice)} WITH CODE &apos;{featuredCoupon.code}&apos;
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-white/50 block mt-1">
                      Full flacons cellaring in archive • Available exclusively in 4 × 5ml set
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={handleAddDiscoverySet}
                      disabled={added}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 sm:flex-initial px-8 py-4 bg-white text-[#121110] font-mono text-xs uppercase tracking-[0.25em] font-bold hover:bg-[#DED4C7] transition-all flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer"
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4 text-[#713D43]" />
                          <span>DISCOVERY SET ADDED</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>ACQUIRE DISCOVERY SET // {discoverySet.formattedPrice}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Discovery Set promo info bar */}
                <motion.div
                  whileHover={{ borderColor: 'rgba(255,255,255,0.25)' }}
                  className="p-3 border border-white/10 bg-white/5 flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="text-white/70">
                    Includes all 4 elixirs (01 Drift, 02 Ignite, 03 Lush, 04 Vesper)
                  </span>
                  <a
                    href="#discovery-set"
                    className="text-[#DED4C7] hover:underline flex items-center gap-1 font-semibold group"
                  >
                    <span>View Box Details</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </motion.div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
