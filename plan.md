# SolarOne Implementation Plan

## Goal
Build SolarOne as a serious commercial SaaS foundation for unified solar-inverter monitoring: **“One App. All Inverters. All Your Solar Systems.”** The first implementation will deliver a coherent, usable MVP rather than a static dashboard mockup, with a scalable architecture for live manufacturer integrations, normalized data, company/customer operations, and future production hardening.

## Product scope for the first implementation slice

### User-facing experience
- A premium public landing page with the SolarOne proposition, supported-inverter positioning, product capabilities, installer value proposition, analytics, alerts, white-label, pricing architecture, FAQ, and contact CTA.
- A responsive authenticated application shell with role-aware navigation for customer, installer, technician, and super-admin surfaces.
- A polished customer/company dashboard with summary metrics, system health, active alerts, recent events, production/consumption/energy-flow visualizations, and multi-system filtering.
- Solar systems list/detail views and an “Add Solar System” flow that captures provider, connection state, site details, capacity, inverter/device metadata, and a custom system name.
- Integration Marketplace/Status view with explicit states: Connected, Disconnected, API Error, Credentials Required, and Coming Soon.
- Installer-oriented starter surfaces for customers, service tickets, maintenance, warranties, and reports so the product architecture is visible beyond a single dashboard.
- Loading, empty, error, skeleton, pagination, responsive mobile navigation, and validation states throughout.

### Backend and domain foundation
- TypeScript server layer with REST endpoints for authentication, dashboard summaries, systems, integrations, customers, alerts, and service tickets.
- Relational schema and migrations for users, roles, companies, customers, sites, solar systems, providers, credentials, plants, devices, readings/aggregates, alerts, notifications, tickets, technicians, maintenance records, warranties, reports, subscription plans/subscriptions, company settings, and audit logs.
- Secure ownership boundaries: users can only access records belonging to their company/account; roles are enforced server-side.
- Authentication boundary with password hashing/session or JWT support, verification/reset extension points, and Preview-safe cookie configuration if cookie sessions are used.
- Encrypted provider credentials and an explicit separation between demo/mock data and real provider data.
- Adapter contracts that normalize manufacturer responses into SolarOne data rather than coupling the UI to any vendor format.
- Synchronization service boundary with retry, timeout, rate-limit, token-refresh, logging, abnormal-condition detection, and alert-generation extension points; no production claim of a working API without configured credentials and a successful API call.
- Notification-provider and subscription/entitlement interfaces without payment-gateway integration in this phase.

### Initial provider architecture
- `InverterProvider` interface supporting authenticate, connect/disconnect, sites/plants, inverters/devices, realtime/daily/monthly/yearly energy, energy flow, battery status, alarms/events, and device status.
- Provider registry and status metadata for FOX ESS, SOLARMAN/Deye, Growatt, Solis, GoodWe, Sungrow, Huawei, SMA, and Fronius.
- FOX ESS, SOLARMAN/Deye, and Growatt are the prioritized MVP adapters. Each adapter will expose a real-API boundary and clear credential/status requirements; it will not fabricate connected readings.
- Remaining providers will be architecture-ready entries marked `Coming Soon` or `Credentials Required` until official access is configured.

## Technical approach

### Frontend
- React + TypeScript + Vite, Tailwind CSS, shadcn-style reusable primitives, Lucide icons, and a charting library for production/consumption/energy-flow visuals.
- Route-driven SPA with public landing route and authenticated product routes; maintain a static `public/manus-routes.json` manifest for every user-facing page.
- Feature-oriented UI modules: `dashboard`, `systems`, `integrations`, `customers`, `service`, `warranties`, `reports`, `admin`, and shared `ui`/`layout` components.
- API client and typed domain models consume normalized SolarOne responses only. Demo fixtures live in a clearly named demo layer and are never used as claimed live provider data.

### Server and data
- Node.js + TypeScript server with REST controllers, validation, authorization middleware, provider services, normalization, and sync orchestration.
- ORM-backed relational schema with indexes on company ownership, system/provider identifiers, timestamps, and alert/status queries.
- Portable repository/service interfaces so the domain is not coupled to a single database vendor.
- Store durable data in the managed database; keep secrets in managed secret configuration and never commit them.

### Deployment and project operations
- Keep the app listening on the initialized runtime port (3000 unless the project configuration says otherwise), bound to `0.0.0.0` for Preview.
- Add a production health endpoint and Docker-ready build/start configuration when the server is complete.
- Configure TypeScript diagnostics before the first application code batch, using the host-managed post-edit registration on Sandbox.
- Checkpoint only the intended source/configuration files to the canonical project repository; publication remains separate and will only be claimed if confirmed.

## Design direction

