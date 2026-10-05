import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { demoSummary } from '../src/data/demo.js';
import { getProvider, providerDefinitions } from './providers/registry.js';
import { SolarOneDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const root = process.env.SOLARONE_ROOT ?? (isProduction ? path.resolve(__dirname, '../..') : path.resolve(__dirname, '..'));
const port = Number(process.env.PORT ?? 3000);
const app = express();
const httpServer = createHttpServer(app);
const database = new SolarOneDatabase();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const appOrigin = process.env.APP_ORIGIN;
app.use(cors(appOrigin ? { origin: appOrigin, credentials: true } : { origin: false }));
app.use(express.json({ limit: '1mb' }));

const sendDatabaseError = (res: express.Response) => res.status(503).json({ error: 'database_unavailable', message: 'The SolarOne data service is unavailable. No changes were saved.' });
const systemInput = z.object({ name: z.string().trim().min(2).max(160), location: z.string().trim().min(2).max(255), capacityKw: z.number().positive().max(100000), manufacturer: z.string().trim().min(2).max(120), model: z.string().trim().min(2).max(160) });
const customerInput = z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), site: z.string().trim().min(2).max(160) });
const ticketInput = z.object({ title: z.string().trim().min(3).max(160), system: z.string().trim().min(2).max(160), priority: z.enum(['Normal', 'High', 'Critical']), technician: z.string().trim().max(160).default('') });
const settingsInput = z.object({ companyName: z.string().trim().min(2).max(160), supportEmail: z.string().trim().email().max(320), primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), notifications: z.record(z.string(), z.boolean()) });

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'solarone', mode: isProduction ? 'production' : 'development', database: database.isAvailable() ? 'ready' : 'unavailable', timestamp: new Date().toISOString() }));
app.get('/api/dashboard', (_req, res) => res.json({ data: demoSummary, mode: 'demo', message: 'Summary telemetry is demo-only until verified provider readings are ingested.' }));
app.get('/api/systems', async (_req, res) => { try { return res.json({ data: await database.listSystems(), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.get('/api/systems/:id', async (req, res) => { try { const system = (await database.listSystems()).find((item) => item.id === req.params.id); return system ? res.json({ data: system, mode: 'database' }) : res.status(404).json({ error: 'not_found', message: 'System not found' }); } catch { return sendDatabaseError(res); } });
app.post('/api/systems', async (req, res) => { const parsed = systemInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() }); try { return res.status(201).json({ data: await database.createSystem(parsed.data), mode: 'database', message: 'System saved as pending provider connection. No live readings are claimed.' }); } catch { return sendDatabaseError(res); } });
app.post('/api/systems/:id/sync', (_req, res) => res.status(409).json({ error: 'provider_not_connected', message: 'Sync requires a verified provider connection.' }));
app.get('/api/alerts', async (_req, res) => { try { return res.json({ data: await database.listAlerts(), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.post('/api/alerts/acknowledge-all', async (_req, res) => { try { return res.json({ data: { acknowledged: await database.acknowledgeAllAlerts() }, mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.get('/api/integrations', (_req, res) => res.json({ data: providerDefinitions.map(({ provider: _provider, ...definition }) => definition) }));
app.post('/api/integrations/:provider/connect', (req, res) => { const provider = getProvider(req.params.provider); if (!provider) return res.status(404).json({ error: 'not_found', message: 'Unknown provider' }); return res.status(409).json({ error: 'credentials_required', message: `${provider.displayName} is not connected. Configure and verify official API credentials before syncing data.` }); });
app.get('/api/customers', async (_req, res) => { try { return res.json({ data: await database.listCustomers(), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.post('/api/customers', async (req, res) => { const parsed = customerInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() }); try { return res.status(201).json({ data: await database.createCustomer(parsed.data), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.get('/api/service-tickets', async (_req, res) => { try { return res.json({ data: await database.listTickets(), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.post('/api/service-tickets', async (req, res) => { const parsed = ticketInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() }); try { return res.status(201).json({ data: await database.createTicket(parsed.data), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.patch('/api/service-tickets/:id', async (req, res) => { const status = z.enum(['Open', 'Assigned', 'In Progress', 'Waiting', 'Resolved', 'Closed']).safeParse(req.body?.status); if (!status.success) return res.status(400).json({ error: 'validation_error', message: 'Invalid ticket status' }); try { return res.json({ data: await database.updateTicket(req.params.id, status.data), mode: 'database' }); } catch (error) { return error instanceof Error && error.message === 'ticket_not_found' ? res.status(404).json({ error: 'not_found', message: 'Ticket not found' }) : sendDatabaseError(res); } });
app.get('/api/settings', async (_req, res) => { try { return res.json({ data: await database.getSettings(), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.put('/api/settings', async (req, res) => { const parsed = settingsInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() }); try { return res.json({ data: await database.saveSettings(parsed.data), mode: 'database' }); } catch { return sendDatabaseError(res); } });
app.get('/api/reports', (_req, res) => res.status(501).json({ error: 'not_implemented', message: 'Report generation requires the provider readings pipeline and storage configuration.' }));

app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found', message: 'SolarOne API route not found' }));

if (isProduction) {
  app.use(express.static(path.join(root, 'dist')));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({ root, server: { middlewareMode: true, hmr: { server: httpServer } }, appType: 'spa' });
  app.use(vite.middlewares);
}

await database.initialize().catch((error) => console.error('SolarOne database initialization failed:', error instanceof Error ? error.message : error));
httpServer.listen(port, '0.0.0.0', () => console.log(`SolarOne server listening on 0.0.0.0:${port}`));
