import React from 'react';
import { Lock } from 'lucide-react';
import { TraceLogo, StarEmblem } from '../brand/TraceLogo';
import { BRAND_CONFIG } from '../../data/products';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { discoverySet } = useStoreConfig();
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#242321] text-[#FAF8F4] pt-20 pb-12 border-t border-[#33312E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-[#3A3835]">
          
          {/* Brand Column (Left - 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <TraceLogo size="lg" showEmblem={true} inverted={true} />

            <p className="text-sm text-[#DED4C7]/80 font-body leading-relaxed max-w-sm">
              Hyper-concentrated luxury fragrance elixirs crafted at 30% essential oil density for an unbroken 18–24 hour presence.
            </p>

            <p className="font-editorial text-lg italic text-[#FAF8F4]/90 tracking-wide">
              "A perfume that leaves a trace, not just a scent."
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs font-mono tracking-widest text-[#B7A99A]">
              <span>INDIA</span>
              <span>•</span>
              <span className="text-[#DED4C7] font-bold">30% EXTRAIT ELIXIR</span>
              <span>•</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Nav Links Column: Shop (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#B7A99A] uppercase block">
              The Collection
            </span>
            <ul className="space-y-2.5 text-xs font-body tracking-wider text-[#FAF8F4]/80">
              <li>
                <button
                  onClick={() => scrollTo('#collection')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  01 DRIFT (Fresh/Aquatic)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#collection')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  02 IGNITE (Warm/Spicy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#collection')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  03 LUSH (Floral)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#collection')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  04 VESPER (Sweet/Amber)
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => scrollTo('#discovery-set')}
                  className="text-[#DED4C7] font-semibold hover:underline underline-offset-4 uppercase cursor-pointer"
                >
                  The Discovery Set (4 × 5ml) // {discoverySet.formattedPrice}
                </button>
              </li>
            </ul>
          </div>

          {/* Nav Links Column: Brand & Story (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#B7A99A] uppercase block">
              Exploration
            </span>
            <ul className="space-y-2.5 text-xs font-body tracking-wider text-[#FAF8F4]/80">
              <li>
                <button
                  onClick={() => scrollTo('#story')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  Brand Philosophy
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#hero')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  Campaign Visuals
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#collection')}
                  className="hover:text-[#DED4C7] transition-colors uppercase cursor-pointer"
                >
                  Fragrance Notes
                </button>
              </li>
              <li>
                <a
                  href={`https://instagram.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#DED4C7] transition-colors uppercase block"
                >
                  Instagram {BRAND_CONFIG.instagramHandle}
                </a>
              </li>
            </ul>
          </div>

          {/* Nav Links Column: Concierge & Policies (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#B7A99A] uppercase block">
              Concierge
            </span>
            <ul className="space-y-2.5 text-xs font-body tracking-wider text-[#FAF8F4]/80">
              <li>
                <span className="text-[#B7A99A] block text-[10px] uppercase font-mono">Customer Concierge:</span>
                <a
                  href={`mailto:${BRAND_CONFIG.customerSupportEmail}`}
                  className="hover:text-[#DED4C7] transition-colors font-mono lowercase"
                >
                  {BRAND_CONFIG.customerSupportEmail}
                </a>
              </li>
              <li className="pt-1">
                <span className="text-[#B7A99A] block text-[10px] uppercase font-mono">Dispatch Standard:</span>
                <span className="text-xs">{BRAND_CONFIG.dispatchTime}</span>
              </li>
              <li className="pt-1">
                <span className="text-[#B7A99A] block text-[10px] uppercase font-mono">Domestic Delivery:</span>
                <span className="text-xs">Express shipping across all PIN codes in India</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[#B7A99A]/80">
          <div className="flex items-center gap-2">
            <StarEmblem size={12} color="#B7A99A" />
            <span>© 2026 TRACE FRAGRANCES. ALL RIGHTS RESERVED.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] tracking-wider uppercase">
            <span className="hover:text-[#FAF8F4] transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span>•</span>
            <span className="hover:text-[#FAF8F4] transition-colors cursor-pointer">
              Terms &amp; Conditions
            </span>
            <span>•</span>
            <span className="hover:text-[#FAF8F4] transition-colors cursor-pointer">
              Shipping &amp; Returns
            </span>
            {onOpenAdmin && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 text-[#DED4C7]/80 hover:text-white transition-colors uppercase cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Portal</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
