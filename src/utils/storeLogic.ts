import type { Timestamp } from 'firebase/firestore';

export type DiscountType = 'fixed' | 'percent';
export type PaymentType = 'cod' | 'prepaid';
export type PaymentMethod = 'cod' | 'upi' | 'cards';
export type PaymentStatus =
  | 'pending_cod'
  | 'cod_collected'
  | 'paid'
  | 'pending_verification'
  | 'refunded';
export type FulfillmentStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';
export type AdminRole = 'owner' | 'manager';
export type AuditAction =
  | 'pricing_updated'
  | 'coupon_created'
  | 'coupon_updated'
  | 'coupon_deleted'
  | 'order_updated'
  | 'order_deleted'
  | 'admin_added'
  | 'admin_removed'
  | 'session_login';

export interface StorePricingConfig {
  discoverySetPrice: number;
  discoverySetInStock: boolean;
  fragrancePrices: Record<string, number>;
  fragranceStock: Record<string, boolean>;
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  codFee: number;
  prepaidEnabled: boolean;
  featuredCouponCode: string;
  promoBannerText: string;
  updatedBy: string;
  updatedAt?: Timestamp | Date | string | null;
}

export interface CouponRecord {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  applyPerItem: boolean;
  minOrderAmount: number;
  maxDiscount: number;
  active: boolean;
  usageCount: number;
  maxUses: number;
  createdBy: string;
  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
}

export interface OrderItemSnapshot {
  id: string;
  name: string;
  price: number;
  quantity: number;
  volume: string;
  image: string;
}

export interface OrderRecord {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  pincode: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shippingFee: number;
  codFee: number;
  totalPrice: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string;
  trackingKey?: string;
  adminNotes: string;
  updatedBy: string;
  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
}

export interface OrderTrackingRecord {
  trackingKey: string;
  orderNumber: string;
  customerFirstName: string;
  city: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shippingFee: number;
  codFee: number;
  totalPrice: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string;
  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
}

export interface SavedCustomerOrderRef {
  orderNumber: string;
  trackingKey: string;
  placedAt: string;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  addedBy: string;
  createdAt?: Timestamp | Date | string | null;
}

export interface AuditLogRecord {
  id?: string;
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  targetId: string;
  summary: string;
  createdAt?: Timestamp | Date | string | null;
}

export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,32}$/;
export const FEATURED_COUPON_REGEX = /^[A-Z0-9_-]{0,32}$/;
export const PINCODE_REGEX = /^[0-9]{6}$/;
export const ORDER_NUMBER_REGEX = /^TRC-[A-Z0-9-]{2,28}$/;
export const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export const DEFAULT_STORE_PRICING: StorePricingConfig = {
  discoverySetPrice: 799,
  discoverySetInStock: true,
  fragrancePrices: {
    'fragrance-01-drift': 1200,
    'fragrance-02-ignite': 1200,
    'fragrance-03-lush': 1200,
    'fragrance-04-vesper': 1200,
  },
  fragranceStock: {
    'fragrance-01-drift': true,
    'fragrance-02-ignite': true,
    'fragrance-03-lush': true,
    'fragrance-04-vesper': true,
  },
  shippingFee: 99,
  freeShippingThreshold: 1500,
  codEnabled: true,
  codFee: 0,
  prepaidEnabled: true,
  featuredCouponCode: 'TRACE2026',
  promoBannerText: 'Launch Offer: Instant savings at checkout',
  updatedBy: 'system',
};

export const DEFAULT_COUPONS: CouponRecord[] = [
  {
    code: 'TRACE2026',
    description: 'Launch Offer — ₹100 OFF per item',
    discountType: 'fixed',
    discountValue: 100,
    applyPerItem: true,
    minOrderAmount: 0,
    maxDiscount: 0,
    active: true,
    usageCount: 0,
    maxUses: 0,
    createdBy: 'system',
  },
];

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

export const TRACKING_KEY_REGEX = /^[a-f0-9]{40}$/;

export function normalizeOrderNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
}

export function extractFirstName(fullName: string): string {
  const cleaned = fullName.trim().split(/\s+/)[0] || 'Guest';
  return cleaned.slice(0, 60);
}

