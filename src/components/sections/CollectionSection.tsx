import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus, Check } from 'lucide-react';
import { FRAGRANCES, DISCOVERY_SET, type FragranceProduct } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { StarEmblem } from '../brand/TraceLogo';
import { AnimatedText } from '../common/AnimatedText';

interface CollectionSectionProps {
  onSelectProduct: (product: FragranceProduct) => void;
}

export const CollectionSection: React.FC<CollectionSectionProps> = ({ onSelectProduct }) => {
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (e: React.MouseEvent, product: FragranceProduct) => {
    e.stopPropagation();
    addItem({
      id: DISCOVERY_SET.id,
      name: DISCOVERY_SET.name,
      category: DISCOVERY_SET.subtitle,
      price: DISCOVERY_SET.price,
      image: '/assets/discovery-box-new.jpg',
      volume: DISCOVERY_SET.configuration
    });

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId(null);
    }, 1200);
  };

  return (
    <section id="collection" className="py-24 md:py-36 bg-[#171614] text-[#FAF8F4] relative border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Dialed Coffee Bold Contrast */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.25em] uppercase text-[#DED4C7]"
            >
              <StarEmblem size={12} color="#713D43" />
              <span>// THE CORE COLLECTION</span>
            </motion.div>
            
            <AnimatedText
              text={"FOUR SCENTS.\nFOUR EXPRESSIONS."}
              as="h2"
              className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-light [&_.block:last-child]:italic [&_.block:last-child]:font-normal [&_.block:last-child]:text-[#DED4C7]"
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
            <p>// 4 × 5ML DISCOVERY SET // ₹799 (₹699 WITH 'TRACE2026')</p>
            <p className="text-white/80 font-body text-sm pt-1">
              Full flacons are currently cellaring in archive. Discover all four expressions now in the curated presentation box.
            </p>
          </motion.div>
        </div>

        {/* 4-Column Grid with Dialed Coffee High Contrast Styling & Staggered Motion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {FRAGRANCES.map((product, idx) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 35, filter: 'blur(4px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              onClick={() => onSelectProduct(product)}
              className="group bg-[#21201D] border border-white/15 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-white/40 hover:bg-[#282623] hover:shadow-2xl relative"
            >
              {/* Technical Corner Badge */}
              <div className="absolute top-3 left-3 z-20 bg-black/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono tracking-widest text-white uppercase border border-white/20">
                0{idx + 1} // {product.name.replace(' ELIXIR', '')}
              </div>

              <div className="absolute top-3 right-3 z-20 text-[9px] font-mono text-[#DED4C7] font-bold bg-black/60 px-2 py-0.5 border border-white/10">
                30% EXTRAIT
              </div>

              {/* Product Visual Container with Elemental Cave */}
              <div className="relative aspect-3/4 overflow-hidden bg-[#151413] flex items-center justify-center border-b border-white/10">
                <img
                  src={product.panelImage}
                  alt={`TRACE ${product.number} ${product.name} elemental sanctuary`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />

                {/* Pure Photo Presentation - No heavy tint overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Quick View Button on Hover */}
                <div className="absolute inset-x-4 bottom-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product);
                    }}
                    className="w-full py-2.5 px-3 bg-white text-[#121110] text-[11px] font-mono uppercase tracking-wider hover:bg-[#DED4C7] transition-colors border border-white flex items-center justify-center gap-1.5 shadow-xl font-bold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Quick Specs</span>
                  </button>
                </div>
              </div>

              {/* Product Info with Technical Specs */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#DED4C7] block font-bold">
                    {product.category}
                  </span>

                  <h3 className="font-editorial text-2xl text-white tracking-wide group-hover:text-[#DED4C7] transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-white/70 font-body line-clamp-2 leading-relaxed">
                    {product.shortDescription}
                  </p>
                </div>

                {/* Technical specs summary */}
                <div className="pt-2 border-t border-white/10 text-[11px] text-white/60 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/40">ACCORDS:</span>
                    <span className="truncate max-w-[150px] text-white/80">{product.notes.top[0]} & {product.notes.base[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">LONGEVITY:</span>
                    <span className="text-white/80">{product.metrics.longevity}</span>
                  </div>
                </div>

                {/* Price and Add to Cart Action */}
                <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-base font-bold text-white">
                      ₹799 <span className="text-[10px] text-[#713D43] font-bold">(₹699 CODE)</span>
                    </span>
                    <span className="block text-[9px] font-mono text-[#DED4C7] font-bold">
                      IN 4 × 5ML DISCOVERY SET
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={(e) => handleAddToCart(e, product)}
                    className="px-3 py-2 bg-white text-[#121110] text-[10px] font-mono font-bold tracking-wider uppercase hover:bg-[#DED4C7] transition-colors flex items-center gap-1 cursor-pointer shadow-md"
                    aria-label="Add Discovery Set to bag"
                  >
                    {addedId === product.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#713D43]" />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD SET</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};
