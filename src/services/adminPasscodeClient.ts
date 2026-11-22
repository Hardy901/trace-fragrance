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

async function parseJsonSafe<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
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
  if (!response.ok) {
    throw new Error('Unable to reach the admin security vault API.');
  }
  return parseJsonSafe<AdminVaultStatus>(response);
}

export async function setupAdminVaultPasscode(passcode: string): Promise<AdminVaultUnlockResult> {
  const response = await fetch('/api/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
    cache: 'no-store',
  });
  const data = await parseJsonSafe<AdminVaultUnlockResult>(response);
  if (!response.ok) {
    return {
      authenticated: false,
      error: data.error || 'Unable to initialize admin passcode vault.',
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
  const data = await parseJsonSafe<AdminVaultUnlockResult>(response);
  if (!response.ok) {
    return {
      authenticated: false,
      error: data.error || 'Invalid admin passcode.',
      remainingAttempts: data.remainingAttempts,
      retryAfterSec: data.retryAfterSec,
      needsSetup: data.needsSetup,
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
