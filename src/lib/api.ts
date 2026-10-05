import type { Alert, DashboardSummary, SolarSystem } from '../domain/types';

export interface ApiEnvelope<T> { data: T; mode?: 'demo' | 'database' | 'real_api' | 'empty_state'; message?: string; }
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); this.name = 'ApiError'; } }

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, { ...init, headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const body = await response.json().catch(() => ({ error: 'invalid_response', message: 'The server returned an invalid response.' }));
  if (!response.ok) throw new ApiError(response.status, String(body.error ?? 'request_failed'), String(body.message ?? `SolarOne API request failed: ${response.status}`));
  if (!body || !('data' in body)) throw new ApiError(502, 'invalid_response', 'The server response did not contain data.');
  return body as ApiEnvelope<T>;
}

export function fetchDashboard() { return request<DashboardSummary>('/api/dashboard'); }
export function fetchSystems() { return request<SolarSystem[]>('/api/systems'); }
export function createSystem(input: { name: string; location: string; capacityKw: number; manufacturer: string; model: string }) { return request<SolarSystem>('/api/systems', { method: 'POST', body: JSON.stringify(input) }); }
export function fetchAlerts() { return request<Alert[]>('/api/alerts'); }
export function acknowledgeAllAlerts() { return request<{ acknowledged: number }>('/api/alerts/acknowledge-all', { method: 'POST' }); }
export interface CustomerRecord { id: string; name: string; email: string; site: string; }
export function fetchCustomers() { return request<CustomerRecord[]>('/api/customers'); }
export function createCustomer(input: Omit<CustomerRecord, 'id'>) { return request<CustomerRecord>('/api/customers', { method: 'POST', body: JSON.stringify(input) }); }
export interface TicketRecord { id: string; title: string; system: string; priority: string; status: string; technician: string; }
export function fetchTickets() { return request<TicketRecord[]>('/api/service-tickets'); }
export function createTicket(input: Omit<TicketRecord, 'id' | 'status'>) { return request<TicketRecord>('/api/service-tickets', { method: 'POST', body: JSON.stringify(input) }); }
export function updateTicket(id: string, status: string) { return request<{ id: string; status: string }>(`/api/service-tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
export interface SettingsRecord { companyName: string; supportEmail: string; primaryColor: string; secondaryColor: string; notifications: Record<string, boolean>; }
export function fetchSettings() { return request<SettingsRecord>('/api/settings'); }
export function saveSettings(input: SettingsRecord) { return request<SettingsRecord>('/api/settings', { method: 'PUT', body: JSON.stringify(input) }); }
export function connectProvider(provider: string, input: Record<string, string>) { return request<unknown>(`/api/integrations/${provider}/connect`, { method: 'POST', body: JSON.stringify(input) }); }
