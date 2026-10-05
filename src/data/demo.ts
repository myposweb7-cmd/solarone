import type { Alert, DashboardSummary, EnergyPoint, SolarSystem } from '../domain/types.js';

export const demoSummary: DashboardSummary = {
  capacityKw: 125.6,
  currentProductionKw: 72.4,
  todayKwh: 487.3,
  monthKwh: 8742,
  totalKwh: 186420,
  consumptionKw: 42.8,
  gridImportKw: 3.6,
  gridExportKw: 26.2,
  batterySoc: 78,
  co2SavedKg: 86.4,
  estimatedSavings: 128.45,
  onlineSystems: 3,
  totalSystems: 4,
};

export const demoSystems: SolarSystem[] = [
  { id: 'home', name: 'Home Solar System', location: 'Colombo · Residential', capacityKw: 5, manufacturer: 'FOX ESS', model: 'T6-G3', serialNumber: 'FOX-DEMO-001', status: 'online', todayKwh: 18.4, lastSyncAt: 'demo fixture', providerStatus: 'credentials_required', telemetry: { solarPower: 3.2, dailyEnergy: 18.4, monthlyEnergy: 420, yearlyEnergy: 4200, totalEnergy: 10340, loadPower: 2.1, gridImport: 0, gridExport: 1.1, batterySOC: 82, batteryPower: 0.8, inverterTemperature: 34, inverterStatus: 'online', faultCode: null, faultMessage: null, timestamp: new Date().toISOString(), source: 'demo_fixture' } },
  { id: 'office', name: 'Office Rooftop', location: 'Kandy · Commercial', capacityKw: 20, manufacturer: 'Growatt', model: 'MOD 20KTL3-X', serialNumber: 'GRO-DEMO-002', status: 'online', todayKwh: 76.2, lastSyncAt: 'demo fixture', providerStatus: 'credentials_required', telemetry: { solarPower: 14.5, dailyEnergy: 76.2, monthlyEnergy: 1800, yearlyEnergy: 21200, totalEnergy: 48200, loadPower: 10.2, gridImport: 0, gridExport: 4.3, batterySOC: null, batteryPower: null, inverterTemperature: 41, inverterStatus: 'online', faultCode: null, faultMessage: null, timestamp: new Date().toISOString(), source: 'demo_fixture' } },
  { id: 'factory', name: 'Factory Solar', location: 'Gampaha · Industrial', capacityKw: 100, manufacturer: 'Solis', model: 'S5-GC100K', serialNumber: 'SOL-DEMO-003', status: 'online', todayKwh: 392.7, lastSyncAt: 'demo fixture', providerStatus: 'credentials_required', telemetry: { solarPower: 54.7, dailyEnergy: 392.7, monthlyEnergy: 6522, yearlyEnergy: 95600, totalEnergy: 210300, loadPower: 30.5, gridImport: 1.2, gridExport: 25.4, batterySOC: null, batteryPower: null, inverterTemperature: 46, inverterStatus: 'online', faultCode: null, faultMessage: null, timestamp: new Date().toISOString(), source: 'demo_fixture' } },
  { id: 'warehouse', name: 'Warehouse Array', location: 'Negombo · Commercial', capacityKw: 0.6, manufacturer: 'SOLARMAN / Deye', model: 'SUN-6K-SG04', serialNumber: 'DEA-DEMO-004', status: 'offline', todayKwh: null, lastSyncAt: '2 days ago', providerStatus: 'api_error', telemetry: null },
];

export const demoAlerts: Alert[] = [
  { id: 'a1', title: 'Communication error', message: 'Warehouse Array has not reported telemetry for 48 hours.', severity: 'critical', systemName: 'Warehouse Array', occurredAt: '12 min ago', acknowledged: false },
  { id: 'a2', title: 'High inverter temperature', message: 'Factory Solar peaked at 46°C. Review ventilation before the afternoon peak.', severity: 'warning', systemName: 'Factory Solar', occurredAt: '34 min ago', acknowledged: false },
  { id: 'a3', title: 'Daily target reached', message: 'Home Solar System has reached 92% of its daily generation target.', severity: 'info', systemName: 'Home Solar System', occurredAt: '1 hr ago', acknowledged: true },
];

export const demoEnergy: EnergyPoint[] = [
  { label: '06:00', solar: 3, consumption: 11, export: 0, import: 8 }, { label: '08:00', solar: 22, consumption: 26, export: 0, import: 4 },
  { label: '10:00', solar: 46, consumption: 35, export: 10, import: 0 }, { label: '12:00', solar: 71, consumption: 42, export: 25, import: 0 },
  { label: '14:00', solar: 68, consumption: 44, export: 22, import: 0 }, { label: '16:00', solar: 52, consumption: 37, export: 15, import: 0 },
  { label: '18:00', solar: 18, consumption: 31, export: 0, import: 13 }, { label: '20:00', solar: 2, consumption: 22, export: 0, import: 20 },
];
