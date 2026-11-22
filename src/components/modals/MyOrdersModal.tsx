import React, { useEffect, useState } from 'react';
import {
  X,
  Package,
  Search,
  CheckCircle2,
  Truck,
  Banknote,
  CreditCard,
  AlertCircle,
  Clock,
  Trash2,
  XCircle,
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  deriveOrderTrackingKey,
  formatINR,
  formatTimestamp,
  normalizeOrderNumber,
  ORDER_NUMBER_REGEX,
  type FulfillmentStatus,
  type OrderTrackingRecord,
  type PaymentStatus,
  type SavedCustomerOrderRef,
} from '../../utils/storeLogic';
import { TraceLogo } from '../brand/TraceLogo';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedOrders: SavedCustomerOrderRef[];
  onAddSavedOrder: (ref: SavedCustomerOrderRef) => void;
  onRemoveSavedOrder: (trackingKey: string) => void;
}

const PROGRESS_STEPS: Array<{ key: FulfillmentStatus; label: string }> = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_cod: 'Pay on Delivery (COD)',
  cod_collected: 'COD Paid',
  paid: 'Paid Before (Verified)',
  pending_verification: 'Prepaid Verification Pending',
  refunded: 'Refunded',
};

function getStepIndex(status: FulfillmentStatus): number {
  const idx = PROGRESS_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  savedOrders,
  onAddSavedOrder,
  onRemoveSavedOrder,
}) => {
  const [liveRecords, setLiveRecords] = useState<
    Record<string, { loading: boolean; missing: boolean; record: OrderTrackingRecord | null }>
  >({});

  // Lookup form state
  const [lookupOrderNum, setLookupOrderNum] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Close on Escape and lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  // Live Firestore subscriptions for each saved customer order (PII-free /order_tracking/{trackingKey})
  useEffect(() => {
    if (!isOpen || savedOrders.length === 0) return;

    const unsubscribers = savedOrders.map(ref => {
      setLiveRecords(prev => ({
        ...prev,
        [ref.trackingKey]: prev[ref.trackingKey] ?? {
          loading: true,
          missing: false,
          record: null,
        },
      }));

      return onSnapshot(
        doc(db, 'order_tracking', ref.trackingKey),
        snap => {
          if (snap.exists()) {
            setLiveRecords(prev => ({
              ...prev,
              [ref.trackingKey]: {
                loading: false,
                missing: false,
                record: snap.data() as OrderTrackingRecord,
              },
            }));
          } else {
            setLiveRecords(prev => ({
              ...prev,
              [ref.trackingKey]: {
                loading: false,
                missing: true,
                record: null,
              },
            }));
          }
        },
        () => {
          setLiveRecords(prev => ({
            ...prev,
            [ref.trackingKey]: {
              loading: false,
              missing: true,
              record: null,
            },
          }));
        }
      );
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isOpen, savedOrders]);

  if (!isOpen) return null;

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupFeedback(null);

    const normalizedOrder = normalizeOrderNumber(lookupOrderNum);
    const normalizedEmail = lookupEmail.trim().toLowerCase();

    if (!ORDER_NUMBER_REGEX.test(normalizedOrder)) {
      setLookupFeedback({
        type: 'error',
        text: 'Enter a valid TRACE order reference (e.g. TRC-123456-ABC).',
      });
      return;
    }
    if (!normalizedEmail.includes('@') || normalizedEmail.length < 5) {
      setLookupFeedback({
        type: 'error',
        text: 'Enter the exact email address used during checkout.',
      });
      return;
    }

    setLookingUp(true);
    try {
      const trackingKey = await deriveOrderTrackingKey(normalizedOrder, normalizedEmail);
      const snap = await getDoc(doc(db, 'order_tracking', trackingKey));
      if (!snap.exists()) {
        setLookupFeedback({
          type: 'error',
          text: 'No matching order found. Double-check your Order Reference and checkout email.',
        });
        return;
      }

      const data = snap.data() as OrderTrackingRecord;
      onAddSavedOrder({
        orderNumber: data.orderNumber,
        trackingKey,
        placedAt: new Date().toISOString(),
      });
      setLookupOrderNum('');
      setLookupEmail('');
      setLookupFeedback({
        type: 'success',
        text: `Order ${data.orderNumber} found and synced live below.`,
      });
    } catch {
      setLookupFeedback({
        type: 'error',
        text: 'Unable to look up order right now. Please try again shortly.',
      });
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-orders-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#242321]/75 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 md:p-6"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#FAF8F4] border border-[#DED4C7] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-4">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#F3EFE8] border-b border-[#DED4C7] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TraceLogo size="sm" showEmblem={true} />
            <span className="text-xs font-mono text-[#713D43] uppercase tracking-widest border-l border-[#DED4C7] pl-3">
              My Orders
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close My Orders"
            className="p-1.5 text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="space-y-1">
            <h2
              id="my-orders-modal-title"
              className="font-editorial text-2xl sm:text-3xl text-[#242321] tracking-wide"
            >
              Track Your TRACE Orders
            </h2>
            <p className="text-xs font-body text-[#242321]/70">
              Your private orders placed on this device appear automatically and update in real time as we pack and dispatch them.
            </p>
          </div>

          {/* Lookup Form for Orders Placed on Another Device */}
          <form
            onSubmit={handleLookupOrder}
            className="bg-white border border-[#DED4C7] p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#242321]">
              <Search className="w-3.5 h-3.5 text-[#713D43]" />
              <span>Find an Order by Reference &amp; Email</span>
            </div>

            {lookupFeedback && (
              <div
                className={`p-3 border text-xs flex items-center gap-2 ${
                  lookupFeedback.type === 'success'
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                    : 'bg-[#FDF4F5] border-[#713D43]/30 text-[#713D43]'
                }`}
              >
                {lookupFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{lookupFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
              <div className="sm:col-span-5">
                <label htmlFor="track-order-number" className="sr-only">
                  Order Reference Number
                </label>
                <input
                  id="track-order-number"
                  type="text"
                  required
                  value={lookupOrderNum}
                  onChange={e => setLookupOrderNum(e.target.value)}
                  placeholder="Order Ref (e.g. TRC-949536-U2X)"
                  className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] uppercase placeholder:normal-case focus:outline-none focus:border-[#242321]"
                />
              </div>
              <div className="sm:col-span-5">
                <label htmlFor="track-order-email" className="sr-only">
                  Checkout Email Address
                </label>
                <input
                  id="track-order-email"
                  type="email"
                  required
                  value={lookupEmail}
                  onChange={e => setLookupEmail(e.target.value)}
                  placeholder="Checkout email address"
                  className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={lookingUp}
                  className="w-full h-full py-2.5 px-3 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {lookingUp ? '...' : 'Track'}
                </button>
              </div>
            </div>
          </form>

          {/* Saved Customer Orders List */}
          {savedOrders.length === 0 ? (
            <div className="bg-white border border-[#DED4C7] py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-[#F3EFE8] border border-[#DED4C7] flex items-center justify-center text-[#713D43]">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-2xl text-[#242321]">No Orders Saved Yet</h3>
              <p className="text-xs font-body text-[#242321]/65 max-w-md mx-auto leading-relaxed">
                Place an order from your bag to see live status updates here automatically, or enter your Order Reference &amp; checkout email above to track an order from another device.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedOrders.map(ref => {
                const state = liveRecords[ref.trackingKey];
                const record = state?.record;

                return (
                  <article
                    key={ref.trackingKey}
                    className="bg-white border border-[#DED4C7] overflow-hidden"
                  >
                    {/* Order Card Top Strip */}
                    <div className="px-4 sm:px-5 py-3.5 bg-[#F3EFE8]/70 border-b border-[#DED4C7] flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-[#242321]">
                            {ref.orderNumber}
                          </span>
                          {record && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase bg-white border border-[#DED4C7] text-[#242321]">
                              {record.paymentType === 'cod' ? (
                                <Banknote className="w-3 h-3 text-[#B45309]" />
                              ) : (
                                <CreditCard className="w-3 h-3 text-[#15803D]" />
                              )}
                              <span>
                                {record.paymentType === 'cod'
                                  ? 'COD'
                                  : `Paid Before (${record.paymentMethod.toUpperCase()})`}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[#242321]/60">
                          {record
                            ? `${record.customerFirstName} · ${record.city} · Placed ${formatTimestamp(record.createdAt)}`
                            : `Saved ${formatTimestamp(ref.placedAt)}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {record && (
                          <span className="font-mono text-sm font-bold text-[#242321] tabular-nums">
                            {formatINR(record.totalPrice)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveSavedOrder(ref.trackingKey)}
                          aria-label={`Remove ${ref.orderNumber} from this device`}
                          title="Remove from this device"
                          className="p-1.5 text-[#242321]/50 hover:text-[#B91C1C] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Order Body */}
                    {state?.loading ? (
                      <div className="p-5 space-y-2">
                        <div className="h-4 bg-[#F3EFE8] w-2/3 animate-pulse" />
                        <div className="h-8 bg-[#F3EFE8] animate-pulse" />
                      </div>
                    ) : state?.missing || !record ? (
                      <div className="p-5 text-xs font-body text-[#242321]/70 flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#B7A99A] shrink-0" />
                        <span>
                          This order record is no longer active or was archived by store administration.
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 sm:p-5 space-y-5">
                        {/* Live Status Stepper or Cancelled Banner */}
                        {record.fulfillmentStatus === 'cancelled' ? (
                          <div className="p-3 bg-[#FDF4F5] border border-[#B91C1C]/30 text-xs text-[#B91C1C] flex items-center gap-2">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>
                              This order was cancelled. Payment status: {PAYMENT_STATUS_LABEL[record.paymentStatus]}.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-mono uppercase tracking-wider text-[#713D43] font-semibold">
                                Status: {PROGRESS_STEPS[getStepIndex(record.fulfillmentStatus)].label}
                              </span>
                              <span className="font-mono text-[11px] text-[#242321]/70">
                                {PAYMENT_STATUS_LABEL[record.paymentStatus]}
                              </span>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5">
                              {PROGRESS_STEPS.map((stepItem, index) => {
                                const currentIdx = getStepIndex(record.fulfillmentStatus);
                                const completed = index <= currentIdx;
                                return (
                                  <div key={stepItem.key} className="space-y-1.5">
                                    <div
                                      className={`h-1.5 transition-colors ${
                                        completed ? 'bg-[#713D43]' : 'bg-[#DED4C7]'
                                      }`}
                                    />
                                    <span
                                      className={`block text-[10px] font-mono truncate ${
                                        completed
                                          ? 'text-[#242321] font-semibold'
                                          : 'text-[#242321]/45'
                                      }`}
                                    >
                                      {stepItem.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Courier AWB Tracking Strip */}
                        {record.trackingNumber && (
                          <div className="px-3.5 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-2 text-[#242321]/75 font-body">
                              <Truck className="w-4 h-4 text-[#713D43]" />
                              <span>Courier Tracking / AWB:</span>
                            </span>
                            <span className="font-mono font-semibold text-[#242321]">
                              {record.trackingNumber}
                            </span>
                          </div>
                        )}

                        {/* Line Items & Pricing */}
                        <div className="divide-y divide-[#DED4C7]/60 text-xs font-body border-t border-[#DED4C7]/70 pt-2">
                          {record.items.map((item, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              className="py-2 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-9 h-10 object-cover border border-[#DED4C7] shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-[#242321] truncate">{item.name}</p>
                                  <p className="text-[11px] font-mono text-[#242321]/60">
                                    {item.volume} · Qty {item.quantity} × {formatINR(item.price)}
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono tabular-nums font-medium text-[#242321] shrink-0">
                                {formatINR(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-[#DED4C7] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#242321]/65">
                          <span>
                            Subtotal {formatINR(record.subtotal)}
                            {record.discount > 0
                              ? ` · Discount -${formatINR(record.discount)}${record.couponCode ? ` (${record.couponCode})` : ''}`
                              : ''}
                            {record.shippingFee > 0
                              ? ` · Shipping ${formatINR(record.shippingFee)}`
                              : ' · Free Shipping'}
                            {record.codFee > 0 ? ` · COD ${formatINR(record.codFee)}` : ''}
                          </span>
                          <span>Updated {formatTimestamp(record.updatedAt)}</span>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
