# CareMetric — Healthcare Appointment Analytics Integrity Dashboard

> **Healthcare Analytics with Verifiable Metrics**  
> An end-to-end appointment analytics dashboard demonstrating full-stack relational debugging, reliable SQL metric aggregation, and regression protection across PostgreSQL, Drizzle ORM, Express, and Next.js.

---

## 1. Project Overview

**CareMetric** is a production-style healthcare appointment analytics dashboard engineered to demonstrate and solve a critical data-integrity pitfall commonly found in enterprise analytics pipelines: **metric multiplication caused by one-to-many relational joins**.

In healthcare and operations dashboards, high-level metrics (e.g., total appointments, completion rates, no-shows) often appear correct when looking at broad summaries, but become corrupted and inflated as soon as filters (such as date ranges, providers, facilities, or statuses) force joins against one-to-many historical tables.

CareMetric demonstrates:
1. **How relational join duplication happens** when joining `appointments` directly with `appointment_status_history`.
2. **How to detect and isolate the anomaly** using live SQL diagnostic queries and a visual **Data Integrity Inspector**.
3. **How to calculate canonical metrics safely** in PostgreSQL using filtered base-set aggregation.
4. **How to prevent regression** with automated integration and cardinality tests.

---

## 2. Portfolio Case Study

```text
Scenario:
A healthcare operations analytics dashboard displayed consistent high-level appointment counts,
but filtered totals drifted and over-reported volume when filtering by provider, facility, or date.

Investigation:
The data pipeline was traced end-to-end from Next.js URL query parameters through the Express API
layer down to PostgreSQL relational queries.

Root Cause:
A 1:N relational join between `appointments` and `appointment_status_history` multiplied appointment
rows before aggregation. For appointments with multiple status transitions
(SCHEDULED -> CONFIRMED -> COMPLETED), a naive COUNT(*) evaluated 1 appointment as 3 distinct rows.

Resolution:
The data strategy was refactored: filter predicates are applied directly on the base `appointments`
table. Metrics are computed from the canonical population before joining secondary history tables.

Verification:
Automated regression tests were added verifying filter combinations, invariant checks
(total = scheduled + confirmed + completed + cancelled + noShow), and verifying that an appointment
with 3 status history rows is counted as exactly 1 in production while flagged in the diagnostic inspector.
```

---

## 3. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web Dashboard                    │
│   (URL-Synced Filters • Recharts • TanStack Query • Tailwind) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express API Service                     │
│    (Unified Filter Builder • Zod Validation • Pino Logger)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Drizzle ORM / Postgres.js
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│    (appointments • status_history • providers • facilities) │
└─────────────────────────────────────────────────────────────┘
```

### Relational Model & Cardinality

```text
   Patient (100)
        │
        │ 1
        │
        │ N
   Appointment (500) ─────────── Provider (5)
        │
        │
        └─────────────────────── Facility (3)
        │
        │ 1
        │
        │ N  (800 - 1,200 rows)
   AppointmentStatusHistory
```

---

## 4. The Data Integrity Pitfall Explained

### ❌ The Incorrect Naive Join Pattern
When querying appointment metrics, an analytics developer naively joins the historical status table to inspect transitions:

```sql
-- INCORRECT: Naive 1:N join
SELECT COUNT(*)
FROM appointments a
LEFT JOIN appointment_status_history h
    ON h.appointment_id = a.id
WHERE a.provider_id = '...' AND a.scheduled_at >= '...';
```

#### What Happens Under the Hood:
If appointment `APT-0102` experienced three lifecycle transitions:
1. `SCHEDULED` (2026-09-10)
2. `CONFIRMED` (2026-09-12)
3. `COMPLETED` (2026-09-15)

The relational join produces **three separate rows**:
```text
APT-0102 | Dr. Maya Silva | SCHEDULED
APT-0102 | Dr. Maya Silva | CONFIRMED
APT-0102 | Dr. Maya Silva | COMPLETED
```

Running `COUNT(*)` counts 3 rows instead of 1 appointment. If 500 appointments have 1,167 historical transitions, naive queries report **1,167 appointments (+667 phantom rows)**.

---

### ✓ The Safe Production Strategy
CareMetric isolates base appointment filtering and metric aggregation:

```sql
-- CORRECT: Isolated base-set aggregation
SELECT
    COUNT(*)::int AS total,
    COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END)::int AS scheduled,
    COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::int AS confirmed,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int AS cancelled,
    COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END)::int AS no_show
