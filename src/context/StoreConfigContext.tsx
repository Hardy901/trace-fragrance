import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  OWNER_ADMIN_EMAIL,
} from '../firebase';
import {
  DISCOVERY_SET,
  FRAGRANCES,
  type DiscoverySetProduct,
  type FragranceProduct,
} from '../data/products';
import {
  computeDiscountedPrice,
  DEFAULT_COUPONS,
  DEFAULT_STORE_PRICING,
  formatINR,
  type AdminRole,
  type CouponRecord,
  type StorePricingConfig,
} from '../utils/storeLogic';

interface StoreConfigContextType {
  pricing: StorePricingConfig;
  hasLivePricingDoc: boolean;
  activeCoupons: CouponRecord[];
  hasLiveCoupons: boolean;
  featuredCoupon: CouponRecord | null;
  discoverySet: DiscoverySetProduct;
  fragrances: FragranceProduct[];
  discoveryDiscountedPrice: number | null;
  isStoreSynced: boolean;
  authReady: boolean;
  user: User | null;
  isAdmin: boolean;
  isOwnerAdmin: boolean;
  adminRole: AdminRole | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  sendAdminVerificationEmail: () => Promise<void>;
  refreshAdminAuthStatus: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pricing, setPricing] = useState<StorePricingConfig>(DEFAULT_STORE_PRICING);
  const [hasLivePricingDoc, setHasLivePricingDoc] = useState(false);
  const [liveActiveCoupons, setLiveActiveCoupons] = useState<CouponRecord[]>([]);
  const [hasLiveCoupons, setHasLiveCoupons] = useState(false);
  const [isStoreSynced, setIsStoreSynced] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnerAdmin, setIsOwnerAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Live real-time listener for global storefront pricing & shipping rules
  useEffect(() => {
    const pricingRef = doc(db, 'store_config', 'pricing');
    const unsubPricing = onSnapshot(
      pricingRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<StorePricingConfig>;
          setPricing({
            ...DEFAULT_STORE_PRICING,
            ...data,
            fragrancePrices: {
              ...DEFAULT_STORE_PRICING.fragrancePrices,
              ...data.fragrancePrices,
            },
            fragranceStock: {
              ...DEFAULT_STORE_PRICING.fragranceStock,
              ...data.fragranceStock,
            },
          });
          setHasLivePricingDoc(true);
        } else {
          setPricing(DEFAULT_STORE_PRICING);
          setHasLivePricingDoc(false);
        }
        setIsStoreSynced(true);
      },
      error => {
        console.error('Live pricing sync warning:', error);
        try {
          handleFirestoreError(error, OperationType.GET, 'store_config/pricing');
        } catch {
          // Fallback to defaults for storefront resilience
          setIsStoreSynced(true);
        }
      }
    );

    // 2. Live real-time listener for active storefront coupons (enforces server-side active == true filter)
    const activeCouponsQuery = query(
      collection(db, 'coupons'),
      where('active', '==', true)
    );
    const unsubCoupons = onSnapshot(
      activeCouponsQuery,
      snapshot => {
        const list = snapshot.docs.map(d => d.data() as CouponRecord);
        setLiveActiveCoupons(list);
        setHasLiveCoupons(snapshot.docs.length > 0);
      },
      error => {
        console.error('Live coupon sync warning:', error);
        try {
          handleFirestoreError(error, OperationType.LIST, 'coupons');
        } catch {
          // Keep storefront operational
        }
      }
    );

    return () => {
      unsubPricing();
      unsubCoupons();
    };
  }, []);

  const evaluateAdminIdentity = async (currentUser: User | null): Promise<void> => {
    setUser(currentUser);
    setAuthError(null);

    if (!currentUser) {
      setIsAdmin(false);
      setIsOwnerAdmin(false);
      setAdminRole(null);
      setAuthReady(true);
      return;
    }

    const verifiedOwner =
      Boolean(currentUser.emailVerified) &&
      currentUser.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();

    if (verifiedOwner) {
      setIsOwnerAdmin(true);
      setIsAdmin(true);
      setAdminRole('owner');
      setAuthReady(true);
      return;
    }

    if (!currentUser.emailVerified) {
      setIsOwnerAdmin(false);
      setIsAdmin(false);
      setAdminRole(null);
      setAuthError('Your admin account email must be verified before Firestore grants access.');
      setAuthReady(true);
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        const data = adminDoc.data() as { role?: AdminRole };
        setIsOwnerAdmin(false);
        setIsAdmin(true);
        setAdminRole(data.role === 'owner' ? 'owner' : 'manager');
      } else {
        setIsOwnerAdmin(false);
        setIsAdmin(false);
        setAdminRole(null);
      }
    } catch (err) {
      setIsOwnerAdmin(false);
      setIsAdmin(false);
      setAdminRole(null);
      console.error('Admin verification lookup failed:', err);
    } finally {
      setAuthReady(true);
    }
  };

  // 3. Firebase Auth & RBAC verification listener
  useEffect(() => {
    let active = true;
    const unsubAuth = onAuthStateChanged(auth, async currentUser => {
      if (!active) return;
      await evaluateAdminIdentity(currentUser);
    });

    return () => {
      active = false;
      unsubAuth();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to complete Google sign-in.';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in popup was closed before completing authentication.');
      } else {
        setAuthError(msg);
      }
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await evaluateAdminIdentity(credential.user);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to sign in with email and password.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setAuthError('Invalid email or password. Ensure this admin account exists in Firebase Authentication.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setAuthError('Email/Password sign-in is not yet enabled in Firebase Authentication → Sign-in method.');
      } else if (msg.includes('auth/too-many-requests')) {
        setAuthError('Too many failed sign-in attempts. Please wait a few minutes and try again.');
      } else {
        setAuthError(msg);
      }
    }
  };

  const sendAdminVerificationEmail = async () => {
    setAuthError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to send verification email.';
      setAuthError(msg);
      throw error;
    }
  };

  const refreshAdminAuthStatus = async () => {
    setAuthError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await currentUser.reload();
      await currentUser.getIdToken(true);
      await evaluateAdminIdentity(auth.currentUser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to refresh authentication status.';
      setAuthError(msg);
    }
  };

  const signOutAdmin = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  // Use live Firestore coupons once pricing/store has been initialized; fallback to default launch coupon prior to first seed
  const activeCoupons = useMemo(() => {
    if (hasLivePricingDoc || hasLiveCoupons) {
      return liveActiveCoupons;
    }
    return DEFAULT_COUPONS;
  }, [hasLivePricingDoc, hasLiveCoupons, liveActiveCoupons]);

  const featuredCoupon = useMemo(() => {
    if (!pricing.featuredCouponCode) return null;
    return (
      activeCoupons.find(
        c => c.code.toUpperCase() === pricing.featuredCouponCode.toUpperCase() && c.active
      ) || null
    );
  }, [activeCoupons, pricing.featuredCouponCode]);

  const discoverySet = useMemo<DiscoverySetProduct>(
    () => ({
      ...DISCOVERY_SET,
      price: pricing.discoverySetPrice,
      formattedPrice: formatINR(pricing.discoverySetPrice),
      inStock: pricing.discoverySetInStock,
    }),
    [pricing.discoverySetPrice, pricing.discoverySetInStock]
  );

  const fragrances = useMemo<FragranceProduct[]>(
    () =>
      FRAGRANCES.map(item => {
        const livePrice = pricing.fragrancePrices[item.id] ?? item.price;
        const liveStock = pricing.fragranceStock[item.id] ?? item.inStock;
        return {
          ...item,
          price: livePrice,
          formattedPrice: formatINR(livePrice),
          inStock: liveStock,
        };
      }),
    [pricing.fragrancePrices, pricing.fragranceStock]
  );

  const discoveryDiscountedPrice = useMemo(
    () => computeDiscountedPrice(discoverySet.price, featuredCoupon),
    [discoverySet.price, featuredCoupon]
  );

  return (
    <StoreConfigContext.Provider
      value={{
        pricing,
        hasLivePricingDoc,
        activeCoupons,
        hasLiveCoupons,
        featuredCoupon,
        discoverySet,
        fragrances,
        discoveryDiscountedPrice,
        isStoreSynced,
        authReady,
        user,
        isAdmin,
        isOwnerAdmin,
        adminRole,
        authError,
        signInWithGoogle,
        signInWithEmailPassword,
        sendAdminVerificationEmail,
        refreshAdminAuthStatus,
        signOutAdmin,
      }}
    >
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => {
  const ctx = useContext(StoreConfigContext);
  if (!ctx) {
    throw new Error('useStoreConfig must be used within a StoreConfigProvider');
  }
  return ctx;
};
