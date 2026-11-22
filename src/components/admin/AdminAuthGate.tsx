import React, { useState } from 'react';
import { ShieldCheck, Lock, LogOut, ArrowLeft, Copy, Check, AlertCircle } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { TraceLogo } from '../brand/TraceLogo';

interface AdminAuthGateProps {
  onBackToStore: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onBackToStore }) => {
  const { authReady, user, isAdmin, authError, signInWithGoogle, signOutAdmin } = useStoreConfig();
  const [signingIn, setSigningIn] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard?.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#242321] flex flex-col">
      {/* Minimal Top Bar */}
      <header className="px-6 py-4 border-b border-[#DED4C7] bg-white flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <TraceLogo size="sm" showEmblem={true} />
          <span className="text-xs font-mono text-[#B7A99A] hidden sm:inline">
            / Administration
          </span>
        </div>
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-body font-medium text-[#242321] hover:text-[#713D43] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#DED4C7] p-8 sm:p-10 space-y-8">
          <div className="space-y-3">
            <div className="w-11 h-11 bg-[#F3EFE8] border border-[#DED4C7] flex items-center justify-center text-[#713D43]">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-editorial text-3xl text-[#242321] font-normal tracking-tight">
              TRACE Admin Console
            </h1>
            <p className="text-sm font-body text-[#242321]/70 leading-relaxed">
              Protected operational workspace for live order reconciliation (COD &amp; Prepaid), site-wide pricing, and coupon governance.
            </p>
          </div>

          {!authReady ? (
            <div className="py-6 space-y-3">
              <div className="h-10 bg-[#F3EFE8] animate-pulse" />
              <p className="text-xs font-mono text-[#242321]/60">
                Verifying Firebase authentication state...
              </p>
            </div>
          ) : user && !isAdmin ? (
            <div className="space-y-5">
              <div className="p-4 bg-[#FDF4F5] border border-[#713D43]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#713D43] text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Access Denied — Unauthorized Account</span>
                </div>
                <p className="text-xs text-[#242321]/80 leading-relaxed">
                  Signed in as <strong className="font-mono">{user.email}</strong>. This account is not registered in the TRACE administrator allowlist. Zero storefront records were loaded.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F4] border border-[#DED4C7] space-y-2">
                <span className="text-[11px] font-mono text-[#242321]/60 block">
                  Your Verified Firebase UID (share with store owner to request access)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-[#242321] truncate">
                    {user.uid}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono border border-[#DED4C7] bg-white hover:bg-[#F3EFE8] transition-colors cursor-pointer shrink-0"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={signOutAdmin}
                  className="w-full py-3 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-medium tracking-wider uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out &amp; Switch Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {authError && (
                <div className="p-3.5 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full py-3.5 px-5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.18em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{signingIn ? 'Verifying Credentials...' : 'Sign In with Authorized Google Account'}</span>
              </button>

              <div className="pt-5 border-t border-[#DED4C7] space-y-2 text-xs text-[#242321]/65 font-body">
                <p>Server-side Firestore security rules enforce:</p>
                <ul className="space-y-1 text-[#242321]/75">
                  <li>· Verified Google identity + database allowlist check</li>
                  <li>· Zero customer order PII exposed to unauthenticated clients</li>
                  <li>· Immutable audit logging for all pricing and order mutations</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
