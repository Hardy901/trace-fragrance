import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COUPONS,
  DEFAULT_STORE_PRICING,
  TRACKING_KEY_REGEX,
  calculateCartTotals,
  calculateCouponDiscount,
  computeDiscountedPrice,
  deriveOrderTrackingKey,
  extractFirstName,
  formatINR,
  normalizeCouponCode,
  normalizeOrderNumber,
  ordersToCsv,
  summarizeOrderAnalytics,
  validateCheckoutForm,
  validateCouponInput,
  validatePricingConfigInput,
  type CouponRecord,
  type OrderRecord,
} from './storeLogic';

test('formatINR formats Indian rupee currency accurately', () => {
  assert.equal(formatINR(799), '₹799');
  assert.equal(formatINR(1500), '₹1,500');
  assert.equal(formatINR(125000), '₹1,25,000');
  assert.equal(formatINR(-50), '₹0');
});

test('fixed per-item coupon calculates discount correctly and respects caps', () => {
  const coupon = DEFAULT_COUPONS[0]; // TRACE2026: ₹100 per item
  const single = calculateCouponDiscount(coupon, 799, 1);
  assert.equal(single.discount, 100);
  assert.equal(single.error, null);

  const double = calculateCouponDiscount(coupon, 1598, 2);
  assert.equal(double.discount, 200);

  const cappedCoupon: CouponRecord = { ...coupon, maxDiscount: 150 };
  const capped = calculateCouponDiscount(cappedCoupon, 1598, 2);
  assert.equal(capped.discount, 150);
});

test('percentage coupon respects minOrderAmount, maxDiscount, and active status', () => {
  const percentCoupon: CouponRecord = {
    code: 'ELIXIR20',
    description: '20% off orders over ₹1,000',
    discountType: 'percent',
    discountValue: 20,
    applyPerItem: false,
    minOrderAmount: 1000,
    maxDiscount: 300,
    active: true,
    usageCount: 0,
    maxUses: 50,
    createdBy: 'admin@example.com',
  };

  const belowMin = calculateCouponDiscount(percentCoupon, 799, 1);
  assert.equal(belowMin.discount, 0);
  assert.ok(belowMin.error?.includes('Minimum order'));

  const valid = calculateCouponDiscount(percentCoupon, 1200, 1);
  assert.equal(valid.discount, 240);
  assert.equal(valid.error, null);

  const capped = calculateCouponDiscount(percentCoupon, 2500, 2);
  assert.equal(capped.discount, 300);

  const inactive = calculateCouponDiscount({ ...percentCoupon, active: false }, 1200, 1);
  assert.equal(inactive.discount, 0);
  assert.ok(inactive.error?.includes('inactive'));

  const exhausted = calculateCouponDiscount({ ...percentCoupon, usageCount: 50 }, 1200, 1);
  assert.equal(exhausted.discount, 0);
  assert.ok(exhausted.error?.includes('redemption limit'));
});

test('calculateCartTotals handles COD fee, free shipping threshold, and coupon discount live', () => {
  const config = {
    ...DEFAULT_STORE_PRICING,
    discoverySetPrice: 899,
    shippingFee: 99,
    freeShippingThreshold: 1500,
    codFee: 50,
  };
  const coupon = DEFAULT_COUPONS[0];

  const codTotals = calculateCartTotals([{ price: 899, quantity: 1 }], config, coupon, 'cod');
  assert.equal(codTotals.subtotal, 899);
  assert.equal(codTotals.discount, 100);
  assert.equal(codTotals.shippingFee, 99);
  assert.equal(codTotals.codFee, 50);
  assert.equal(codTotals.totalPrice, 948);

  const prepaidFreeShip = calculateCartTotals(
    [{ price: 899, quantity: 2 }],
    config,
    coupon,
    'prepaid'
  );
  assert.equal(prepaidFreeShip.subtotal, 1798);
  assert.equal(prepaidFreeShip.discount, 200);
  assert.equal(prepaidFreeShip.shippingFee, 0);
  assert.equal(prepaidFreeShip.codFee, 0);
  assert.equal(prepaidFreeShip.totalPrice, 1598);
});

test('computeDiscountedPrice returns discounted preview for featured storefront coupon', () => {
  assert.equal(computeDiscountedPrice(799, DEFAULT_COUPONS[0]), 699);
  assert.equal(computeDiscountedPrice(999, { ...DEFAULT_COUPONS[0], active: false }), null);
});

