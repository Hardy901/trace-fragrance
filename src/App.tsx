import React, { useEffect, useState } from 'react';
import { StoreConfigProvider } from './context/StoreConfigContext';
import { CartProvider } from './context/CartContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
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
import { MyOrdersModal } from './components/modals/MyOrdersModal';
import { MarqueeTicker } from './components/brand/MarqueeTicker';
import { AdminConsole } from './components/admin/AdminConsole';
import {
  readSavedCustomerOrders,
  removeSavedCustomerOrderRef,
  saveCustomerOrderRef,
  type SavedCustomerOrderRef,
} from './utils/storeLogic';
import type { FragranceProduct } from './data/products';

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
}

export const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [savedOrders, setSavedOrders] = useState<SavedCustomerOrderRef[]>(() =>
    readSavedCustomerOrders()
  );
  const [selectedProduct, setSelectedProduct] = useState<FragranceProduct | null>(null);
  const [showAdmin, setShowAdmin] = useState<boolean>(() => isAdminPath());

  const handleAddSavedOrder = (ref: SavedCustomerOrderRef) => {
    setSavedOrders(saveCustomerOrderRef(ref));
  };

  const handleRemoveSavedOrder = (trackingKey: string) => {
    setSavedOrders(removeSavedCustomerOrderRef(trackingKey));
  };

  useEffect(() => {
    const handlePopState = () => {
      setShowAdmin(isAdminPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setShowAdmin(true);
    window.scrollTo({ top: 0 });
  };

  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setShowAdmin(false);
    window.scrollTo({ top: 0 });
  };

  if (showAdmin) {
    return <AdminConsole onBackToStore={navigateToStore} />;
  }

  return (
    <div className="relative min-h-screen bg-[#FAF8F4] text-[#242321] luxury-grain overflow-x-hidden selection:bg-[#713D43] selection:text-[#FAF8F4]">
      {/* Luxury Preloader (auto-skipped with ?autostart=1) */}
      <LoadingScreen />

      {/* 1. Navigation */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        savedOrdersCount={savedOrders.length}
      />

      <main>
        {/* 2. Hero Experience */}
        <HeroExperience />

        {/* Kinetic Marquee Ticker */}
        <MarqueeTicker inverted={true} />

        {/* 3. Brand Introduction */}
        <BrandIntro />

        {/* 5. Individual Fragrance Story */}
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
      <Footer
        onOpenAdmin={navigateToAdmin}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

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
      <CheckoutModal
        onOrderPlaced={handleAddSavedOrder}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />
      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        savedOrders={savedOrders}
        onAddSavedOrder={handleAddSavedOrder}
        onRemoveSavedOrder={handleRemoveSavedOrder}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreConfigProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </StoreConfigProvider>
    </ErrorBoundary>
  );
}
