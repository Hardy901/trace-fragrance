import {
  createAdminVaultEngine as createEngine,
  extractBearerToken as extractToken,
  extractClientIp as extractIp,
  getAdminVaultEngine as getEngine,
} from './adminPasscodeEngine.mjs';

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

export interface AdminVaultOptions {
  envPasscode?: string;
  sessionSecret?: string;
  ttlMs?: number;
  maxAttempts?: number;
  windowMs?: number;
  now?: () => number;
}

export interface AdminVaultEngine {
  getStatus: (authHeader?: string | null) => VaultActionResult;
  setupPasscode: (passcode: unknown, clientIp: string) => VaultActionResult;
  verifyPasscode: (passcode: unknown, clientIp: string) => VaultActionResult;
  logout: (authHeader?: string | null) => VaultActionResult;
}

export const extractBearerToken: (authHeader: string | undefined | null) => string | null =
  extractToken;

export const createAdminVaultEngine: (options?: AdminVaultOptions) => AdminVaultEngine =
  createEngine;

export const getAdminVaultEngine: () => AdminVaultEngine = getEngine;

export const extractClientIp: (
  headers: Record<string, string | string[] | undefined>,
  fallbackIp?: string
) => string = extractIp;
