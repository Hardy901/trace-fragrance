import React, { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  Package,
  IndianRupee,
  TicketPercent,
  Shield,
  LogOut,
  ArrowLeft,
  Lock,
  Menu,
  X,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { seedInitialStoreData } from '../../services/firestoreService';
import type {
  AdminUserRecord,
  AuditLogRecord,
  CouponRecord,
  OrderRecord,
} from '../../utils/storeLogic';
import { TraceLogo } from '../brand/TraceLogo';
import { AdminAuthGate } from './AdminAuthGate';
import { OrdersManager } from './OrdersManager';
import { PricingManager } from './PricingManager';
import { CouponsManager } from './CouponsManager';
import { SecurityAccessManager } from './SecurityAccessManager';

type AdminTab = 'orders' | 'pricing' | 'coupons' | 'security';

interface AdminConsoleProps {
  onBackToStore: () => void;
}

const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes inactivity auto-lock

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onBackToStore }) => {
  const {
    authReady,
    user,
    isAdmin,
    isOwnerAdmin,
    adminRole,
    pricing,
    hasLivePricingDoc,
    signOutAdmin,
  } = useStoreConfig();

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [allCoupons, setAllCoupons] = useState<CouponRecord[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  // Inactivity auto-lock guard
  useEffect(() => {
    if (!isAdmin || isSessionLocked) return;
    let timer = window.setTimeout(() => setIsSessionLocked(true), SESSION_TIMEOUT_MS);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsSessionLocked(true), SESSION_TIMEOUT_MS);
    };
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isAdmin, isSessionLocked]);

  // Mount real-time protected Firestore listeners ONLY after verified admin authorization
  useEffect(() => {
    if (!authReady || !isAdmin || !user) return;

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(
      ordersQuery,
      snap => {
        setOrders(snap.docs.map(d => d.data() as OrderRecord));
        setOrdersLoading(false);
      },
      error => {
        setOrdersLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const couponsRef = collection(db, 'coupons');
    const unsubCoupons = onSnapshot(
      couponsRef,
      snap => {
        const list = snap.docs.map(d => d.data() as CouponRecord);
        list.sort((a, b) => a.code.localeCompare(b.code));
        setAllCoupons(list);
        setCouponsLoading(false);
      },
      error => {
        setCouponsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'coupons');
      }
    );

    const adminsRef = collection(db, 'admins');
    const unsubAdmins = onSnapshot(
      adminsRef,
      snap => {
        setAdmins(snap.docs.map(d => d.data() as AdminUserRecord));
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'admins');
      }
    );

    const auditQuery = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubAudit = onSnapshot(
      auditQuery,
      snap => {
        setAuditLogs(
          snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as AuditLogRecord),
          }))
        );
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'audit_logs');
      }
    );

    return () => {
      unsubOrders();
      unsubCoupons();
      unsubAdmins();
      unsubAudit();
    };
  }, [authReady, isAdmin, user]);

  // Hard security gate: render zero admin UI or data until verified admin
  if (!authReady || !user || !isAdmin) {
    return <AdminAuthGate onBackToStore={onBackToStore} />;
  }

  // Manual or inactivity session lock screen
  if (isSessionLocked) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] text-[#242321] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#DED4C7] p-8 space-y-6 text-center">
          <div className="w-12 h-12 bg-[#F3EFE8] border border-[#DED4C7] mx-auto flex items-center justify-center text-[#713D43]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h1 className="font-editorial text-3xl text-[#242321]">Session Locked</h1>
            <p className="text-xs font-body text-[#242321]/70">
              Your TRACE admin workspace was locked to protect customer order PII.
            </p>
            <p className="text-xs font-mono text-[#242321]/60">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setIsSessionLocked(false)}
              className="w-full py-3 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer"
            >
              Resume Admin Session
            </button>
            <button
              type="button"
              onClick={signOutAdmin}
              className="w-full py-2.5 border border-[#DED4C7] text-xs font-body text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
            >
              Sign Out Completely
            </button>
          </div>
        </div>
      </div>
    );
  }

  const actorEmail = user.email || 'admin@tracefragrances.com';

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedInitialStoreData(actorEmail);
      setSeedDone(true);
    } finally {
      setSeeding(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count?: number }> = [
    {
      id: 'orders',
      label: 'Orders Ledger',
      icon: <Package className="w-4 h-4" />,
      count: orders.length,
    },
    {
      id: 'pricing',
      label: 'Global Pricing',
      icon: <IndianRupee className="w-4 h-4" />,
    },
    {
      id: 'coupons',
      label: 'Coupon Codes',
      icon: <TicketPercent className="w-4 h-4" />,
      count: allCoupons.length,
    },
    {
      id: 'security',
      label: 'Access & Audit',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  const activeTitleMap: Record<AdminTab, { title: string; subtitle: string }> = {
    orders: {
      title: 'Orders Ledger',
      subtitle: 'Real-time Cash on Delivery (COD) and Paid Before order tracking and reconciliation.',
    },
    pricing: {
      title: 'Global Store Pricing',
      subtitle: 'Update product prices, shipping thresholds, and payment options live across the entire site.',
    },
    coupons: {
      title: 'Coupon Engine',
      subtitle: 'Create, activate, pause, and spotlight promotional codes in real time.',
    },
    security: {
      title: 'Access Control & Audit Trail',
      subtitle: 'Manage verified administrator roles and inspect immutable change history.',
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#242321] flex">
      {/* Desktop Sidebar (248px) */}
      <aside className="hidden lg:flex w-62 shrink-0 flex-col bg-[#1A1917] text-[#FAF8F4] border-r border-white/10">
        <div className="px-6 py-5 border-b border-white/10">
          <TraceLogo size="sm" showEmblem={true} inverted={true} />
          <p className="mt-2 text-[11px] font-mono text-[#DED4C7]/60">
            Admin Operations
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Admin sections">
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3.5 py-2.5 text-left text-xs font-body font-medium flex items-center justify-between transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#713D43] text-white'
                    : 'text-[#FAF8F4]/75 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span className="font-mono text-[11px] tabular-nums opacity-80">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-2 space-y-0.5">
            <span className="text-[11px] font-mono text-[#DED4C7]/60 block">
              {adminRole === 'owner' ? 'Store Owner' : 'Admin Manager'}
            </span>
            <span className="text-xs font-mono text-[#FAF8F4] block truncate">
              {actorEmail}
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full px-3 py-2 text-xs font-body text-[#DED4C7] border border-white/15 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Live Storefront</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#242321]/70 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="w-64 h-full bg-[#1A1917] text-[#FAF8F4] p-5 flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <TraceLogo size="sm" showEmblem={true} inverted={true} />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1 text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-body font-medium flex items-center justify-between ${
                      activeTab === item.id
                        ? 'bg-[#713D43] text-white'
                        : 'text-[#FAF8F4]/75 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.count !== undefined && (
                      <span className="font-mono text-[11px] tabular-nums">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <button
              type="button"
              onClick={onBackToStore}
              className="w-full px-3 py-2 text-xs font-body text-[#DED4C7] border border-white/15 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Live Storefront</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb left, primary controls right */}
        <header className="bg-white border-b border-[#DED4C7] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-1.5 text-[#242321] hover:text-[#713D43] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-body text-[#242321]/60 truncate">
              <span className="font-medium text-[#242321]">TRACE Admin</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#713D43] font-medium truncate">
                {activeTitleMap[activeTab].title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSessionLocked(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#DED4C7] bg-white text-xs font-body font-medium text-[#242321] hover:bg-[#F3EFE8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>

            <button
              type="button"
              onClick={signOutAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-medium hover:bg-[#713D43] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          {/* First-Run Live Database Initialization Banner */}
          {!hasLivePricingDoc && !seedDone && (
            <div className="bg-white border border-[#713D43]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-[#713D43] shrink-0 mt-0.5" />
                <div className="text-xs font-body">
                  <p className="font-semibold text-[#242321]">
                    Initialize Live Storefront Configuration in Firestore
                  </p>
                  <p className="text-[#242321]/70 mt-0.5">
                    Publish the baseline TRACE pricing (₹799 Discovery Set, ₹1,200 50ml Elixirs) and the default <span className="font-mono">TRACE2026</span> coupon to Firestore so all visitors sync from your live database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-[#713D43] text-white text-xs font-body font-semibold uppercase tracking-wider hover:bg-[#242321] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {seeding ? 'Initializing...' : 'Initialize Live Database'}
              </button>
            </div>
          )}

          {seedDone && (
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 text-xs text-[#15803D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Firestore initialized with live storefront pricing and TRACE2026 coupon.
              </span>
            </div>
          )}

          {/* Section Heading */}
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#242321] font-normal tracking-tight">
              {activeTitleMap[activeTab].title}
            </h1>
            <p className="text-sm font-body text-[#242321]/65 mt-1">
              {activeTitleMap[activeTab].subtitle}
            </p>
          </div>

          {activeTab === 'orders' && (
            <OrdersManager
              orders={orders}
              loading={ordersLoading}
              actorEmail={actorEmail}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingManager
              pricing={pricing}
              coupons={allCoupons}
              actorEmail={actorEmail}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsManager
              coupons={allCoupons}
              loading={couponsLoading}
              pricing={pricing}
              actorEmail={actorEmail}
            />
          )}

          {activeTab === 'security' && (
            <SecurityAccessManager
              admins={admins}
              auditLogs={auditLogs}
              isOwnerAdmin={isOwnerAdmin}
              currentUid={user.uid}
              actorEmail={actorEmail}
            />
          )}
        </main>
      </div>
    </div>
  );
};
