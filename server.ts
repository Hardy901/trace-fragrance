import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { extractClientIp, getAdminVaultEngine } from './lib/adminPasscodeServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  const vault = getAdminVaultEngine();

  app.use('/api/admin', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.get('/api/admin/status', (req, res) => {
    const result = vault.getStatus(req.headers.authorization);
    res.status(result.status).json(result.body);
  });

  app.post('/api/admin/setup', (req, res) => {
    const clientIp = extractClientIp(req.headers, req.socket.remoteAddress);
    const result = vault.setupPasscode(req.body?.passcode, clientIp);
    res.status(result.status).json(result.body);
  });

  app.post('/api/admin/verify', (req, res) => {
    const clientIp = extractClientIp(req.headers, req.socket.remoteAddress);
    const result = vault.verifyPasscode(req.body?.passcode, clientIp);
    res.status(result.status).json(result.body);
  });

  app.post('/api/admin/logout', (req, res) => {
    const result = vault.logout(req.headers.authorization);
    res.status(result.status).json(result.body);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRACE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start TRACE server:', err);
  process.exit(1);
});
