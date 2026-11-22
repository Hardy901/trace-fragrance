import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Search,
  Package,
  Banknote,
  CreditCard,
  AlertCircle,
  Truck,
  Clock,
  Trash2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import { useStoreConfig } from '../../context/StoreConfigContext';
import {
  deriveOrderTrackingKey,
  formatINR,
  formatTimestamp,
  normalizeOrderNumber,
  ORDER_NUMBER_REGEX,
  readSavedCustomerOrders,
  removeSavedCustomerOrderRef,
  saveCustomerOrderRef,
  type FulfillmentStatus,
  type OrderTrackingRecord,
  type PaymentStatus,
  type SavedCustomerOrderRef,
} from '../../utils/storeLogic';

interface AdminLiveSyncPanelProps {
  onSwitchToFullSignIn: () => void;
}

const STATUS_BADGE_MAP: Record<FulfillmentStatus, { label: string; tone: string }> = {
  placed: { label: 'Placed', tone: 'bg-[#FAF8F4] border-[#DED4C7] text-[#242321]' },
  confirmed: { label: 'Confirmed', tone: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]' },
  packed: { label: 'Packed', tone: 'bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]' },
  dispatched: { label: 'Dispatched', tone: 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9]' },
  delivered: { label: 'Delivered', tone: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]' },
  cancelled: { label: 'Cancelled', tone: 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]' },
};

const PAYMENT_LABEL_MAP: Record<PaymentStatus, string> = {
  pending_cod: 'COD • Pending Collection',
  cod_collected: 'COD • Collected',
  paid: 'Paid Before • Verified',
  pending_verification: 'Paid Before • Verification Pending',
  refunded: 'Refunded',
};

