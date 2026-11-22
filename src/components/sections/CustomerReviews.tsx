import React from 'react';
import { motion } from 'framer-motion';
import { PRESS_REVIEWS } from '../../data/products';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const CustomerReviews: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-[#FAF8F4] relative border-b border-[#DED4C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43]"
          >
            <StarEmblem size={12} color="#713D43" />
            <span>Early Impressions</span>
          </motion.div>

          <AnimatedText
            text="WORDS THAT LINGER"
            as="h2"
            className="font-editorial text-4xl sm:text-5xl text-[#242321] tracking-wide font-light"
            splitBy="char"
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-[#242321]/75 font-body leading-relaxed"
          >
            Excerpts from our private preview circle and independent olfactory tasters.
          </motion.p>
        </div>

        {/* 3 Review Cards with Staggered Entrance */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {PRESS_REVIEWS.map((review) => (
            <motion.div
              key={review.id}
              variants={{
                hidden: { opacity: 0, y: 35, filter: 'blur(4px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              whileHover={{ y: -6, borderColor: '#B7A99A', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)' }}
              className="p-8 bg-[#F3EFE8]/70 border border-[#DED4C7] flex flex-col justify-between relative group transition-all duration-300"
            >
              <div className="space-y-4">
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#713D43] block">
                  {review.source}
                </span>

                <blockquote className="font-editorial text-xl md:text-2xl text-[#242321] leading-relaxed italic">
                  "{review.quote}"
                </blockquote>
              </div>

              <div className="pt-6 mt-6 border-t border-[#DED4C7]/60 flex items-center justify-between text-xs font-body">
                <div>
                  <span className="font-medium text-[#242321] block">
                    {review.author}
                  </span>
                  <span className="text-[11px] text-[#242321]/60 font-mono">
                    {review.location}
                  </span>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B7A99A] px-2 py-0.5 bg-white border border-[#DED4C7]">
                  Early Preview
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer per brief requirements */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[11px] font-mono text-[#B7A99A] uppercase tracking-wider">
            Transparency Note: Early tasting feedback collected from pre-release testing groups. Verified customer ratings will be published following public shipping.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
