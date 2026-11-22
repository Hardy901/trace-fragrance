import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Power,
} from 'lucide-react';
import {
  createCoupon,
  deleteCoupon,
  publishStorePricing,
  updateCoupon,
} from '../../services/firestoreService';
import {
  describeCouponSavings,
  formatINR,
  normalizeCouponCode,
  type CouponRecord,
  type DiscountType,
  type StorePricingConfig,
} from '../../utils/storeLogic';

interface CouponsManagerProps {
  coupons: CouponRecord[];
  loading: boolean;
  pricing: StorePricingConfig;
  actorEmail: string;
}

interface CouponFormState {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  applyPerItem: boolean;
  minOrderAmount: number;
  maxDiscount: number;
  maxUses: number;
  active: boolean;
}

const EMPTY_FORM: CouponFormState = {
  code: '',
  description: '',
  discountType: 'fixed',
  discountValue: 100,
  applyPerItem: false,
  minOrderAmount: 0,
  maxDiscount: 0,
  maxUses: 0,
  active: true,
};

export const CouponsManager: React.FC<CouponsManagerProps> = ({
  coupons,
  loading,
  pricing,
  actorEmail,
}) => {
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const startEdit = (coupon: CouponRecord) => {
    setEditingCode(coupon.code);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      applyPerItem: coupon.applyPerItem,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      maxUses: coupon.maxUses,
      active: coupon.active,
    });
    setFeedback(null);
  };

  const resetForm = () => {
    setEditingCode(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingCode) {
        const existing = coupons.find(c => c.code === editingCode);
        if (!existing) throw new Error('Coupon no longer exists.');
        await updateCoupon(existing, {
          description: form.description,
          discountType: form.discountType,
          discountValue: form.discountValue,
          applyPerItem: form.applyPerItem,
          minOrderAmount: form.minOrderAmount,
          maxDiscount: form.maxDiscount,
          maxUses: form.maxUses,
          active: form.active,
        });
        setFeedback({ type: 'success', text: `Coupon "${editingCode}" updated live across storefront.` });
        resetForm();
      } else {
        await createCoupon(form, actorEmail);
        const normalized = normalizeCouponCode(form.code);
        setFeedback({
          type: 'success',
          text: `Coupon "${normalized}" created and live for immediate redemption.`,
        });
        resetForm();
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to save coupon.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponRecord) => {
    setFeedback(null);
    try {
      await updateCoupon(coupon, { active: !coupon.active });
      setFeedback({
        type: 'success',
        text: `Coupon "${coupon.code}" is now ${!coupon.active ? 'active' : 'paused'}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to toggle coupon.',
      });
    }
  };

  const handleSetFeatured = async (code: string) => {
    setFeedback(null);
    try {
      await publishStorePricing(
        { ...pricing, featuredCouponCode: code },
        actorEmail
      );
      setFeedback({
        type: 'success',
        text: `"${code}" is now the featured storefront promo code across hero, marquee, and cart.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to set featured coupon.',
      });
    }
  };

  const handleDelete = async (code: string) => {
    setFeedback(null);
    try {
      await deleteCoupon(code);
      if (pricing.featuredCouponCode === code) {
        await publishStorePricing({ ...pricing, featuredCouponCode: '' }, actorEmail);
      }
      setConfirmDeleteCode(null);
      if (editingCode === code) resetForm();
      setFeedback({ type: 'success', text: `Coupon "${code}" deleted.` });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete coupon.',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create / Edit Coupon Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white border border-[#DED4C7] p-6 space-y-5"
      >
        <div className="pb-3 border-b border-[#DED4C7] flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-2xl text-[#242321]">
              {editingCode ? `Edit ${editingCode}` : 'Create Coupon Code'}
            </h2>
            <p className="text-xs font-body text-[#242321]/60 mt-0.5">
              Changes sync instantly to every visitor&apos;s cart and checkout.
            </p>
          </div>
          {editingCode && (
            <button
              type="button"
              onClick={resetForm}
              aria-label="Cancel editing coupon"
              className="p-1.5 text-[#242321]/60 hover:text-[#713D43] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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

        <div className="space-y-4 text-xs font-body">
          <div>
            <label htmlFor="coupon-code-input" className="block font-medium text-[#242321]/75 mb-1.5">
              Coupon Code
            </label>
            <input
              id="coupon-code-input"
              type="text"
              required
              disabled={Boolean(editingCode)}
              maxLength={32}
              value={form.code}
              onChange={e =>
                setForm(prev => ({ ...prev, code: normalizeCouponCode(e.target.value) }))
              }
              placeholder="e.g. TRACE2026, VIP15, FESTIVE200"
              className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono uppercase tracking-wider text-sm text-[#242321] disabled:opacity-60 focus:outline-none focus:border-[#242321]"
            />
          </div>

          <div>
            <label htmlFor="coupon-desc-input" className="block font-medium text-[#242321]/75 mb-1.5">
              Customer-Facing Description
            </label>
            <input
              id="coupon-desc-input"
              type="text"
              required
              maxLength={160}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Launch Offer — ₹100 OFF per Discovery Set"
              className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="coupon-type" className="block font-medium text-[#242321]/75 mb-1.5">
                Discount Type
              </label>
              <select
                id="coupon-type"
                value={form.discountType}
                onChange={e =>
                  setForm(prev => ({ ...prev, discountType: e.target.value as DiscountType }))
                }
                className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-[#242321] focus:outline-none focus:border-[#242321]"
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label htmlFor="coupon-value" className="block font-medium text-[#242321]/75 mb-1.5">
                {form.discountType === 'percent' ? 'Percent Off (%)' : 'Amount Off (₹)'}
              </label>
              <input
                id="coupon-value"
                type="number"
                required
                min={1}
                max={form.discountType === 'percent' ? 100 : 50000}
                value={form.discountValue}
                onChange={e =>
                  setForm(prev => ({ ...prev, discountValue: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="coupon-min-order" className="block font-medium text-[#242321]/75 mb-1.5">
                Min Order (₹)
              </label>
              <input
                id="coupon-min-order"
                type="number"
                min={0}
                max={100000}
                value={form.minOrderAmount}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    minOrderAmount: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] focus:outline-none focus:border-[#242321]"
              />
            </div>

            <div>
              <label htmlFor="coupon-max-disc" className="block font-medium text-[#242321]/75 mb-1.5">
                Max Cap (₹)
              </label>
              <input
                id="coupon-max-disc"
                type="number"
                min={0}
                max={50000}
                value={form.maxDiscount}
                onChange={e =>
                  setForm(prev => ({ ...prev, maxDiscount: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] focus:outline-none focus:border-[#242321]"
              />
            </div>

            <div>
              <label htmlFor="coupon-max-uses" className="block font-medium text-[#242321]/75 mb-1.5">
                Max Uses
              </label>
              <input
                id="coupon-max-uses"
                type="number"
                min={0}
                max={1000000}
                value={form.maxUses}
                onChange={e =>
                  setForm(prev => ({ ...prev, maxUses: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-[#242321] focus:outline-none focus:border-[#242321]"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#242321]/55">
            Set Max Cap or Max Uses to 0 for unlimited.
          </p>

          {form.discountType === 'fixed' && (
            <label className="flex items-center gap-2.5 p-3 bg-[#FAF8F4] border border-[#DED4C7] cursor-pointer">
              <input
                type="checkbox"
                checked={form.applyPerItem}
                onChange={e => setForm(prev => ({ ...prev, applyPerItem: e.target.checked }))}
                className="accent-[#713D43] w-4 h-4"
              />
              <span className="text-[#242321]">
                Apply fixed discount per item in cart (unchecked = flat discount per order)
              </span>
            </label>
          )}

          <label className="flex items-center gap-2.5 p-3 bg-[#FAF8F4] border border-[#DED4C7] cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
              className="accent-[#713D43] w-4 h-4"
            />
            <span className="text-[#242321]">Active immediately on storefront</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>
            {submitting
              ? 'Saving...'
              : editingCode
                ? 'Update Live Coupon'
                : 'Publish New Coupon'}
          </span>
        </button>
      </form>

      {/* Right: Active & Paused Coupons Registry */}
      <div className="lg:col-span-7 bg-white border border-[#DED4C7] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DED4C7] flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-2xl text-[#242321]">Live Coupon Registry</h2>
            <p className="text-xs font-body text-[#242321]/60">
              {coupons.filter(c => c.active).length} active · {coupons.length} total
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-14 bg-[#F3EFE8] animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-2">
            <p className="font-editorial text-2xl text-[#242321]">No Coupons Created Yet</p>
            <p className="text-xs font-body text-[#242321]/65">
              Create your first promotional code on the left — e.g. TRACE2026 — and feature it across the storefront.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DED4C7]">
            {coupons.map(coupon => {
              const isFeatured =
                pricing.featuredCouponCode.toUpperCase() === coupon.code.toUpperCase();
              return (
                <div key={coupon.code} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F4]/70 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-[#242321] tracking-wider">
                        {coupon.code}
                      </span>
                      <span aria-hidden="true" className="text-[#B7A99A]">·</span>
                      <span
                        className={`text-xs font-medium ${
                          coupon.active ? 'text-[#15803D]' : 'text-[#242321]/50'
                        }`}
                      >
                        {coupon.active ? 'Active' : 'Paused'}
                      </span>
                      {isFeatured && (
                        <>
                          <span aria-hidden="true" className="text-[#B7A99A]">·</span>
                          <span className="text-xs font-semibold text-[#713D43]">
                            Featured on Storefront
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs font-body text-[#242321]/80">{coupon.description}</p>

                    <p className="text-[11px] font-mono text-[#242321]/60 tabular-nums">
                      {describeCouponSavings(coupon)}
                      {coupon.minOrderAmount > 0 ? ` · Min ${formatINR(coupon.minOrderAmount)}` : ''}
                      {' · '}
                      Uses: {coupon.usageCount}
                      {coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ' (Unlimited)'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isFeatured && coupon.active && (
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(coupon.code)}
                        aria-label={`Feature ${coupon.code} on storefront`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#DED4C7] bg-white text-xs font-body text-[#242321] hover:border-[#713D43] hover:text-[#713D43] transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Feature</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleActive(coupon)}
                      aria-label={`${coupon.active ? 'Pause' : 'Activate'} coupon ${coupon.code}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#DED4C7] bg-white text-xs font-body text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{coupon.active ? 'Pause' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(coupon)}
                      aria-label={`Edit coupon ${coupon.code}`}
                      className="p-1.5 border border-[#DED4C7] bg-white text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteCode === coupon.code ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon.code)}
                          className="px-2.5 py-1.5 bg-[#B91C1C] text-white text-xs font-body font-medium hover:bg-[#991B1B] cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCode(null)}
                          className="px-2 py-1.5 border border-[#DED4C7] text-xs font-body text-[#242321] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCode(coupon.code)}
                        aria-label={`Delete coupon ${coupon.code}`}
                        className="p-1.5 border border-[#DED4C7] bg-white text-[#242321]/70 hover:text-[#B91C1C] hover:border-[#B91C1C]/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
