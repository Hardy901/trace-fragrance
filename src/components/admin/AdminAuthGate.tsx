import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';
import {
  setupAdminVaultPasscode,
  verifyAdminVaultPasscode,
  type AdminVaultStatus,
} from '../../services/adminPasscodeClient';
import { TraceLogo } from '../brand/TraceLogo';
import firebaseConfig from '../../../firebase-applet-config.json';

interface AdminAuthGateProps {
  onBackToStore: () => void;
  vaultStatus: AdminVaultStatus | null;
  vaultApiError: string | null;
  vaultLoading: boolean;
  vaultUnlocked: boolean;
  onVaultUnlocked: (token: string, source: 'env' | 'runtime') => void;
  onLockVault: () => void;
  onRetryVaultStatus: () => void;
  onVaultNeedsSetup: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  onBackToStore,
  vaultStatus,
  vaultApiError,
  vaultLoading,
  vaultUnlocked,
  onVaultUnlocked,
  onLockVault,
  onRetryVaultStatus,
  onVaultNeedsSetup,
}) => {
  const {
    authReady,
    user,
    isAdmin,
    authError,
    signInWithGoogle,
    signInWithEmailPassword,
    sendAdminVerificationEmail,
    refreshAdminAuthStatus,
    signOutAdmin,
  } = useStoreConfig();

  // Layer 1: Server-side passcode vault state (zero hardcoded secret)
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [vaultSubmitting, setVaultSubmitting] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Layer 2: Firebase Identity state (Email/Password for Vercel + Google Sign-In)
  const [authTab, setAuthTab] = useState<'email' | 'google'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [refreshingVerification, setRefreshingVerification] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isUnauthorizedDomain = Boolean(authError && authError.includes('auth/unauthorized-domain'));
  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  const firebaseAuthProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  const handleVaultSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultError(null);
    if (passcode.trim().length < 8) {
      setVaultError('Admin passcode must be at least 8 characters.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setVaultError('Passcodes do not match. Please re-enter to confirm.');
      return;
    }

    setVaultSubmitting(true);
    try {
      const result = await setupAdminVaultPasscode(passcode);
      if (result.authenticated && result.token) {
        setPasscode('');
        setConfirmPasscode('');
        onVaultUnlocked(result.token, result.source || 'runtime');
      } else {
        setVaultError(result.error || 'Unable to initialize admin passcode vault.');
      }
    } catch {
      setVaultError('Unable to reach server passcode vault. Please retry.');
    } finally {
      setVaultSubmitting(false);
    }
  };

  const handleVaultVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultError(null);
    setRemainingAttempts(null);
    if (!passcode.trim()) {
      setVaultError('Enter your admin passcode to unlock.');
      return;
    }

    setVaultSubmitting(true);
    try {
      const result = await verifyAdminVaultPasscode(passcode);
      if (result.authenticated && result.token) {
        setPasscode('');
        onVaultUnlocked(result.token, result.source || 'env');
      } else {
        if (result.needsSetup) {
          onVaultNeedsSetup();
        }
        setVaultError(result.error || 'Invalid admin passcode.');
        if (typeof result.remainingAttempts === 'number') {
          setRemainingAttempts(result.remainingAttempts);
        }
      }
    } catch {
      setVaultError('Unable to reach server passcode vault. Please retry.');
    } finally {
      setVaultSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) return;
    setSigningIn(true);
    try {
      await signInWithEmailPassword(emailInput, passwordInput);
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendAdminVerificationEmail();
      setVerificationSent(true);
    } catch {
      // Error surfaced via authError
    }
  };

  const handleRefreshVerification = async () => {
    setRefreshingVerification(true);
    try {
      await refreshAdminAuthStatus();
    } finally {
      setRefreshingVerification(false);
    }
  };

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard?.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 1800);
  };

  const handleCopyHost = () => {
    if (!currentHostname) return;
    navigator.clipboard?.writeText(currentHostname);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 1800);
  };

  const isVaultUnconfigured = vaultStatus !== null && !vaultStatus.configured;

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
        <div className="w-full max-w-md bg-white border border-[#DED4C7] p-8 sm:p-10 space-y-7">
          {/* Header & 2-Layer Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 bg-[#F3EFE8] border border-[#DED4C7] flex items-center justify-center text-[#713D43]">
                {vaultUnlocked ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                <span
                  className={`px-2 py-0.5 border ${
                    vaultUnlocked
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                      : 'bg-[#F3EFE8] border-[#242321] text-[#242321] font-semibold'
                  }`}
                >
                  1. Vault
                </span>
                <span className="text-[#B7A99A]">→</span>
                <span
                  className={`px-2 py-0.5 border ${
                    vaultUnlocked
                      ? 'bg-[#F3EFE8] border-[#242321] text-[#242321] font-semibold'
                      : 'bg-white border-[#DED4C7] text-[#B7A99A]'
                  }`}
                >
                  2. Identity
                </span>
              </div>
            </div>

            <h1 className="font-editorial text-3xl text-[#242321] font-normal tracking-tight">
              TRACE Admin Console
            </h1>
            <p className="text-sm font-body text-[#242321]/70 leading-relaxed">
              {!vaultUnlocked
                ? 'Server-verified passcode vault protects administrative access. Credentials are hashed server-side and never bundled in client code.'
                : 'Vault unlocked. Authenticate your verified administrator account to establish an encrypted Firestore session.'}
            </p>
          </div>

          {/* LAYER 1: SERVER-SIDE PASSCODE VAULT */}
          {vaultLoading ? (
            <div className="py-6 space-y-3">
              <div className="h-10 bg-[#F3EFE8] animate-pulse" />
              <p className="text-xs font-mono text-[#242321]/60">
                Connecting to server-side passcode vault...
              </p>
            </div>
          ) : !vaultUnlocked && vaultApiError ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-[#242321]">
                      Admin Passcode Vault API Unreachable
                    </p>
                    <p className="leading-relaxed">{vaultApiError}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onRetryVaultStatus}
                className="w-full py-3 bg-[#242321] text-[#FAF8F4] font-body text-xs tracking-[0.2em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : !vaultUnlocked ? (
            isVaultUnconfigured ? (
              <form onSubmit={handleVaultSetup} className="space-y-4">
                <div className="p-3.5 bg-[#FAF8F4] border border-[#DED4C7] text-xs text-[#242321]/80 space-y-1">
                  <p className="font-semibold text-[#242321]">First-Run Vault Initialization</p>
                  <p className="leading-relaxed">
                    Set your server-side admin passcode now. For permanent Vercel deployments, also add{' '}
                    <code className="font-mono text-[#713D43]">ADMIN_PASSCODE</code> in Vercel Project Settings → Environment Variables.
                  </p>
                </div>

                {vaultError && (
                  <div className="p-3 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{vaultError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs font-body">
                  <div>
                    <label
                      htmlFor="vault-setup-passcode"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/70 mb-1"
                    >
                      Set Admin Passcode (Min. 8 Characters)
                    </label>
                    <div className="relative">
                      <input
                        id="vault-setup-passcode"
                        type={showPasscode ? 'text' : 'password'}
                        required
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        value={passcode}
                        onChange={e => setPasscode(e.target.value)}
                        placeholder="Enter private admin passcode"
                        className="w-full px-3 py-2.5 pr-10 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(prev => !prev)}
                        aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#242321]/55 hover:text-[#242321] cursor-pointer"
                      >
                        {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="vault-confirm-passcode"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/70 mb-1"
                    >
                      Confirm Passcode
                    </label>
                    <input
                      id="vault-confirm-passcode"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      value={confirmPasscode}
                      onChange={e => setConfirmPasscode(e.target.value)}
                      placeholder="Re-enter admin passcode"
                      className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={vaultSubmitting}
                  className="w-full py-3.5 px-5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.18em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{vaultSubmitting ? 'Initializing Vault...' : 'Initialize & Unlock Vault'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVaultVerify} className="space-y-4">
                {vaultError && (
                  <div className="p-3 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] space-y-1">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{vaultError}</span>
                    </div>
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <p className="font-mono text-[11px] pl-6">
                        {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout.
                      </p>
                    )}
                  </div>
                )}

                <div className="text-xs font-body">
                  <label
                    htmlFor="vault-passcode"
                    className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/70 mb-1.5"
                  >
                    Admin Vault Passcode
                  </label>
                  <div className="relative">
                    <input
                      id="vault-passcode"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      maxLength={128}
                      autoComplete="current-password"
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      placeholder="Enter admin passcode"
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(prev => !prev)}
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#242321]/55 hover:text-[#242321] cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={vaultSubmitting}
                  className="w-full py-3.5 px-5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.18em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Lock className="w-4 h-4" />
                  <span>{vaultSubmitting ? 'Verifying Server Hash...' : 'Unlock Admin Vault'}</span>
                </button>
              </form>
            )
          ) : !authReady ? (
            <div className="py-6 space-y-3">
              <div className="h-10 bg-[#F3EFE8] animate-pulse" />
              <p className="text-xs font-mono text-[#242321]/60">
                Verifying Firebase authentication state...
              </p>
            </div>
          ) : user && !user.emailVerified ? (
            /* Signed in via Email/Password but email verification pending */
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] space-y-2">
                <div className="flex items-center gap-2 text-[#713D43] text-sm font-semibold">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Verify Your Admin Email</span>
                </div>
                <p className="text-xs text-[#242321]/80 leading-relaxed">
                  Signed in as <strong className="font-mono">{user.email}</strong>. Firestore security rules require a verified email before unlocking order data.
                </p>
              </div>

              {verificationSent && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D]">
                  Verification link sent to {user.email}. Click the link in your inbox, then tap &ldquo;Refresh Access&rdquo; below.
                </div>
              )}

              {authError && (
                <div className="p-3 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43]">
                  {authError}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="w-full py-3 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Verification Email</span>
                </button>
                <button
                  type="button"
                  disabled={refreshingVerification}
                  onClick={handleRefreshVerification}
                  className="w-full py-2.5 px-4 border border-[#242321] text-xs font-body font-medium text-[#242321] hover:bg-[#F3EFE8] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingVerification ? 'animate-spin' : ''}`} />
                  <span>I&apos;ve Verified — Refresh Access</span>
                </button>
                <button
                  type="button"
                  onClick={signOutAdmin}
                  className="w-full py-2 text-xs font-body text-[#242321]/65 hover:text-[#713D43] transition-colors cursor-pointer"
                >
                  Sign Out &amp; Switch Account
                </button>
              </div>
            </div>
          ) : user && !isAdmin ? (
            /* Signed in & verified, but not on admin allowlist */
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

              <button
                type="button"
                onClick={signOutAdmin}
                className="w-full py-3 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-medium tracking-wider uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out &amp; Switch Account</span>
              </button>
            </div>
          ) : (
            /* LAYER 2: FIREBASE AUTH (EMAIL/PASSWORD FOR VERCEL + GOOGLE) */
            <div className="space-y-5">
              <div className="flex items-center justify-between px-3 py-2 bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Passcode Vault Verified</span>
                </span>
                <button
                  type="button"
                  onClick={onLockVault}
                  className="font-mono text-[11px] underline underline-offset-2 hover:text-[#242321] cursor-pointer"
                >
                  Lock Vault
                </button>
              </div>

              {/* Dual Sign-In Mode Tabs */}
              <div
                className="grid grid-cols-2 p-1 bg-[#F3EFE8] border border-[#DED4C7]"
                role="tablist"
                aria-label="Admin sign-in method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'email'}
                  onClick={() => setAuthTab('email')}
                  className={`py-2 text-xs font-body font-medium transition-colors cursor-pointer ${
                    authTab === 'email'
                      ? 'bg-[#242321] text-[#FAF8F4]'
                      : 'text-[#242321]/70 hover:text-[#242321]'
                  }`}
                >
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'google'}
                  onClick={() => setAuthTab('google')}
                  className={`py-2 text-xs font-body font-medium transition-colors cursor-pointer ${
                    authTab === 'google'
                      ? 'bg-[#242321] text-[#FAF8F4]'
                      : 'text-[#242321]/70 hover:text-[#242321]'
                  }`}
                >
                  Google Sign-In
                </button>
              </div>

              {authError && (
                <div className="p-3.5 bg-[#FDF4F5] border border-[#713D43]/30 text-xs text-[#713D43] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold">
                        {isUnauthorizedDomain
                          ? 'Domain Not Yet Authorized for Google Popup'
                          : authError}
                      </p>
                      {isUnauthorizedDomain && (
                        <p className="text-[#242321]/80 leading-relaxed">
                          Use the <strong>Email &amp; Password</strong> tab (works on any Vercel domain immediately), or add this domain in Firebase Console → Authentication → Settings → Authorized domains.
                        </p>
                      )}
                    </div>
                  </div>
                  {isUnauthorizedDomain && currentHostname && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-[#DED4C7]">
                        <code className="text-[11px] font-mono text-[#242321] truncate">
                          {currentHostname}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyHost}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono border border-[#DED4C7] bg-[#FAF8F4] text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer shrink-0"
                        >
                          {copiedHost ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHost ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <a
                        href={firebaseAuthSettingsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#713D43] underline underline-offset-2 hover:text-[#242321] transition-colors"
                      >
                        <span>Open Firebase Authentication Settings</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {authTab === 'email' ? (
                <form onSubmit={handleEmailSignIn} className="space-y-3.5 text-xs font-body">
                  <div>
                    <label
                      htmlFor="admin-login-email"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/70 mb-1"
                    >
                      Admin Email
                    </label>
                    <input
                      id="admin-login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="owner@domain.com"
                      className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-login-password"
                      className="block text-[11px] font-mono uppercase tracking-wider text-[#242321]/70 mb-1"
                    >
                      Firebase Account Password
                    </label>
                    <input
                      id="admin-login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full px-3 py-2.5 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full py-3.5 px-5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.18em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{signingIn ? 'Authenticating...' : 'Sign In with Email & Password'}</span>
                  </button>

                  <p className="text-[11px] text-[#242321]/60 leading-relaxed">
                    Works on Vercel &amp; custom domains with zero popup restrictions. Enable Email/Password in{' '}
                    <a
                      href={firebaseAuthProvidersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#713D43] underline underline-offset-2 hover:text-[#242321]"
                    >
                      Firebase Sign-in Methods
                    </a>
                    .
                  </p>
                </form>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full py-3.5 px-5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-[0.18em] uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{signingIn ? 'Verifying Credentials...' : 'Sign In with Authorized Google Account'}</span>
                  </button>
                  <p className="text-[11px] text-[#242321]/60 leading-relaxed">
                    Requires <code className="font-mono">{currentHostname || 'your domain'}</code> to be listed under Firebase Authorized domains.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Footer */}
          <div className="pt-5 border-t border-[#DED4C7] space-y-2 text-xs text-[#242321]/65 font-body">
            <p>Two-layer protection enforced server-side:</p>
            <ul className="space-y-1 text-[#242321]/75">
              <li>· Scrypt server-side passcode vault with brute-force rate limiting</li>
              <li>· Verified Firebase Auth + Firestore allowlist rules for customer PII</li>
              <li>· Immutable audit logging for all order, pricing, and coupon edits</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