- **Design movement:** premium climate-tech / energy-operations console: calm, precise, high-signal, and more editorial than a generic admin template.
- **Core principles:** (1) operational clarity over decoration, (2) energy data has visual hierarchy, (3) every status is explicit and trustworthy, (4) responsive density without clutter.
- **Color philosophy:** dark navy provides operational confidence and lets telemetry read clearly; warm solar gold is the ownable action/accent color; pale mineral surfaces keep dense dashboards legible; status colors are reserved for health semantics rather than decoration.
- **Layout paradigm:** a left rail plus wide command canvas with asymmetric hero/dashboard sections, a persistent context bar, and modular cards that align to a telemetry rhythm instead of a centered marketing grid.
- **Signature elements:** a compact sun-orbit wordmark mark, thin energy-flow traces connecting key metrics, and small “signal” status pills with a gold active edge.
- **Interaction philosophy:** make the next operational action obvious; use progressive disclosure for provider setup and record details; favor inline filters, clear empty states, and reversible actions.
- **Animation:** restrained 150–250ms transitions, number/count-up only for visible metric changes, subtle pulse on live status indicators, and animated energy-flow traces only in the visualization where they reinforce directionality; respect reduced-motion settings.
- **Typography system:** a modern geometric sans for headings and UI (e.g. Manrope/Inter-style) paired with a readable sans for dense metadata; strong compact headings, generous labels, and tabular numerals for energy values.
- **Brand essence:** the trusted control plane for solar portfolios—built for homeowners and the companies who keep systems performing. Personality: **clear, capable, forward-looking**.
- **Brand voice:** concise, confident, operational, and human. Example lines: “See every system at a glance.” and “Connect the fleet. Catch issues earlier.”
- **Wordmark/logo:** `SolarOne` set as a custom wordmark with the `O` treated as a small solar orbit/ring and a four-ray sun mark that can stand alone in the rail.
- **Signature brand color:** Solar Gold `#F4B740`, used sparingly for primary actions, active navigation, live signal highlights, and the orbit mark.

## Project structure

```text
solarone/
├── app.config.ts                 # Project metadata, including durable logoUrl
├── package.json / lockfile       # Pinned toolchain and dependencies
├── public/
│   ├── manus-routes.json         # User-facing route manifest
│   └── manifest.webmanifest      # PWA-ready metadata
├── src/
│   ├── app/                      # App bootstrap, routing, providers, auth guards
│   ├── components/
│   │   ├── ui/                   # Buttons, cards, dialogs, tables, tabs, forms
│   │   ├── charts/               # Production, consumption, comparison charts
│   │   ├── energy-flow/           # Solar/inverter/home/battery/grid visualization
│   │   └── layout/                # Shell, rail, top bar, mobile nav, page headers
│   ├── features/
│   │   ├── landing/
│   │   ├── dashboard/
│   │   ├── systems/
│   │   ├── integrations/
│   │   ├── customers/
│   │   ├── service/
│   │   ├── warranties/
│   │   ├── reports/
│   │   └── admin/
│   ├── lib/                      # API client, auth state, formatters, validation
│   ├── data/                     # Clearly isolated demo fixtures and provider metadata
│   └── styles/                   # Global tokens, theme, responsive styles
├── server/
│   ├── index.ts                  # HTTP entrypoint and health route
│   ├── routes/                   # REST route modules
│   ├── middleware/               # Auth, RBAC, validation, rate limiting, errors
│   ├── domain/                   # Normalized entities and business rules
│   ├── providers/                # InverterProvider, registry, adapters, status
│   ├── sync/                     # Sync jobs, retries, rate limits, alert detection
│   ├── notifications/            # Provider interface and channel adapters
│   └── repositories/              # Database access and ownership-scoped queries
├── db/
│   ├── schema/                   # Relational models and indexes
│   ├── migrations/
│   └── seed/                     # Non-production development seed only
├── Dockerfile
├── .env.example
└── README.md
```

## Delivery phases

1. **Foundation:** project runtime, design tokens, routing, landing page, app shell, route manifest, typed domain models, diagnostics, health endpoint, and clearly isolated demo fixtures.
2. **Core SaaS MVP:** dashboard, systems list/detail/add flow, integration marketplace/status, normalized API contracts, relational schema, auth/RBAC boundaries, company ownership rules, and initial installer surfaces.
3. **Operations:** provider adapter registry, sync orchestration, alert center, customer management, tickets, maintenance, warranties, and notification/subscription interfaces.
4. **Expansion:** reports/CSV-PDF export, analytics comparisons, environmental settings, white-label configuration, additional real provider adapters, production hardening, and deployment configuration.

The first execution slice should be considered complete only when the app is a usable, responsive SolarOne MVP foundation with a real server/data boundary and explicit integration truthfulness—not merely a collection of screenshots or hard-coded dashboard values.

## Verification plan

- Confirm the application starts on the configured Preview port and serves the intended routes plus `/manus-routes.json` with HTTP 200 and valid JSON.
- Run the existing package typecheck/build/lint checks after dependencies are installed; use host-managed TypeScript diagnostics after each source batch and resolve actionable errors.
- Inspect the server route map, provider interface/registry, normalized data types, and ownership/RBAC middleware to verify the UI is not coupled to manufacturer payloads.
- Verify no provider is rendered as connected without an explicit configured/tested credential state; demo data is labeled and isolated.
- Verify responsive layout at desktop and mobile breakpoints, including navigation, tables, charts, forms, empty/loading/error states, and keyboard-visible focus.
- Verify health endpoint, REST response shapes, route manifest/source parity, database migration/seed behavior, and production configuration placeholders.
- Before handoff, create a checkpoint from the canonical repository and report Preview unless a successful publication is confirmed.

## Assumptions and open risks

- The first delivery prioritizes a complete MVP foundation and honest provider architecture; live manufacturer connectivity requires user-supplied provider credentials, API access, and provider-specific terms/limits.
- The Webdev managed Database capability is documented as a managed MySQL-compatible relational database, while the requested product specification names PostgreSQL. The implementation should keep a portable repository/schema boundary; if PostgreSQL is non-negotiable, switch the database target to an externally managed PostgreSQL DSN before production migrations rather than silently claiming PostgreSQL support.
- Payment gateway integration is intentionally deferred; subscription plans and entitlement boundaries are represented in the domain model only.
- Email, WhatsApp, SMS, push, custom domains, and PDF generation are represented through provider/service boundaries initially and require credentials or deployment-specific services for production activation.
- No real customer or inverter credentials will be invented or committed; demo mode is visibly distinct from real API mode.