export async function deriveOrderTrackingKey(orderNumber: string, email: string): Promise<string> {
  const normalizedOrder = normalizeOrderNumber(orderNumber);
  const normalizedEmail = email.trim().toLowerCase();
  const payload = `${normalizedOrder}|${normalizedEmail}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 40);
}

const CUSTOMER_ORDERS_STORAGE_KEY = 'trace_customer_orders_v1';

export function readSavedCustomerOrders(): SavedCustomerOrderRef[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMER_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is SavedCustomerOrderRef =>
          Boolean(entry) &&
          typeof entry.orderNumber === 'string' &&
          typeof entry.trackingKey === 'string' &&
          ORDER_NUMBER_REGEX.test(entry.orderNumber) &&
          TRACKING_KEY_REGEX.test(entry.trackingKey)
      )
      .slice(0, 25);
  } catch {
    return [];
  }
}

export function saveCustomerOrderRef(entry: SavedCustomerOrderRef): SavedCustomerOrderRef[] {
  const existing = readSavedCustomerOrders().filter(
    item => item.trackingKey !== entry.trackingKey && item.orderNumber !== entry.orderNumber
  );
  const next = [entry, ...existing].slice(0, 25);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOMER_ORDERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function removeSavedCustomerOrderRef(trackingKey: string): SavedCustomerOrderRef[] {
  const next = readSavedCustomerOrders().filter(item => item.trackingKey !== trackingKey);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOMER_ORDERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function generateOrderNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TRC-${randomDigits}-${suffix}`;
}

export function calculateCouponDiscount(
  coupon: CouponRecord | null,
  subtotal: number,
  itemCount: number
): { discount: number; error: string | null } {
  if (!coupon) {
    return { discount: 0, error: null };
  }
  if (!coupon.active) {
    return { discount: 0, error: `Coupon "${coupon.code}" is currently inactive.` };
  }
  if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) {
    return { discount: 0, error: `Coupon "${coupon.code}" has reached its redemption limit.` };
  }
  if (subtotal <= 0) {
    return { discount: 0, error: null };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      discount: 0,
      error: `Minimum order of ${formatINR(coupon.minOrderAmount)} required for "${coupon.code}".`,
    };
  }

  let rawDiscount = 0;
  if (coupon.discountType === 'percent') {
    rawDiscount = Math.round((subtotal * coupon.discountValue) / 100);
  } else {
    const multiplier = coupon.applyPerItem ? Math.max(1, itemCount) : 1;
    rawDiscount = Math.round(coupon.discountValue * multiplier);
  }

  if (coupon.maxDiscount > 0) {
    rawDiscount = Math.min(rawDiscount, coupon.maxDiscount);
  }

  const finalDiscount = Math.max(0, Math.min(subtotal, rawDiscount));
  return { discount: finalDiscount, error: null };
}

export function computeDiscountedPrice(
  basePrice: number,
  featuredCoupon: CouponRecord | null
): number | null {
  if (!featuredCoupon || !featuredCoupon.active) return null;
  if (featuredCoupon.maxUses > 0 && featuredCoupon.usageCount >= featuredCoupon.maxUses) {
    return null;
  }
  if (basePrice < featuredCoupon.minOrderAmount) return null;

  const { discount } = calculateCouponDiscount(featuredCoupon, basePrice, 1);
  if (discount <= 0) return null;
  return Math.max(0, basePrice - discount);
}

export function describeCouponSavings(coupon: CouponRecord | null): string {
  if (!coupon) return '';
  if (coupon.discountType === 'percent') {
    const cap = coupon.maxDiscount > 0 ? ` (up to ${formatINR(coupon.maxDiscount)})` : '';
    return `${coupon.discountValue}% OFF${cap}`;
  }
  return `${formatINR(coupon.discountValue)} OFF${coupon.applyPerItem ? ' per item' : ''}`;
}

