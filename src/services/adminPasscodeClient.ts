export interface AdminVaultStatus {
  configured: boolean;
  source: 'env' | 'runtime' | 'unconfigured';
  authenticated: boolean;
  expiresAt: number | null;
}

export interface AdminVaultUnlockResult {
  authenticated: boolean;
  source?: 'env' | 'runtime';
  token?: string;
  expiresAt?: number;
  error?: string;
  remainingAttempts?: number;
  retryAfterSec?: number;
  needsSetup?: boolean;
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('application/json');
}

async function parseJsonSafe<T>(response: Response): Promise<{ ok: boolean; data: T }> {
  if (!isJsonResponse(response)) {
    return { ok: false, data: {} as T };
  }
  try {
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, data: {} as T };
  }
}

export async function fetchAdminVaultStatus(token: string | null): Promise<AdminVaultStatus> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch('/api/admin/status', {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  const parsed = await parseJsonSafe<AdminVaultStatus>(response);
  if (!response.ok || !parsed.ok || typeof parsed.data.configured !== 'boolean') {
    throw new Error(
      `Admin vault API unavailable (HTTP ${response.status}). Redeploy the latest build and verify /api/admin is active.`
    );
  }
  return parsed.data;
}

export async function setupAdminVaultPasscode(passcode: string): Promise<AdminVaultUnlockResult> {
  const response = await fetch('/api/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
    cache: 'no-store',
  });
  const parsed = await parseJsonSafe<AdminVaultUnlockResult>(response);
  if (!parsed.ok) {
    return {
      authenticated: false,
      error: `Admin vault API returned an unexpected response (HTTP ${response.status}). Redeploy the latest build and try again.`,
    };
  }
  const data = parsed.data;
  if (!response.ok) {
    return {
      authenticated: false,
      error: data.error || `Unable to initialize admin passcode vault (HTTP ${response.status}).`,
      retryAfterSec: data.retryAfterSec,
    };
  }
  return data;
}

export async function verifyAdminVaultPasscode(passcode: string): Promise<AdminVaultUnlockResult> {
  const response = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
    cache: 'no-store',
  });
  const parsed = await parseJsonSafe<AdminVaultUnlockResult>(response);
  if (!parsed.ok) {
    return {
      authenticated: false,
      error: `Admin vault API returned an unexpected response (HTTP ${response.status}). Redeploy the latest build and check Vercel Function logs.`,
    };
  }
  const data = parsed.data;
  if (!response.ok) {
    const fallbackError =
      response.status === 401
        ? 'Invalid admin passcode.'
        : `Admin vault API error (HTTP ${response.status}).`;
    return {
      authenticated: false,
      error: data.error || fallbackError,
      remainingAttempts: data.remainingAttempts,
      retryAfterSec: data.retryAfterSec,
      needsSetup: data.needsSetup,
    };
  }
  if (!data.authenticated || !data.token) {
    return {
      authenticated: false,
      error: data.error || 'Admin vault returned an incomplete session response.',
    };
  }
  return data;
}

export async function logoutAdminVault(token: string | null): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers,
      cache: 'no-store',
    });
  } catch {
    // Best-effort token revocation
  }
}
