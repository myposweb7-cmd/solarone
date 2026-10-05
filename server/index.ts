import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { demoAlerts, demoSummary, demoSystems } from '../src/data/demo.js';
import { getProvider, providerDefinitions } from './providers/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const root = process.env.SOLARONE_ROOT ?? (isProduction ? path.resolve(__dirname, '../..') : path.resolve(__dirname, '..'));
const port = Number(process.env.PORT ?? 3000);

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const appOrigin = process.env.APP_ORIGIN;
app.use(cors(appOrigin ? { origin: appOrigin, credentials: true } : { origin: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'solarone', mode: isProduction ? 'production' : 'development', timestamp: new Date().toISOString() }));
app.get('/api/dashboard', (_req, res) => res.json({ data: demoSummary, mode: 'demo', message: 'Demo fixture data is isolated. Connect a provider to replace it with real API telemetry.' }));
app.get('/api/systems', (_req, res) => res.json({ data: demoSystems, mode: 'demo' }));
app.get('/api/systems/:id', (req, res) => {
  const system = demoSystems.find((item) => item.id === req.params.id);
  if (!system) return res.status(404).json({ error: 'System not found' });
  return res.json({ data: system, mode: 'demo' });
});
app.get('/api/alerts', (_req, res) => res.json({ data: demoAlerts, mode: 'demo' }));
app.get('/api/integrations', (_req, res) => res.json({ data: providerDefinitions.map(({ provider: _provider, ...definition }) => definition) }));
app.post('/api/integrations/:provider/connect', (req, res) => {
  const provider = getProvider(req.params.provider);
  if (!provider) return res.status(404).json({ error: 'Unknown provider' });
  return res.status(409).json({ error: 'credentials_required', message: `${provider.displayName} is not connected. Configure and verify official API credentials before syncing data.` });
});

const systemInput = z.object({ name: z.string().min(2), location: z.string().min(2), capacityKw: z.number().positive(), manufacturer: z.string().min(2), model: z.string().min(2) });
app.post('/api/systems', (req, res) => {
  const parsed = systemInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() });
  return res.status(201).json({ data: { id: `pending-${Date.now()}`, ...parsed.data, status: 'unknown', providerStatus: 'credentials_required', todayKwh: null, lastSyncAt: null, telemetry: null }, message: 'System saved as pending provider connection. No live readings are claimed.' });
});
app.post('/api/systems/:id/sync', (_req, res) => res.status(409).json({ error: 'provider_not_connected', message: 'Sync requires a verified provider connection.' }));
app.get('/api/customers', (_req, res) => res.json({ data: [], mode: 'empty_state', message: 'Customer records will appear here once connected to the database.' }));
app.get('/api/service-tickets', (_req, res) => res.json({ data: [], mode: 'empty_state' }));

if (isProduction) {
  app.use(express.static(path.join(root, 'dist')));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({ root, server: { middlewareMode: true, hmr: { port: 24679 } }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => console.log(`SolarOne server listening on 0.0.0.0:${port}`));
