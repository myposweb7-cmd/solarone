import type { InverterProvider, ProviderCredentials, ProviderDefinition, ProviderDevice, ProviderSite } from './types.js';
import type { NormalizedTelemetry, SystemStatus } from '../../src/domain/types.js';

class CredentialsRequiredProvider implements InverterProvider {
  constructor(public readonly key: string, public readonly displayName: string) {}
  private unavailable<T>(): Promise<T> { return Promise.reject(new Error(`${this.displayName} credentials and official API access are required`)); }
  authenticate(_credentials: ProviderCredentials) { return Promise.resolve({ authenticated: false, message: 'Credentials required; no live API connection is configured.' }); }
  connect(_credentials: ProviderCredentials) { return this.unavailable<void>(); }
  disconnect(_connectionId: string) { return Promise.resolve(); }
  getSites(_connectionId: string) { return this.unavailable<ProviderSite[]>(); }
  getInverters(_connectionId: string, _siteId: string) { return this.unavailable<ProviderDevice[]>(); }
  getRealtimeData(_connectionId: string, _deviceId: string) { return this.unavailable<NormalizedTelemetry>(); }
  getDailyData(_connectionId: string, _deviceId: string, _date: string) { return this.unavailable<NormalizedTelemetry[]>(); }
  getMonthlyData(_connectionId: string, _deviceId: string, _month: string) { return this.unavailable<NormalizedTelemetry[]>(); }
  getYearlyData(_connectionId: string, _deviceId: string, _year: string) { return this.unavailable<NormalizedTelemetry[]>(); }
  getEnergyFlow(_connectionId: string, _deviceId: string) { return this.unavailable<NormalizedTelemetry>(); }
  getBatteryStatus(_connectionId: string, _deviceId: string) { return this.unavailable<Pick<NormalizedTelemetry, 'batterySOC' | 'batteryPower'>>(); }
  getAlarms(_connectionId: string, _deviceId: string) { return this.unavailable<Array<{ code: string; message: string; severity: string }>>(); }
  getEvents(_connectionId: string, _deviceId: string) { return this.unavailable<Array<{ type: string; message: string; timestamp: string }>>(); }
  getDeviceStatus(_connectionId: string, _deviceId: string) { return this.unavailable<SystemStatus>(); }
}

const fox = new CredentialsRequiredProvider('foxess', 'FOX ESS');
const solarman = new CredentialsRequiredProvider('solarman', 'SOLARMAN / Deye');
const growatt = new CredentialsRequiredProvider('growatt', 'Growatt');

export const providerDefinitions: ProviderDefinition[] = [
  { key: 'foxess', displayName: 'FOX ESS', status: 'credentials_required', description: 'Official cloud API adapter boundary ready; account credentials are required.', provider: fox },
  { key: 'solarman', displayName: 'SOLARMAN / Deye', status: 'credentials_required', description: 'Adapter boundary ready; API credentials are required to connect.', provider: solarman },
  { key: 'growatt', displayName: 'Growatt', status: 'credentials_required', description: 'Official API access varies by account and partner scope.', provider: growatt },
  { key: 'solis', displayName: 'Solis', status: 'coming_soon', description: 'Coming soon / partner API access required.' },
  { key: 'goodwe', displayName: 'GoodWe', status: 'coming_soon', description: 'Architecture-ready provider slot.' },
  { key: 'sungrow', displayName: 'Sungrow', status: 'coming_soon', description: 'Architecture-ready provider slot.' },
  { key: 'huawei', displayName: 'Huawei FusionSolar', status: 'credentials_required', description: 'Partner credentials and tenant access required.' },
  { key: 'sma', displayName: 'SMA', status: 'coming_soon', description: 'Architecture-ready provider slot.' },
  { key: 'fronius', displayName: 'Fronius', status: 'coming_soon', description: 'Architecture-ready provider slot.' },
];

export function getProvider(key: string): ProviderDefinition | undefined {
  return providerDefinitions.find((provider) => provider.key === key);
}
