import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { FRAGRANCES } from '../../data/products';
import { publishStorePricing } from '../../services/firestoreService';
import {
  computeDiscountedPrice,
  DEFAULT_STORE_PRICING,
  formatINR,
  type CouponRecord,
  type StorePricingConfig,
} from '../../utils/storeLogic';

interface PricingManagerProps {
  pricing: StorePricingConfig;
  coupons: CouponRecord[];
  actorEmail: string;
}

export const PricingManager: React.FC<PricingManagerProps> = ({
  pricing,
  coupons,
  actorEmail,
}) => {
  const [draft, setDraft] = useState<StorePricingConfig>(pricing);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setDraft(pricing);
  }, [pricing]);

  const activeCoupons = coupons.filter(c => c.active);
  const previewFeatured =
    activeCoupons.find(c => c.code === draft.featuredCouponCode) || null;
  const previewDiscounted = computeDiscountedPrice(draft.discoverySetPrice, previewFeatured);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await publishStorePricing(draft, actorEmail);
      setFeedback({
        type: 'success',
        text: 'Live storefront pricing, shipping, and promo settings published to all active visitors.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to publish pricing update.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handlePublish} className="space-y-6">
      {feedback && (
        <div
          className={`p-4 border text-xs flex items-center gap-2 ${
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

      {/* Live Preview Strip */}
      <div className="bg-white border border-[#DED4C7] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-body text-[#242321]/60 block">
            Live Storefront Preview (Updates Hero, Marquee, Collection, Cart &amp; Checkout)
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono tabular-nums text-2xl font-semibold text-[#242321]">
              Discovery Set: {formatINR(draft.discoverySetPrice)}
            </span>
            {previewDiscounted !== null && previewFeatured && (
              <span className="font-mono tabular-nums text-sm text-[#713D43] font-medium">
                → {formatINR(previewDiscounted)} with code {previewFeatured.code}
              </span>
            )}
          </div>
          <p className="text-xs font-body text-[#242321]/65">
            Shipping: {formatINR(draft.shippingFee)} · Free over {formatINR(draft.freeShippingThreshold)} ·{' '}
            COD {draft.codEnabled ? (draft.codFee > 0 ? `Enabled (+${formatINR(draft.codFee)})` : 'Enabled (Free)') : 'Disabled'} ·{' '}
            Prepaid {draft.prepaidEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_STORE_PRICING)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#DED4C7] bg-white text-xs font-body font-medium text-[#242321] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242321] text-[#FAF8F4] text-xs font-body font-semibold tracking-wider uppercase hover:bg-[#713D43] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Pricing */}
        <div className="lg:col-span-7 bg-white border border-[#DED4C7] p-6 space-y-6">
          <div className="pb-3 border-b border-[#DED4C7]">
            <h2 className="font-editorial text-2xl text-[#242321]">
              Product Pricing &amp; Availability
            </h2>
            <p className="text-xs font-body text-[#242321]/65 mt-1">
              Changes propagate immediately to all live storefront pages and active shopping carts.
            </p>
          </div>

          {/* Discovery Set */}
          <div className="p-4 bg-[#FAF8F4] border border-[#DED4C7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-body text-sm font-semibold text-[#242321]">
                TRACE Elixir Discovery Set (4 × 5 ml)
              </h3>
              <p className="text-xs text-[#242321]/60">
                Primary storefront hero, collection &amp; quick-view SKU
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32">
                <label htmlFor="price-discovery-set" className="block text-[11px] font-mono text-[#242321]/60 mb-1">
                  MRP (INR)
                </label>
                <input
                  id="price-discovery-set"
                  type="number"
                  min={1}
                  max={100000}
                  required
                  value={draft.discoverySetPrice}
                  onChange={e =>
                    setDraft(prev => ({
                      ...prev,
                      discoverySetPrice: Math.max(0, Number(e.target.value)),
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-body text-[#242321] pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.discoverySetInStock}
                  onChange={e =>
                    setDraft(prev => ({ ...prev, discoverySetInStock: e.target.checked }))
                  }
                  className="accent-[#713D43] w-4 h-4"
                />
                <span>In Stock</span>
              </label>
            </div>
          </div>

          {/* 4 Archive Elixirs */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-[#242321]/65">
              50 ml Extrait Elixirs (Individual Catalog Pricing)
            </h3>
            <div className="divide-y divide-[#DED4C7] border border-[#DED4C7]">
              {FRAGRANCES.map(item => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                >
                  <div>
                    <span className="font-mono text-xs text-[#713D43] mr-2">NO. {item.number}</span>
                    <span className="font-body text-sm font-medium text-[#242321]">{item.name}</span>
                    <span className="block text-xs text-[#242321]/55">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <label htmlFor={`price-${item.id}`} className="sr-only">
                        {item.name} MRP in INR
                      </label>
                      <input
                        id={`price-${item.id}`}
                        type="number"
                        min={1}
                        max={100000}
                        required
                        value={draft.fragrancePrices[item.id] ?? item.price}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            fragrancePrices: {
                              ...prev.fragrancePrices,
                              [item.id]: Math.max(0, Number(e.target.value)),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-body text-[#242321] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.fragranceStock[item.id] ?? true}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            fragranceStock: {
                              ...prev.fragranceStock,
                              [item.id]: e.target.checked,
                            },
                          }))
                        }
                        className="accent-[#713D43] w-4 h-4"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Shipping, Payment Modes & Featured Promo */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#DED4C7] p-6 space-y-5">
            <div className="pb-3 border-b border-[#DED4C7]">
              <h2 className="font-editorial text-2xl text-[#242321]">
                Shipping &amp; Checkout Rules
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="shipping-fee" className="block font-medium text-[#242321]/75 mb-1.5">
                  Express Shipping (₹)
                </label>
                <input
                  id="shipping-fee"
                  type="number"
                  min={0}
                  max={5000}
                  required
                  value={draft.shippingFee}
                  onChange={e =>
                    setDraft(prev => ({ ...prev, shippingFee: Math.max(0, Number(e.target.value)) }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label htmlFor="free-shipping-threshold" className="block font-medium text-[#242321]/75 mb-1.5">
                  Free Shipping Over (₹)
                </label>
                <input
                  id="free-shipping-threshold"
                  type="number"
                  min={0}
                  max={100000}
                  required
                  value={draft.freeShippingThreshold}
                  onChange={e =>
                    setDraft(prev => ({
                      ...prev,
                      freeShippingThreshold: Math.max(0, Number(e.target.value)),
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#DED4C7] space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-[#FAF8F4] border border-[#DED4C7] cursor-pointer">
                <div>
                  <span className="font-medium text-[#242321] block">Accept Cash on Delivery (COD)</span>
                  <span className="text-[#242321]/60">Customers pay courier in cash or UPI upon delivery</span>
                </div>
                <input
                  type="checkbox"
                  checked={draft.codEnabled}
                  onChange={e => setDraft(prev => ({ ...prev, codEnabled: e.target.checked }))}
                  className="accent-[#713D43] w-4 h-4"
                />
              </label>

              {draft.codEnabled && (
                <div>
                  <label htmlFor="cod-fee" className="block font-medium text-[#242321]/75 mb-1.5">
                    Optional COD Handling Fee (₹)
                  </label>
                  <input
                    id="cod-fee"
                    type="number"
                    min={0}
                    max={1000}
                    value={draft.codFee}
                    onChange={e =>
                      setDraft(prev => ({ ...prev, codFee: Math.max(0, Number(e.target.value)) }))
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono tabular-nums text-sm text-[#242321] focus:outline-none focus:border-[#242321]"
                  />
                </div>
              )}

              <label className="flex items-center justify-between p-3 bg-[#FAF8F4] border border-[#DED4C7] cursor-pointer">
                <div>
                  <span className="font-medium text-[#242321] block">Accept Paid Before (UPI / Cards)</span>
                  <span className="text-[#242321]/60">Prepaid checkout with instant transaction reference capture</span>
                </div>
                <input
                  type="checkbox"
                  checked={draft.prepaidEnabled}
                  onChange={e => setDraft(prev => ({ ...prev, prepaidEnabled: e.target.checked }))}
                  className="accent-[#713D43] w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Storefront Featured Coupon */}
          <div className="bg-white border border-[#DED4C7] p-6 space-y-4">
            <div className="pb-3 border-b border-[#DED4C7]">
              <h2 className="font-editorial text-2xl text-[#242321]">
                Storefront Promo Spotlight
              </h2>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label htmlFor="featured-coupon" className="block font-medium text-[#242321]/75 mb-1.5">
                  Featured Coupon Code (Hero, Marquee &amp; Cart Banner)
                </label>
                <select
                  id="featured-coupon"
                  value={draft.featuredCouponCode}
                  onChange={e =>
                    setDraft(prev => ({ ...prev, featuredCouponCode: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] font-mono text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                >
                  <option value="">None (Hide storefront promo badge)</option>
                  {activeCoupons.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </option>
                  ))}
                  {draft.featuredCouponCode &&
                    !activeCoupons.some(c => c.code === draft.featuredCouponCode) && (
                      <option value={draft.featuredCouponCode}>
                        {draft.featuredCouponCode} (Not yet created/active)
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label htmlFor="promo-banner-text" className="block font-medium text-[#242321]/75 mb-1.5">
                  Promotional Subtitle
                </label>
                <input
                  id="promo-banner-text"
                  type="text"
                  maxLength={160}
                  value={draft.promoBannerText}
                  onChange={e =>
                    setDraft(prev => ({ ...prev, promoBannerText: e.target.value }))
                  }
                  placeholder="Launch Offer: Instant savings at checkout"
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DED4C7] text-xs text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
