import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../../data/products';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatINR } from '../../utils/storeLogic';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const FAQSection: React.FC = () => {
  const { pricing } = useStoreConfig();

  const resolvedFaqItems = FAQ_ITEMS.map(item =>
    item.id === 'faq-6'
      ? {
          ...item,
          answer: `We offer express shipping across India. Orders are dispatched within 24 to 48 business hours. Delivery takes 2–4 business days for metro areas. Complimentary shipping is provided on orders over ${formatINR(pricing.freeShippingThreshold)}.`,
        }
      : item
  );

  return (
    <section className="py-24 md:py-36 bg-[#F3EFE8] relative border-b border-[#DED4C7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43]"
          >
            <StarEmblem size={12} color="#713D43" />
            <span>Concierge & Inquiries</span>
          </motion.div>

          <AnimatedText
            text="FREQUENTLY ASKED QUESTIONS"
            as="h2"
            className="font-editorial text-4xl sm:text-5xl text-[#242321] tracking-wide font-light"
            splitBy="word"
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-[#242321]/75 font-body leading-relaxed max-w-lg mx-auto"
          >
            Everything you need to know about our formulations, the discovery set, delivery timelines, and bottle care.
          </motion.p>
        </div>

        {/* Semantic Accordion Group as per Modern Web Guidance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
          aria-labelledby="faq-heading"
        >
          {resolvedFaqItems.map((item, idx) => (
            <details
              key={item.id}
              name="trace-faq"
              className="group bg-[#FAF8F4] border border-[#DED4C7] overflow-hidden transition-all duration-300 open:border-[#B7A99A] open:shadow-xs"
              open={idx === 0}
            >
              <summary className="p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none focus:outline-none focus-visible:bg-[#F3EFE8] transition-colors hover:bg-white/80">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#B7A99A] group-open:text-[#713D43] transition-colors">
                    0{idx + 1}
                  </span>
                  <span className="font-editorial text-lg sm:text-xl text-[#242321] group-open:text-[#713D43] transition-colors tracking-wide">
                    {item.question}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#F3EFE8] flex items-center justify-center shrink-0 border border-[#DED4C7] group-open:bg-[#242321] group-open:text-[#FAF8F4] transition-all duration-300">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-open:rotate-180" />
                </div>
              </summary>

              <div className="px-5 pb-6 sm:px-6 pt-1 text-sm text-[#242321]/80 font-body leading-relaxed border-t border-[#DED4C7]/50">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </motion.div>

        {/* Support contact note */}
        <div className="mt-12 text-center pt-8 border-t border-[#DED4C7]/60">
          <p className="text-xs font-body text-[#242321]/70">
            Have a question not addressed here? Contact our concierge at{' '}
            <a
              href="mailto:concierge@tracefragrances.com"
              className="text-[#713D43] font-medium underline underline-offset-4 hover:text-[#242321] transition-colors"
            >
              concierge@tracefragrances.com
            </a>
          </p>
        </div>

      </div>
    </section>
  );
};
