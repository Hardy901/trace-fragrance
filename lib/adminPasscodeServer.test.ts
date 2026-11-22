import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminVaultEngine } from './adminPasscodeServer';

test('unconfigured vault initializes once via setupPasscode and blocks overwrite', () => {
  const vault = createAdminVaultEngine({ envPasscode: '' });

  const initial = vault.getStatus();
  assert.equal(initial.status, 200);
  assert.equal(initial.body.configured, false);
  assert.equal(initial.body.source, 'unconfigured');

  const shortFail = vault.setupPasscode('short', '10.0.0.1');
  assert.equal(shortFail.status, 400);

  const setupOk = vault.setupPasscode('customVault#99', '10.0.0.1');
  assert.equal(setupOk.status, 201);
  assert.equal(setupOk.body.authenticated, true);
  assert.equal(typeof setupOk.body.token, 'string');

  // Cannot re-initialize once configured
  const secondSetup = vault.setupPasscode('attackerPass#1', '10.0.0.2');
  assert.equal(secondSetup.status, 409);

  // Token validates via getStatus
  const authedStatus = vault.getStatus(`Bearer ${setupOk.body.token as string}`);
  assert.equal(authedStatus.body.configured, true);
  assert.equal(authedStatus.body.authenticated, true);
});

test('env passcode verifies cleanly, rate-limits brute force, and honors logout revocation & expiry', () => {
  let currentTime = 1_700_000_000_000;
  const vault = createAdminVaultEngine({
    envPasscode: 'server-secret-pass',
    sessionSecret: 'unit-test-hmac-secret-key-2026',
    maxAttempts: 3,
    windowMs: 60_000,
    ttlMs: 30_000,
    now: () => currentTime,
  });

  // Env source blocks runtime setup
  assert.equal(vault.setupPasscode('override123', '1.2.3.4').status, 409);

  // Brute force triggers 429 on 3rd failure for IP 1.2.3.4
  assert.equal(vault.verifyPasscode('wrong1', '1.2.3.4').status, 401);
  assert.equal(vault.verifyPasscode('wrong2', '1.2.3.4').status, 401);
  const locked = vault.verifyPasscode('wrong3', '1.2.3.4');
  assert.equal(locked.status, 429);

  // Even correct passcode is blocked while locked for 1.2.3.4
  assert.equal(vault.verifyPasscode('server-secret-pass', '1.2.3.4').status, 429);

  // Different IP can verify cleanly
  const ok = vault.verifyPasscode('server-secret-pass', '5.6.7.8');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.authenticated, true);
  const token = ok.body.token as string;
  assert.equal(vault.getStatus(`Bearer ${token}`).body.authenticated, true);

  // Tampered token fails
  assert.equal(vault.getStatus(`Bearer ${token}x`).body.authenticated, false);

  // Logout revokes token immediately
  vault.logout(`Bearer ${token}`);
  assert.equal(vault.getStatus(`Bearer ${token}`).body.authenticated, false);

  // Fresh token expires after ttlMs
  const fresh = vault.verifyPasscode('server-secret-pass', '5.6.7.8');
  const freshToken = fresh.body.token as string;
  assert.equal(vault.getStatus(`Bearer ${freshToken}`).body.authenticated, true);
  currentTime += 31_000;
  assert.equal(vault.getStatus(`Bearer ${freshToken}`).body.authenticated, false);
});
