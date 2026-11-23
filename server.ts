import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectCallerPublicIp,
  LookupError,
  lookupTarget,
} from './src/server/ipLookupService.ts';
import { lookupUsernameAcrossPlatforms } from './src/server/usernameLookupService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  function getCallerContext(req: express.Request) {
    const rawFwd = req.headers['x-forwarded-for'];
    const forwarded = Array.isArray(rawFwd)
      ? rawFwd.join(',')
      : typeof rawFwd === 'string'
      ? rawFwd
      : undefined;
    return {
      forwarded,
      remoteAddress: req.ip || req.socket.remoteAddress,
    };
  }

  app.get('/api/ip/self', async (req, res) => {
    try {
      const ctx = getCallerContext(req);
      const ip = await detectCallerPublicIp(ctx.forwarded, ctx.remoteAddress);
      const data = await lookupTarget(ip, ctx);
      res.json(data);
    } catch (error) {
      if (error instanceof LookupError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to inspect public IP address.' });
    }
  });

  app.get('/api/ip/lookup', async (req, res) => {
    const target = typeof req.query.target === 'string' ? req.query.target : '';
    try {
      const data = await lookupTarget(target, getCallerContext(req));
      res.json(data);
    } catch (error) {
      if (error instanceof LookupError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Unable to complete IP lookup.' });
    }
  });

  app.post('/api/ip/batch', async (req, res) => {
    const rawTargets = Array.isArray(req.body?.targets) ? req.body.targets : [];
    const targets: string[] = rawTargets
      .filter((item: unknown): item is string => typeof item === 'string')
      .map((item: string) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    if (targets.length === 0) {
      res.status(400).json({ error: 'Provide at least one IP address or domain.' });
      return;
    }

    const ctx = getCallerContext(req);
    const settled = await Promise.allSettled(targets.map((t) => lookupTarget(t, ctx)));
    const results = settled.map((item, idx) => {
      if (item.status === 'fulfilled') {
        return { ok: true as const, target: targets[idx], data: item.value };
      }
      const message =
        item.reason instanceof Error ? item.reason.message : 'Lookup failed';
      return { ok: false as const, target: targets[idx], error: message };
    });

    res.json({ results });
  });

  app.get('/api/username/lookup', async (req, res) => {
    const username = typeof req.query.username === 'string' ? req.query.username : '';
    try {
      const data = await lookupUsernameAcrossPlatforms(username);
      res.json(data);
    } catch (error) {
      if (error instanceof LookupError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Unable to complete username lookup.' });
    }
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`).replace(/\/+$/, '');
    res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`).replace(/\/+$/, '');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`
    );
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NetSIIprobe server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
