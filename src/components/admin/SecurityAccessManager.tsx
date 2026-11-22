import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  History,
} from 'lucide-react';
import { OWNER_ADMIN_EMAIL } from '../../firebase';
import { addAdminUser, removeAdminUser } from '../../services/firestoreService';
import {
  formatTimestamp,
  type AdminRole,
  type AdminUserRecord,
  type AuditLogRecord,
} from '../../utils/storeLogic';

interface SecurityAccessManagerProps {
  admins: AdminUserRecord[];
  auditLogs: AuditLogRecord[];
  isOwnerAdmin: boolean;
  currentUid: string;
  actorEmail: string;
}

export const SecurityAccessManager: React.FC<SecurityAccessManagerProps> = ({
  admins,
  auditLogs,
  isOwnerAdmin,
  currentUid,
  actorEmail,
}) => {
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('manager');
  const [submitting, setSubmitting] = useState(false);
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await addAdminUser({ uid, email, displayName, role }, actorEmail);
      setFeedback({
        type: 'success',
        text: `Authorized ${email.trim().toLowerCase()} as ${role}. Access takes effect immediately.`,
      });
      setUid('');
      setEmail('');
      setDisplayName('');
      setRole('manager');
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to authorize admin.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (admin: AdminUserRecord) => {
    setFeedback(null);
    try {
      await removeAdminUser(admin.uid, admin.email);
      setConfirmRemoveUid(null);
      setFeedback({
        type: 'success',
        text: `Revoked admin access for ${admin.email}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to revoke admin.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Protection Summary */}
      <div className="bg-white border border-[#DED4C7] p-6 space-y-3">
        <div className="flex items-center gap-2 text-[#713D43]">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-editorial text-2xl text-[#242321]">
            Zero-Trust Security Architecture
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-body text-[#242321]/75">
          <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] space-y-1">
            <span className="font-semibold text-[#242321] block">Server-Side Firestore Rules</span>
            <p>
              Orders PII, pricing writes, coupon mutations, and audit logs are blocked at the database layer for everyone except verified allowlisted admins.
            </p>
          </div>
          <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] space-y-1">
            <span className="font-semibold text-[#242321] block">Owner-Only Role Governance</span>
            <p>
              Only the primary owner (<span className="font-mono">{OWNER_ADMIN_EMAIL}</span>) can grant or revoke admin UIDs. Self-escalation is cryptographically denied.
            </p>
          </div>
          <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] space-y-1">
            <span className="font-semibold text-[#242321] block">Immutable Audit Trail</span>
            <p>
              Every pricing update, coupon change, and order edit is recorded in an append-only <span className="font-mono">audit_logs</span> collection that cannot be altered or deleted.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Authorized Admins Registry + Grant Form */}
        <div className="lg:col-span-5 bg-white border border-[#DED4C7] p-6 space-y-6">
          <div className="pb-3 border-b border-[#DED4C7]">
            <h3 className="font-editorial text-2xl text-[#242321]">Authorized Administrators</h3>
            <p className="text-xs font-body text-[#242321]/60 mt-0.5">
              Verified Google accounts permitted to access this console.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 border text-xs flex items-center gap-2 ${
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

          {/* Primary Owner Row */}
          <div className="divide-y divide-[#DED4C7] border border-[#DED4C7]">
            <div className="p-4 bg-[#FAF8F4] flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-[#242321] block">
                  Primary Store Owner
                </span>
                <span className="text-xs font-mono text-[#242321]/75 block">
                  {OWNER_ADMIN_EMAIL}
                </span>
                <span className="text-[11px] font-mono text-[#713D43]">
                  Owner · Protected Bootstrapped Root
                </span>
              </div>
              <Lock className="w-4 h-4 text-[#713D43] shrink-0" />
            </div>

            {admins.map(admin => (
              <div
                key={admin.uid}
                className="p-4 bg-white flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#242321] block truncate">
                    {admin.displayName}
                  </span>
                  <span className="text-xs font-mono text-[#242321]/75 block truncate">
                    {admin.email}
                  </span>
                  <span className="text-[11px] font-mono text-[#242321]/50 block truncate">
                    UID: {admin.uid} · Role: {admin.role}
                  </span>
                </div>

                {isOwnerAdmin && admin.uid !== currentUid && (
                  <div className="shrink-0">
                    {confirmRemoveUid === admin.uid ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(admin)}
                          className="px-2.5 py-1 bg-[#B91C1C] text-white text-xs cursor-pointer"
                        >
                          Revoke
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveUid(null)}
                          className="px-2 py-1 border border-[#DED4C7] text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveUid(admin.uid)}
                        aria-label={`Revoke admin access for ${admin.email}`}
                        className="p-1.5 border border-[#DED4C7] text-[#242321]/70 hover:text-[#B91C1C] hover:border-[#B91C1C]/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {isOwnerAdmin ? (
            <form onSubmit={handleAddAdmin} className="space-y-3 pt-2 text-xs font-body">
              <h4 className="font-semibold text-[#242321] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#713D43]" />
                <span>Authorize Team Manager</span>
              </h4>
              <p className="text-[11px] text-[#242321]/60 leading-relaxed">
                Ask your team member to sign in at <span className="font-mono">/admin</span> once and copy their verified Firebase UID from the lockout screen.
              </p>

              <div>
                <label htmlFor="admin-uid" className="block text-[#242321]/70 mb-1">
                  Firebase Auth UID
                </label>
                <input
                  id="admin-uid"
                  type="text"
                  required
                  value={uid}
                  onChange={e => setUid(e.target.value)}
                  placeholder="Paste verified UID"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-name" className="block text-[#242321]/70 mb-1">
                    Full Name
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Operations Lead"
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                  />
                </div>
                <div>
                  <label htmlFor="admin-role" className="block text-[#242321]/70 mb-1">
                    Role
                  </label>
                  <select
                    id="admin-role"
                    value={role}
                    onChange={e => setRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
                  >
                    <option value="manager">Manager (Orders, Pricing, Coupons)</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="admin-email" className="block text-[#242321]/70 mb-1">
                  Verified Google Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="manager@tracefragrances.com"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-semibold uppercase tracking-wider hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Authorizing...' : 'Grant Admin Access'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-[#242321]/60 bg-[#FAF8F4] border border-[#DED4C7] p-3">
              Signed in with Manager privileges. Only the primary store owner may grant or revoke admin accounts.
            </p>
          )}
        </div>

        {/* Immutable Audit Log */}
        <div className="lg:col-span-7 bg-white border border-[#DED4C7] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DED4C7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#713D43]" />
              <h3 className="font-editorial text-2xl text-[#242321]">Immutable Audit Trail</h3>
            </div>
            <span className="text-xs font-mono text-[#242321]/55">
              Latest {auditLogs.length} events
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-16 px-6 text-center text-xs font-body text-[#242321]/60">
              No administrative actions logged yet. Price updates, coupon edits, and order reconciliations will be recorded here automatically.
            </div>
          ) : (
            <div className="divide-y divide-[#DED4C7]/70 max-h-[540px] overflow-y-auto">
              {auditLogs.map((entry, idx) => (
                <div key={entry.id || idx} className="px-5 py-3.5 text-xs font-body space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-[#713D43]">
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-[#242321]/55 tabular-nums">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>
                  <p className="text-[#242321]">{entry.summary}</p>
                  <p className="text-[11px] font-mono text-[#242321]/55">
                    Actor: {entry.actorEmail} · Target: {entry.targetId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
