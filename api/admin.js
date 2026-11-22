import { extractClientIp, getAdminVaultEngine } from '../lib/adminPasscodeEngine.mjs';

const MAX_BODY_BYTES = 16 * 1024;

function sendJson(res, statusCode, payload) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function resolveAction(req) {
  const queryAction = req.query?.action;
  if (typeof queryAction === 'string' && queryAction.trim()) {
    return queryAction.trim().toLowerCase();
  }
  if (Array.isArray(queryAction) && typeof queryAction[0] === 'string' && queryAction[0].trim()) {
    return queryAction[0].trim().toLowerCase();
  }

  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const paramAction = parsedUrl.searchParams.get('action');
    if (paramAction && paramAction.trim()) {
      return paramAction.trim().toLowerCase();
    }
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last !== 'admin') {
      return last.trim().toLowerCase();
    }
  } catch {
    // Fall through to null
  }
  return null;
}

async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (typeof req.body === 'string') {
      if (!req.body.trim()) return {};
      try {
        const parsed = JSON.parse(req.body);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        const parsed = JSON.parse(req.body.toString('utf8'));
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
  }

  if (typeof req.on !== 'function' || req.readableEnded) {
    return {};
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    req.on('data', chunk => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (!raw) {
          resolve({});
          return;
        }
        const parsed = JSON.parse(raw);
        resolve(typeof parsed === 'object' && parsed !== null ? parsed : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  const action = resolveAction(req);
  const engine = getAdminVaultEngine();
  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;
  const clientIp = extractClientIp(req.headers, req.socket?.remoteAddress);

  if (action === 'status') {
    if (req.method !== 'GET') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    const result = engine.getStatus(authHeader);
    return sendJson(res, result.status, result.body);
  }

  if (action === 'setup' || action === 'verify') {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
        return sendJson(res, 413, { error: 'Request payload too large.' });
      }
      return sendJson(res, 400, { error: 'Invalid request payload.' });
    }

    const result =
      action === 'setup'
        ? engine.setupPasscode(body.passcode, clientIp)
        : engine.verifyPasscode(body.passcode, clientIp);
    return sendJson(res, result.status, result.body);
  }

  if (action === 'logout') {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    const result = engine.logout(authHeader);
    return sendJson(res, result.status, result.body);
  }

  return sendJson(res, 404, { error: 'Unknown admin vault endpoint.' });
}