export function calculateCartTotals(
  items: Array<{ price: number; quantity: number }>,
  config: StorePricingConfig,
  activeCoupon: CouponRecord | null,
  paymentType: PaymentType = 'prepaid'
) {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const { discount, error: discountError } = calculateCouponDiscount(
    activeCoupon,
    subtotal,
    totalItems
  );
  const shippingFee =
    subtotal === 0 || subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;
  const codFee = subtotal > 0 && paymentType === 'cod' ? config.codFee : 0;
  const totalPrice = Math.max(0, subtotal - discount + shippingFee + codFee);
  const amountNeededForFreeShipping = Math.max(0, config.freeShippingThreshold - subtotal);

  return {
    totalItems,
    subtotal,
    discount,
    discountError,
    shippingFee,
    codFee,
    totalPrice,
    amountNeededForFreeShipping,
  };
}

export interface OrderAnalyticsSummary {
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  paidBeforeRevenue: number;
  codCollectedRevenue: number;
  codPendingRevenue: number;
  prepaidOrdersCount: number;
  codOrdersCount: number;
  pendingDispatchCount: number;
  averageOrderValue: number;
}

export function summarizeOrderAnalytics(orders: OrderRecord[]): OrderAnalyticsSummary {
  let totalRevenue = 0;
  let paidBeforeRevenue = 0;
  let codCollectedRevenue = 0;
  let codPendingRevenue = 0;
  let prepaidOrdersCount = 0;
  let codOrdersCount = 0;
  let pendingDispatchCount = 0;
  let cancelledOrders = 0;

  for (const order of orders) {
    if (order.fulfillmentStatus === 'cancelled' || order.paymentStatus === 'refunded') {
      cancelledOrders += 1;
      continue;
    }

    totalRevenue += order.totalPrice;

    if (order.paymentType === 'prepaid') {
      prepaidOrdersCount += 1;
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'pending_verification') {
        paidBeforeRevenue += order.totalPrice;
      }
    } else {
      codOrdersCount += 1;
      if (order.paymentStatus === 'cod_collected') {
        codCollectedRevenue += order.totalPrice;
      } else if (order.paymentStatus === 'pending_cod') {
        codPendingRevenue += order.totalPrice;
      }
    }

    if (
      order.fulfillmentStatus === 'placed' ||
      order.fulfillmentStatus === 'confirmed' ||
      order.fulfillmentStatus === 'packed'
    ) {
      pendingDispatchCount += 1;
    }
  }

  const activeOrders = orders.length - cancelledOrders;
  const averageOrderValue = activeOrders > 0 ? Math.round(totalRevenue / activeOrders) : 0;

  return {
    totalOrders: orders.length,
    activeOrders,
    cancelledOrders,
    totalRevenue,
    paidBeforeRevenue,
    codCollectedRevenue,
    codPendingRevenue,
    prepaidOrdersCount,
    codOrdersCount,
    pendingDispatchCount,
    averageOrderValue,
  };
}

export function validatePricingConfigInput(input: StorePricingConfig): string | null {
  if (!Number.isFinite(input.discoverySetPrice) || input.discoverySetPrice < 1 || input.discoverySetPrice > 100000) {
    return 'Discovery Set price must be between ₹1 and ₹1,00,000.';
  }
  if (!Number.isFinite(input.shippingFee) || input.shippingFee < 0 || input.shippingFee > 5000) {
    return 'Shipping fee must be between ₹0 and ₹5,000.';
  }
  if (
    !Number.isFinite(input.freeShippingThreshold) ||
    input.freeShippingThreshold < 0 ||
    input.freeShippingThreshold > 100000
  ) {
    return 'Free shipping threshold must be between ₹0 and ₹1,00,000.';
  }
  if (!Number.isFinite(input.codFee) || input.codFee < 0 || input.codFee > 1000) {
    return 'COD fee must be between ₹0 and ₹1,000.';
  }
  if (!input.codEnabled && !input.prepaidEnabled) {
    return 'At least one payment mode (COD or Prepaid) must remain enabled.';
  }
  for (const [id, price] of Object.entries(input.fragrancePrices)) {
    if (!Number.isFinite(price) || price < 1 || price > 100000) {
      return `Invalid price for ${id}. Must be between ₹1 and ₹1,00,000.`;
    }
  }
  if (!FEATURED_COUPON_REGEX.test(input.featuredCouponCode)) {
    return 'Featured coupon code may only contain A-Z, 0-9, hyphens, and underscores (max 32 chars).';
  }
  if (input.promoBannerText.length > 160) {
    return 'Promo banner text cannot exceed 160 characters.';
  }
  return null;
}

