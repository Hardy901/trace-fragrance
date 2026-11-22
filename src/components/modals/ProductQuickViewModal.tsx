import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { FragranceProduct } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatINR } from '../../utils/storeLogic';
import { StarEmblem } from '../brand/TraceLogo';

interface ProductQuickViewModalProps {
  product: FragranceProduct | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose
}) => {
  const { discoverySet, featuredCoupon, discoveryDiscountedPrice } = useStoreConfig();
  const { addItem } = useCart();
  const [quantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(
      {
        id: discoverySet.id,
        name: discoverySet.name,
        category: discoverySet.subtitle,
        price: discoverySet.price,
        image: '/assets/discovery-box-new.jpg',
        volume: discoverySet.configuration
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#242321]/75 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#FAF8F4] border border-[#DED4C7] shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-[#FAF8F4]/80 backdrop-blur-xs text-[#242321] hover:text-[#713D43] transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Column */}
        <div className="relative bg-[#151413] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/15 min-h-[380px]">
          <div className="relative w-full max-w-[240px] h-[340px] flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-auto object-contain drop-shadow-2xl"
            />
            <div className="absolute -bottom-3 -right-3 bg-[#242321] text-[#FAF8F4] px-3 py-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-md border border-white/20">
              <StarEmblem size={12} color="#DED4C7" />
              <span>{product.volume}</span>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="p-6 md:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#713D43] font-medium tracking-widest uppercase">
                NO. {product.number}
              </span>
              <span className="text-[#B7A99A]">•</span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#242321]/70">
                {product.category}
              </span>
            </div>

            <h2 id="quickview-title" className="font-editorial text-3xl md:text-4xl text-[#242321] tracking-wide mb-1">
              {product.name}
            </h2>
            {product.alternateName && (
              <p className="text-xs font-mono tracking-widest uppercase text-[#B7A99A] mb-3">
                Concept Edition: {product.alternateName}
              </p>
            )}

            <p className="text-sm font-body text-[#242321]/80 leading-relaxed mb-4">
              {product.shortDescription}
            </p>

            {/* Fragrance Notes Breakdown */}
            <div className="space-y-3 bg-[#F3EFE8]/70 p-4 border border-[#DED4C7] text-xs font-body">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#B7A99A] block mb-0.5">
                  Top Notes
                </span>
                <span className="text-[#242321] font-medium">
                  {product.notes.top.join(' • ')}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DED4C7]/60">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#B7A99A] block mb-0.5">
                  Heart Notes
                </span>
                <span className="text-[#242321] font-medium">
                  {product.notes.heart.join(' • ')}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DED4C7]/60">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#B7A99A] block mb-0.5">
                  Base Notes
                </span>
                <span className="text-[#242321] font-medium">
                  {product.notes.base.join(' • ')}
                </span>
              </div>
            </div>

            {/* Accords */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.accords.map(accord => (
                <span
                  key={accord}
                  className="px-2.5 py-1 text-[11px] bg-[#F3EFE8] text-[#242321] font-mono border border-[#DED4C7]/80"
                >
                  {accord}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Add to cart */}
          <div className="pt-4 border-t border-[#DED4C7] space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono text-2xl font-bold text-[#242321]">
                  {discoverySet.formattedPrice}
                </span>
                {featuredCoupon && discoveryDiscountedPrice !== null && (
                  <span className="text-[10px] text-[#713D43] font-mono font-bold ml-2">
                    ({formatINR(discoveryDiscountedPrice)} with code {featuredCoupon.code})
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-[#713D43] uppercase tracking-wider font-bold">
                In 4 × 5ml Discovery Set
              </span>
            </div>

            <p className="text-[11px] font-mono text-[#B7A99A]">
              Full flacons are currently cellaring. All 4 expressions are available immediately in the Discovery Box.
            </p>

            <button
              onClick={handleAddToCart}
              disabled={added}
              className="w-full py-3.5 px-6 bg-[#242321] text-[#FAF8F4] text-xs font-body uppercase tracking-[0.2em] hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 text-[#DED4C7]" />
                  <span>Discovery Set Added to Bag</span>
                </>
              ) : (
                <span>Add Discovery Set • {discoverySet.formattedPrice}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
