export type UserRole = 'SUPER_ADMIN' | 'INSTALLER' | 'TECHNICIAN' | 'CUSTOMER';
export type ProviderStatus = 'connected' | 'available' | 'credentials_required' | 'coming_soon' | 'api_error' | 'disconnected';
export type SystemStatus = 'online' | 'offline' | 'warning' | 'unknown';
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'resolved';

export interface NormalizedTelemetry {
  solarPower: number | null;
  dailyEnergy: number | null;
  monthlyEnergy: number | null;
  yearlyEnergy: number | null;
  totalEnergy: number | null;
  loadPower: number | null;
  gridImport: number | null;
  gridExport: number | null;
  batterySOC: number | null;
  batteryPower: number | null;
  inverterTemperature: number | null;
  inverterStatus: SystemStatus;
  faultCode: string | null;
  faultMessage: string | null;
  timestamp: string;
  source: 'real_api' | 'demo_fixture';
}

export interface SolarSystem {
  id: string;
  name: string;
  customerId?: string | null;
  customerName?: string | null;
  location: string;
  capacityKw: number;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  status: SystemStatus;
  todayKwh: number | null;
  lastSyncAt: string | null;
  telemetry: NormalizedTelemetry | null;
  providerStatus: ProviderStatus;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  systemName: string;
  occurredAt: string;
  acknowledged: boolean;
}

export interface DashboardSummary {
  capacityKw: number;
  currentProductionKw: number;
  todayKwh: number;
  monthKwh: number;
  totalKwh: number;
  consumptionKw: number;
  gridImportKw: number;
  gridExportKw: number;
  batterySoc: number;
  co2SavedKg: number;
  estimatedSavings: number;
  onlineSystems: number;
  totalSystems: number;
}

export interface EnergyPoint {
  label: string;
  solar: number;
  consumption: number;
  export: number;
  import: number;
}

export interface ProviderConnection { id: string; providerKey: string; providerName: string; status: ProviderStatus; customerCount: number; systemCount: number; }
export interface HierarchyCustomer { id: string; name: string; email: string; site: string; systems: SolarSystem[]; }
export interface SolarHierarchy { company: { id: string; name: string }; connections: ProviderConnection[]; customers: HierarchyCustomer[]; }
