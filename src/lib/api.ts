import type { Alert, DashboardSummary, SolarSystem } from '../domain/types';

interface ApiEnvelope<T> {
  data: T;
  mode?: 'demo' | 'real_api' | 'empty_state';
  message?: string;
}

async function get<T>(path: string): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`SolarOne API request failed: ${response.status}`);
  return response.json() as Promise<ApiEnvelope<T>>;
}

export function fetchDashboard() { return get<DashboardSummary>('/api/dashboard'); }
export function fetchSystems() { return get<SolarSystem[]>('/api/systems'); }
export function fetchAlerts() { return get<Alert[]>('/api/alerts'); }
