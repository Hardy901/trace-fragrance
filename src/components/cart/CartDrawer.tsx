import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Sparkles, Tag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BRAND_CONFIG } from '../../data/products';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totalItems,
    subtotal,
    discount,
    couponCode,
    couponError,
    applyCoupon,
    removeCoupon,
    shipping,
    totalPrice,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    openCheckout
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const ok = applyCoupon(inputCode);
    if (ok) setInputCode('');
  };

  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-[#242321]/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={e => {
        if (e.target === e.currentTarget) closeCart();
      }}
    >
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 max-w-full flex pl-10 animate-in slide-in-from-right duration-300"
      >
        <div className="w-screen max-w-md bg-[#FAF8F4] text-[#242321] shadow-2xl flex flex-col border-l border-[#DED4C7]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#DED4C7] flex items-center justify-between bg-[#F3EFE8]/80">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#B7A99A]">
                Your Selection
              </span>
              <h2 id="cart-drawer-title" className="font-editorial text-2xl font-medium tracking-wide">
                SHOPPING CART ({totalItems})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Special Coupon Promo Banner */}
          <div className="px-6 py-2.5 bg-[#FAF3EC] border-b border-[#DED4C7] text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#713D43] font-medium text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use code <strong>TRACE2026</strong> for ₹100 OFF</span>
            </span>
            {!couponCode && (
              <button
                onClick={() => applyCoupon('trace2026')}
                className="text-[10px] font-mono uppercase tracking-wider text-[#713D43] underline font-bold cursor-pointer"
              >
                Auto-Apply
              </button>
            )}
          </div>

          {/* Free Shipping Tier Banner */}
          <div className="px-6 py-3.5 bg-[#F3EFE8] border-b border-[#DED4C7] text-xs">
            {amountNeededForFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[11px] text-[#242321]">
                  <span>Add ₹{amountNeededForFreeShipping} for Complimentary Shipping</span>
                  <span>{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full h-1 bg-[#DED4C7] overflow-hidden">
                  <div
                    className="h-full bg-[#713D43] transition-all duration-500 ease-out"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#713D43] font-medium">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>You've unlocked Complimentary Express Delivery</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#DED4C7]">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <span className="font-editorial text-2xl text-[#242321]/60 italic block">
                  Your bag is currently empty
                </span>
                <p className="text-xs text-[#242321]/70 font-body max-w-xs mx-auto">
                  Experience all four hyper-concentrated 30% elixirs in the TRACE Discovery Set.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-4 px-6 py-2.5 bg-[#242321] text-[#FAF8F4] text-xs font-mono uppercase tracking-wider hover:bg-[#713D43] transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover bg-[#F3EFE8] border border-[#DED4C7] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-editorial text-lg text-[#242321] truncate font-medium">
                          {item.name}
                        </h3>
                        <span className="text-[11px] text-[#B7A99A] font-mono block">
                          {item.volume}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#B7A99A] hover:text-[#713D43] transition-colors p-1 cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="inline-flex items-center border border-[#DED4C7] bg-[#F3EFE8]">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 hover:bg-[#DED4C7] text-[#242321] transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-mono text-xs font-medium text-[#242321]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 hover:bg-[#DED4C7] text-[#242321] transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold text-[#242321] block">
                          {BRAND_CONFIG.currencySymbol}
                          {(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {couponCode === 'TRACE2026' && item.id === 'trace-discovery-set' && (
                          <span className="text-[10px] font-mono text-[#713D43] font-bold block">
                            (₹699 with code)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Coupon Code Section */}
          {items.length > 0 && (
            <div className="px-6 py-3.5 bg-[#FAF8F4] border-t border-[#DED4C7]">
              {couponCode ? (
                <div className="flex items-center justify-between p-2.5 bg-[#F2EDE4] border border-[#713D43]/40">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#713D43]" />
                    <div>
                      <span className="font-mono text-xs font-bold text-[#713D43] block">
                        COUPON APPLIED: {couponCode}
                      </span>
                      <span className="text-[10px] font-mono text-[#242321]/70">
                        ₹100 discount applied • Discovery Set price ₹699
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[10px] font-mono text-[#713D43] hover:underline uppercase cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-[#B7A99A]" />
                      <input
                        type="text"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.toUpperCase())}
                        placeholder="COUPON (TRY: TRACE2026)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#DED4C7] text-xs font-mono tracking-wider text-[#242321] uppercase placeholder:normal-case placeholder:text-[#B7A99A] focus:outline-none focus:border-[#713D43]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#242321] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[10px] font-mono text-red-600">{couponError}</p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#DED4C7] bg-[#F3EFE8]/70 space-y-4">
              <div className="space-y-2 text-xs font-body">
                <div className="flex justify-between text-[#242321]/70">
                  <span>Subtotal (MRP)</span>
                  <span className="font-mono text-sm font-medium text-[#242321]">
                    {BRAND_CONFIG.currencySymbol}
                    {subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#713D43] font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Coupon Discount (TRACE2026)</span>
                    </span>
                    <span className="font-mono text-sm font-bold">
                      -{BRAND_CONFIG.currencySymbol}{discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#242321]/70">
                  <span>Shipping</span>
                  <span className="font-mono text-xs">
                    {shipping === 0 ? (
                      <span className="text-[#713D43] font-medium uppercase tracking-wider">
                        Complimentary
                      </span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#DED4C7] flex justify-between text-sm font-medium text-[#242321]">
                  <div>
                    <span className="font-editorial text-lg tracking-wide block">Estimated Total</span>
                    {couponCode === 'TRACE2026' && (
                      <span className="text-[10px] font-mono text-[#713D43] block">
                        Special Launch Price: ₹699
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-lg font-bold text-[#242321]">
                    {BRAND_CONFIG.currencySymbol}
                    {totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={openCheckout}
                className="w-full py-4 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.25em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 group cursor-pointer shadow-lg"
              >
                <span>Proceed to Checkout // ₹{totalPrice.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#242321]/60 font-body">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B7A99A]" />
                <span>Secure Checkout • Pre-Order & Launch Edition</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
