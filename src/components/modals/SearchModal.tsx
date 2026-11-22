import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import type { FragranceProduct } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: FragranceProduct) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct
}) => {
  const { fragrances, discoverySet } = useStoreConfig();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchedFragrances = fragrances.filter(f => {
    if (!cleanQuery) return true;
    const matchName = f.name.toLowerCase().includes(cleanQuery);
    const matchAlt = f.alternateName?.toLowerCase().includes(cleanQuery);
    const matchCategory = f.category.toLowerCase().includes(cleanQuery);
    const matchDesc = f.shortDescription.toLowerCase().includes(cleanQuery);
    const matchNotes = [
      ...f.notes.top,
      ...f.notes.heart,
      ...f.notes.base
    ].some(n => n.toLowerCase().includes(cleanQuery));
    const matchAccords = f.accords.some(m => m.toLowerCase().includes(cleanQuery));

    return matchName || matchAlt || matchCategory || matchDesc || matchNotes || matchAccords;
  });

  const matchDiscovery = !cleanQuery ||
    discoverySet.name.toLowerCase().includes(cleanQuery) ||
    discoverySet.shortDescription.toLowerCase().includes(cleanQuery) ||
    'discovery set'.includes(cleanQuery) ||
    'miniature'.includes(cleanQuery) ||
    'vials'.includes(cleanQuery);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-[#242321]/75 backdrop-blur-sm transition-opacity"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#FAF8F4] border border-[#DED4C7] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search header */}
        <div className="p-4 md:p-6 border-b border-[#DED4C7] flex items-center gap-3 bg-[#F3EFE8]/70">
          <Search className="w-5 h-5 text-[#B7A99A] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, moods, fragrance numbers (e.g. Neroli, Amber, 01)..."
            className="w-full bg-transparent text-[#242321] placeholder-[#B7A99A] focus:outline-none font-body text-base md:text-lg"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-[#242321] hover:text-[#713D43] transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick keywords pill suggestions */}
        <div className="px-4 md:px-6 py-2.5 bg-[#FAF8F4] border-b border-[#DED4C7]/50 flex items-center gap-2 overflow-x-auto text-xs text-[#242321]/70">
          <span className="font-mono text-[10px] uppercase text-[#B7A99A] shrink-0">Try:</span>
          {['Citrus', 'Vanilla', 'Saffron', 'Aquatic', 'Tea', 'Amber', 'Discovery Set'].map(keyword => (
            <button
              key={keyword}
              onClick={() => setQuery(keyword)}
              className="px-2.5 py-1 bg-[#F3EFE8] hover:bg-[#DED4C7] transition-colors rounded-none whitespace-nowrap text-xs font-body tracking-wider"
            >
              {keyword}
            </button>
          ))}
        </div>

        {/* Results list */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4">
          <h2 id="search-modal-title" className="sr-only">
            Fragrance Search Results
          </h2>

          {/* Discovery set card if matches */}
          {matchDiscovery && (
            <div className="p-3 bg-[#F3EFE8]/70 border border-[#DED4C7] flex items-center justify-between gap-4 group hover:border-[#B7A99A] transition-colors">
              <div className="flex items-center gap-3">
                <img
                  src={discoverySet.images.boxClosed}
                  alt={discoverySet.name}
                  className="w-14 h-14 object-cover border border-[#DED4C7]"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#713D43] font-medium tracking-widest uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>Curated Set</span>
                  </div>
                  <h3 className="font-editorial text-lg text-[#242321] tracking-wide">
                    {discoverySet.name}
                  </h3>
                  <p className="text-xs text-[#242321]/70 font-mono">
                    {discoverySet.formattedPrice} • {discoverySet.configuration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  addItem({
                    id: discoverySet.id,
                    name: discoverySet.name,
                    category: discoverySet.subtitle,
                    price: discoverySet.price,
                    image: discoverySet.images.boxClosed,
                    volume: discoverySet.configuration
                  });
                  onClose();
                }}
                className="px-3.5 py-2 text-xs uppercase tracking-widest font-body bg-[#242321] text-[#FAF8F4] hover:bg-[#713D43] transition-colors shrink-0"
              >
                Add to Cart
              </button>
            </div>
          )}

          {/* Fragrances */}
          <div className="space-y-3">
            {matchedFragrances.map(fragrance => (
              <div
                key={fragrance.id}
                className="p-3 bg-white border border-[#DED4C7]/80 flex items-center justify-between gap-4 group hover:border-[#B7A99A] transition-colors"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(fragrance);
                      onClose();
                    }
                  }}
                >
                  <img
                    src={fragrance.image}
                    alt={fragrance.name}
                    className="w-12 h-16 object-cover bg-[#F3EFE8] border border-[#DED4C7]"
                  />
                  <div>
                    <span className="text-[11px] font-mono tracking-widest text-[#B7A99A] uppercase">
                      {fragrance.number} • {fragrance.category}
                    </span>
                    <h3 className="font-editorial text-lg text-[#242321] tracking-wider group-hover:text-[#713D43] transition-colors">
                      {fragrance.name}{' '}
                      <span className="text-xs font-sans text-[#242321]/60">
                        ({fragrance.alternateName})
                      </span>
                    </h3>
                    <p className="text-xs text-[#242321]/70 line-clamp-1 max-w-sm">
                      {fragrance.notes.top.join(', ')} → {fragrance.notes.base.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-[#713D43] font-bold">
                    In Set {discoverySet.formattedPrice}
                  </span>
                  <button
                    onClick={() => {
                      addItem({
                        id: discoverySet.id,
                        name: discoverySet.name,
                        category: discoverySet.subtitle,
                        price: discoverySet.price,
                        image: '/assets/discovery-box-new.jpg',
                        volume: discoverySet.configuration
                      });
                      onClose();
                    }}
                    className="p-2 bg-[#F3EFE8] hover:bg-[#242321] hover:text-[#FAF8F4] transition-colors"
                    aria-label="Add Discovery Set to cart"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {matchedFragrances.length === 0 && !matchDiscovery && (
              <div className="py-12 text-center text-[#242321]/60">
                <p className="font-editorial text-xl italic mb-1">
                  No fragrance found matching "{query}"
                </p>
                <p className="text-xs font-body tracking-wider uppercase text-[#B7A99A]">
                  Try searching for notes like Bergamot, Cardamom, Saffron, or Vanilla
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
