import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useStoreConfig } from './StoreConfigContext';
import {
  calculateCartTotals,
  normalizeCouponCode,
  type CouponRecord,
  type PaymentType,
} from '../utils/storeLogic';

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  volume: string;
  number?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  appliedCoupon: CouponRecord | null;
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  shipping: number;
  codFee: number;
  totalPrice: number;
  computeTotalsForPayment: (paymentType: PaymentType) => ReturnType<typeof calculateCartTotals>;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'trace_cart_v1';
const COUPON_STORAGE_KEY = 'trace_coupon_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pricing, activeCoupons, discoverySet, fragrances } = useStoreConfig();

  const [rawItems, setRawItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  // Keep cart item unit prices live-synchronized with Firestore pricing changes
  const items = useMemo(() => {
    const livePriceMap = new Map<string, number>();
    livePriceMap.set(discoverySet.id, discoverySet.price);
    for (const f of fragrances) {
      livePriceMap.set(f.id, f.price);
    }
    return rawItems.map(item => {
      const livePrice = livePriceMap.get(item.id);
      return livePrice !== undefined ? { ...item, price: livePrice } : item;
    });
  }, [rawItems, discoverySet.id, discoverySet.price, fragrances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      if (couponCode) {
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [couponCode]);

  // Resolve the currently applied coupon against live Firestore active coupons
  const appliedCoupon = useMemo(() => {
    if (!couponCode) return null;
    const normalized = normalizeCouponCode(couponCode);
    return activeCoupons.find(c => c.code.toUpperCase() === normalized && c.active) || null;
  }, [couponCode, activeCoupons]);

  // If an admin disables or deletes a coupon while a shopper has it applied, notify and clear gracefully
  useEffect(() => {
    if (couponCode && activeCoupons.length > 0 && !appliedCoupon) {
      setCouponCode(null);
      setCouponError(`Coupon "${couponCode}" is no longer active.`);
    }
  }, [couponCode, activeCoupons, appliedCoupon]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setRawItems(prevItems => {
      const existing = prevItems.find(i => i.id === item.id);
      if (existing) {
        return prevItems.map(i =>
          i.id === item.id ? { ...i, price: item.price, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setRawItems(prevItems => prevItems.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setRawItems(prevItems =>
      prevItems
        .map(i => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setRawItems([]);
  };

  const applyCoupon = (code: string): boolean => {
    const cleaned = normalizeCouponCode(code);
    if (!cleaned) {
      setCouponError('Please enter a valid coupon code.');
      return false;
    }

    const match = activeCoupons.find(c => c.code.toUpperCase() === cleaned && c.active);
    if (!match) {
      const hint = pricing.featuredCouponCode
        ? ` Try "${pricing.featuredCouponCode}".`
        : '';
      setCouponError(`Coupon "${cleaned}" is invalid or inactive.${hint}`);
      return false;
    }

    const currentSubtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    if (match.maxUses > 0 && match.usageCount >= match.maxUses) {
      setCouponError(`Coupon "${match.code}" has reached its maximum redemptions.`);
      return false;
    }
    if (currentSubtotal > 0 && currentSubtotal < match.minOrderAmount) {
      setCouponError(
        `Minimum order of ₹${match.minOrderAmount.toLocaleString('en-IN')} required for "${match.code}".`
      );
      return false;
    }

    setCouponCode(match.code);
    setCouponError(null);
    return true;
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponError(null);
  };

  const computeTotalsForPayment = (paymentType: PaymentType) =>
    calculateCartTotals(items, pricing, appliedCoupon, paymentType);

  const defaultTotals = useMemo(
    () => calculateCartTotals(items, pricing, appliedCoupon, 'prepaid'),
    [items, pricing, appliedCoupon]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems: defaultTotals.totalItems,
        subtotal: defaultTotals.subtotal,
        discount: defaultTotals.discount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        appliedCoupon,
        couponError: couponError || defaultTotals.discountError,
        applyCoupon,
        removeCoupon,
        shipping: defaultTotals.shippingFee,
        codFee: pricing.codFee,
        totalPrice: defaultTotals.totalPrice,
        computeTotalsForPayment,
        freeShippingThreshold: pricing.freeShippingThreshold,
        amountNeededForFreeShipping: defaultTotals.amountNeededForFreeShipping,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
