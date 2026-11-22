import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const EditorialGallery: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const bannerScale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);
  const bannerY = useTransform(scrollYProgress, [0, 1], [25, -25]);

  return (
    <section ref={containerRef} className="py-24 md:py-36 bg-[#F3EFE8] relative overflow-hidden border-b border-[#DED4C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43]"
            >
              <StarEmblem size={12} color="#713D43" />
              <span>Visual Campaign Archive</span>
            </motion.div>
            
            <AnimatedText
              text="THE TRACE ARCHIVE"
              as="h2"
              className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#242321] tracking-wide font-light"
              splitBy="char"
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-md text-sm text-[#242321]/75 font-body leading-relaxed"
          >
            A visual chronicle of raw stone, dramatic natural light, and the tactile presentation of fine fragrance craft.
          </motion.p>
        </div>

        {/* Magazine Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Full Width Featured Elemental Panorama */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-12 relative group overflow-hidden border border-[#DED4C7] bg-[#121110] min-h-[220px] md:min-h-[320px]"
          >
            <motion.img
              src="/assets/four-expressions-panorama.jpg"
              alt="TRACE Four Expressions Extrait Elixir Panorama"
              className="w-full h-full object-cover"
              style={{ scale: bannerScale, y: bannerY }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121110]/85 via-transparent to-transparent flex items-end p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.25em] text-[#DED4C7] uppercase block">
                    Plate 00 • Pure Extrait Elixir Panorama
                  </span>
                  <p className="font-editorial text-2xl md:text-3xl text-[#FAF8F4] tracking-wide mt-1">
                    01 Drift (Limestone) • 02 Ignite (Emerald) • 03 Lush (Amber Terracotta) • 04 Vesper (Obsidian)
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 bg-black/60 px-3 py-1 border border-white/10 shrink-0">
                  [ 1024 × 341 PANORAMIC CAPTURE ]
                </span>
              </div>
            </div>
          </motion.div>

          {/* Plate 01: Hero Lineup on raw sandstone (spans 7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 relative group overflow-hidden border border-[#DED4C7] bg-[#FAF8F4] min-h-[360px] lg:min-h-[440px]"
          >
            <img
              src="/assets/hero-campaign.jpg"
              alt="TRACE Fragrances line on raw sandstone"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#242321]/75 via-transparent to-transparent flex items-end p-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.25em] text-[#DED4C7] uppercase block">
                  Plate 01 • Sunlight & Shadow
                </span>
                <p className="font-editorial text-2xl text-[#FAF8F4] tracking-wide mt-1">
                  Four vials bathed in dawn light over rough-hewn stone.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Plate 02: The New Discovery Box Open (spans 5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 relative group overflow-hidden border border-[#DED4C7] bg-[#FAF8F4] min-h-[360px] lg:min-h-[440px]"
          >
            <img
              src="/assets/discovery-box-new.jpg"
              alt="Open Discovery Set box with vials"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#242321]/75 via-transparent to-transparent flex items-end p-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.25em] text-[#DED4C7] uppercase block">
                  Plate 02 • Discovery Presentation
                </span>
                <p className="font-editorial text-xl text-[#FAF8F4] tracking-wide mt-1">
                  Rigid taupe keepsake box with custom internal tray.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Plate 03: Luxury Craft Gift Bag (spans 12 cols / banner) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-12 relative group overflow-hidden border border-[#DED4C7] bg-[#FAF8F4] min-h-[260px]"
          >
            <img
              src="/assets/shopping-bag.jpg"
              alt="TRACE luxury gift bag"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#242321]/75 via-transparent to-transparent flex items-end p-6 md:p-8">
              <div>
                <span className="font-mono text-[10px] tracking-[0.25em] text-[#DED4C7] uppercase block">
                  Plate 03 • The Presentation
                </span>
                <p className="font-editorial text-xl md:text-2xl text-[#FAF8F4] tracking-wide mt-1">
                  "Four Moods. Same Universe."
                </p>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
