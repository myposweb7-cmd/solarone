import type { NormalizedTelemetry, SystemStatus } from '../../src/domain/types.js';

export interface ProviderCredentials {
  accountId?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
}

export interface ProviderSite {
  id: string;
  name: string;
  location?: string;
  capacityKw?: number;
}

export interface ProviderDevice {
  id: string;
  siteId: string;
  name: string;
  model?: string;
  serialNumber?: string;
  status: SystemStatus;
}

export interface InverterProvider {
  readonly key: string;
  readonly displayName: string;
  authenticate(credentials: ProviderCredentials): Promise<{ authenticated: boolean; message?: string }>;
  connect(credentials: ProviderCredentials): Promise<void>;
  disconnect(connectionId: string): Promise<void>;
  getSites(connectionId: string): Promise<ProviderSite[]>;
  getInverters(connectionId: string, siteId: string): Promise<ProviderDevice[]>;
  getRealtimeData(connectionId: string, deviceId: string): Promise<NormalizedTelemetry>;
  getDailyData(connectionId: string, deviceId: string, date: string): Promise<NormalizedTelemetry[]>;
  getMonthlyData(connectionId: string, deviceId: string, month: string): Promise<NormalizedTelemetry[]>;
  getYearlyData(connectionId: string, deviceId: string, year: string): Promise<NormalizedTelemetry[]>;
  getEnergyFlow(connectionId: string, deviceId: string): Promise<NormalizedTelemetry>;
  getBatteryStatus(connectionId: string, deviceId: string): Promise<Pick<NormalizedTelemetry, 'batterySOC' | 'batteryPower'>>;
  getAlarms(connectionId: string, deviceId: string): Promise<Array<{ code: string; message: string; severity: string }>>;
  getEvents(connectionId: string, deviceId: string): Promise<Array<{ type: string; message: string; timestamp: string }>>;
  getDeviceStatus(connectionId: string, deviceId: string): Promise<SystemStatus>;
}

export interface ProviderDefinition {
  key: string;
  displayName: string;
  status: 'connected' | 'available' | 'credentials_required' | 'coming_soon' | 'api_error' | 'disconnected';
  description: string;
  provider?: InverterProvider;
}
