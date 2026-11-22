import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, Sparkles } from 'lucide-react';
import { TraceLogo } from '../brand/TraceLogo';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', href: '#hero' },
    { name: 'COLLECTION', href: '#collection' },
    { name: 'OUR STORY', href: '#story' },
    { name: 'DISCOVER', href: '#discovery-set' }
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: isScrolled ? 'rgba(243, 239, 232, 0.96)' : 'rgba(18, 17, 16, 0.85)',
          borderColor: isScrolled ? 'rgba(222, 212, 199, 0.9)' : 'rgba(255, 255, 255, 0.12)',
          paddingTop: isScrolled ? '12px' : '20px',
          paddingBottom: isScrolled ? '12px' : '20px'
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b shadow-sm select-none"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: TRACE Logo */}
            <a
              href="#hero"
              onClick={e => handleLinkClick(e, '#hero')}
              className="group cursor-pointer focus:outline-none flex items-center"
              aria-label="TRACE Home"
            >
              <TraceLogo
                size="md"
                showEmblem={true}
                inverted={!isScrolled}
                className="transition-transform duration-300 group-hover:scale-103"
              />
            </a>

            {/* Centre: Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center space-x-5 lg:space-x-8 xl:space-x-10" aria-label="Main Navigation">
              {navLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={e => handleLinkClick(e, link.href)}
                  className={`font-body text-xs tracking-[0.25em] font-medium transition-colors duration-300 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#713D43] hover:after:w-full after:transition-all after:duration-300 ${
                    isScrolled
                      ? 'text-[#242321] hover:text-[#713D43]'
                      : 'text-[#FAF8F4] hover:text-[#DED4C7]'
                  }`}
                >
                  {link.name}
                </a>
              ))}

              {/* Coming Soon Glowing Hint in Nav */}
              <a
                href="#archive-50ml"
                onClick={e => {
                  handleLinkClick(e, '#archive-50ml');
                  window.dispatchEvent(new CustomEvent('open-secret-archive'));
                }}
                className={`group flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono tracking-widest uppercase transition-all duration-300 border rounded-full ${
                  isScrolled
                    ? 'border-[#713D43]/60 bg-[#713D43]/15 text-[#713D43] hover:bg-[#713D43] hover:text-white shadow-[0_0_10px_rgba(113,61,67,0.25)]'
                    : 'border-[#DED4C7]/60 bg-[#713D43]/30 text-[#DED4C7] hover:bg-[#713D43] hover:text-white shadow-[0_0_12px_rgba(113,61,67,0.4)]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#DED4C7] animate-pulse" />
                <span>COMING SOON</span>
              </a>
            </nav>

            {/* Right: Search & Cart + Mobile toggle */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={onOpenSearch}
                className={`inline-flex items-center gap-1.5 transition-colors duration-300 p-1.5 focus:outline-none group cursor-pointer ${
                  isScrolled ? 'text-[#242321] hover:text-[#713D43]' : 'text-[#FAF8F4] hover:text-[#DED4C7]'
                }`}
                aria-label="Search fragrances"
              >
                <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="hidden lg:inline text-xs font-body tracking-[0.2em] font-medium">
                  SEARCH
                </span>
              </button>

              <button
                onClick={openCart}
                className={`inline-flex items-center gap-2 transition-colors duration-300 p-1.5 focus:outline-none group cursor-pointer relative ${
                  isScrolled ? 'text-[#242321] hover:text-[#713D43]' : 'text-[#FAF8F4] hover:text-[#DED4C7]'
                }`}
                aria-label={`Shopping Cart with ${totalItems} items`}
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#713D43] text-[#FAF8F4] text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-xs font-body tracking-[0.2em] font-medium">
                  BAG {totalItems > 0 && `(${totalItems})`}
                </span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-1.5 transition-colors focus:outline-none ${
                  isScrolled ? 'text-[#242321] hover:text-[#713D43]' : 'text-[#FAF8F4] hover:text-[#DED4C7]'
                }`}
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#242321]/70 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-[#FAF8F4] border-r border-[#DED4C7] p-6 pt-20 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#B7A99A] block mb-2">
                Menu
              </span>
              <nav className="flex flex-col space-y-4">
                {navLinks.map(link => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={e => handleLinkClick(e, link.href)}
                    className="font-editorial text-2xl tracking-wider text-[#242321] hover:text-[#713D43] transition-colors border-b border-[#DED4C7]/50 pb-2"
                  >
                    {link.name}
                  </a>
                ))}

                {/* Secret Coming Soon link in mobile drawer */}
                <a
                  href="#archive-50ml"
                  onClick={e => {
                    handleLinkClick(e, '#archive-50ml');
                    window.dispatchEvent(new CustomEvent('open-secret-archive'));
                  }}
                  className="font-editorial text-2xl tracking-wider text-[#713D43] hover:text-[#242321] transition-colors border-b border-[#DED4C7]/50 pb-2 flex items-center justify-between"
                >
                  <span>COMING SOON (TRACE 50)</span>
                  <Sparkles className="w-4 h-4 text-[#713D43]" />
                </a>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#DED4C7] space-y-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="w-full py-2.5 px-4 bg-[#F3EFE8] text-xs font-body tracking-[0.2em] uppercase text-[#242321] flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Fragrances</span>
              </button>
              <div className="text-center font-mono text-[10px] text-[#B7A99A] tracking-widest uppercase">
                BEYOND SCENT. INTO MEMORY.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
