import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, Gift, Sparkles, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { describeCouponSavings, formatINR } from '../../utils/storeLogic';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

export const DiscoverySetSection: React.FC = () => {
  const { discoverySet, featuredCoupon, discoveryDiscountedPrice } = useStoreConfig();
  const { addItem, applyCoupon, couponCode } = useCart();
  const [activeImage, setActiveImage] = useState<'open' | 'closed'>('open');
  const [added, setAdded] = useState(false);

  const imagesMap = {
    open: { src: '/assets/discovery-box-new.jpg', label: 'Open Presentation • 4 Vials & Inlay Card' },
    closed: { src: '/assets/discovery-box-closed.jpg', label: 'Torn-Rock Rigid Keepsake Box' }
  };

  const handleAddToCart = () => {
    if (!discoverySet.inStock) return;
    addItem({
      id: discoverySet.id,
      name: discoverySet.name,
      category: discoverySet.subtitle,
      price: discoverySet.price,
      image: '/assets/discovery-box-new.jpg',
      volume: discoverySet.configuration
    });
    if (!couponCode && featuredCoupon) {
      applyCoupon(featuredCoupon.code);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <section id="discovery-set" className="py-24 md:py-36 bg-[#F3EFE8] relative overflow-hidden border-b border-[#DED4C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Sub-header Badge */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F4] border border-[#DED4C7] text-xs font-mono tracking-[0.25em] uppercase text-[#713D43] mb-4 shadow-xs"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>The Essential Introduction</span>
          </motion.div>

          <AnimatedText
            text={"FOUR EXPRESSIONS.\nONE DISCOVERY."}
            as="h2"
            className="font-editorial text-4xl sm:text-6xl text-[#242321] tracking-wide font-light [&_.block:last-child]:italic [&_.block:last-child]:font-normal [&_.block:last-child]:text-[#713D43]"
            splitBy="word"
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-[#242321]/75 font-body leading-relaxed"
          >
            Not sure which fragrance feels like you? Discover all four TRACE expressions in one carefully presented discovery set.
          </motion.p>
        </div>

        {/* Product Details Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAF8F4] border border-[#DED4C7] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          
          {/* Gallery View Column (Left) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DED4C7]">
            {/* Main Interactive Preview */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#121110] border border-[#DED4C7] shadow-inner mb-6 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  src={imagesMap[activeImage].src}
                  alt={imagesMap[activeImage].label}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-104 ${
                    !discoverySet.inStock ? 'grayscale opacity-75' : ''
                  }`}
                />
              </AnimatePresence>

              {!discoverySet.inStock && (
                <div className="absolute top-4 left-4 bg-[#991B1B] text-white px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] border border-white/30 shadow-lg">
                  OUT OF STOCK
                </div>
              )}

              {/* Tag overlay */}
              <div className="absolute bottom-4 left-4 bg-[#242321]/85 backdrop-blur-xs text-[#FAF8F4] px-3 py-1 font-mono text-[10px] uppercase tracking-widest border border-white/10">
                {imagesMap[activeImage].label}
              </div>
            </div>

            {/* View Switcher Tabs with animated borders */}
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(imagesMap) as Array<keyof typeof imagesMap>).map(key => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveImage(key)}
                  className={`p-3 border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    activeImage === key
                      ? 'border-[#242321] bg-white ring-1 ring-[#713D43] shadow-xs'
                      : 'border-[#DED4C7] bg-[#F3EFE8]/70 hover:bg-white'
                  }`}
                >
                  <img
                    src={imagesMap[key].src}
                    alt={imagesMap[key].label}
                    className="w-12 h-12 object-cover border border-[#DED4C7]"
                  />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#713D43] block">
                      {key === 'open' ? 'VIEW 01' : 'VIEW 02'}
                    </span>
                    <span className="font-editorial text-sm text-[#242321] block font-medium">
                      {key === 'open' ? 'Open Presentation' : 'Keepsake Box Lid'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Purchasing & Story Details Column (Right) */}
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-8 bg-[#FAF8F4]">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-[0.28em] text-[#713D43] uppercase block mb-1">
                  Limited Edition Packaging
                </span>
                <h3 className="font-editorial text-3xl sm:text-4xl text-[#242321] tracking-wide">
                  {discoverySet.name}
                </h3>
                <p className="text-xs font-mono text-[#B7A99A] uppercase tracking-widest mt-1">
                  Live Price • {discoverySet.configuration}
                </p>
              </div>

              <div className="border-y border-[#DED4C7] py-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-[#242321]">
                    {discoverySet.formattedPrice}
                  </span>
                  {!discoverySet.inStock ? (
                    <span className="px-2.5 py-0.5 bg-[#991B1B] text-white text-xs font-mono font-bold uppercase tracking-widest">
                      OUT OF STOCK
                    </span>
                  ) : (
                    featuredCoupon &&
                    discoveryDiscountedPrice !== null && (
                      <span className="px-2.5 py-0.5 bg-[#713D43]/15 border border-[#713D43]/40 text-[#713D43] text-xs font-mono font-bold">
                        {formatINR(discoveryDiscountedPrice)} WITH CODE &apos;{featuredCoupon.code}&apos;
                      </span>
                    )
                  )}
                </div>
                {featuredCoupon && (
                  <p className="text-xs text-[#713D43] font-body mt-2 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Use coupon code <strong>{featuredCoupon.code}</strong> for{' '}
                      {describeCouponSavings(featuredCoupon)} at checkout
                    </span>
                  </p>
                )}
              </div>

              <p className="text-sm font-body text-[#242321]/80 leading-relaxed">
                {discoverySet.fullStory}
              </p>

              {/* Packaging & Inclusions list */}
              <div className="space-y-3 bg-[#F3EFE8]/70 p-4 border border-[#DED4C7] text-xs font-body">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#242321] block font-semibold">
                  What&apos;s Inside The Box:
                </span>
                <ul className="space-y-2 text-[#242321]/85">
                  {discoverySet.packagingDetails.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * idx, duration: 0.4 }}
                      className="flex items-start gap-2"
                    >
                      <StarEmblem size={10} color="#713D43" className="mt-1 shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Purchase CTA */}
            <div className="pt-6 border-t border-[#DED4C7] space-y-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={added || !discoverySet.inStock}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.25em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer group disabled:opacity-60"
              >
                {!discoverySet.inStock ? (
                  <span>OUT OF STOCK</span>
                ) : added ? (
                  <>
                    <Check className="w-4 h-4 text-[#DED4C7]" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Discover the Set • {discoverySet.formattedPrice}
                      {featuredCoupon && discoveryDiscountedPrice !== null
                        ? ` (${formatINR(discoveryDiscountedPrice)} with code)`
                        : ''}
                    </span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-between text-[11px] text-[#242321]/60 font-body">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#B7A99A]" />
                  <span>Complimentary Luxury Gift Packaging</span>
                </span>
                <span>{discoverySet.inStock ? 'Ready to ship' : 'Restocking soon'}</span>
              </div>
            </div>

          </div>

        </motion.div>

      </div>
    </section>
  );
};
