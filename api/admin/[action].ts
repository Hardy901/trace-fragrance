import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractClientIp, getAdminVaultEngine } from '../../lib/adminPasscodeServer';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const rawAction = req.query.action;
  const action = Array.isArray(rawAction) ? rawAction[0] : rawAction;
  const engine = getAdminVaultEngine();
  const authHeader =
    typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
  const clientIp = extractClientIp(req.headers, req.socket?.remoteAddress);

  if (action === 'status') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const result = engine.getStatus(authHeader);
    return res.status(result.status).json(result.body);
  }

  if (action === 'setup') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    const result = engine.setupPasscode((body as { passcode?: unknown }).passcode, clientIp);
    return res.status(result.status).json(result.body);
  }

  if (action === 'verify') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    const result = engine.verifyPasscode((body as { passcode?: unknown }).passcode, clientIp);
    return res.status(result.status).json(result.body);
  }

  if (action === 'logout') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const result = engine.logout(authHeader);
    return res.status(result.status).json(result.body);
  }

  return res.status(404).json({ error: 'Unknown admin vault endpoint.' });
}
