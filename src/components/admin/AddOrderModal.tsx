import React, { useMemo, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  MessageCircle,
  Banknote,
  Save,
} from 'lucide-react';
import { DISCOVERY_SET, FRAGRANCES } from '../../data/products';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { createAdminManualOrder } from '../../services/firestoreService';
import {
  formatINR,
  type FulfillmentStatus,
  type OrderItemSnapshot,
  type PaymentStatus,
  type PaymentType,
} from '../../utils/storeLogic';

interface AddOrderModalProps {
  actorEmail: string;
  onClose: () => void;
  onCreated: (result: { orderNumber: string; totalPrice: number; customerName: string }) => void;
}

interface CatalogOption {
  id: string;
  name: string;
  price: number;
  volume: string;
  image: string;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  actorEmail,
  onClose,
  onCreated,
}) => {
  const { pricing, activeCoupons: coupons } = useStoreConfig();

  const catalogOptions = useMemo<CatalogOption[]>(() => {
    const discovery: CatalogOption = {
      id: DISCOVERY_SET.id,
      name: DISCOVERY_SET.name,
      price: pricing.discoverySetPrice,
      volume: DISCOVERY_SET.configuration,
      image: DISCOVERY_SET.images.boxOpen,
    };
    const elixirs: CatalogOption[] = FRAGRANCES.map(item => ({
      id: item.id,
      name: `${item.number} ${item.name}`,
      price: pricing.fragrancePrices[item.id] ?? item.price,
      volume: item.volume,
      image: item.image,
    }));
    return [discovery, ...elixirs];
  }, [pricing]);

  const [paymentType, setPaymentType] = useState<PaymentType>('prepaid');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>('confirmed');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const [items, setItems] = useState<OrderItemSnapshot[]>([
    {
      id: catalogOptions[0].id,
      name: catalogOptions[0].name,
      price: catalogOptions[0].price,
      quantity: 1,
      volume: catalogOptions[0].volume,
      image: catalogOptions[0].image,
    },
  ]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(catalogOptions[0].id);

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [autoShipping, setAutoShipping] = useState(true);
  const [manualShippingFee, setManualShippingFee] = useState<number>(pricing.shippingFee);
  const [codFee, setCodFee] = useState<number>(0);

  const [paymentReference, setPaymentReference] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('Ordered via WhatsApp UPI');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const effectiveShippingFee = autoShipping
    ? subtotal >= pricing.freeShippingThreshold
      ? 0
      : pricing.shippingFee
    : Math.max(0, Math.min(5000, Math.round(manualShippingFee || 0)));

  const effectiveCodFee =
    paymentType === 'cod' ? Math.max(0, Math.min(1000, Math.round(codFee || 0))) : 0;

  const effectiveDiscount = Math.max(0, Math.min(subtotal, Math.round(discount || 0)));
  const grandTotal = Math.max(0, subtotal - effectiveDiscount + effectiveShippingFee + effectiveCodFee);

  const handleSwitchPaymentType = (nextType: PaymentType) => {
    setPaymentType(nextType);
    if (nextType === 'prepaid') {
      setPaymentStatus('paid');
      setCodFee(0);
      if (adminNotes === 'Manual COD order') {
        setAdminNotes('Ordered via WhatsApp UPI');
      }
    } else {
      setPaymentStatus('pending_cod');
      setCodFee(pricing.codFee);
      if (adminNotes === 'Ordered via WhatsApp UPI') {
        setAdminNotes('Manual COD order');
      }
    }
  };

  const handleAddCatalogItem = () => {
    const picked = catalogOptions.find(opt => opt.id === selectedCatalogId);
    if (!picked) return;
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === picked.id);
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: Math.min(50, item.quantity + 1) }
            : item
        );
      }
      if (prev.length >= 20) return prev;
      return [
        ...prev,
        {
          id: picked.id,
          name: picked.name,
          price: picked.price,
          quantity: 1,
          volume: picked.volume,
          image: picked.image,
        },
      ];
    });
  };

  const handleUpdateItem = (
    index: number,
    patch: Partial<Pick<OrderItemSnapshot, 'quantity' | 'price'>>
  ) => {
    setItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleApplyCouponPreset = (code: string) => {
    setCouponCode(code);
    const matched = coupons.find(c => c.code === code);
    if (!matched) return;
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    let calc = 0;
    if (matched.discountType === 'percent') {
      calc = Math.round((subtotal * matched.discountValue) / 100);
    } else {
      calc = Math.round(matched.discountValue * (matched.applyPerItem ? Math.max(1, totalQty) : 1));
    }
    if (matched.maxDiscount > 0) {
      calc = Math.min(calc, matched.maxDiscount);
    }
    setDiscount(Math.max(0, Math.min(subtotal, calc)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await createAdminManualOrder(
        {
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          city,
          pincode,
          items,
          discount: effectiveDiscount,
          couponCode,
          shippingFee: effectiveShippingFee,
          codFee: effectiveCodFee,
          paymentType,
          paymentMethod: paymentType === 'cod' ? 'cod' : 'upi',
          paymentStatus,
          paymentReference,
          fulfillmentStatus,
          trackingNumber,
          adminNotes,
        },
        actorEmail
      );
      onCreated({
        orderNumber: result.orderNumber,
        totalPrice: result.totalPrice,
        customerName: customerName.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create order. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-order-modal-title"
      className="fixed inset-0 z-50 bg-[#242321]/65 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 md:p-6"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#FAF8F4] border border-[#DED4C7] shadow-2xl my-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#DED4C7] flex items-center justify-between gap-4">
          <div>
            <h2 id="add-order-modal-title" className="font-editorial text-2xl text-[#242321]">
              Add Manual / WhatsApp UPI Order
            </h2>
            <p className="text-xs font-body text-[#242321]/60 mt-0.5">
              Logs directly to live Firestore &amp; generates a live customer tracking ID (<span className="font-mono">TRC-...</span>).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close add order modal"
            className="p-2 text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs font-body">
          {error && (
            <div className="p-3.5 bg-[#FDF4F5] border border-[#713D43]/30 text-[#713D43] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Payment Channel Selector */}
          <div className="space-y-2">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/65">
              1. Order Channel &amp; Payment Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSwitchPaymentType('prepaid')}
                className={`p-3.5 border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  paymentType === 'prepaid'
                    ? 'bg-[#F0FDF4] border-[#15803D] text-[#166534]'
                    : 'bg-white border-[#DED4C7] text-[#242321] hover:border-[#242321]'
                }`}
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-[#15803D]" />
                <div>
                  <span className="font-semibold block">UPI / Prepaid (WhatsApp)</span>
                  <span className="text-[11px] opacity-75">
                    Paid via UPI on +91 93156 71544
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPaymentType('cod')}
                className={`p-3.5 border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  paymentType === 'cod'
                    ? 'bg-[#FFFBEB] border-[#B45309] text-[#92400E]'
                    : 'bg-white border-[#DED4C7] text-[#242321] hover:border-[#242321]'
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0 text-[#B45309]" />
                <div>
                  <span className="font-semibold block">Cash on Delivery (COD)</span>
                  <span className="text-[11px] opacity-75">
                    Manual / phone COD order
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Customer Details */}
          <div className="bg-white border border-[#DED4C7] p-4 space-y-3">
            <h3 className="font-semibold text-[#242321] pb-2 border-b border-[#DED4C7]">
              2. Customer &amp; Delivery Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-name" className="block text-[#242321]/70 mb-1">
                  Full Name *
                </label>
                <input
                  id="manual-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Rohan Mehta"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label htmlFor="manual-phone" className="block text-[#242321]/70 mb-1">
                  Mobile Number *
                </label>
                <input
                  id="manual-phone"
                  type="tel"
                  required
                  minLength={8}
                  maxLength={24}
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-email" className="block text-[#242321]/70 mb-1">
                  Email Address * <span className="text-[#242321]/45">(used for order tracking)</span>
                </label>
                <input
                  id="manual-email"
                  type="email"
                  required
                  maxLength={160}
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label htmlFor="manual-address" className="block text-[#242321]/70 mb-1">
                  Street / Delivery Address *
                </label>
                <input
                  id="manual-address"
                  type="text"
                  required
                  minLength={5}
                  maxLength={300}
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="House 14, Sector 29, Near Metro"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-city" className="block text-[#242321]/70 mb-1">
                  City *
                </label>
                <input
                  id="manual-city"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Gurugram"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label htmlFor="manual-pincode" className="block text-[#242321]/70 mb-1">
                  PIN Code (6 Digits) *
                </label>
                <input
                  id="manual-pincode"
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="122002"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>
          </div>

          {/* 3. Items Picker */}
          <div className="bg-white border border-[#DED4C7] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DED4C7]">
              <h3 className="font-semibold text-[#242321]">3. Order Items</h3>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select product to add"
                  value={selectedCatalogId}
                  onChange={e => setSelectedCatalogId(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAF8F4] border border-[#DED4C7] text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                >
                  {catalogOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({formatINR(opt.price)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCatalogItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#242321] text-[#FAF8F4] text-xs font-medium hover:bg-[#713D43] transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#DED4C7]/70">
              {items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#242321] truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-[#242321]/55">{item.volume}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] text-[#242321]/60">
                      Unit ₹
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        required
                        value={item.price}
                        onChange={e =>
                          handleUpdateItem(idx, {
                            price: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="ml-1 w-20 px-2 py-1 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321]"
                      />
                    </label>

                    <label className="text-[11px] text-[#242321]/60">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={item.quantity}
                        onChange={e =>
                          handleUpdateItem(idx, {
                            quantity: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                          })
                        }
                        className="ml-1 w-14 px-2 py-1 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321]"
                      />
                    </label>

                    <span className="font-mono tabular-nums font-semibold text-[#242321] w-20 text-right">
                      {formatINR(item.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1.5 text-[#242321]/50 hover:text-[#B91C1C] transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Pricing, Status & Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#DED4C7] p-4 space-y-3">
              <h3 className="font-semibold text-[#242321] pb-2 border-b border-[#DED4C7]">
                4. Payment &amp; Fulfillment Status
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manual-fulfillment" className="block text-[#242321]/70 mb-1">
                    Fulfillment Status
                  </label>
                  <select
                    id="manual-fulfillment"
                    value={fulfillmentStatus}
                    onChange={e => setFulfillmentStatus(e.target.value as FulfillmentStatus)}
                    className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                  >
                    <option value="placed">Placed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="packed">Packed</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="manual-payment-status" className="block text-[#242321]/70 mb-1">
                    Payment Status
                  </label>
                  <select
                    id="manual-payment-status"
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                  >
                    <option value="paid">Paid Before (UPI Verified)</option>
                    <option value="pending_verification">Verify Prepaid</option>
                    <option value="pending_cod">COD Pending</option>
                    <option value="cod_collected">COD Collected</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manual-utr" className="block text-[#242321]/70 mb-1">
                    UPI UTR / Payment Ref
                  </label>
                  <input
                    id="manual-utr"
                    type="text"
                    maxLength={80}
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g. UTR4321987654"
                    className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                  />
                </div>

                <div>
                  <label htmlFor="manual-awb" className="block text-[#242321]/70 mb-1">
                    AWB / Tracking No.
                  </label>
                  <input
                    id="manual-awb"
                    type="text"
                    maxLength={80}
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="Optional courier AWB"
                    className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-notes" className="block text-[#242321]/70 mb-1">
                  Admin Notes
                </label>
                <textarea
                  id="manual-notes"
                  rows={2}
                  maxLength={500}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="WhatsApp screenshot verified, gift wrap request, etc."
                  className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>

            <div className="bg-white border border-[#DED4C7] p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-semibold text-[#242321] pb-2 border-b border-[#DED4C7]">
                  5. Totals &amp; Discounts
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="manual-coupon" className="block text-[#242321]/70 mb-1">
                      Coupon Code (Optional)
                    </label>
                    <input
                      id="manual-coupon"
                      type="text"
                      maxLength={32}
                      list="manual-coupon-list"
                      value={couponCode}
                      onChange={e => handleApplyCouponPreset(e.target.value.toUpperCase())}
                      placeholder="e.g. TRACE2026"
                      className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono uppercase text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                    <datalist id="manual-coupon-list">
                      {coupons.map(c => (
                        <option key={c.code} value={c.code} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="manual-discount" className="block text-[#242321]/70 mb-1">
                      Discount (₹)
                    </label>
                    <input
                      id="manual-discount"
                      type="number"
                      min={0}
                      max={subtotal}
                      value={discount}
                      onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="manual-shipping" className="text-[#242321]/70">
                        Shipping (₹)
                      </label>
                      <label className="inline-flex items-center gap-1 text-[10px] font-mono text-[#713D43] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoShipping}
                          onChange={e => setAutoShipping(e.target.checked)}
                          className="accent-[#713D43]"
                        />
                        <span>Auto</span>
                      </label>
                    </div>
                    <input
                      id="manual-shipping"
                      type="number"
                      min={0}
                      max={5000}
                      disabled={autoShipping}
                      value={effectiveShippingFee}
                      onChange={e => setManualShippingFee(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] disabled:opacity-60 focus:outline-none focus:border-[#242321]"
                    />
                  </div>

                  {paymentType === 'cod' && (
                    <div>
                      <label htmlFor="manual-cod-fee" className="block text-[#242321]/70 mb-1">
                        COD Fee (₹)
                      </label>
                      <input
                        id="manual-cod-fee"
                        type="number"
                        min={0}
                        max={1000}
                        value={codFee}
                        onChange={e => setCodFee(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-2.5 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] focus:outline-none focus:border-[#242321]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#DED4C7] space-y-1 font-mono tabular-nums text-xs">
                <div className="flex justify-between text-[#242321]/70">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-[#713D43]">
                    <span>Discount</span>
                    <span>-{formatINR(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#242321]/70">
                  <span>Shipping</span>
                  <span>{effectiveShippingFee === 0 ? 'Complimentary' : formatINR(effectiveShippingFee)}</span>
                </div>
                {effectiveCodFee > 0 && (
                  <div className="flex justify-between text-[#242321]/70">
                    <span>COD Fee</span>
                    <span>{formatINR(effectiveCodFee)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#DED4C7] flex justify-between text-base font-semibold text-[#242321]">
                  <span>Total Payable</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Bar */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-2 border-t border-[#DED4C7]">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-5 py-2.5 border border-[#DED4C7] bg-white text-xs font-medium text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#242321] text-[#FAF8F4] text-xs font-semibold uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving Order to Firestore...'
                  : `Create ${paymentType === 'prepaid' ? 'UPI' : 'COD'} Order · ${formatINR(grandTotal)}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
