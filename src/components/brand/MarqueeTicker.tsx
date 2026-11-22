import React from 'react';
import { StarEmblem } from './TraceLogo';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { formatINR } from '../../utils/storeLogic';

interface MarqueeTickerProps {
  className?: string;
  inverted?: boolean;
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({
  className = '',
  inverted = false,
}) => {
  const { discoverySet, featuredCoupon, discoveryDiscountedPrice, pricing } = useStoreConfig();

  const tickerItems = [
    '30% PURE OIL CONCENTRATION',
    '18–24 HOURS UNBROKEN STAY',
    'EXTRAIT DE PARFUM ELIXIRS',
    `DISCOVERY SET 4 × 5ML // ${discoverySet.formattedPrice}`,
    ...(featuredCoupon && discoveryDiscountedPrice !== null
      ? [`CODE: ${featuredCoupon.code} FOR ${formatINR(discoveryDiscountedPrice)}`]
      : []),
    '120 DAYS CELLAR MACERATION',
    `COMPLIMENTARY EXPRESS SHIPPING OVER ${formatINR(pricing.freeShippingThreshold)}`,
    'BEYOND SCENT. INTO MEMORY',
    'HAUTE PARFUMERIE // BATCH 01',
  ];

  return (
    <div
      className={`w-full overflow-hidden whitespace-nowrap py-3 border-y select-none ${
        inverted
          ? 'bg-[#121110] text-[#FAF8F4] border-white/15'
          : 'bg-[#1A1917] text-[#F3EFE8] border-white/10'
      } ${className}`}
      aria-hidden="true"
    >
      <div className="inline-flex animate-marquee space-x-8 font-mono text-[11px] uppercase tracking-[0.25em]">
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="inline-flex items-center space-x-6">
            <span className="font-medium tracking-widest">{item}</span>
            <StarEmblem size={10} color="#713D43" />
          </div>
        ))}
      </div>
    </div>
  );
};