FROM appointments
WHERE provider_id = '...' AND scheduled_at >= '...';
```

1. **Deterministic Filter Semantics**: All endpoints (`/api/appointments`, `/api/analytics/appointments`, `/api/analytics/appointments/trend`, `/api/analytics/integrity`) use the single reusable filter builder `buildAppointmentWhere()`.
2. **Inclusive Start & Exclusive End**: Dates are bound safely (`scheduled_at >= YYYY-MM-DD` and `scheduled_at < (YYYY-MM-DD + 1 day)`).
3. **Canonical Metrics**: Production metrics always aggregate from the filtered appointment population directly.

---

## 5. Technology Stack

- **Frontend**: Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, TanStack Query v5, Lucide Icons.
- **Backend**: Node.js, Express 5, TypeScript, Drizzle ORM, Postgres.js driver, Zod, Pino / Pino-Http, Helmet, CORS.
- **Database**: PostgreSQL 16.
- **Testing**: Vitest, Supertest.
- **Infrastructure & Deployment**: Docker, Docker Compose, Nginx reverse proxy.

---

## 6. Monorepo Structure

```text
caremetric/
├── apps/
│   ├── api/                     # Express REST API
│   │   ├── src/
│   │   │   ├── config/          # Environment configuration
│   │   │   ├── db/              # Drizzle schema, client, and seed script
│   │   │   ├── lib/             # Shared filter builder (buildAppointmentWhere)
│   │   │   ├── modules/         # Modular route controllers (analytics, appointments, etc.)
│   │   │   ├── app.ts           # Express application setup
│   │   │   └── server.ts        # Entry point and graceful shutdown
│   │   ├── drizzle/             # Versioned SQL migration files
│   │   ├── tests/               # Vitest integration & regression tests
│   │   └── Dockerfile
│   └── web/                     # Next.js Analytics Dashboard
│       ├── src/
│       │   ├── app/             # App router pages and layouts
│       │   ├── components/      # Header, Filters, KPI Cards, Chart, Table, Integrity Inspector
│       │   ├── lib/api/         # Axios client and TanStack Query hooks
│       │   └── providers/       # React Query provider
│       └── Dockerfile
├── packages/
│   └── shared/                  # Monorepo shared package (@caremetric/shared)
│       └── src/                 # Common TypeScript types, Zod schemas, constants
├── infra/
│   └── nginx/                   # Reverse proxy configuration
├── docker-compose.yml           # Multi-container orchestration (Postgres, API, Web, Nginx)
├── pnpm-workspace.yaml
└── README.md
```

---

## 7. REST API Reference

All endpoints are mounted under `/api`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and timestamp |
| `GET` | `/api/providers` | List all available healthcare providers |
| `GET` | `/api/facilities` | List all healthcare facilities |
| `GET` | `/api/appointments` | Paginated appointment list with joined patient/provider/facility |
| `GET` | `/api/analytics/appointments` | Safe KPI aggregates (`total`, `scheduled`, `confirmed`, `completed`, `cancelled`, `noShow`) |
| `GET` | `/api/analytics/appointments/trend` | Daily appointment counts grouped by `scheduled_at` |
| `GET` | `/api/analytics/integrity` | Live diagnostics: unique appointments vs diagnostic joined rows & duplicate occurrences |

### Standard Filter Query Parameters
Supported across all analytics and list endpoints:
- `from` (`YYYY-MM-DD`)
- `to` (`YYYY-MM-DD`)
- `providerId` (UUID)
- `facilityId` (UUID)
- `status` (`SCHEDULED` \| `CONFIRMED` \| `COMPLETED` \| `CANCELLED` \| `NO_SHOW`)

---

## 8. Getting Started Locally

### Prerequisites
- Node.js >= 20.18
- pnpm >= 10.0
- PostgreSQL running locally (or via Docker)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Avindu11/care-metric.git
cd care-metric
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both root and `apps/api`:
```bash
cp .env.example .env
cp .env.example apps/api/.env
```

Ensure `DATABASE_URL` points to your PostgreSQL database:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/caremetric_db
```

### 3. Run Migrations & Seed Database
```bash
# Generate and apply Drizzle database migrations
pnpm db:migrate

# Seed 500 appointments with realistic status transitions
pnpm db:seed
```

### 4. Run Development Servers
```bash
# Starts both the API (port 4000) and Next.js Web (port 3000)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Automated Testing & Verification

Run the full automated test suite:
```bash
pnpm test
```

### Key Regression Test (`apps/api/tests/regression.test.ts`)
Validates that when an appointment has 3 historical status transitions:
- Production analytics endpoint reports `total: 1`
- Integrity inspector reports `joinedRows: 3`, `duplicateRows: 2`, and flags the appointment as a join multiplier.

---

## 10. Docker Deployment

Deploy the entire production stack (PostgreSQL, Express API, Next.js, and Nginx reverse proxy):

```bash
docker compose up --build -d
```

Once running:
- **Web Dashboard**: [http://localhost](http://localhost) (routed via Nginx)
- **API Health**: [http://localhost/api/health](http://localhost/api/health)
- **Database**: Isolated on the internal Docker network.

To run migrations and seed inside Docker:
```bash
docker compose exec api pnpm db:migrate
docker compose exec api pnpm db:seed
```

---

## 11. Definition of Done & Acceptance Criteria Compliance

- [x] **AC-01**: Unfiltered analytics return the exact appointment count (500) rather than joined history rows (1,167).
- [x] **AC-02**: Provider filters restrict metrics, charts, and table rows to that provider.
- [x] **AC-03**: Facility filters restrict metrics, charts, and table rows to that facility.
- [x] **AC-04**: Status filter reflects appointment current status, not historical status rows.
- [x] **AC-05**: Date ranges apply inclusive start and exclusive end rules consistently across all endpoints.
- [x] **AC-06**: Multiple filters combine with strict SQL AND semantics.
- [x] **AC-07**: Appointments with multiple status history records are counted exactly once in production.
- [x] **AC-08**: The Data Integrity Inspector detects and reports duplicate joined rows.
- [x] **AC-09**: Filter state is synchronized with URL search parameters and survives page reload.
- [x] **AC-10**: API errors display clean error messages instead of misleading zero metrics.

---

## License
MIT