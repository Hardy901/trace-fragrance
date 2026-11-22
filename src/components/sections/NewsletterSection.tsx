import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  return (
    <section className="py-28 md:py-40 bg-[#FAF8F4] relative border-b border-[#DED4C7] overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#713D43] mb-6"
        >
          <StarEmblem size={12} color="#713D43" />
          <span>The Dispatch</span>
        </motion.div>

        <AnimatedText
          text="LEAVE SOMETHING BEHIND."
          as="h2"
          className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-[#242321] tracking-wide font-light leading-[1.08] mb-6"
          splitBy="char"
        />

        <motion.p
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg text-[#242321]/75 font-body leading-relaxed max-w-xl mx-auto mb-10"
        >
          Discover fragrances that become part of your story. Receive early batch access, fragrance architecture essays, and private tasting invitations.
        </motion.p>

        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-[#F3EFE8] border border-[#DED4C7] max-w-md mx-auto space-y-2 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF8F4] text-[#713D43] mx-auto flex items-center justify-center border border-[#DED4C7]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl text-[#242321]">Welcome to the TRACE List</h3>
            <p className="text-xs text-[#242321]/70 font-body">
              Your preview invitation has been registered. You will hear from us before our next limited release.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-2 bg-[#F3EFE8] p-1.5 border border-[#DED4C7] shadow-xs focus-within:border-[#713D43] transition-colors">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL ADDRESS"
                className="flex-1 px-4 py-3 bg-transparent text-xs font-mono tracking-wider text-[#242321] placeholder-[#B7A99A] focus:outline-none"
              />
              <motion.button
                type="submit"
                disabled={status === 'submitting'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-[#242321] text-[#FAF8F4] text-xs font-body uppercase tracking-[0.2em] hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>{status === 'submitting' ? 'Registering...' : 'Join the TRACE List'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
            <p className="mt-3 text-[10px] font-mono text-[#B7A99A] uppercase tracking-wider">
              No spam. Unsubscribe anytime. Dispatched monthly.
            </p>
          </motion.form>
        )}

      </div>
    </section>
  );
};