export const AdminLiveSyncPanel: React.FC<AdminLiveSyncPanelProps> = ({
  onSwitchToFullSignIn,
}) => {
  const { discoverySet, hasLivePricingDoc, activeCoupons, featuredCoupon } = useStoreConfig();

  const [watchedOrders, setWatchedOrders] = useState<SavedCustomerOrderRef[]>(() =>
    readSavedCustomerOrders()
  );
  const [liveRecords, setLiveRecords] = useState<
    Record<string, { loading: boolean; missing: boolean; record: OrderTrackingRecord | null }>
  >({});

  const [orderRefInput, setOrderRefInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Subscribe in real time to each watched order's PII-free Firestore tracking projection
  useEffect(() => {
    if (watchedOrders.length === 0) return;

    const unsubscribers = watchedOrders.map(ref => {
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
  }, [watchedOrders]);

  const handleVerifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const normalizedRef = normalizeOrderNumber(orderRefInput);
    const normalizedEmail = emailInput.trim().toLowerCase();

    if (!ORDER_NUMBER_REGEX.test(normalizedRef)) {
      setFeedback({
        type: 'error',
        text: 'Enter a valid order reference such as TRC-949536-U2X.',
      });
      return;
    }
    if (!normalizedEmail.includes('@') || normalizedEmail.length < 5) {
      setFeedback({
        type: 'error',
        text: 'Enter the exact checkout email used when placing the order.',
      });
      return;
    }

    setChecking(true);
    try {
      const trackingKey = await deriveOrderTrackingKey(normalizedRef, normalizedEmail);
      const snap = await getDoc(doc(db, 'order_tracking', trackingKey));
      if (!snap.exists()) {
        setFeedback({
          type: 'error',
          text: 'No synced order found in Firestore for that Order Reference and email pair.',
        });
        return;
      }

      const data = snap.data() as OrderTrackingRecord;
      const updated = saveCustomerOrderRef({
        orderNumber: data.orderNumber,
        trackingKey,
        placedAt: new Date().toISOString(),
      });
      setWatchedOrders(updated);
      setOrderRefInput('');
      setEmailInput('');
      setFeedback({
        type: 'success',
        text: `Verified live in Firestore: ${data.orderNumber} (${data.fulfillmentStatus.toUpperCase()}).`,
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Unable to query Firestore right now. Check your network connection and retry.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleRemoveWatched = (trackingKey: string) => {
    setWatchedOrders(removeSavedCustomerOrderRef(trackingKey));
  };

  return (
    <div className="space-y-5">
      {/* 1. Live Firestore Connection & Storefront Catalog Health */}
      <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#242321]">
            <Database className="w-4 h-4 text-[#713D43]" />
            <span>Live Firestore Sync Status</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 border font-mono text-[10px] uppercase tracking-wider ${
              hasLivePricingDoc
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                : 'bg-[#FEFCE8] border-[#FEF08A] text-[#A16207]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{hasLivePricingDoc ? 'Synced Live' : 'Connected (Defaults)'}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-white border border-[#DED4C7]">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#242321]/55">
              Discovery Set
            </span>
            <span className="font-mono font-semibold text-[#242321] block mt-0.5">
              {discoverySet.formattedPrice}
            </span>
            <span className="text-[10px] font-mono text-[#242321]/60">
              {discoverySet.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div className="p-2.5 bg-white border border-[#DED4C7]">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#242321]/55">
              Active Coupons
            </span>
            <span className="font-mono font-semibold text-[#242321] block mt-0.5">
              {activeCoupons.length} live
            </span>
            <span className="text-[10px] font-mono text-[#713D43] truncate block">
              {featuredCoupon ? featuredCoupon.code : 'None featured'}
            </span>
          </div>
          <div className="p-2.5 bg-white border border-[#DED4C7]">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#242321]/55">
              Orders Tracked
            </span>
            <span className="font-mono font-semibold text-[#242321] block mt-0.5">
              {watchedOrders.length} checked
            </span>
            <span className="text-[10px] font-mono text-[#242321]/60">PII-free view</span>
          </div>
        </div>

        <p className="text-[10px] font-mono text-[#242321]/55 truncate">
          DB: {firebaseConfig.firestoreDatabaseId}
        </p>
      </div>

      {/* 2. Verify Any Order in Firestore (No Firebase Sign-In Needed) */}
      <form
        onSubmit={handleVerifyOrder}
        className="p-4 bg-white border border-[#DED4C7] space-y-3 text-xs font-body"
      >
        <div>
          <h2 className="font-semibold text-[#242321] text-xs uppercase tracking-wider font-mono">
            Verify Order Sync in Firestore
          </h2>
          <p className="text-[11px] text-[#242321]/65 mt-1 leading-relaxed">
            Enter any test or customer Order Reference and checkout email to confirm it synced live to Firestore without needing Firebase sign-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="sync-order-ref"
              className="block text-[10px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
            >
              Order Reference
            </label>
            <input
              id="sync-order-ref"
              type="text"
              required
              value={orderRefInput}
              onChange={e => setOrderRefInput(e.target.value)}
              placeholder="TRC-949536-U2X"
              className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
            />
          </div>
          <div>
            <label
              htmlFor="sync-order-email"
              className="block text-[10px] font-mono uppercase tracking-wider text-[#242321]/65 mb-1"
            >
              Checkout Email
            </label>
            <input
              id="sync-order-email"
              type="email"
              required
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
            />
          </div>
        </div>

        {feedback && (
          <div
            className={`p-2.5 border text-[11px] flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                : 'bg-[#FDF4F5] border-[#713D43]/30 text-[#713D43]'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={checking}
          className="w-full py-2.5 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.16em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{checking ? 'Checking Live Firestore...' : 'Verify Live Sync'}</span>
        </button>
      </form>

      {/* 3. Live Verified Order Cards (Auto-populated from device + manual verifications) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#242321]/70">
            Live Synced Orders ({watchedOrders.length})
          </span>
          <span className="text-[10px] font-mono text-[#15803D]">Real-time stream</span>
        </div>

        {watchedOrders.length === 0 ? (
          <div className="p-4 bg-[#FAF8F4] border border-dashed border-[#DED4C7] text-center space-y-1.5">
            <Package className="w-5 h-5 text-[#B7A99A] mx-auto" />
            <p className="text-xs font-medium text-[#242321]">No Orders Checked Yet</p>
            <p className="text-[11px] text-[#242321]/65 leading-relaxed">
              Place a test COD order on the storefront or enter any Order Ref + Email above to verify real-time Firestore syncing.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
            {watchedOrders.map(ref => {
              const state = liveRecords[ref.trackingKey];
              const record = state?.record ?? null;
              const statusMeta = record
                ? STATUS_BADGE_MAP[record.fulfillmentStatus] ?? STATUS_BADGE_MAP.placed
                : null;

              return (
                <div
                  key={ref.trackingKey}
                  className="p-3.5 bg-[#FAF8F4] border border-[#DED4C7] space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[#242321]">
                          {ref.orderNumber}
                        </span>
                        {state?.loading ? (
                          <span className="text-[10px] font-mono text-[#242321]/55">
                            Syncing...
                          </span>
                        ) : state?.missing ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] font-mono text-[10px]">
                            <XCircle className="w-3 h-3" />
                            <span>Deleted / Not Found</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] font-mono text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Synced in Firestore</span>
                          </span>
                        )}
                      </div>
                      {record && (
                        <p className="text-[11px] text-[#242321]/65 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            {record.customerFirstName} • {record.city} •{' '}
                            {formatTimestamp(record.createdAt)}
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWatched(ref.trackingKey)}
                      aria-label={`Remove ${ref.orderNumber} from sync verifier`}
                      className="p-1 text-[#242321]/45 hover:text-[#B91C1C] transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {record && statusMeta && (
                    <>
                      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#DED4C7]/70">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 border font-mono text-[10px] uppercase tracking-wider ${statusMeta.tone}`}
                          >
                            {statusMeta.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#DED4C7] font-mono text-[10px] text-[#242321]/80">
                            {record.paymentType === 'cod' ? (
                              <Banknote className="w-3 h-3 text-[#713D43]" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-[#15803D]" />
                            )}
                            <span>{PAYMENT_LABEL_MAP[record.paymentStatus]}</span>
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#242321]">
                          {formatINR(record.totalPrice)}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#242321]/75 space-y-0.5">
                        {record.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between gap-2">
                            <span className="truncate">
                              {item.quantity} × {item.name}
                            </span>
                            <span className="font-mono shrink-0">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {record.trackingNumber && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#713D43] bg-white px-2.5 py-1.5 border border-[#DED4C7]">
                          <Truck className="w-3.5 h-3.5 shrink-0" />
                          <span>AWB: {record.trackingNumber}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Full Admin Management Notice */}
      <div className="p-3.5 bg-[#F3EFE8] border border-[#DED4C7] text-[11px] text-[#242321]/80 space-y-2 leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-[#242321]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#713D43]" />
          <span>Why Full Order Management Still Needs Step 2 Sign-In</span>
        </div>
        <p>
          Full customer details (phone numbers, street addresses), status updates, order deletion, and price/coupon publishing remain locked behind Firebase Authentication so customer PII can never be accessed without verified admin identity.
        </p>
        <button
          type="button"
          onClick={onSwitchToFullSignIn}
          className="text-[#713D43] font-medium underline underline-offset-2 hover:text-[#242321] cursor-pointer"
        >
          Switch to Full Admin Sign-In →
        </button>
      </div>
    </div>
  );
};
