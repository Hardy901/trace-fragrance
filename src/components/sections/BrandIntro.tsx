import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

// Smooth counting stat component
const StatCounter: React.FC<{ target: number; suffix?: string; label: string }> = ({ target, suffix = '', label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1400;
    const startTime = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target]);

  return (
    <div ref={ref}>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="font-editorial text-3xl md:text-4xl text-[#242321] block tabular-nums"
      >
        {count}{suffix}
      </motion.span>
      <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#B7A99A]">
        {label}
      </span>
    </div>
  );
};

export const BrandIntro: React.FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ['start end', 'end start']
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section id="story" className="py-24 md:py-36 bg-[#FAF8F4] relative overflow-hidden border-b border-[#DED4C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Editorial Text Column */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43]"
            >
              <StarEmblem size={12} color="#713D43" />
              <span>Haute Parfumerie & Concentration</span>
            </motion.div>

            <AnimatedText
              text={"PURE OIL DENSITY.\n18–24 HOURS UNBROKEN STAY."}
              as="h2"
              className="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#242321] font-light leading-[1.12] tracking-wide [&_.block:last-child]:italic [&_.block:last-child]:font-normal [&_.block:last-child]:text-[#713D43]"
              splitBy="word"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 text-[#242321]/80 font-body text-base md:text-lg leading-relaxed max-w-xl"
            >
              <p>
                <strong className="font-semibold text-[#242321]">TRACE</strong> was conceived to challenge diluted commercial perfumery. While standard perfumes evaporate within hours, we formulate true Extrait Elixirs at a relentless <strong className="text-[#242321]">30% essential oil concentration</strong>.
              </p>
              <p>
                Each creation rests in dark, temperature-controlled chambers for 120 to 150 days of cellar maceration. The result is a heavy, resinous density that bonds intimately to body warmth, delivering an unbroken 18 to 24 hour projection.
              </p>
              <p className="font-editorial text-xl italic text-[#242321]">
                Four hyper-concentrated elixirs. Pure botanical density. One indelible TRACE.
              </p>
            </motion.div>

            {/* Micro stats with live counters */}
            <div className="pt-6 border-t border-[#DED4C7] grid grid-cols-3 gap-4 font-mono">
              <StatCounter target={30} suffix="%" label="Oil Density" />
              <StatCounter target={24} suffix="h" label="Skin Stay" />
              <StatCounter target={120} suffix="d" label="Macerated" />
            </div>
          </div>

          {/* Cinematic Image Column featuring Discovery Set Box with parallax & clip-path reveal */}
          <div className="lg:col-span-5 relative" ref={imageRef}>
            <motion.div
              initial={{ opacity: 0, clipPath: 'inset(10% 10% 10% 10%)' }}
              whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-square overflow-hidden border border-[#DED4C7] shadow-xl group bg-[#F3EFE8]"
            >
              <motion.img
                src="/assets/discovery-box-new.jpg"
                alt="TRACE Elixir Discovery Set presentation box with four 30% vials"
                className="w-full h-full object-cover"
                style={{ scale: imageScale, y: imageY }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#242321]/75 via-transparent to-transparent flex items-end p-6">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#DED4C7] block">
                    Discovery Edition • 4 × 5 ml Elixirs
                  </span>
                  <p className="font-editorial text-xl text-[#FAF8F4] italic">
                    "Same air. Different versions of you."
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
