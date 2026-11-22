import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  DEFAULT_COUPONS,
  DEFAULT_STORE_PRICING,
  deriveOrderTrackingKey,
  extractFirstName,
  normalizeCouponCode,
  TRACKING_KEY_REGEX,
  validateCheckoutForm,
  validateCouponInput,
  validatePricingConfigInput,
  type AdminRole,
  type AuditAction,
  type CouponRecord,
  type DiscountType,
  type FulfillmentStatus,
  type OrderItemSnapshot,
  type OrderRecord,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentType,
  type StorePricingConfig,
} from '../utils/storeLogic';

function makeAuditId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `aud_${stamp}_${rand}`;
}

export async function logAdminAudit(
  action: AuditAction,
  targetId: string,
  summary: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  const logId = makeAuditId();
  const path = `audit_logs/${logId}`;
  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      actorUid: user.uid,
      actorEmail: user.email,
      action,
      targetId: targetId.slice(0, 128),
      summary: summary.slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createCustomerOrder(params: {
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
  paymentReference: string;
}): Promise<{ orderNumber: string; trackingKey: string }> {
  const validationError = validateCheckoutForm({
    name: params.customerName,
    email: params.customerEmail,
    phone: params.customerPhone,
    address: params.shippingAddress,
    city: params.city,
    pincode: params.pincode,
    paymentType: params.paymentType,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference,
    itemCount: params.items.length,
  });

  if (validationError) {
    throw new Error(validationError);
  }

  const sanitizedItems: OrderItemSnapshot[] = params.items.slice(0, 20).map(item => ({
    id: item.id.slice(0, 80),
    name: item.name.slice(0, 120),
    price: Math.max(1, Math.round(item.price)),
    quantity: Math.max(1, Math.min(50, Math.round(item.quantity))),
    volume: (item.volume || 'Standard').slice(0, 80),
    image: (item.image || '/assets/discovery-box-new.jpg').slice(0, 200),
  }));

  const subtotal = Math.round(params.subtotal);
  const discount = Math.max(0, Math.min(subtotal, Math.round(params.discount)));
  const shippingFee = Math.max(0, Math.round(params.shippingFee));
  const codFee = params.paymentType === 'cod' ? Math.max(0, Math.round(params.codFee)) : 0;
  const totalPrice = subtotal - discount + shippingFee + codFee;

  const paymentStatus: PaymentStatus =
    params.paymentType === 'cod'
      ? 'pending_cod'
      : params.paymentReference.trim().length >= 4
        ? 'paid'
        : 'pending_verification';

  const normalizedEmail = params.customerEmail.trim().toLowerCase().slice(0, 160);
  const normalizedName = params.customerName.trim().slice(0, 120);
  const normalizedCity = params.city.trim().slice(0, 80);
  const normalizedCoupon = normalizeCouponCode(params.couponCode);
  const resolvedPaymentMethod: PaymentMethod =
    params.paymentType === 'cod' ? 'cod' : params.paymentMethod;
  const trackingKey = await deriveOrderTrackingKey(params.orderNumber, normalizedEmail);

  const orderPayload = {
    orderNumber: params.orderNumber,
    customerName: normalizedName,
    customerEmail: normalizedEmail,
    customerPhone: params.customerPhone.trim().slice(0, 24),
    shippingAddress: params.shippingAddress.trim().slice(0, 300),
    city: normalizedCity,
    pincode: params.pincode.trim().slice(0, 6),
    items: sanitizedItems,
    subtotal,
    discount,
    couponCode: normalizedCoupon,
    shippingFee,
    codFee,
    totalPrice,
    paymentType: params.paymentType,
    paymentMethod: resolvedPaymentMethod,
    paymentStatus,
    paymentReference: params.paymentReference.trim().slice(0, 80),
    fulfillmentStatus: 'placed' as FulfillmentStatus,
    trackingNumber: '',
    trackingKey,
    adminNotes: '',
    updatedBy: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // PII-free projection for customer self-service live tracking
  const trackingPayload = {
    trackingKey,
    orderNumber: params.orderNumber,
    customerFirstName: extractFirstName(normalizedName),
    city: normalizedCity,
    items: sanitizedItems,
    subtotal,
    discount,
    couponCode: normalizedCoupon,
    shippingFee,
    codFee,
    totalPrice,
    paymentType: params.paymentType,
    paymentMethod: resolvedPaymentMethod,
    paymentStatus,
    fulfillmentStatus: 'placed' as FulfillmentStatus,
    trackingNumber: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `orders/${params.orderNumber}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', params.orderNumber), orderPayload);
    batch.set(doc(db, 'order_tracking', trackingKey), trackingPayload);
    await batch.commit();
    return { orderNumber: params.orderNumber, trackingKey };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function publishStorePricing(
  config: StorePricingConfig,
  actorEmail: string
): Promise<void> {
  const cleaned: StorePricingConfig = {
    discoverySetPrice: Math.round(Number(config.discoverySetPrice)),
    discoverySetInStock: Boolean(config.discoverySetInStock),
    fragrancePrices: Object.fromEntries(
      Object.entries(config.fragrancePrices).map(([k, v]) => [k, Math.round(Number(v))])
    ),
    fragranceStock: Object.fromEntries(
      Object.entries(config.fragranceStock).map(([k, v]) => [k, Boolean(v)])
    ),
    shippingFee: Math.round(Number(config.shippingFee)),
    freeShippingThreshold: Math.round(Number(config.freeShippingThreshold)),
    codEnabled: Boolean(config.codEnabled),
    codFee: Math.round(Number(config.codFee)),
    prepaidEnabled: Boolean(config.prepaidEnabled),
    featuredCouponCode: normalizeCouponCode(config.featuredCouponCode),
    promoBannerText: config.promoBannerText.trim().slice(0, 160),
    updatedBy: actorEmail,
  };

  const validationError = validatePricingConfigInput(cleaned);
  if (validationError) {
    throw new Error(validationError);
  }

  const path = 'store_config/pricing';
  try {
    await setDoc(doc(db, 'store_config', 'pricing'), {
      ...cleaned,
      updatedAt: serverTimestamp(),
    });
    await logAdminAudit(
      'pricing_updated',
      'pricing',
      `Published live pricing: Discovery Set ₹${cleaned.discoverySetPrice}, Shipping ₹${cleaned.shippingFee} (free over ₹${cleaned.freeShippingThreshold}), Featured code "${cleaned.featuredCouponCode || 'None'}"`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createCoupon(
  input: {
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    applyPerItem: boolean;
    minOrderAmount: number;
    maxDiscount: number;
    active: boolean;
    maxUses: number;
  },
  actorEmail: string
): Promise<void> {
  const validationError = validateCouponInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const code = normalizeCouponCode(input.code);
  const path = `coupons/${code}`;
  try {
    const existingSnap = await getDoc(doc(db, 'coupons', code));
    if (existingSnap.exists()) {
      throw new Error(`Coupon "${code}" already exists. Edit it instead of creating a duplicate.`);
    }

    await setDoc(doc(db, 'coupons', code), {
      code,
      description: input.description.trim().slice(0, 160),
      discountType: input.discountType,
      discountValue: Number(input.discountValue),
      applyPerItem: Boolean(input.applyPerItem),
      minOrderAmount: Math.round(Number(input.minOrderAmount)),
      maxDiscount: Math.round(Number(input.maxDiscount)),
      active: Boolean(input.active),
      usageCount: 0,
      maxUses: Math.round(Number(input.maxUses)),
      createdBy: actorEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await logAdminAudit(
      'coupon_created',
      code,
      `Created coupon ${code} (${input.discountType === 'percent' ? `${input.discountValue}%` : `₹${input.discountValue}`} off)`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCoupon(
  coupon: CouponRecord,
  updates: Partial<{
    description: string;
    discountType: DiscountType;
    discountValue: number;
    applyPerItem: boolean;
    minOrderAmount: number;
    maxDiscount: number;
    active: boolean;
    usageCount: number;
    maxUses: number;
  }>
): Promise<void> {
  const merged = {
    code: coupon.code,
    description: (updates.description ?? coupon.description).trim().slice(0, 160),
    discountType: updates.discountType ?? coupon.discountType,
    discountValue: Number(updates.discountValue ?? coupon.discountValue),
    applyPerItem: Boolean(updates.applyPerItem ?? coupon.applyPerItem),
    minOrderAmount: Math.round(Number(updates.minOrderAmount ?? coupon.minOrderAmount)),
    maxDiscount: Math.round(Number(updates.maxDiscount ?? coupon.maxDiscount)),
    active: Boolean(updates.active ?? coupon.active),
    usageCount: Math.round(Number(updates.usageCount ?? coupon.usageCount)),
    maxUses: Math.round(Number(updates.maxUses ?? coupon.maxUses)),
  };

  const validationError = validateCouponInput(merged);
  if (validationError) {
    throw new Error(validationError);
  }

  const path = `coupons/${coupon.code}`;
  try {
    await updateDoc(doc(db, 'coupons', coupon.code), {
      description: merged.description,
      discountType: merged.discountType,
      discountValue: merged.discountValue,
      applyPerItem: merged.applyPerItem,
      minOrderAmount: merged.minOrderAmount,
      maxDiscount: merged.maxDiscount,
      active: merged.active,
      usageCount: merged.usageCount,
      maxUses: merged.maxUses,
      updatedAt: serverTimestamp(),
    });
    await logAdminAudit(
      'coupon_updated',
      coupon.code,
      `Updated coupon ${coupon.code}: ${merged.active ? 'Active' : 'Paused'}, ${merged.discountType === 'percent' ? `${merged.discountValue}%` : `₹${merged.discountValue}`}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCoupon(code: string): Promise<void> {
  const normalized = normalizeCouponCode(code);
  const path = `coupons/${normalized}`;
  try {
    await deleteDoc(doc(db, 'coupons', normalized));
    await logAdminAudit('coupon_deleted', normalized, `Deleted coupon code ${normalized}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

async function resolveExistingTrackingKey(order: OrderRecord): Promise<string | null> {
  const candidate =
    order.trackingKey && TRACKING_KEY_REGEX.test(order.trackingKey)
      ? order.trackingKey
      : await deriveOrderTrackingKey(order.orderNumber, order.customerEmail);

  try {
    const snap = await getDoc(doc(db, 'order_tracking', candidate));
    return snap.exists() ? candidate : null;
  } catch {
    return null;
  }
}

export async function updateOrderRecord(
  order: OrderRecord,
  updates: {
    paymentStatus: PaymentStatus;
    paymentReference: string;
    fulfillmentStatus: FulfillmentStatus;
    trackingNumber: string;
    adminNotes: string;
  },
  actorEmail: string
): Promise<void> {
  const path = `orders/${order.orderNumber}`;
  const cleanTrackingNumber = updates.trackingNumber.trim().slice(0, 80);
  try {
    const existingTrackingKey = await resolveExistingTrackingKey(order);
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.orderNumber), {
      paymentStatus: updates.paymentStatus,
      paymentReference: updates.paymentReference.trim().slice(0, 80),
      fulfillmentStatus: updates.fulfillmentStatus,
      trackingNumber: cleanTrackingNumber,
      adminNotes: updates.adminNotes.trim().slice(0, 500),
      updatedBy: actorEmail,
      updatedAt: serverTimestamp(),
    });

    if (existingTrackingKey) {
      batch.update(doc(db, 'order_tracking', existingTrackingKey), {
        paymentStatus: updates.paymentStatus,
        fulfillmentStatus: updates.fulfillmentStatus,
        trackingNumber: cleanTrackingNumber,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    await logAdminAudit(
      'order_updated',
      order.orderNumber,
      `Updated ${order.orderNumber}: fulfillment=${updates.fulfillmentStatus}, payment=${updates.paymentStatus}${cleanTrackingNumber ? `, tracking=${cleanTrackingNumber}` : ''}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderRecord(order: OrderRecord): Promise<void> {
  const path = `orders/${order.orderNumber}`;
  try {
    const existingTrackingKey = await resolveExistingTrackingKey(order);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', order.orderNumber));
    if (existingTrackingKey) {
      batch.delete(doc(db, 'order_tracking', existingTrackingKey));
    }
    await batch.commit();
    await logAdminAudit(
      'order_deleted',
      order.orderNumber,
      `Permanently deleted order ${order.orderNumber} (${order.customerName}, ${order.paymentType.toUpperCase()}, ₹${order.totalPrice})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addAdminUser(
  input: { uid: string; email: string; displayName: string; role: AdminRole },
  actorEmail: string
): Promise<void> {
  const uid = input.uid.trim();
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!/^[a-zA-Z0-9_-]{6,128}$/.test(uid)) {
    throw new Error('Firebase Auth UID must be 6–128 alphanumeric characters (or _ / -).');
  }
  if (!email.includes('@') || email.length < 5 || email.length > 160) {
    throw new Error('Please enter a valid verified Google email address.');
  }
  if (displayName.length < 1 || displayName.length > 100) {
    throw new Error('Display name must be between 1 and 100 characters.');
  }

  const path = `admins/${uid}`;
  try {
    await setDoc(doc(db, 'admins', uid), {
      uid,
      email,
      displayName,
      role: input.role,
      addedBy: actorEmail,
      createdAt: serverTimestamp(),
    });
    await logAdminAudit(
      'admin_added',
      uid,
      `Granted ${input.role} admin access to ${email} (${uid})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeAdminUser(uid: string, email: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
    await logAdminAudit('admin_removed', uid, `Revoked admin access for ${email} (${uid})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedInitialStoreData(actorEmail: string): Promise<void> {
  const pricingRef = doc(db, 'store_config', 'pricing');
  try {
    const pricingSnap = await getDoc(pricingRef);
    if (!pricingSnap.exists()) {
      await publishStorePricing(DEFAULT_STORE_PRICING, actorEmail);
    }

    const defaultCoupon = DEFAULT_COUPONS[0];
    const couponRef = doc(db, 'coupons', defaultCoupon.code);
    const couponSnap = await getDoc(couponRef);
    if (!couponSnap.exists()) {
      await createCoupon(
        {
          code: defaultCoupon.code,
          description: defaultCoupon.description,
          discountType: defaultCoupon.discountType,
          discountValue: defaultCoupon.discountValue,
          applyPerItem: defaultCoupon.applyPerItem,
          minOrderAmount: defaultCoupon.minOrderAmount,
          maxDiscount: defaultCoupon.maxDiscount,
          active: defaultCoupon.active,
          maxUses: defaultCoupon.maxUses,
        },
        actorEmail
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'store_config/pricing');
  }
}
