import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Banknote,
  AlertCircle,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { createCustomerOrder } from '../../services/firestoreService';
import {
  WHATSAPP_UPI_DISPLAY_PHONE,
  buildWhatsAppUpiOrderMessage,
  buildWhatsAppUpiOrderUrl,
  formatINR,
  generateOrderNumber,
  saveCustomerOrderRef,
  type PaymentMethod,
  type PaymentType,
  type SavedCustomerOrderRef,
} from '../../utils/storeLogic';
import { TraceLogo } from '../brand/TraceLogo';

interface CheckoutModalProps {
  onOrderPlaced?: (ref: SavedCustomerOrderRef) => void;
  onOpenOrders?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  onOrderPlaced,
  onOpenOrders,
}) => {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    couponCode,
    computeTotalsForPayment,
    clearCart,
    removeCoupon,
  } = useCart();
  const { pricing } = useStoreConfig();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Default to Cash on Delivery whenever COD is enabled; fall back to WhatsApp UPI if COD is disabled.
  const defaultPaymentType: PaymentType = pricing.codEnabled ? 'cod' : 'prepaid';
  const defaultPaymentMethod: PaymentMethod = pricing.codEnabled ? 'cod' : 'upi';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentType: defaultPaymentType as PaymentType,
    paymentMethod: defaultPaymentMethod as PaymentMethod,
  });

  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    totalPrice: number;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
  } | null>(null);

  useEffect(() => {
    if (!pricing.prepaidEnabled && formData.paymentType === 'prepaid' && pricing.codEnabled) {
      setFormData(prev => ({ ...prev, paymentType: 'cod', paymentMethod: 'cod' }));
    } else if (!pricing.codEnabled && formData.paymentType === 'cod' && pricing.prepaidEnabled) {
      setFormData(prev => ({ ...prev, paymentType: 'prepaid', paymentMethod: 'upi' }));
    }
  }, [pricing.codEnabled, pricing.prepaidEnabled, formData.paymentType]);

  const totals = computeTotalsForPayment(formData.paymentType);
  const isWhatsAppUpi = formData.paymentType === 'prepaid';

  const whatsAppPayload = useMemo(
    () => ({
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        volume: item.volume,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: couponCode || '',
      shippingFee: totals.shippingFee,
      totalPrice: totals.totalPrice,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      city: formData.city,
      pincode: formData.pincode,
    }),
    [
      items,
      totals.subtotal,
      totals.discount,
      totals.shippingFee,
      totals.totalPrice,
      couponCode,
      formData.name,
      formData.email,
      formData.phone,
      formData.address,
      formData.city,
      formData.pincode,
    ]
  );

  const whatsAppMessage = useMemo(
    () => buildWhatsAppUpiOrderMessage(whatsAppPayload),
    [whatsAppPayload]
  );
  const whatsAppUrl = useMemo(
    () => buildWhatsAppUpiOrderUrl(whatsAppPayload),
    [whatsAppPayload]
  );

  if (!isCheckoutOpen) return null;

  const selectPayment = (paymentType: PaymentType, paymentMethod: PaymentMethod) => {
    setSubmitError(null);
    setFormData(prev => ({
      ...prev,
      paymentType,
      paymentMethod,
    }));
  };

  const handleCopyWhatsAppMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    } catch {
      // Fallback ignored if clipboard blocked in iframe
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // UPI orders are placed directly via the WhatsApp prompt link rather than an automated gateway.
    if (formData.paymentType !== 'cod') {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const orderNumber = generateOrderNumber();

    try {
      const created = await createCustomerOrder({
        orderNumber,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          volume: item.volume,
          image: item.image,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        couponCode: couponCode || '',
        shippingFee: totals.shippingFee,
        codFee: totals.codFee,
        totalPrice: totals.totalPrice,
        paymentType: 'cod',
        paymentMethod: 'cod',
        paymentReference: '',
      });

      const savedRef: SavedCustomerOrderRef = {
        orderNumber: created.orderNumber,
        trackingKey: created.trackingKey,
        placedAt: new Date().toISOString(),
      };
      saveCustomerOrderRef(savedRef);
      onOrderPlaced?.(savedRef);

      setConfirmedOrder({
        orderNumber,
        totalPrice: totals.totalPrice,
        paymentType: 'cod',
        paymentMethod: 'cod',
      });
      setStep('success');
      clearCart();
      removeCoupon();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to submit order. Please verify your details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    setStep('form');
    setConfirmedOrder(null);
    setSubmitError(null);
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
            <span className="flex items-center gap-1.5 text-xs text-[#242321]/70 font-body">
              <Lock className="w-3.5 h-3.5 text-[#713D43]" />
              <span>Secure Live Checkout</span>
            </span>
            <button
              type="button"
              onClick={step === 'success' ? handleFinish : closeCheckout}
              className="p-1.5 text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <h2 id="checkout-modal-title" className="sr-only">
              Complete Your TRACE Order
            </h2>

            {submitError && (
              <div className="p-3.5 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipping & Payment Info */}
              <div className="space-y-4">
                <h3 className="font-editorial text-xl text-[#242321] tracking-wide border-b border-[#DED4C7] pb-2">
                  1. Shipping Information
                </h3>

                <div className="space-y-3 font-body text-xs">
                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required={!isWhatsAppUpi}
                      minLength={2}
                      maxLength={120}
                      placeholder="Aarav Sharma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        required={!isWhatsAppUpi}
                        maxLength={160}
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                      >
                        Phone (Mobile)
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required={!isWhatsAppUpi}
                        minLength={8}
                        maxLength={24}
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                    >
                      Delivery Address
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required={!isWhatsAppUpi}
                      minLength={5}
                      maxLength={300}
                      placeholder="Flat 402, Lotus Residency, Indiranagar"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="checkout-city"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                      >
                        City
                      </label>
                      <input
                        id="checkout-city"
                        type="text"
                        required={!isWhatsAppUpi}
                        minLength={2}
                        maxLength={80}
                        placeholder="Bengaluru"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-pincode"
                        className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
                      >
                        PIN Code (6 Digits)
                      </label>
                      <input
                        id="checkout-pincode"
                        type="text"
                        required={!isWhatsAppUpi}
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="560038"
                        value={formData.pincode}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#DED4C7] font-mono text-[#242321] focus:border-[#242321] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method: Cash on Delivery (COD) vs UPI via WhatsApp */}
                <h3 className="font-editorial text-xl text-[#242321] tracking-wide border-b border-[#DED4C7] pb-2 pt-2">
                  2. Payment Method
                </h3>
                <div className="space-y-2.5 text-xs font-body">
                  {pricing.codEnabled && (
                    <label
                      className={`flex items-center gap-3 p-3 border bg-white cursor-pointer transition-colors ${
                        formData.paymentType === 'cod'
                          ? 'border-[#242321]'
                          : 'border-[#DED4C7] hover:border-[#242321]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentType === 'cod'}
                        onChange={() => selectPayment('cod', 'cod')}
                        className="accent-[#713D43]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#242321] block">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[11px] text-[#242321]/60">
                          {pricing.codFee > 0
                            ? `Pay courier on arrival (+${formatINR(pricing.codFee)} COD fee)`
                            : 'Pay cash or UPI upon delivery · Instant confirmation'}
                        </span>
                      </div>
                      <Banknote className="w-4 h-4 text-[#B45309] shrink-0" />
                    </label>
                  )}

                  {pricing.prepaidEnabled && (
                    <label
                      className={`flex items-center gap-3 p-3 border bg-white cursor-pointer transition-colors ${
                        isWhatsAppUpi
                          ? 'border-[#15803D]'
                          : 'border-[#DED4C7] hover:border-[#242321]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={isWhatsAppUpi}
                        onChange={() => selectPayment('prepaid', 'upi')}
                        className="accent-[#15803D]"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-[#242321] block">
                          UPI Payment — Order on WhatsApp
                        </span>
                        <span className="text-[11px] text-[#242321]/60">
                          Message <span className="font-mono text-[#242321]">{WHATSAPP_UPI_DISPLAY_PHONE}</span> on WhatsApp to place your UPI order
                        </span>
                      </div>
                      <MessageCircle className="w-4 h-4 text-[#15803D] shrink-0" />
                    </label>
                  )}

                  {isWhatsAppUpi && (
                    <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#166534]">
                          Direct WhatsApp UPI Concierge · {WHATSAPP_UPI_DISPLAY_PHONE}
                        </p>
                        <p className="text-[11px] text-[#166534]/85 leading-relaxed">
                          Message our official WhatsApp number to complete your UPI payment directly. Your bag items, total ({formatINR(totals.totalPrice)}), and any shipping details typed above are pre-filled automatically.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#15803D] text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-[#166534] transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message on WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={handleCopyWhatsAppMessage}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-[#BBF7D0] text-[11px] font-medium text-[#166534] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                        >
                          {copiedMessage ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied Order Text</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Order Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      <details className="text-[11px] text-[#166534]/80">
                        <summary className="cursor-pointer font-mono uppercase tracking-wider text-[10px] hover:text-[#166534]">
                          Preview Pre-Filled WhatsApp Message
                        </summary>
                        <pre className="mt-2 p-2.5 bg-white border border-[#BBF7D0] text-[11px] font-mono text-[#242321] whitespace-pre-wrap break-words leading-relaxed">
                          {whatsAppMessage}
                        </pre>
                      </details>
                    </div>
                  )}
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
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-11 object-cover border border-[#DED4C7]"
                          />
                          <div>
                            <p className="font-editorial text-sm text-[#242321] leading-tight">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#242321]/60 font-mono">
                              Qty: {item.quantity} × {formatINR(item.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums font-medium">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DED4C7] space-y-2 text-xs font-body">
                    <div className="flex justify-between text-[#242321]/70">
                      <span>Subtotal (MRP)</span>
                      <span className="font-mono tabular-nums">{formatINR(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-[#713D43] font-medium">
                        <span>Coupon ({couponCode})</span>
                        <span className="font-mono tabular-nums font-bold">
                          -{formatINR(totals.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#242321]/70">
                      <span>Express Shipping</span>
                      <span className="font-mono tabular-nums">
                        {totals.shippingFee === 0 ? 'Complimentary' : formatINR(totals.shippingFee)}
                      </span>
                    </div>
                    {totals.codFee > 0 && (
                      <div className="flex justify-between text-[#242321]/70">
                        <span>COD Handling Fee</span>
                        <span className="font-mono tabular-nums">{formatINR(totals.codFee)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-[#DED4C7] flex justify-between font-medium text-sm">
                      <div>
                        <span className="font-editorial text-lg block">Total Amount</span>
                        <span className="text-[10px] font-mono text-[#713D43] block">
                          {isWhatsAppUpi
                            ? `UPI via WhatsApp (${WHATSAPP_UPI_DISPLAY_PHONE})`
                            : 'Cash on Delivery'}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-base font-semibold text-[#242321]">
                        {formatINR(totals.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {isWhatsAppUpi ? (
                    <>
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-4 bg-[#15803D] text-[#FAF8F4] font-body text-xs tracking-[0.18em] uppercase hover:bg-[#166534] transition-colors flex items-center justify-center gap-2 text-center"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>Order via WhatsApp UPI · {formatINR(totals.totalPrice)}</span>
                      </a>
                      <p className="text-[11px] text-[#242321]/65 text-center font-body leading-relaxed">
                        Opens WhatsApp chat with <span className="font-mono text-[#242321]">{WHATSAPP_UPI_DISPLAY_PHONE}</span> pre-filled with your bag &amp; details. Our concierge will send your UPI QR and live order tracking ID.
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={submitting || items.length === 0}
                        className="w-full py-4 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.22em] uppercase hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {submitting
                          ? 'Submitting Order...'
                          : `Confirm COD Order · ${formatINR(totals.totalPrice)}`}
                      </button>
                      <p className="text-[11px] text-[#242321]/60 text-center font-body">
                        Your COD order is logged instantly with TRACE fulfillment concierge.
                      </p>
                    </>
                  )}
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
              <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[#713D43]">
                Order Confirmed
              </span>
              <h3 className="font-editorial text-3xl md:text-4xl text-[#242321]">
                Thank you, {formData.name}
              </h3>
              <p className="text-sm text-[#242321]/80 font-body max-w-md mx-auto">
                Your TRACE fragrance order has been recorded in our live fulfillment ledger.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-[#F3EFE8] border border-[#DED4C7] p-5 text-left text-xs font-body space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Reference Number</span>
                <span className="font-mono font-bold text-[#713D43]">
                  {confirmedOrder?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Payment Mode</span>
                <span className="font-mono text-[#242321]">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Total Amount</span>
                <span className="font-mono font-semibold text-[#242321]">
                  {formatINR(confirmedOrder?.totalPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Shipping Address</span>
                <span className="font-mono text-right">
                  {formData.address}, {formData.city} — {formData.pincode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#242321]/70">Estimated Dispatch</span>
                <span className="font-mono text-[#242321]">24–48 Hours</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={() => {
                    handleFinish();
                    onOpenOrders();
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#713D43] text-[#FAF8F4] font-body text-xs tracking-[0.22em] uppercase hover:bg-[#242321] transition-colors cursor-pointer"
                >
                  Track My Order Live
                </button>
              )}
              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.22em] uppercase hover:bg-[#713D43] transition-colors cursor-pointer"
              >
                Continue Exploring TRACE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
