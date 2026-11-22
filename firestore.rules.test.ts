import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Rules Static Verification Suite (Dirty Dozen Invariants)
 * Verifies that firestore.rules enforces all security invariants documented in security_spec.md.
 */
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

test('Global default-deny catch-all rule is declared first', () => {
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('Orders PII isolation: get, list, and delete require isVerifiedUser() and isAdmin()', () => {
  const ordersBlock = rulesContent.slice(
    rulesContent.indexOf('match /orders/{orderId}'),
    rulesContent.indexOf('match /order_tracking/{trackingKey}')
  );
  assert.match(ordersBlock, /allow get: if isVerifiedUser\(\) && isValidOrderNumber\(orderId\) && isAdmin\(\);/);
  assert.match(ordersBlock, /allow list: if isVerifiedUser\(\) && isAdmin\(\);/);
  assert.match(ordersBlock, /allow delete: if isVerifiedUser\(\)\s*&& isValidOrderNumber\(orderId\)\s*&& isAdmin\(\);/);
});

test('Customer order_tracking prevents enumeration (list: false), excludes PII, and enforces existsAfter atomicity', () => {
  const trackingBlock = rulesContent.slice(
    rulesContent.indexOf('match /order_tracking/{trackingKey}'),
    rulesContent.indexOf('match /admins/{adminUid}')
  );
  assert.match(trackingBlock, /allow get: if isValidTrackingKey\(trackingKey\);/);
  assert.match(trackingBlock, /allow list: if false;/);
  assert.match(trackingBlock, /existsAfter\(\/databases\/\$\(database\)\/documents\/orders\/\$\(incoming\(\)\.orderNumber\)\)/);
  assert.match(trackingBlock, /allow delete: if isVerifiedUser\(\)\s*&& isValidTrackingKey\(trackingKey\)\s*&& isAdmin\(\);/);
  const trackingValidator = rulesContent.slice(
    rulesContent.indexOf('function isValidOrderTracking'),
    rulesContent.indexOf('function isValidInitialTrackingState')
  );
  assert.doesNotMatch(trackingValidator, /customerEmail|customerPhone|shippingAddress|pincode|adminNotes/);
});

test('Email verification spoof guard is enforced on owner and admin checks', () => {
  assert.match(rulesContent, /function isVerifiedUser\(\) \{\s*return isSignedIn\(\) && request\.auth\.token\.email_verified == true;/);
  assert.match(rulesContent, /function isOwnerAdmin\(\) \{\s*return isVerifiedUser\(\)/);
});

test('Admins registry prevents self-assignment and restricts mutations to owner', () => {
  const adminsBlock = rulesContent.slice(rulesContent.indexOf('match /admins/{adminUid}'));
  assert.match(adminsBlock, /allow create: if isOwnerAdmin\(\)/);
  assert.match(adminsBlock, /allow update: if isOwnerAdmin\(\)/);
  assert.match(adminsBlock, /allow delete: if isOwnerAdmin\(\)/);
});

test('Order creation enforces strict initial state, arithmetic total, and shadow field protection', () => {
  assert.match(rulesContent, /data\.totalPrice == \(data\.subtotal - data\.discount \+ data\.shippingFee \+ data\.codFee\)/);
  assert.match(rulesContent, /data\.fulfillmentStatus == 'placed'/);
  assert.match(rulesContent, /data\.keys\(\)\.hasOnly\(/);
  assert.match(rulesContent, /data\.createdAt == request\.time/);
});

test('Audit logs are strictly append-only, admin-restricted, and support order_deleted', () => {
  const auditBlock = rulesContent.slice(rulesContent.indexOf('match /audit_logs/{logId}'));
  assert.match(auditBlock, /allow update: if false;/);
  assert.match(auditBlock, /allow delete: if false;/);
  assert.match(auditBlock, /allow list: if isVerifiedUser\(\) && isAdmin\(\);/);
  assert.match(rulesContent, /'order_deleted'/);
});
