import crypto from 'node:crypto';

export interface VaultStatusResponse {
  configured: boolean;
  source: 'env' | 'runtime' | 'unconfigured';
  authenticated: boolean;
  expiresAt: number | null;
}

export interface VaultActionResult {
  status: number;
  body: Record<string, unknown>;
}

interface RateLimitEntry {
  attempts: number[];
  blockedUntil: number;
}

interface AdminVaultOptions {
  envPasscode?: string;
  sessionSecret?: string;
  ttlMs?: number;
  maxAttempts?: number;
  windowMs?: number;
  now?: () => number;
}

const DEFAULT_TTL_MS = 20 * 60 * 1000; // 20 minutes
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SCRYPT_KEYLEN = 64;

function hashPasscode(passcode: string, saltHex: string): Buffer {
  return crypto.scryptSync(passcode, saltHex, SCRYPT_KEYLEN);
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

export function extractBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const trimmed = authHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function createAdminVaultEngine(options: AdminVaultOptions = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const nowFn = options.now ?? (() => Date.now());

  const signingSecret =
    (options.sessionSecret && options.sessionSecret.trim().length >= 16
      ? options.sessionSecret.trim()
      : process.env.ADMIN_SESSION_SECRET?.trim()) ||
    crypto.randomBytes(32).toString('hex');

  // If ADMIN_PASSCODE is provided via environment variable (Vercel / Cloud Secrets),
  // derive its salted scrypt hash at initialization time so plaintext is never compared directly.
  const rawEnvPasscode =
    options.envPasscode !== undefined ? options.envPasscode : process.env.ADMIN_PASSCODE || '';
  const envPasscodeTrimmed = rawEnvPasscode.trim();
  const envSalt = envPasscodeTrimmed ? crypto.randomBytes(16).toString('hex') : '';
  const envHash = envPasscodeTrimmed ? hashPasscode(envPasscodeTrimmed, envSalt) : null;

  // One-time runtime setup fallback when ADMIN_PASSCODE env var is not yet set.
  let runtimeSalt = '';
  let runtimeHash: Buffer | null = null;

  const rateLimits = new Map<string, RateLimitEntry>();
  const revokedJtis = new Set<string>();

  function getActiveCredential(): {
    source: 'env' | 'runtime' | 'unconfigured';
    salt: string;
    hash: Buffer | null;
  } {
    if (envHash) {
      return { source: 'env', salt: envSalt, hash: envHash };
    }
    if (runtimeHash) {
      return { source: 'runtime', salt: runtimeSalt, hash: runtimeHash };
    }
    return { source: 'unconfigured', salt: '', hash: null };
  }

  function signSessionToken(): { token: string; expiresAt: number } {
    const iat = nowFn();
    const exp = iat + ttlMs;
    const jti = crypto.randomBytes(16).toString('hex');
    const payload = base64UrlEncode(JSON.stringify({ sub: 'trace_admin_vault', iat, exp, jti }));
    const sig = base64UrlEncode(
      crypto.createHmac('sha256', signingSecret).update(payload).digest()
    );
    return { token: `${payload}.${sig}`, expiresAt: exp };
  }

  function verifySessionToken(token: string | null): { valid: boolean; expiresAt: number | null; jti?: string } {
    if (!token) return { valid: false, expiresAt: null };
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, expiresAt: null };
    const [payloadPart, sigPart] = parts;
    if (!payloadPart || !sigPart) return { valid: false, expiresAt: null };

    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', signingSecret).update(payloadPart).digest()
    );
    const actualBuf = Buffer.from(sigPart);
    const expectedBuf = Buffer.from(expectedSig);
    if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
      return { valid: false, expiresAt: null };
    }

    try {
      const parsed = JSON.parse(base64UrlDecode(payloadPart)) as {
        sub?: string;
        exp?: number;
        jti?: string;
      };
      if (
        parsed.sub !== 'trace_admin_vault' ||
        typeof parsed.exp !== 'number' ||
        typeof parsed.jti !== 'string'
      ) {
        return { valid: false, expiresAt: null };
      }
      if (revokedJtis.has(parsed.jti)) {
        return { valid: false, expiresAt: null };
      }
      if (nowFn() >= parsed.exp) {
        return { valid: false, expiresAt: null };
      }
      return { valid: true, expiresAt: parsed.exp, jti: parsed.jti };
    } catch {
      return { valid: false, expiresAt: null };
    }
  }

  function checkRateLimit(clientIp: string): { allowed: boolean; retryAfterSec: number } {
    const ip = clientIp || 'unknown';
    const current = nowFn();
    const entry = rateLimits.get(ip);
    if (!entry) return { allowed: true, retryAfterSec: 0 };

    if (entry.blockedUntil > current) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.blockedUntil - current) / 1000)),
      };
    }

    entry.attempts = entry.attempts.filter(ts => current - ts < windowMs);
    if (entry.attempts.length === 0) {
      rateLimits.delete(ip);
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  function recordFailedAttempt(clientIp: string): { locked: boolean; retryAfterSec: number; remaining: number } {
    const ip = clientIp || 'unknown';
    const current = nowFn();
    const existing = rateLimits.get(ip) ?? { attempts: [], blockedUntil: 0 };
    existing.attempts = existing.attempts.filter(ts => current - ts < windowMs);
    existing.attempts.push(current);

    if (existing.attempts.length >= maxAttempts) {
      existing.blockedUntil = current + windowMs;
      rateLimits.set(ip, existing);
      return {
        locked: true,
        retryAfterSec: Math.ceil(windowMs / 1000),
        remaining: 0,
      };
    }

    rateLimits.set(ip, existing);
    return {
      locked: false,
      retryAfterSec: 0,
      remaining: Math.max(0, maxAttempts - existing.attempts.length),
    };
  }

  function clearAttempts(clientIp: string): void {
    rateLimits.delete(clientIp || 'unknown');
  }

  function getStatus(authHeader?: string | null): VaultActionResult {
    const cred = getActiveCredential();
    const token = extractBearerToken(authHeader);
    const verified = verifySessionToken(token);
    const body: VaultStatusResponse = {
      configured: cred.source !== 'unconfigured',
      source: cred.source,
      authenticated: cred.source !== 'unconfigured' && verified.valid,
      expiresAt: verified.valid ? verified.expiresAt : null,
    };
    return { status: 200, body: body as unknown as Record<string, unknown> };
  }

  function setupPasscode(passcode: unknown, clientIp: string): VaultActionResult {
    const cred = getActiveCredential();
    if (cred.source !== 'unconfigured') {
      return {
        status: 409,
        body: {
          error:
            cred.source === 'env'
              ? 'Admin passcode is managed by server environment configuration and cannot be overwritten.'
              : 'Admin passcode vault has already been initialized.',
        },
      };
    }

    const limit = checkRateLimit(clientIp);
    if (!limit.allowed) {
      return {
        status: 429,
        body: {
          error: `Too many requests. Retry in ${limit.retryAfterSec} seconds.`,
          retryAfterSec: limit.retryAfterSec,
        },
      };
    }

    if (typeof passcode !== 'string') {
      return { status: 400, body: { error: 'Passcode must be a non-empty string.' } };
    }
    const trimmed = passcode.trim();
    if (trimmed.length < 8 || trimmed.length > 128) {
      return {
        status: 400,
        body: { error: 'Passcode must be between 8 and 128 characters.' },
      };
    }

    runtimeSalt = crypto.randomBytes(16).toString('hex');
    runtimeHash = hashPasscode(trimmed, runtimeSalt);
    clearAttempts(clientIp);

    const session = signSessionToken();
    return {
      status: 201,
      body: {
        authenticated: true,
        source: 'runtime',
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  }

  function verifyPasscode(passcode: unknown, clientIp: string): VaultActionResult {
    const cred = getActiveCredential();
    if (cred.source === 'unconfigured' || !cred.hash) {
      return {
        status: 503,
        body: {
          error: 'Admin passcode vault is not configured yet.',
          needsSetup: true,
        },
      };
    }

    const limit = checkRateLimit(clientIp);
    if (!limit.allowed) {
      return {
        status: 429,
        body: {
          error: `Too many failed passcode attempts. Try again in ${limit.retryAfterSec} seconds.`,
          retryAfterSec: limit.retryAfterSec,
        },
      };
    }

    if (typeof passcode !== 'string' || passcode.length === 0 || passcode.length > 128) {
      const fail = recordFailedAttempt(clientIp);
      return {
        status: fail.locked ? 429 : 401,
        body: {
          error: fail.locked
            ? `Too many failed passcode attempts. Try again in ${fail.retryAfterSec} seconds.`
            : 'Invalid admin passcode.',
          remainingAttempts: fail.remaining,
          retryAfterSec: fail.retryAfterSec,
        },
      };
    }

    const candidateHash = hashPasscode(passcode.trim(), cred.salt);
    const matched =
      candidateHash.length === cred.hash.length &&
      crypto.timingSafeEqual(candidateHash, cred.hash);

    if (!matched) {
      const fail = recordFailedAttempt(clientIp);
      return {
        status: fail.locked ? 429 : 401,
        body: {
          error: fail.locked
            ? `Too many failed passcode attempts. Try again in ${fail.retryAfterSec} seconds.`
            : 'Invalid admin passcode.',
          remainingAttempts: fail.remaining,
          retryAfterSec: fail.retryAfterSec,
        },
      };
    }

    clearAttempts(clientIp);
    const session = signSessionToken();
    return {
      status: 200,
      body: {
        authenticated: true,
        source: cred.source,
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  }

  function logout(authHeader?: string | null): VaultActionResult {
    const token = extractBearerToken(authHeader);
    const verified = verifySessionToken(token);
    if (verified.valid && verified.jti) {
      revokedJtis.add(verified.jti);
    }
    return { status: 200, body: { authenticated: false } };
  }

  return {
    getStatus,
    setupPasscode,
    verifyPasscode,
    logout,
  };
}

let singletonEngine: ReturnType<typeof createAdminVaultEngine> | null = null;

export function getAdminVaultEngine() {
  if (!singletonEngine) {
    singletonEngine = createAdminVaultEngine();
  }
  return singletonEngine;
}

export function extractClientIp(headers: Record<string, string | string[] | undefined>, fallbackIp?: string): string {
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return fallbackIp || 'unknown';
}
