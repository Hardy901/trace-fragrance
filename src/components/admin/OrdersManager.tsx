import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  X,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Banknote,
  AlertCircle,
  Save,
  Trash2,
  Plus,
  PackageCheck,
} from 'lucide-react';
import {
  formatINR,
  formatTimestamp,
  ordersToCsv,
  summarizeOrderAnalytics,
  type FulfillmentStatus,
  type OrderRecord,
  type PaymentStatus,
} from '../../utils/storeLogic';
import { deleteOrderRecord, updateOrderRecord } from '../../services/firestoreService';
import { AddOrderModal } from './AddOrderModal';

interface OrdersManagerProps {
  orders: OrderRecord[];
  loading: boolean;
  actorEmail: string;
}

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending_cod: 'COD Pending',
  cod_collected: 'COD Collected',
  paid: 'Paid Before',
  pending_verification: 'Verify Prepaid',
  refunded: 'Refunded',
};

function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
    case 'cod_collected':
      return 'text-[#15803D]';
    case 'pending_cod':
    case 'pending_verification':
      return 'text-[#B45309]';
    case 'refunded':
      return 'text-[#B91C1C]';
  }
}

function getFulfillmentColor(status: FulfillmentStatus): string {
  switch (status) {
    case 'delivered':
      return 'text-[#15803D]';
    case 'dispatched':
      return 'text-[#1D4ED8]';
    case 'cancelled':
      return 'text-[#B91C1C]';
    default:
      return 'text-[#242321]';
  }
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  loading,
  actorEmail,
}) => {
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod' | 'prepaid'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FulfillmentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Drawer editable fields
  const [editFulfillment, setEditFulfillment] = useState<FulfillmentStatus>('placed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('pending_cod');
  const [editPaymentRef, setEditPaymentRef] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [ledgerNotice, setLedgerNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const analytics = useMemo(() => summarizeOrderAnalytics(orders), [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter(order => {
      if (paymentFilter !== 'all' && order.paymentType !== paymentFilter) return false;
      if (statusFilter !== 'all' && order.fulfillmentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        order.pincode.includes(q) ||
        order.couponCode.toLowerCase().includes(q) ||
        order.paymentReference.toLowerCase().includes(q)
      );
    });
  }, [orders, paymentFilter, statusFilter, searchTerm]);

  const openOrderDrawer = (order: OrderRecord) => {
    setSelectedOrder(order);
    setEditFulfillment(order.fulfillmentStatus);
    setEditPaymentStatus(order.paymentStatus);
    setEditPaymentRef(order.paymentReference || '');
    setEditTracking(order.trackingNumber || '');
    setEditNotes(order.adminNotes || '');
    setConfirmingDelete(false);
    setFeedback(null);
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setDeleting(true);
    setFeedback(null);
    const targetNumber = selectedOrder.orderNumber;
    try {
      await deleteOrderRecord(selectedOrder);
      setSelectedOrder(null);
      setConfirmingDelete(false);
      setLedgerNotice(`Order ${targetNumber} was permanently deleted and recorded in the audit log.`);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete order.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateOrderRecord(
        selectedOrder,
        {
          fulfillmentStatus: editFulfillment,
          paymentStatus: editPaymentStatus,
          paymentReference: editPaymentRef,
          trackingNumber: editTracking,
          adminNotes: editNotes,
        },
        actorEmail
      );
      setFeedback({ type: 'success', text: `Order ${selectedOrder.orderNumber} updated live.` });
      setSelectedOrder(prev =>
        prev
          ? {
              ...prev,
              fulfillmentStatus: editFulfillment,
              paymentStatus: editPaymentStatus,
              paymentReference: editPaymentRef,
              trackingNumber: editTracking,
              adminNotes: editNotes,
              updatedBy: actorEmail,
            }
          : null
      );
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update order.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPaymentAction = async (nextStatus: PaymentStatus, nextFulfillment?: FulfillmentStatus) => {
    if (!selectedOrder) return;
    setEditPaymentStatus(nextStatus);
    if (nextFulfillment) setEditFulfillment(nextFulfillment);
    setSaving(true);
    setFeedback(null);
    try {
      await updateOrderRecord(
        selectedOrder,
        {
          fulfillmentStatus: nextFulfillment ?? editFulfillment,
          paymentStatus: nextStatus,
          paymentReference: editPaymentRef,
          trackingNumber: editTracking,
          adminNotes: editNotes,
        },
        actorEmail
      );
      setFeedback({
        type: 'success',
        text: `Marked ${selectedOrder.orderNumber} as ${PAYMENT_STATUS_LABELS[nextStatus]}.`,
      });
      setSelectedOrder(prev =>
        prev
          ? {
              ...prev,
              paymentStatus: nextStatus,
              fulfillmentStatus: nextFulfillment ?? prev.fulfillmentStatus,
              updatedBy: actorEmail,
            }
          : null
      );
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Update failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const csv = ordersToCsv(filteredOrders);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trace-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {ledgerNotice && (
        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{ledgerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLedgerNotice(null)}
            aria-label="Dismiss notification"
            className="p-1 text-[#15803D]/70 hover:text-[#15803D] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Strip — 4-column flat grid with hairline dividers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-[#DED4C7] divide-y sm:divide-y-0 sm:divide-x divide-[#DED4C7]">
        <div className="p-5 space-y-1">
          <span className="text-xs font-body text-[#242321]/60 block">
            Net Order Value
          </span>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#242321]">
            {formatINR(analytics.totalRevenue)}
          </p>
          <p className="text-xs font-body text-[#242321]/60">
            {analytics.activeOrders} active · Avg {formatINR(analytics.averageOrderValue)}
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-body text-[#242321]/60 block">
            Paid Before (Prepaid)
          </span>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#15803D]">
            {formatINR(analytics.paidBeforeRevenue)}
          </p>
          <p className="text-xs font-body text-[#242321]/60">
            {analytics.prepaidOrdersCount} UPI / Prepaid orders
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-body text-[#242321]/60 block">
            COD Pending Collection
          </span>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#B45309]">
            {formatINR(analytics.codPendingRevenue)}
          </p>
          <p className="text-xs font-body text-[#242321]/60">
            {analytics.codOrdersCount} COD total · {formatINR(analytics.codCollectedRevenue)} collected
          </p>
        </div>

        <div className="p-5 space-y-1">
          <span className="text-xs font-body text-[#242321]/60 block">
            Awaiting Dispatch
          </span>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#713D43]">
            {analytics.pendingDispatchCount}
          </p>
          <p className="text-xs font-body text-[#242321]/60">
            Placed, confirmed, or packed
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-[#DED4C7] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Payment Type Segmented Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 bg-[#F3EFE8] border border-[#DED4C7]" role="group" aria-label="Filter orders by payment type">
            {(
              [
                { id: 'all', label: `All (${orders.length})` },
                { id: 'cod', label: `COD (${orders.filter(o => o.paymentType === 'cod').length})` },
                {
                  id: 'prepaid',
                  label: `Paid Before (${orders.filter(o => o.paymentType === 'prepaid').length})`,
                },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPaymentFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-body font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  paymentFilter === tab.id
                    ? 'bg-[#242321] text-[#FAF8F4]'
                    : 'text-[#242321]/70 hover:text-[#242321]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by fulfillment status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | FulfillmentStatus)}
            className="px-3 py-2 text-xs font-body bg-white border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
          >
            <option value="all">All Fulfillment Stages</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Search & CSV Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#242321]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search order ID, name, city, PIN..."
              className="w-full pl-9 pr-3 py-2 text-xs font-body bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] placeholder:text-[#242321]/45 focus:outline-none focus:border-[#242321]"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#DED4C7] bg-white text-xs font-body font-medium text-[#242321] hover:bg-[#F3EFE8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddOrderModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Order / UPI</span>
          </button>
        </div>
      </div>

      {/* Orders Ledger Table */}
      <div className="bg-white border border-[#DED4C7] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map(idx => (
              <div key={idx} className="h-11 bg-[#F3EFE8] animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <p className="font-editorial text-2xl text-[#242321]">
              {orders.length === 0 ? 'No Orders Received Yet' : 'No Orders Match Current Filters'}
            </p>
            <p className="text-xs font-body text-[#242321]/65 max-w-md mx-auto">
              {orders.length === 0
                ? 'New Cash on Delivery storefront orders and manual WhatsApp UPI orders you add will appear here in real time.'
                : 'Try adjusting the COD/Prepaid filter or clearing your search query.'}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={() => setShowAddOrderModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First UPI / Manual Order</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DED4C7] bg-[#FAF8F4] text-[11px] font-mono text-[#242321]/60">
                  <th className="py-3 px-4 font-medium">Order Ref</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Payment Mode</th>
                  <th className="py-3 px-4 font-medium">Payment Status</th>
                  <th className="py-3 px-4 font-medium">Fulfillment</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED4C7]/70 text-xs font-body">
                {filteredOrders.map(order => (
                  <tr
                    key={order.orderNumber}
                    className="hover:bg-[#FAF8F4]/80 transition-colors"
                  >
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#242321] block">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] font-mono text-[#242321]/55">
                        {formatTimestamp(order.createdAt)}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <span className="font-medium text-[#242321] block">
                        {order.customerName}
                      </span>
                      <span className="text-[11px] text-[#242321]/60">
                        {order.city} · {order.pincode} · {order.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                      </span>
                    </td>

                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#242321]">
                        {order.paymentType === 'cod' ? (
                          <Banknote className="w-3.5 h-3.5 text-[#B45309]" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-[#15803D]" />
                        )}
                        <span>
                          {order.paymentType === 'cod'
                            ? 'COD'
                            : `Prepaid (${order.paymentMethod.toUpperCase()})`}
                        </span>
                      </span>
                      {order.couponCode && (
                        <span className="block text-[11px] font-mono text-[#713D43]">
                          Code: {order.couponCode}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className={`font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                      {order.paymentReference && (
                        <span className="block text-[11px] font-mono text-[#242321]/55 truncate max-w-[140px]">
                          Ref: {order.paymentReference}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className={`font-medium ${getFulfillmentColor(order.fulfillmentStatus)}`}>
                        {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                      </span>
                      {order.trackingNumber && (
                        <span className="block text-[11px] font-mono text-[#242321]/55">
                          AWB: {order.trackingNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                      <span className="font-mono tabular-nums font-semibold text-[#242321]">
                        {formatINR(order.totalPrice)}
                      </span>
                      {order.discount > 0 && (
                        <span className="block text-[11px] font-mono text-[#713D43]">
                          -{formatINR(order.discount)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openOrderDrawer(order)}
                        className="px-3 py-1.5 border border-[#DED4C7] bg-white text-xs font-body font-medium text-[#242321] hover:bg-[#242321] hover:text-[#FAF8F4] transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Reconciliation Drawer */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-drawer-title"
          className="fixed inset-0 z-50 bg-[#242321]/60 backdrop-blur-xs flex justify-end"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="w-full max-w-xl bg-[#FAF8F4] border-l border-[#DED4C7] h-full flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4 bg-white border-b border-[#DED4C7] flex items-center justify-between gap-4">
              <div>
                <h2 id="order-drawer-title" className="font-mono text-base font-semibold text-[#242321]">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-[#242321]/60 font-body">
                  Placed {formatTimestamp(selectedOrder.createdAt)} ·{' '}
                  {selectedOrder.paymentType === 'cod' ? 'Cash on Delivery' : 'Paid Before'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="p-2 text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {feedback && (
                <div
                  className={`p-3.5 border text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                      : 'bg-[#FDF4F5] border-[#713D43]/30 text-[#713D43]'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* Quick Reconciliation Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.paymentType === 'cod' && selectedOrder.paymentStatus === 'pending_cod' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleQuickPaymentAction('cod_collected', 'delivered')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#15803D] text-white text-xs font-body font-medium hover:bg-[#166534] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark COD Collected &amp; Delivered</span>
                  </button>
                )}
                {selectedOrder.paymentType === 'prepaid' &&
                  selectedOrder.paymentStatus === 'pending_verification' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleQuickPaymentAction('paid', 'confirmed')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#15803D] text-white text-xs font-body font-medium hover:bg-[#166534] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Prepaid Payment</span>
                    </button>
                  )}
                {selectedOrder.fulfillmentStatus === 'placed' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleQuickPaymentAction(editPaymentStatus, 'confirmed')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#242321] text-white text-xs font-body font-medium hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Confirm Order</span>
                  </button>
                )}
                {selectedOrder.fulfillmentStatus !== 'delivered' &&
                  selectedOrder.fulfillmentStatus !== 'cancelled' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleQuickPaymentAction(
                          selectedOrder.paymentType === 'cod' &&
                            selectedOrder.paymentStatus === 'pending_cod'
                            ? 'cod_collected'
                            : editPaymentStatus,
                          'delivered'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#15803D] bg-white text-[#15803D] text-xs font-body font-medium hover:bg-[#15803D] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
              </div>

              {/* Customer Shipping PII */}
              <div className="bg-white border border-[#DED4C7] p-4 space-y-2 text-xs font-body">
                <h3 className="font-semibold text-[#242321] pb-2 border-b border-[#DED4C7]">
                  Customer &amp; Shipping Details
                </h3>
                <div className="grid grid-cols-2 gap-y-2 pt-1">
                  <span className="text-[#242321]/60">Recipient</span>
                  <span className="font-medium text-[#242321]">{selectedOrder.customerName}</span>
                  <span className="text-[#242321]/60">Phone</span>
                  <span className="font-mono text-[#242321]">{selectedOrder.customerPhone}</span>
                  <span className="text-[#242321]/60">Email</span>
                  <span className="font-mono text-[#242321] break-all">{selectedOrder.customerEmail}</span>
                  <span className="text-[#242321]/60">Address</span>
                  <span className="text-[#242321]">
                    {selectedOrder.shippingAddress}, {selectedOrder.city} — {selectedOrder.pincode}
                  </span>
                </div>
              </div>

              {/* Line Items & Pricing Breakdown */}
              <div className="bg-white border border-[#DED4C7] p-4 space-y-3 text-xs font-body">
                <h3 className="font-semibold text-[#242321] pb-2 border-b border-[#DED4C7]">
                  Order Summary
                </h3>
                <div className="divide-y divide-[#DED4C7]/60">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="py-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#242321]">{item.name}</p>
                        <p className="text-[11px] font-mono text-[#242321]/60">
                          {item.volume} · Qty {item.quantity} × {formatINR(item.price)}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums font-medium text-[#242321]">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#DED4C7] space-y-1.5 font-mono tabular-nums">
                  <div className="flex justify-between text-[#242321]/70">
                    <span>Subtotal</span>
                    <span>{formatINR(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-[#713D43]">
                      <span>Coupon ({selectedOrder.couponCode || 'Discount'})</span>
                      <span>-{formatINR(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#242321]/70">
                    <span>Shipping</span>
                    <span>{selectedOrder.shippingFee === 0 ? 'Complimentary' : formatINR(selectedOrder.shippingFee)}</span>
                  </div>
                  {selectedOrder.codFee > 0 && (
                    <div className="flex justify-between text-[#242321]/70">
                      <span>COD Handling Fee</span>
                      <span>{formatINR(selectedOrder.codFee)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#DED4C7] flex justify-between text-sm font-semibold text-[#242321]">
                    <span>Total Payable</span>
                    <span>{formatINR(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Editable Fulfillment & Payment Form */}
              <form onSubmit={handleSaveOrder} className="bg-white border border-[#DED4C7] p-4 space-y-4">
                <h3 className="font-semibold text-xs text-[#242321] pb-2 border-b border-[#DED4C7] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#713D43]" />
                  <span>Fulfillment &amp; Payment Reconciliation</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor="order-fulfillment" className="block text-[#242321]/70 mb-1.5 font-medium">
                      Fulfillment Stage
                    </label>
                    <select
                      id="order-fulfillment"
                      value={editFulfillment}
                      onChange={e => setEditFulfillment(e.target.value as FulfillmentStatus)}
                      className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
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
                    <label htmlFor="order-payment-status" className="block text-[#242321]/70 mb-1.5 font-medium">
                      Payment Status
                    </label>
                    <select
                      id="order-payment-status"
                      value={editPaymentStatus}
                      onChange={e => setEditPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                    >
                      <option value="pending_cod">COD Pending</option>
                      <option value="cod_collected">COD Collected</option>
                      <option value="paid">Paid Before (Verified)</option>
                      <option value="pending_verification">Verify Prepaid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor="order-tracking" className="block text-[#242321]/70 mb-1.5 font-medium">
                      Courier AWB / Tracking Number
                    </label>
                    <input
                      id="order-tracking"
                      type="text"
                      maxLength={80}
                      value={editTracking}
                      onChange={e => setEditTracking(e.target.value)}
                      placeholder="e.g. BLUEDART-884120"
                      className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>

                  <div>
                    <label htmlFor="order-payment-ref" className="block text-[#242321]/70 mb-1.5 font-medium">
                      Payment Reference / UTR
                    </label>
                    <input
                      id="order-payment-ref"
                      type="text"
                      maxLength={80}
                      value={editPaymentRef}
                      onChange={e => setEditPaymentRef(e.target.value)}
                      placeholder="UPI UTR or receipt ID"
                      className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label htmlFor="order-notes" className="block text-[#242321]/70 mb-1.5 font-medium">
                    Internal Admin Notes
                  </label>
                  <textarea
                    id="order-notes"
                    rows={3}
                    maxLength={500}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Dispatch remarks, COD courier confirmation, or customer requests..."
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="w-full py-3 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving to Firestore...' : 'Save Order Update'}</span>
                </button>
              </form>

              {/* Danger Zone: Permanent Order Deletion */}
              <div className="bg-[#FDF4F5] border border-[#B91C1C]/30 p-4 space-y-3 text-xs font-body">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[#B91C1C]">Danger Zone — Delete Order</h3>
                    <p className="text-[11px] text-[#242321]/70 mt-0.5">
                      Permanently remove {selectedOrder.orderNumber} from the orders ledger and customer tracker. Logged to audit trail.
                    </p>
                  </div>
                </div>

                {!confirmingDelete ? (
                  <button
                    type="button"
                    disabled={saving || deleting}
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#B91C1C] bg-white text-[#B91C1C] text-xs font-medium hover:bg-[#B91C1C] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Order</span>
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-1 border-t border-[#B91C1C]/20">
                    <p className="text-xs font-medium text-[#B91C1C]">
                      Are you sure you want to permanently delete{' '}
                      <span className="font-mono">{selectedOrder.orderNumber}</span>? This cannot be undone.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDeleteOrder}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B91C1C] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#991B1B] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deleting ? 'Deleting Order...' : 'Confirm Permanent Delete'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirmingDelete(false)}
                        className="px-3.5 py-2 border border-[#DED4C7] bg-white text-xs text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Manual / WhatsApp UPI Order Modal */}
      {showAddOrderModal && (
        <AddOrderModal
          actorEmail={actorEmail}
          onClose={() => setShowAddOrderModal(false)}
          onCreated={result => {
            setShowAddOrderModal(false);
            setLedgerNotice(
              `Created order ${result.orderNumber} for ${result.customerName} (${formatINR(result.totalPrice)}). Synced live to Firestore & customer tracking.`
            );
          }}
        />
      )}
    </div>
  );
};
