import React, { createContext, useContext, useEffect, useState } from 'react';
import { BRAND_CONFIG } from '../data/products';

export interface CartItem {
  id: string; // product id (e.g. 'fragrance-01-drift' or 'trace-discovery-set')
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
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  shipping: number;
  totalPrice: number;
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
  const [items, setItems] = useState<CartItem[]>(() => {
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

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      const existing = prevItems.find(i => i.id === item.id);
      if (existing) {
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prevItems =>
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
    setItems([]);
  };

  // Coupon handling: trace2026 gives ₹100 discount per discovery set or on order
  const applyCoupon = (code: string): boolean => {
    const cleaned = code.trim().toLowerCase();
    if (cleaned === 'trace2026') {
      setCouponCode('TRACE2026');
      setCouponError(null);
      return true;
    } else {
      setCouponError('Invalid coupon code. Use "TRACE2026" for ₹100 OFF.');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setCouponError(null);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  // Discount calculation: ₹100 off when trace2026 is applied (e.g. MRP 799 -> 699)
  const discount = couponCode === 'TRACE2026' ? Math.min(subtotal, 100 * Math.max(1, items.length)) : 0;

  const shipping = subtotal >= BRAND_CONFIG.freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const totalPrice = Math.max(0, subtotal - discount + shipping);
  const amountNeededForFreeShipping = Math.max(0, BRAND_CONFIG.freeShippingThreshold - subtotal);

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
        totalItems,
        subtotal,
        discount,
        couponCode,
        couponError,
        applyCoupon,
        removeCoupon,
        shipping,
        totalPrice,
        freeShippingThreshold: BRAND_CONFIG.freeShippingThreshold,
        amountNeededForFreeShipping,
        isCheckoutOpen,
        openCheckout,
        closeCheckout
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
