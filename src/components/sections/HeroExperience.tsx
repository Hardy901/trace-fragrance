import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { StarEmblem } from '../brand/TraceLogo';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatINR } from '../../utils/storeLogic';

const heroTextChars = 'BEYOND SCENT.'.split('');
const heroTextChars2 = 'INTO MEMORY.'.split('');

export const HeroExperience: React.FC = () => {
  const { discoverySet, featuredCoupon, discoveryDiscountedPrice } = useStoreConfig();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  });
  
  // Parallax: image moves slower than scroll
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.45], [0, -50]);

  const scrollToExpressions = () => {
    document.querySelector('#expressions')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen w-full flex items-center overflow-hidden bg-[#121110] pt-24 pb-16 md:py-0"
    >
      {/* Parallax Background Campaign Image - Shifted right so all 4 bottles are 100% visible */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: imageY, scale: imageScale }}
          className="w-full h-full relative will-change-transform"
        >
          <img
            src="/assets/hero-campaign.jpg"
            alt="TRACE 30% Fragrance Elixir bottles on raw limestone"
            className="w-full h-full object-cover object-[78%_center] md:object-[82%_center] lg:object-[84%_center] brightness-[0.98] contrast-[1.05]"
            fetchPriority="high"
          />
          {/* High-contrast left-side vignette: keeps left text readable while right bottles remain 100% bright & clear */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] md:w-[55%] lg:w-[48%] bg-gradient-to-r from-[#121110] via-[#121110]/85 to-transparent pointer-events-none" />
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#121110] via-[#121110]/40 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Hero Content Overlay with parallax fade */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center min-h-[84vh] md:min-h-[88vh] py-12"
      >
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-left mr-auto">
          
          {/* Technical Badges with staggered entrance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-2 mb-4"
          >
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#121110]/95 backdrop-blur-md border border-white/20 text-[#DED4C7] text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em]"
            >
              <StarEmblem size={10} color="#713D43" />
              <span>// 30% EXTRAIT ELIXIR</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#713D43]/20 backdrop-blur-md border border-[#713D43]/40 text-[#FCEEF0] text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] font-bold"
            >
              <span>18–24 HRS STAY</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em]"
            >
              <span>
                {!discoverySet.inStock
                  ? `[ DISCOVERY SET // OUT OF STOCK ]`
                  : `[ DISCOVERY SET 4 × 5ML // ${discoverySet.formattedPrice}${
                      featuredCoupon && discoveryDiscountedPrice !== null
                        ? ` • CODE: ${featuredCoupon.code} FOR ${formatINR(discoveryDiscountedPrice)}`
                        : ''
                    } ]`}
              </span>
            </motion.div>
          </motion.div>

          {/* Primary High-Contrast Headline: Character-by-character reveal */}
          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.02] drop-shadow-xl">
            <span className="block overflow-hidden" style={{ perspective: '800px' }}>
              {heroTextChars.map((char, i) => (
                <motion.span
                  key={`l1-${i}`}
                  initial={{ y: 80, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.7 + i * 0.03,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="inline-block"
                  style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
            <span className="block overflow-hidden italic font-normal text-[#DED4C7]" style={{ perspective: '800px' }}>
              {heroTextChars2.map((char, i) => (
                <motion.span
                  key={`l2-${i}`}
                  initial={{ y: 80, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 1.1 + i * 0.03,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="inline-block"
                  style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* Elixir Proposition Copy with smooth fade/blur */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-5 text-sm sm:text-base text-[#F3EFE8]/90 font-body font-light tracking-wide max-w-sm sm:max-w-md leading-relaxed drop-shadow-md"
          >
            Pure, hyper-concentrated luxury fragrance elixirs. Formulated with 30% pure essential oil concentration for an unbroken 18 to 24 hour persistence on skin.
          </motion.p>

          {/* High-Contrast CTAs with micro-interactions */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
          >
            <motion.button
              onClick={scrollToExpressions}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-white text-[#121110] text-xs font-mono uppercase tracking-[0.2em] font-bold hover:bg-[#DED4C7] transition-all duration-300 shadow-2xl flex items-center justify-center gap-2 cursor-pointer group shrink-0"
            >
              <span>Explore 30% Elixirs</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </motion.button>

            <motion.button
              onClick={() => document.querySelector('#discovery-set')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.8)' }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-transparent border border-white/40 text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white transition-all duration-300 text-center cursor-pointer shrink-0"
            >
              {discoverySet.inStock
                ? `Discovery Set (${discoverySet.formattedPrice})`
                : 'Discovery Set (OUT OF STOCK)'}
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.1 }}
          className="absolute bottom-6 right-4 md:right-8 flex items-center gap-3 text-white/60 cursor-pointer group"
          onClick={scrollToExpressions}
        >
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase block text-white/50">
              EXTRAIT ARCHIVE
            </span>
            <span className="text-[9px] font-mono text-white/30">
              ALL 4 BOTTLES VISIBLE →
            </span>
          </div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white transition-colors bg-black/40"
          >
            <ArrowDown className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
