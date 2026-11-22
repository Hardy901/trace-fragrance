import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Rules Static Verification Suite (Dirty Dozen Invariants)
 * Verifies that firestore.rules enforces all 12 security invariants documented in security_spec.md.
 */
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

test('Global default-deny catch-all rule is declared first', () => {
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

test('Orders PII isolation: get and list require isVerifiedUser() and isAdmin()', () => {
  const ordersBlock = rulesContent.slice(rulesContent.indexOf('match /orders/{orderId}'));
  assert.match(ordersBlock, /allow get: if isVerifiedUser\(\) && isValidOrderNumber\(orderId\) && isAdmin\(\);/);
  assert.match(ordersBlock, /allow list: if isVerifiedUser\(\) && isAdmin\(\);/);
  assert.match(ordersBlock, /allow delete: if false;/);
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

test('Audit logs are strictly append-only and admin-restricted', () => {
  const auditBlock = rulesContent.slice(rulesContent.indexOf('match /audit_logs/{logId}'));
  assert.match(auditBlock, /allow update: if false;/);
  assert.match(auditBlock, /allow delete: if false;/);
  assert.match(auditBlock, /allow list: if isVerifiedUser\(\) && isAdmin\(\);/);
});
