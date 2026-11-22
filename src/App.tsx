import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { LoadingScreen } from './components/common/LoadingScreen';
import { Navbar } from './components/sections/Navbar';
import { HeroExperience } from './components/sections/HeroExperience';
import { BrandIntro } from './components/sections/BrandIntro';
import { CollectionSection } from './components/sections/CollectionSection';
import { IndividualFragranceStory } from './components/sections/IndividualFragranceStory';
import { DiscoverySetSection } from './components/sections/DiscoverySetSection';
import { PhilosophySection } from './components/sections/PhilosophySection';
import { WhyTraceSection } from './components/sections/WhyTraceSection';
import { EditorialGallery } from './components/sections/EditorialGallery';
import { CustomerReviews } from './components/sections/CustomerReviews';
import { FAQSection } from './components/sections/FAQSection';
import { SecretArchive50ml } from './components/sections/SecretArchive100ml';
import { NewsletterSection } from './components/sections/NewsletterSection';
import { Footer } from './components/sections/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { SearchModal } from './components/modals/SearchModal';
import { ProductQuickViewModal } from './components/modals/ProductQuickViewModal';
import { CheckoutModal } from './components/modals/CheckoutModal';
import { MarqueeTicker } from './components/brand/MarqueeTicker';
import type { FragranceProduct } from './data/products';

export const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FragranceProduct | null>(null);

  return (
    <div className="relative min-h-screen bg-[#FAF8F4] text-[#242321] luxury-grain overflow-x-hidden selection:bg-[#713D43] selection:text-[#FAF8F4]">
      {/* 2authenticators-Style Luxury Preloader */}
      <LoadingScreen />

      {/* 1. Navigation */}
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} />

      <main>
        {/* 2. Hero Experience */}
        <HeroExperience />

        {/* Dialed Coffee Kinetic Marquee Ticker */}
        <MarqueeTicker inverted={true} />

        {/* 3. Brand Introduction */}
        <BrandIntro />

        {/* 5. Individual Fragrance Story (The 4 Expressions with User's Clean Bottle Photos) */}
        <IndividualFragranceStory />

        {/* 4. The Collection */}
        <CollectionSection onSelectProduct={product => setSelectedProduct(product)} />

        {/* 6. The Discovery Set */}
        <DiscoverySetSection />

        {/* 7. The TRACE Philosophy */}
        <PhilosophySection />

        {/* 8. Why TRACE? */}
        <WhyTraceSection />

        {/* 9. Brand Campaign / Editorial Gallery */}
        <EditorialGallery />

        {/* 10. Customer Impressions / Reviews */}
        <CustomerReviews />

        {/* 11. FAQ Accordion */}
        <FAQSection />

        {/* Second Kinetic Marquee Ticker */}
        <MarqueeTicker inverted={false} />

        {/* Secret Easter Egg: TRACE 50 Coming Soon */}
        <SecretArchive50ml />

        {/* 12. Newsletter / Final CTA */}
        <NewsletterSection />
      </main>

      {/* 13. Footer */}
      <Footer />

      {/* Overlays & Drawers */}
      <CartDrawer />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={product => setSelectedProduct(product)}
      />
      <ProductQuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
      <CheckoutModal />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
