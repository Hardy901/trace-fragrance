# TRACE Firestore Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Every document path not explicitly matched is denied (`allow read, write: if false;`).
2. **Verified Admin Identity**: Administrative privileges are granted strictly to the bootstrapped owner (`opplayer20100@gmail.com` with `email_verified == true`) or verified users whose exact `request.auth.uid` exists in `/admins/{uid}`. Client-supplied tokens/claims are never trusted.
3. **Strict PII Isolation on `/orders`**: Customer orders contain PII (`customerName`, `customerEmail`, `customerPhone`, `shippingAddress`, `city`, `pincode`). Only verified admins may `get` or `list` orders. Unauthenticated users and non-admin authenticated users receive `PERMISSION_DENIED` on any read/list/update/delete.
4. **Validated Guest Checkout Creation**: Shoppers placing an order on `/orders/{orderId}` can ONLY create a new order with `fulfillmentStatus == 'placed'`, empty `trackingNumber`, empty `adminNotes`, empty `updatedBy`, server timestamp `createdAt == request.time && updatedAt == request.time`, bounded `items` array (`1..20`), valid 6-digit `pincode`, and matching `paymentType`/`paymentStatus` (`cod` -> `pending_cod`; `prepaid` -> `paid` or `pending_verification`).
5. **Immutable Financial & Audit Fields**: On `/orders/{orderId}` update, `orderNumber`, `createdAt`, `customerEmail`, `items`, `subtotal`, `discount`, `totalPrice`, and `paymentType` are strictly immutable. On `/audit_logs/{logId}`, `update` and `delete` are permanently forbidden (append-only).
6. **Owner-Only Privilege Governance**: Only the bootstrapped owner (`isOwnerAdmin()`) may create, update, or delete `/admins/{adminUid}` documents. Self-assignment or manager privilege escalation is impossible.
7. **Live Public Catalog, Admin-Only Mutations**: `/store_config/pricing` is publicly readable via `get` (no `list`) so all visitors receive instant live pricing updates. `/coupons/{couponId}` allows public `get` and filtered `list` strictly where `resource.data.active == true`; only admins may read inactive coupons or create/update/delete coupons.
8. **Temporal Integrity & Anti-DoW**: Every string field enforces strict `.size()` caps, every document ID enforces `isValidId()`, and every `createdAt`/`updatedAt` field must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Adversarial Action / Payload | Expected Result |
|---|---------------|-------------|------------------------------|-----------------|
| 1 | **PII Scraping (Unauthenticated List)** | `/orders` | Unauthenticated client calls `list` on `/orders` | `PERMISSION_DENIED` |
| 2 | **PII Leak (Non-Admin Get)** | `/orders/TRC-100001` | Authenticated non-admin (`evil@example.com`) calls `get` | `PERMISSION_DENIED` |
| 3 | **Email Verification Spoof** | `/store_config/pricing` | Auth token with `email: 'opplayer20100@gmail.com'`, `email_verified: false` attempts `update` | `PERMISSION_DENIED` |
| 4 | **Self-Assigned Admin Escalation** | `/admins/attacker_uid` | Signed-in verified non-admin attempts `create` with `{ role: 'owner' }` | `PERMISSION_DENIED` |
| 5 | **Shadow Field Injection** | `/orders/TRC-100002` | Checkout payload includes valid keys + ghost field `isVipApproved: true` | `PERMISSION_DENIED` |
| 6 | **State Shortcutting on Order Create** | `/orders/TRC-100003` | Guest creates COD order with `paymentStatus: 'cod_collected'` or `fulfillmentStatus: 'delivered'` | `PERMISSION_DENIED` |
| 7 | **Price Tampering by Non-Admin** | `/store_config/pricing` | Signed-in verified customer updates `discoverySetPrice: 1` | `PERMISSION_DENIED` |
| 8 | **Unauthorized Coupon Creation** | `/coupons/FREE100` | Signed-in verified customer creates `{ code: 'FREE100', discountType: 'percent', discountValue: 100 }` | `PERMISSION_DENIED` |
| 9 | **Resource / ID Poisoning** | `/orders/bad$id!...150chars` | Order creation with invalid characters or >128 char doc ID or 2MB `shippingAddress` | `PERMISSION_DENIED` |
| 10 | **Value Poisoning on Admin Update** | `/orders/TRC-100001` | Admin updates `fulfillmentStatus` to invalid enum `'shipped_now'` or 5000-char `adminNotes` | `PERMISSION_DENIED` |
| 11 | **Immutable Field Tampering** | `/orders/TRC-100001` | Admin attempts to modify `totalPrice` or `createdAt` on an existing order | `PERMISSION_DENIED` |
| 12 | **Audit Log Destruction / Forgery** | `/audit_logs/log-001` | Admin attempts `delete` on `/audit_logs/log-001` or creates log with forged `actorUid` | `PERMISSION_DENIED` |
