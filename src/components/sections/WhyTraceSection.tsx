import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { WHY_TRACE_FEATURES } from '../../data/products';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

const FeatureNumber: React.FC<{ num: string; delay: number }> = ({ num, delay }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayed, setDisplayed] = useState('00');
  
  useEffect(() => {
    if (!isInView) return;
    const target = parseInt(num, 10);
    const duration = 800;
    const startTime = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target).toString().padStart(2, '0'));
      if (progress < 1) requestAnimationFrame(animate);
    };
    setTimeout(() => requestAnimationFrame(animate), delay * 1000);
  }, [isInView, num, delay]);

  return <span ref={ref}>{displayed}</span>;
};

export const WhyTraceSection: React.FC = () => {
  return (
    <section className="py-24 md:py-36 bg-[#FAF8F4] relative border-b border-[#DED4C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43]"
          >
            <StarEmblem size={12} color="#713D43" />
            <span>The Formulation Standard</span>
          </motion.div>

          <AnimatedText
            text="WHY TRACE ELIXIRS?"
            as="h2"
            className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#242321] tracking-wide font-light"
            splitBy="char"
          />

          <motion.p
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm md:text-base text-[#242321]/75 font-body leading-relaxed"
          >
            Engineered at 30% essential oil concentration for continuous 18–24 hour persistence without synthetic fillers.
          </motion.p>
        </div>

        {/* 4 Feature Blocks with staggered reveal */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {WHY_TRACE_FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.number}
              variants={{
                hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              whileHover={{ y: -6, borderColor: '#B7A99A', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08)' }}
              className="p-8 bg-[#F3EFE8]/70 border border-[#DED4C7] flex flex-col justify-between group transition-all duration-300"
            >
              <div>
                <span className="font-editorial text-4xl text-[#B7A99A] group-hover:text-[#713D43] transition-colors block mb-4">
                  <FeatureNumber num={feature.number} delay={idx * 0.1} />
                </span>

                <h3 className="font-editorial text-2xl text-[#242321] tracking-wide mb-3">
                  {feature.title}
                </h3>

                <p className="text-sm text-[#242321]/80 font-body leading-relaxed mb-4">
                  {feature.description}
                </p>
              </div>

              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
                className="origin-left"
              >
                <div className="pt-4 border-t border-[#DED4C7]/60">
                  <p className="text-xs text-[#242321]/60 font-body leading-normal">
                    {feature.detail}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Formulation note */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-[11px] font-mono text-[#B7A99A] uppercase tracking-wider">
            Formulation Certificate: Every TRACE elixir batch is blended with 30% pure fragrance compounds and rested for 120 days prior to bottling.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
