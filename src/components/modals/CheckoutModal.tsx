import React, { useState } from 'react';
import { X, CheckCircle2, Lock, CreditCard } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BRAND_CONFIG } from '../../data/products';
import { TraceLogo } from '../brand/TraceLogo';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, items, subtotal, discount, couponCode, shipping, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '+91 98765 43210',
    address: 'Flat 402, Lotus Residency, Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    paymentMethod: 'upi'
  });
  const [orderNumber, setOrderNumber] = useState('');

  if (!isCheckoutOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomOrder = `TRC-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(randomOrder);
    setStep('success');
    clearCart();
  };

  const handleFinish = () => {
    setStep('form');
    closeCheckout();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#242321]/75 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
    >
      <div className="w-full max-w-3xl bg-[#FAF8F4] border border-[#DED4C7] shadow-2xl relative overflow-hidden my-8">
        {/* Top header bar */}
        <div className="p-4 md:p-6 border-b border-[#DED4C7] bg-[#F3EFE8] flex items-center justify-between">
          <TraceLogo size="sm" showEmblem={true} />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[#242321]/60 font-body">
              <Lock className="w-3.5 h-3.5 text-[#713D43]" />
              <span>Simulated Checkout Preview</span>
            </span>
            <button
              onClick={step === 'success' ? handleFinish : closeCheckout}
              className="p-1.5 text-[#242321] hover:text-[#713D43] transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipping info */}
              <div className="space-y-4">
                <h3 className="font-editorial text-xl text-[#242321] tracking-wide border-b border-[#DED4C7] pb-2">
                  1. Shipping Information
                </h3>

                <div className="space-y-3 font-body text-xs">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                        Phone (Mobile)
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#B7A99A] mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated Payment */}
                <h3 className="font-editorial text-xl text-[#242321] tracking-wide border-b border-[#DED4C7] pb-2 pt-2">
                  2. Payment Method
                </h3>
                <div className="space-y-2 text-xs font-body">
                  <label className="flex items-center gap-3 p-3 border border-[#DED4C7] bg-white cursor-pointer hover:border-[#242321] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                      className="accent-[#713D43]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-[#242321] block">Instant UPI / QR</span>
                      <span className="text-[10px] text-[#242321]/60">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                    <CreditCard className="w-4 h-4 text-[#B7A99A]" />
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-[#DED4C7] bg-white cursor-pointer hover:border-[#242321] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'cards'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cards' })}
                      className="accent-[#713D43]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-[#242321] block">Credit / Debit Card</span>
                      <span className="text-[10px] text-[#242321]/60">Visa, Mastercard, RuPay, Amex</span>
                    </div>
                    <CreditCard className="w-4 h-4 text-[#B7A99A]" />
                  </label>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-[#F3EFE8]/70 p-5 border border-[#DED4C7] flex flex-col justify-between">
                <div>
                  <h4 className="font-editorial text-lg text-[#242321] tracking-wide mb-3 border-b border-[#DED4C7] pb-2">
                    Order Overview
                  </h4>

                  <div className="space-y-3 max-h-48 overflow-y-auto divide-y divide-[#DED4C7]/50 text-xs font-body">
                    {items.map(item => (
                      <div key={item.id} className="pt-2 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt={item.name} className="w-9 h-11 object-cover border border-[#DED4C7]" />
                          <div>
                            <p className="font-editorial text-sm text-[#242321] leading-tight">{item.name}</p>
                            <p className="text-[10px] text-[#242321]/60 font-mono">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-mono font-medium">
                          {BRAND_CONFIG.currencySymbol}{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DED4C7] space-y-2 text-xs font-body">
                    <div className="flex justify-between text-[#242321]/70">
                      <span>Subtotal (MRP)</span>
                      <span className="font-mono">{BRAND_CONFIG.currencySymbol}{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[#713D43] font-medium">
                        <span>Coupon ({couponCode})</span>
                        <span className="font-mono font-bold">-{BRAND_CONFIG.currencySymbol}{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#242321]/70">
                      <span>Express Shipping</span>
                      <span className="font-mono">{shipping === 0 ? 'Complimentary' : `₹${shipping}`}</span>
                    </div>
                    <div className="pt-3 border-t border-[#DED4C7] flex justify-between font-medium text-sm">
                      <div>
                        <span className="font-editorial text-lg block">Total Amount</span>
                        {couponCode === 'TRACE2026' && (
                          <span className="text-[10px] font-mono text-[#713D43] block">Launch Offer Applied</span>
                        )}
                      </div>
                      <span className="font-mono text-base font-semibold text-[#242321]">
                        {BRAND_CONFIG.currencySymbol}{totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.25em] uppercase hover:bg-[#713D43] transition-colors cursor-pointer"
                  >
                    Confirm & Place Simulated Order
                  </button>
                  <p className="text-[10px] text-[#242321]/60 text-center font-body">
                    Demo Mode: No payment is charged. Order is recorded for frontend demonstration.
                  </p>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* Order confirmation success screen */
          <div className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F3EFE8] text-[#713D43] mx-auto flex items-center justify-center border border-[#DED4C7]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[#B7A99A]">
                Order Confirmed
              </span>
              <h3 className="font-editorial text-3xl md:text-4xl text-[#242321]">
                Thank you, {formData.name}
              </h3>
              <p className="text-sm text-[#242321]/80 font-body max-w-md mx-auto">
                Your simulated TRACE fragrance order has been received. Your personal olfactory journey begins now.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-[#F3EFE8] border border-[#DED4C7] p-5 text-left text-xs font-body space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Reference Number</span>
                <span className="font-mono font-bold text-[#713D43]">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Recipient Email</span>
                <span className="font-mono">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Shipping Address</span>
                <span className="font-mono text-right">{formData.address}, {formData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Estimated Dispatch</span>
                <span className="font-mono text-[#242321]">24–48 Hours</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.25em] uppercase hover:bg-[#713D43] transition-colors"
            >
              Continue Exploring TRACE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
