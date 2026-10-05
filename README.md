# SolarOne

SolarOne is a unified solar inverter monitoring and management platform: **one app for all your solar systems**.

## Development

```bash
npm install
npm run dev
```

The application listens on port `3000` and exposes `/api/health`. The dashboard currently runs in explicitly labeled demo mode; provider adapters never claim live telemetry without verified credentials and an actual API connection.

## Architecture

The React/Vite client consumes normalized SolarOne domain types. The Express server owns the REST boundary, validation, health checks, and provider registry. Add a new inverter manufacturer by implementing `server/providers/types.ts` and registering the adapter in `server/providers/registry.ts`; do not couple manufacturer payloads to dashboard components.

`db/schema.sql` is a portable relational reference for companies, users, sites, credentials, systems, readings, alerts, service tickets, and audit logs. Provider credentials must be encrypted at rest and stored through deployment secret management.

## Checks

```bash
npm run typecheck
npm run build
```
