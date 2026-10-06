import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { demoAlerts, demoSystems } from '../src/data/demo.js';
import type { Alert, SolarSystem } from '../src/domain/types.js';

const DEMO_COMPANY_ID = 'demo-company';

type Row = RowDataPacket & Record<string, unknown>;

export class SolarOneDatabase {
  private pool: Pool | null = null;
  private available = false;
  readonly companyId = DEMO_COMPANY_ID;

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) return;
    const url = new URL(connectionString);
    this.pool = mysql.createPool({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: { rejectUnauthorized: false },
      connectionLimit: 5,
      waitForConnections: true,
      connectTimeout: 8000,
      charset: 'utf8mb4',
    });
  }

  async initialize() {
    if (!this.pool) return;
    const statements = [
      `CREATE TABLE IF NOT EXISTS companies (id VARCHAR(64) PRIMARY KEY, name VARCHAR(160) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS solar_systems (id VARCHAR(64) PRIMARY KEY, company_id VARCHAR(64) NOT NULL, name VARCHAR(160) NOT NULL, location VARCHAR(255) NOT NULL, capacity_kw DECIMAL(12,3) NOT NULL, manufacturer VARCHAR(120) NOT NULL, model VARCHAR(160) NOT NULL, status VARCHAR(32) NOT NULL, provider_status VARCHAR(32) NOT NULL, today_kwh DECIMAL(14,3) NULL, last_sync_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX systems_company_idx(company_id, created_at))`,
      `CREATE TABLE IF NOT EXISTS alerts (id VARCHAR(64) PRIMARY KEY, company_id VARCHAR(64) NOT NULL, title VARCHAR(160) NOT NULL, message TEXT NOT NULL, severity VARCHAR(32) NOT NULL, system_name VARCHAR(160) NOT NULL, occurred_at TIMESTAMP NOT NULL, acknowledged_at TIMESTAMP NULL, resolved_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX alerts_company_idx(company_id, occurred_at))`,
      `CREATE TABLE IF NOT EXISTS customers (id VARCHAR(64) PRIMARY KEY, company_id VARCHAR(64) NOT NULL, name VARCHAR(160) NOT NULL, email VARCHAR(320) NOT NULL, site VARCHAR(160) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX customers_company_idx(company_id, created_at))`,
      `CREATE TABLE IF NOT EXISTS service_tickets (id VARCHAR(64) PRIMARY KEY, company_id VARCHAR(64) NOT NULL, title VARCHAR(160) NOT NULL, system_name VARCHAR(160) NOT NULL, priority VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL, technician VARCHAR(160) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX tickets_company_idx(company_id, created_at))`,
      `CREATE TABLE IF NOT EXISTS company_settings (company_id VARCHAR(64) PRIMARY KEY, company_name VARCHAR(160) NOT NULL, support_email VARCHAR(320) NOT NULL, primary_color VARCHAR(16) NOT NULL, secondary_color VARCHAR(16) NOT NULL, notification_settings_json TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    ];
    for (const statement of statements) await this.pool.query(statement);
    await this.pool.query(`INSERT IGNORE INTO companies (id, name) VALUES (?, ?)`, [this.companyId, 'ABC Solar']);
    const [systemCount] = await this.pool.query<Row[]>(`SELECT id FROM solar_systems WHERE company_id = ? LIMIT 1`, [this.companyId]);
    if (!systemCount.length) {
      for (const system of demoSystems) await this.pool.query(`INSERT IGNORE INTO solar_systems (id, company_id, name, location, capacity_kw, manufacturer, model, status, provider_status, today_kwh, last_sync_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [system.id, this.companyId, system.name, system.location, system.capacityKw, system.manufacturer, system.model, system.status, system.providerStatus, system.todayKwh, system.lastSyncAt ? new Date(system.lastSyncAt) : null]);
    }
    const [alertCount] = await this.pool.query<Row[]>(`SELECT id FROM alerts WHERE company_id = ? LIMIT 1`, [this.companyId]);
    if (!alertCount.length) for (const alert of demoAlerts) await this.pool.query(`INSERT IGNORE INTO alerts (id, company_id, title, message, severity, system_name, occurred_at, acknowledged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [alert.id, this.companyId, alert.title, alert.message, alert.severity, alert.systemName, new Date(), alert.acknowledged ? new Date() : null]);
    await this.pool.query(`INSERT IGNORE INTO company_settings (company_id, company_name, support_email, primary_color, secondary_color, notification_settings_json) VALUES (?, ?, ?, ?, ?, ?)`, [this.companyId, 'ABC Solar', 'support@abcsolar.example', '#F4B740', '#0B1324', JSON.stringify({ inApp: true, email: true, whatsapp: false, sms: false })]);
    this.available = true;
  }

  isAvailable() { return this.available; }
  private requirePool() { if (!this.pool || !this.available) throw new Error('database_unavailable'); return this.pool; }

  async listSystems(): Promise<SolarSystem[]> {
    const pool = this.requirePool(); const [rows] = await pool.query<Row[]>(`SELECT * FROM solar_systems WHERE company_id = ? ORDER BY created_at ASC`, [this.companyId]);
    return rows.map((row) => ({ id: String(row.id), name: String(row.name), location: String(row.location), capacityKw: Number(row.capacity_kw), manufacturer: String(row.manufacturer), model: String(row.model), status: row.provider_status === 'connected' ? row.status as SolarSystem['status'] : 'unknown', todayKwh: row.today_kwh == null ? null : Number(row.today_kwh), lastSyncAt: row.provider_status === 'connected' && row.last_sync_at ? new Date(String(row.last_sync_at)).toISOString() : null, telemetry: null, providerStatus: row.provider_status as SolarSystem['providerStatus'] }));
  }

  async createSystem(input: { name: string; location: string; capacityKw: number; manufacturer: string; model: string }) {
    const pool = this.requirePool(); const id = randomUUID();
    await pool.query(`INSERT INTO solar_systems (id, company_id, name, location, capacity_kw, manufacturer, model, status, provider_status, today_kwh) VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', 'credentials_required', NULL)`, [id, this.companyId, input.name, input.location, input.capacityKw, input.manufacturer, input.model]);
    const systems = await this.listSystems(); return systems.find((system) => system.id === id)!;
  }

  async listAlerts(): Promise<Alert[]> {
    const pool = this.requirePool(); const [rows] = await pool.query<Row[]>(`SELECT * FROM alerts WHERE company_id = ? AND resolved_at IS NULL ORDER BY occurred_at DESC`, [this.companyId]);
    return rows.map((row) => ({ id: String(row.id), title: String(row.title), message: String(row.message), severity: row.severity as Alert['severity'], systemName: String(row.system_name), occurredAt: new Date(String(row.occurred_at)).toLocaleString(), acknowledged: Boolean(row.acknowledged_at) }));
  }

  async acknowledgeAllAlerts() { const pool = this.requirePool(); const [result] = await pool.query<ResultSetHeader>(`UPDATE alerts SET acknowledged_at = CURRENT_TIMESTAMP WHERE company_id = ? AND acknowledged_at IS NULL AND resolved_at IS NULL`, [this.companyId]); return result.affectedRows; }

  async listCustomers() { const pool = this.requirePool(); const [rows] = await pool.query<Row[]>(`SELECT id, name, email, site FROM customers WHERE company_id = ? ORDER BY created_at DESC`, [this.companyId]); return rows.map((row) => ({ id: String(row.id), name: String(row.name), email: String(row.email), site: String(row.site) })); }
  async createCustomer(input: { name: string; email: string; site: string }) { const pool = this.requirePool(); const id = randomUUID(); await pool.query(`INSERT INTO customers (id, company_id, name, email, site) VALUES (?, ?, ?, ?, ?)`, [id, this.companyId, input.name, input.email, input.site]); return { id, ...input }; }
  async listTickets() { const pool = this.requirePool(); const [rows] = await pool.query<Row[]>(`SELECT id, title, system_name AS system, priority, status, technician FROM service_tickets WHERE company_id = ? ORDER BY created_at DESC`, [this.companyId]); return rows.map((row) => ({ id: String(row.id), title: String(row.title), system: String(row.system), priority: String(row.priority), status: String(row.status), technician: row.technician ? String(row.technician) : '' })); }
  async createTicket(input: { title: string; system: string; priority: string; technician: string }) { const pool = this.requirePool(); const id = randomUUID(); await pool.query(`INSERT INTO service_tickets (id, company_id, title, system_name, priority, status, technician) VALUES (?, ?, ?, ?, ?, 'Open', ?)`, [id, this.companyId, input.title, input.system, input.priority, input.technician || null]); return { id, ...input, status: 'Open' }; }
  async updateTicket(id: string, status: string) { const pool = this.requirePool(); const [result] = await pool.query<ResultSetHeader>(`UPDATE service_tickets SET status = ? WHERE id = ? AND company_id = ?`, [status, id, this.companyId]); if (!result.affectedRows) throw new Error('ticket_not_found'); return { id, status }; }
  async getSettings() { const pool = this.requirePool(); const [rows] = await pool.query<Row[]>(`SELECT company_name AS companyName, support_email AS supportEmail, primary_color AS primaryColor, secondary_color AS secondaryColor, notification_settings_json AS notifications FROM company_settings WHERE company_id = ?`, [this.companyId]); const row = rows[0]; if (!row) throw new Error('settings_not_found'); return { companyName: String(row.companyName), supportEmail: String(row.supportEmail), primaryColor: String(row.primaryColor), secondaryColor: String(row.secondaryColor), notifications: JSON.parse(String(row.notifications)) as Record<string, boolean> }; }
  async saveSettings(input: { companyName: string; supportEmail: string; primaryColor: string; secondaryColor: string; notifications: Record<string, boolean> }) { const pool = this.requirePool(); await pool.query(`INSERT INTO company_settings (company_id, company_name, support_email, primary_color, secondary_color, notification_settings_json) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), support_email = VALUES(support_email), primary_color = VALUES(primary_color), secondary_color = VALUES(secondary_color), notification_settings_json = VALUES(notification_settings_json)`, [this.companyId, input.companyName, input.supportEmail, input.primaryColor, input.secondaryColor, JSON.stringify(input.notifications)]); return input; }
}