test('summarizeOrderAnalytics splits COD pending, COD collected, Prepaid, and cancelled orders accurately', () => {
  const sampleOrders: OrderRecord[] = [
    {
      orderNumber: 'TRC-100001-AAA',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: 'Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      items: [],
      subtotal: 799,
      discount: 100,
      couponCode: 'TRACE2026',
      shippingFee: 99,
      codFee: 0,
      totalPrice: 798,
      paymentType: 'prepaid',
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      paymentReference: 'UTR123456',
      fulfillmentStatus: 'dispatched',
      trackingNumber: 'BLUEDART-11',
      adminNotes: '',
      updatedBy: 'opplayer20100@gmail.com',
    },
    {
      orderNumber: 'TRC-100002-BBB',
      customerName: 'Meera Nair',
      customerEmail: 'meera@example.com',
      customerPhone: '+91 98765 00000',
      shippingAddress: 'Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      items: [],
      subtotal: 1598,
      discount: 0,
      couponCode: '',
      shippingFee: 0,
      codFee: 50,
      totalPrice: 1648,
      paymentType: 'cod',
      paymentMethod: 'cod',
      paymentStatus: 'pending_cod',
      paymentReference: '',
      fulfillmentStatus: 'placed',
      trackingNumber: '',
      adminNotes: '',
      updatedBy: '',
    },
    {
      orderNumber: 'TRC-100003-CCC',
      customerName: 'Kabir Verma',
      customerEmail: 'kabir@example.com',
      customerPhone: '+91 99999 88888',
      shippingAddress: 'Hauz Khas',
      city: 'New Delhi',
      pincode: '110016',
      items: [],
      subtotal: 799,
      discount: 0,
      couponCode: '',
      shippingFee: 99,
      codFee: 0,
      totalPrice: 898,
      paymentType: 'cod',
      paymentMethod: 'cod',
      paymentStatus: 'cod_collected',
      paymentReference: '',
      fulfillmentStatus: 'delivered',
      trackingNumber: 'DELHIVERY-99',
      adminNotes: '',
      updatedBy: 'opplayer20100@gmail.com',
    },
    {
      orderNumber: 'TRC-100004-DDD',
      customerName: 'Cancelled Order',
      customerEmail: 'cancel@example.com',
      customerPhone: '+91 90000 11111',
      shippingAddress: 'Park Street',
      city: 'Kolkata',
      pincode: '700016',
      items: [],
      subtotal: 799,
      discount: 0,
      couponCode: '',
      shippingFee: 99,
      codFee: 0,
      totalPrice: 898,
      paymentType: 'prepaid',
      paymentMethod: 'cards',
      paymentStatus: 'refunded',
      paymentReference: '',
      fulfillmentStatus: 'cancelled',
      trackingNumber: '',
      adminNotes: '',
      updatedBy: 'opplayer20100@gmail.com',
    },
  ];

  const stats = summarizeOrderAnalytics(sampleOrders);
  assert.equal(stats.totalOrders, 4);
  assert.equal(stats.activeOrders, 3);
  assert.equal(stats.cancelledOrders, 1);
  assert.equal(stats.totalRevenue, 798 + 1648 + 898);
  assert.equal(stats.paidBeforeRevenue, 798);
  assert.equal(stats.codPendingRevenue, 1648);
  assert.equal(stats.codCollectedRevenue, 898);
  assert.equal(stats.prepaidOrdersCount, 1);
  assert.equal(stats.codOrdersCount, 2);
  assert.equal(stats.pendingDispatchCount, 1);
});

test('blueprint-synchronized validators reject invalid pricing, coupons, and checkout forms', () => {
  assert.equal(validatePricingConfigInput(DEFAULT_STORE_PRICING), null);
  assert.ok(
    validatePricingConfigInput({ ...DEFAULT_STORE_PRICING, discoverySetPrice: 0 }) !== null
  );
  assert.ok(
    validatePricingConfigInput({
      ...DEFAULT_STORE_PRICING,
      codEnabled: false,
      prepaidEnabled: false,
    }) !== null
  );

  assert.equal(normalizeCouponCode(' trace 2026! '), 'TRACE2026');
  assert.ok(
    validateCouponInput({
      code: 'AB',
      description: 'Too short',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 0,
      maxDiscount: 0,
      maxUses: 0,
    }) !== null
  );
  assert.ok(
    validateCouponInput({
      code: 'SUPER150',
      description: 'Over 100%',
      discountType: 'percent',
      discountValue: 150,
      minOrderAmount: 0,
      maxDiscount: 0,
      maxUses: 0,
    }) !== null
  );

  assert.ok(
    validateCheckoutForm({
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '+91 98765 43210',
      address: '402 Lotus Residency',
      city: 'Bengaluru',
      pincode: '5600',
      paymentType: 'cod',
      paymentMethod: 'cod',
      paymentReference: '',
      itemCount: 1,
    })?.includes('6 digits')
  );
});

test('ordersToCsv properly escapes commas and quotes in customer fields', () => {
  const csv = ordersToCsv([
    {
      orderNumber: 'TRC-100001-AAA',
      customerName: 'Sharma, "Aarav"',
      customerEmail: 'aarav@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: 'Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      items: [
        {
          id: 'trace-discovery-set',
          name: 'TRACE ELIXIR DISCOVERY SET',
          price: 799,
          quantity: 1,
          volume: '4 x 5 ml',
          image: '/assets/discovery-box-new.jpg',
        },
      ],
      subtotal: 799,
      discount: 100,
      couponCode: 'TRACE2026',
      shippingFee: 99,
      codFee: 0,
      totalPrice: 798,
      paymentType: 'cod',
      paymentMethod: 'cod',
      paymentStatus: 'pending_cod',
      paymentReference: '',
      fulfillmentStatus: 'placed',
      trackingNumber: '',
      adminNotes: '',
      updatedBy: '',
      createdAt: '2026-11-22T10:00:00Z',
    },
  ]);

  assert.ok(csv.includes('"Sharma, ""Aarav"""'));
  assert.ok(csv.includes('TRC-100001-AAA'));
  assert.ok(csv.includes('COD'));
});

test('deriveOrderTrackingKey produces deterministic 40-char hex key insensitive to casing/whitespace', async () => {
  const keyA = await deriveOrderTrackingKey('trc-123456-abc', '  Aarav@Example.COM ');
  const keyB = await deriveOrderTrackingKey('TRC-123456-ABC', 'aarav@example.com');
  const keyOther = await deriveOrderTrackingKey('TRC-123456-ABC', 'other@example.com');

  assert.equal(keyA, keyB);
  assert.notEqual(keyA, keyOther);
  assert.match(keyA, TRACKING_KEY_REGEX);
  assert.equal(normalizeOrderNumber(' trc-998877-xyz! '), 'TRC-998877-XYZ');
  assert.equal(extractFirstName('  Aarav Sharma '), 'Aarav');
  assert.equal(extractFirstName('   '), 'Guest');
});