export function validateCouponInput(input: {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  maxUses: number;
}): string | null {
  const code = normalizeCouponCode(input.code);
  if (!COUPON_CODE_REGEX.test(code)) {
    return 'Coupon code must be 3–32 characters using A–Z, 0–9, hyphens, or underscores.';
  }
  if (!input.description.trim() || input.description.trim().length > 160) {
    return 'Description must be between 1 and 160 characters.';
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    return 'Discount value must be greater than 0.';
  }
  if (input.discountType === 'percent' && input.discountValue > 100) {
    return 'Percentage discount cannot exceed 100%.';
  }
  if (input.discountType === 'fixed' && input.discountValue > 50000) {
    return 'Fixed discount cannot exceed ₹50,000.';
  }
  if (!Number.isFinite(input.minOrderAmount) || input.minOrderAmount < 0 || input.minOrderAmount > 100000) {
    return 'Minimum order amount must be between ₹0 and ₹1,00,000.';
  }
  if (!Number.isFinite(input.maxDiscount) || input.maxDiscount < 0 || input.maxDiscount > 50000) {
    return 'Max discount cap must be between ₹0 and ₹50,000.';
  }
  if (!Number.isFinite(input.maxUses) || input.maxUses < 0 || input.maxUses > 1000000) {
    return 'Max uses must be between 0 (unlimited) and 1,000,000.';
  }
  return null;
}

export function validateCheckoutForm(input: {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  itemCount: number;
}): string | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const pincode = input.pincode.trim();

  if (input.itemCount < 1 || input.itemCount > 20) {
    return 'Your bag must contain between 1 and 20 items.';
  }
  if (name.length < 2 || name.length > 120) {
    return 'Full name must be between 2 and 120 characters.';
  }
  if (email.length < 5 || email.length > 160 || !email.includes('@')) {
    return 'Please enter a valid email address.';
  }
  if (phone.length < 8 || phone.length > 24) {
    return 'Please enter a valid mobile number (8–24 characters).';
  }
  if (address.length < 5 || address.length > 300) {
    return 'Delivery address must be between 5 and 300 characters.';
  }
  if (city.length < 2 || city.length > 80) {
    return 'City name must be between 2 and 80 characters.';
  }
  if (!PINCODE_REGEX.test(pincode)) {
    return 'PIN code must be exactly 6 digits.';
  }
  if (input.paymentReference.trim().length > 80) {
    return 'Payment reference cannot exceed 80 characters.';
  }
  return null;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatTimestamp(value: Timestamp | Date | string | null | undefined): string {
  if (!value) return '—';
  let date: Date;
  if (typeof value === 'string') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof (value as Timestamp).toDate === 'function') {
    date = (value as Timestamp).toDate();
  } else {
    return '—';
  }
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ordersToCsv(orders: OrderRecord[]): string {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Email',
    'Phone',
    'City',
    'PIN Code',
    'Items',
    'Payment Type',
    'Payment Method',
    'Payment Status',
    'Payment Reference',
    'Fulfillment Status',
    'Tracking Number',
    'Coupon',
    'Subtotal',
    'Discount',
    'Shipping',
    'COD Fee',
    'Total INR',
  ];

  const rows = orders.map(order => [
    order.orderNumber,
    formatTimestamp(order.createdAt),
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.city,
    order.pincode,
    order.items.map(i => `${i.name} x${i.quantity}`).join('; '),
    order.paymentType.toUpperCase(),
    order.paymentMethod.toUpperCase(),
    order.paymentStatus,
    order.paymentReference,
    order.fulfillmentStatus,
    order.trackingNumber,
    order.couponCode,
    order.subtotal,
    order.discount,
    order.shippingFee,
    order.codFee,
    order.totalPrice,
  ]);

  return [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n');
}
