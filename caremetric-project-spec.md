# CareMetric — Healthcare Appointment Analytics Integrity Dashboard

> **Purpose:** Build a compact, production-style full-stack portfolio project that demonstrates end-to-end debugging and reliable healthcare analytics across PostgreSQL, backend APIs, filtering/aggregation logic, and a Next.js dashboard.
>
> **Primary portfolio message:**  
> *“I can trace inaccurate analytics metrics from the database through backend aggregation and REST APIs to frontend filters, identify the actual root cause, fix it safely, and add regression protection.”*

---

# 1. Project Overview

**CareMetric** is a small healthcare appointment analytics dashboard designed to demonstrate a realistic data-integrity problem commonly found in production analytics systems.

The application displays appointment metrics such as:

- Total appointments
- Completed appointments
- Cancelled appointments
- No-shows
- Appointments over time

The dashboard supports filtering by:

- Date range
- Provider
- Facility
- Appointment status

The core technical scenario is an **inconsistent appointment-count bug caused by one-to-many relational joins**, such as joining an `appointments` table directly with an `appointment_status_history` table and then counting rows instead of unique appointments.

The application must demonstrate:

1. How the incorrect metric can happen.
2. How to detect the inconsistency.
3. How to identify the affected appointment records.
4. How to calculate correct metrics.
5. How to prevent regression through automated tests.

This is **not** intended to become a full healthcare management system.

---

# 2. Project Goals

The application must demonstrate the following capabilities to potential clients:

- React / Next.js development
- TypeScript
- Node.js backend development
- PostgreSQL
- SQL querying
- Drizzle ORM
- REST API design
- Data aggregation
- Analytics dashboard development
- Full-stack debugging
- Filter consistency
- Detection of duplicate records
- Understanding of database relationships and cardinality
- Safe metric calculation
- Automated regression testing
- Dockerized deployment
- Production-style project structure

The project should feel like a focused extract from a real production system rather than a tutorial CRUD application.

---

# 3. Scope Constraints

The application must remain intentionally compact.

## Include

- One main analytics dashboard
- Synthetic healthcare appointment data
- REST API
- PostgreSQL
- Drizzle ORM
- Provider, facility, patient, appointment, and appointment-status-history data
- KPI cards
- Filter controls
- Appointment trend chart
- Appointment table
- Data Integrity Inspector
- Duplicate-count diagnostics
- Automated tests for filters and aggregation
- Docker support
- VPS-ready deployment configuration
- Clean README documentation

## Do NOT Include

Do not add any of the following unless explicitly requested later:

- Authentication
- Authorization / RBAC
- User management
- Real patient health records
- Appointment booking
- Billing
- Medical records
- Prescriptions
- Doctor portals
- Patient portals
- Notifications
- Email
- SMS
- AI features
- Background job queues
- Admin panels
- Multi-tenancy
- Payments
- Audit-log subsystem
- Complex microservices
- Kubernetes

The project's value comes from **analytics correctness and debugging**, not feature count.

---

# 4. Technical Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- Recharts for charts
- TanStack Query optional but recommended
- Native URL search parameters for filter state

## Backend

- Node.js
- Express
- TypeScript
- Zod for request/query validation

## Database

- PostgreSQL

## ORM / Database Toolkit

- Drizzle ORM
- `drizzle-orm`
- `drizzle-kit`
- `pg`

## Testing

Recommended:

- Vitest
- Supertest
- Testcontainers or a dedicated PostgreSQL test database if time allows

At minimum, integration tests should validate API aggregation logic against database records.

## Deployment

- Docker
- Docker Compose
- Nginx reverse proxy
- Linux VPS

---

# 5. Suggested Repository Structure

Use a lightweight monorepo.

```text
caremetric/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── db/
│       │   ├── modules/
│       │   │   ├── appointments/
│       │   │   ├── analytics/
│       │   │   ├── providers/
│       │   │   └── facilities/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── app.ts
│       │   └── server.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   └── constants/
│       └── package.json
│
├── drizzle/
│   └── migrations/
│
├── scripts/
│   └── seed.ts
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

Use `pnpm` workspaces.

---

# 6. Core Domain Model

The data model must be intentionally small but relational enough to demonstrate the analytics bug.

Required entities:

- Provider
- Facility
- Patient
- Appointment
- AppointmentStatusHistory

---

# 7. Database Schema

Use UUID primary keys where practical.

## 7.1 providers

```text
providers
---------
id
name
specialty
created_at
```

Example:

```text
Dr. Maya Silva
Cardiology
```

---

## 7.2 facilities

```text
facilities
----------
id
name
city
created_at
```

Example:

```text
Central Medical Center
Colombo
```

---

## 7.3 patients

Use synthetic identifiers only.

Do not store realistic or sensitive medical data.

```text
patients
--------
id
patient_code
created_at
```

Example:

```text
PAT-0001
```

---

## 7.4 appointments

```text
appointments
------------
id
appointment_code
patient_id
provider_id
facility_id
status
scheduled_at
created_at
updated_at
```

Possible status values:

```text
SCHEDULED
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

---

## 7.5 appointment_status_history

```text
appointment_status_history
--------------------------
id
appointment_id
status
changed_at
```

An appointment can have several history rows.

Example:

```text
APT-0102

SCHEDULED
CONFIRMED
COMPLETED
```

This one-to-many relationship is central to the project.

---

# 8. Drizzle ORM Schema

Use PostgreSQL enums where useful.

Example direction:

```ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  specialty: varchar("specialty", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const facilities = pgTable("facilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  city: varchar("city", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientCode: varchar("patient_code", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    appointmentCode: varchar("appointment_code", {
      length: 50,
    })
      .notNull()
      .unique(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),

    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id),

    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),

    status: appointmentStatusEnum("status").notNull(),

    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("appointments_provider_idx").on(table.providerId),
    index("appointments_facility_idx").on(table.facilityId),
    index("appointments_status_idx").on(table.status),
    index("appointments_scheduled_at_idx").on(table.scheduledAt),
  ],
);

export const appointmentStatusHistory = pgTable(
  "appointment_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, {
        onDelete: "cascade",
      }),

    status: appointmentStatusEnum("status").notNull(),

    changedAt: timestamp("changed_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("appointment_status_history_appointment_idx").on(
      table.appointmentId,
    ),
  ],
);
```

The AI agent may adjust file names and Drizzle syntax depending on installed versions, but the resulting schema and relationships must remain equivalent.

---

# 9. Database Relationship Diagram

```text
Patient
  │
  │ 1
  │
  │ N
Appointment ─────────── Provider
  │
  │
  └──────────────────── Facility
  │
  │ 1
  │
  │ N
AppointmentStatusHistory
```

The most important relationship is:

```text
Appointment
    1
    │
    │
    N
AppointmentStatusHistory
```

This is the relationship used to demonstrate accidental metric multiplication.

---

# 10. Seed Data

Create deterministic synthetic demo data.

Recommended scale:

```text
Providers                   5
Facilities                  3
Patients                  100
Appointments              500
Status history rows      800-1,200
```

The seed process should generate realistic status transitions.

Examples:

```text
SCHEDULED
```

```text
SCHEDULED
→ CONFIRMED
```

```text
SCHEDULED
→ CONFIRMED
→ COMPLETED
```

```text
SCHEDULED
→ CANCELLED
```

```text
SCHEDULED
→ CONFIRMED
→ NO_SHOW
```

The latest appointment status must also be written to:

```text
appointments.status
```

This allows current-state analytics to be calculated directly from the appointment table.

Use patient codes such as:

```text
PAT-0001
PAT-0002
PAT-0003
```

Do not use real names or healthcare information.

---

# 11. The Bug Being Demonstrated

The project must explicitly reproduce a realistic analytics failure.

## Incorrect query pattern

A developer wants appointment analytics and joins status history directly:

```sql
SELECT
    a.id,
    a.status,
    a.provider_id,
    a.facility_id,
    h.status AS historical_status
FROM appointments a
LEFT JOIN appointment_status_history h
    ON h.appointment_id = a.id;
```

For this appointment:

```text
APT-0102
```

with status history:

```text
SCHEDULED
CONFIRMED
COMPLETED
```

the result becomes:

```text
APT-0102    SCHEDULED
APT-0102    CONFIRMED
APT-0102    COMPLETED
```

If the query performs:

```sql
COUNT(*)
```

then one appointment has effectively become three rows.

This causes incorrect KPI values.

---

# 12. Why Filters Make the Problem More Confusing

The application's README and Integrity Inspector should explain that unfiltered metrics can sometimes appear correct while filtered metrics become inconsistent because:

- different endpoints may use different joins
- different filters may force additional relational joins
- one-to-many relationships multiply rows
- aggregation may happen after row multiplication
- frontend filters may not correspond exactly to backend predicates
- date boundaries may be inconsistent
- status history can be confused with current appointment status

Example:

```text
Actual appointments:             248

Rows after status-history join:  267

Incorrect COUNT(*):              267

Correct appointment count:       248
```

---

# 13. Correct Analytics Strategy

Do not rely blindly on:

```sql
COUNT(DISTINCT appointment_id)
```

That can hide an incorrect data pipeline.

The preferred strategy is:

1. Define the appointment population.
2. Apply appointment-level filters.
3. Aggregate directly from that filtered appointment population.
4. Join one-to-many tables only when their data is explicitly required.
5. Aggregate secondary tables before joining where appropriate.

Conceptually:

```text
appointments
     ↓
apply appointment filters
     ↓
filtered appointment set
     ↓
aggregate metrics
     ↓
return API response
```

Secondary tables should not multiply the base metric dataset.

---

# 14. Filter Semantics

The dashboard must support:

- `from`
- `to`
- `providerId`
- `facilityId`
- `status`

Every analytics endpoint must use the **same filter semantics**.

This is critical.

Create a single reusable backend filtering function rather than independently rebuilding filters in multiple services.

Example:

```ts
interface AppointmentFilters {
  from?: Date;
  to?: Date;
  providerId?: string;
  facilityId?: string;
  status?:
    | "SCHEDULED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
}
```

---

# 15. Date-Range Rules

Avoid ambiguous date handling.

Use an inclusive start and exclusive end pattern internally if possible.

Example:

User chooses:

```text
2026-09-01 through 2026-09-30
```

Backend converts this to approximately:

```text
scheduled_at >= 2026-09-01T00:00:00
scheduled_at <  2026-10-01T00:00:00
```

This is safer than manually constructing a final timestamp such as `23:59:59.999`.

Document this behavior.

---

# 16. REST API

Base prefix:

```text
/api
```

Required endpoints:

```http
GET /api/health

GET /api/providers

GET /api/facilities

GET /api/appointments

GET /api/analytics/appointments

GET /api/analytics/appointments/trend

GET /api/analytics/integrity
```

---

# 17. Health Endpoint

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

---

# 18. Provider Endpoint

```http
GET /api/providers
```

Example response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Dr. Maya Silva",
      "specialty": "Cardiology"
    }
  ]
}
```

---

# 19. Facility Endpoint

```http
GET /api/facilities
```

Example response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Central Medical Center",
      "city": "Colombo"
    }
  ]
}
```

---

# 20. Appointment List Endpoint

```http
GET /api/appointments
```

Supported query parameters:

```text
from
to
providerId
facilityId
status
page
pageSize
```

Recommended default:

```text
page=1
pageSize=20
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "appointmentCode": "APT-0102",
      "patientCode": "PAT-0021",
      "provider": {
        "id": "uuid",
        "name": "Dr. Maya Silva"
      },
      "facility": {
        "id": "uuid",
        "name": "Central Medical Center"
      },
      "status": "COMPLETED",
      "scheduledAt": "2026-09-12T07:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 248,
    "totalPages": 13
  }
}
```

The pagination `total` must represent unique appointments.

---

# 21. Main Analytics Endpoint

```http
GET /api/analytics/appointments
```

Query parameters:

```text
from
to
providerId
facilityId
status
```

Example:

```http
GET /api/analytics/appointments?from=2026-09-01&to=2026-09-30&status=COMPLETED
```

Response:

```json
{
  "filters": {
    "from": "2026-09-01",
    "to": "2026-09-30",
    "providerId": null,
    "facilityId": null,
    "status": "COMPLETED"
  },
  "metrics": {
    "total": 196,
    "scheduled": 0,
    "confirmed": 0,
    "completed": 196,
    "cancelled": 0,
    "noShow": 0
  }
}
```

When no status filter is applied:

```json
{
  "metrics": {
    "total": 248,
    "scheduled": 17,
    "confirmed": 29,
    "completed": 151,
    "cancelled": 31,
    "noShow": 20
  }
}
```

Invariant:

```text
total
=
scheduled
+ confirmed
+ completed
+ cancelled
+ noShow
```

for the currently filtered population.

---

# 22. Trend Endpoint

```http
GET /api/analytics/appointments/trend
```

Use the same filters.

Response:

```json
{
  "data": [
    {
      "date": "2026-09-01",
      "count": 18
    },
    {
      "date": "2026-09-02",
      "count": 24
    }
  ]
}
```

Group by appointment `scheduled_at` date.

Do not group by status-history timestamp.

---

# 23. Data Integrity Endpoint

This is the signature feature.

```http
GET /api/analytics/integrity
```

It should accept the same appointment filters:

```text
from
to
providerId
facilityId
status
```

Example response:

```json
{
  "summary": {
    "uniqueAppointments": 248,
    "joinedRows": 267,
    "duplicateRows": 19,
    "affectedAppointments": 12,
    "integrityStatus": "WARNING"
  },
  "duplicates": [
    {
      "appointmentId": "uuid",
      "appointmentCode": "APT-0102",
      "occurrences": 3
    },
    {
      "appointmentId": "uuid",
      "appointmentCode": "APT-0188",
      "occurrences": 2
    }
  ],
  "diagnosis": {
    "type": "ONE_TO_MANY_JOIN_MULTIPLICATION",
    "relationship": "appointments -> appointment_status_history",
    "message": "Joining appointment status history directly multiplies appointment rows. Appointment metrics must be aggregated from the filtered appointment set."
  }
}
```

---

# 24. Integrity Calculation Logic

The backend should calculate two views of the same data.

## Correct count

Count filtered appointments from the `appointments` table only.

Conceptually:

```sql
SELECT COUNT(*)
FROM appointments
WHERE ...filters;
```

## Diagnostic joined-row count

Join status history intentionally:

```sql
SELECT COUNT(*)
FROM appointments a
LEFT JOIN appointment_status_history h
    ON h.appointment_id = a.id
WHERE ...same appointment filters;
```

Then:

```text
duplicateRows = joinedRows - uniqueAppointments
```

This is a diagnostic value only.

---

# 25. Duplicate Appointment Detection

Identify appointment IDs that occur multiple times in the diagnostic join.

Conceptually:

```sql
SELECT
    a.id,
    a.appointment_code,
    COUNT(*) AS occurrences
FROM appointments a
LEFT JOIN appointment_status_history h
    ON h.appointment_id = a.id
WHERE ...
GROUP BY a.id, a.appointment_code
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;
```

Implement using Drizzle SQL expressions where practical.

Using `sql` from Drizzle is acceptable for advanced aggregate queries.

The project should demonstrate both:

- ORM usage
- ability to write precise SQL where ORM abstraction is not ideal

---

# 26. Frontend Dashboard

Only one main page is required.

Recommended route:

```text
/
```

or:

```text
/dashboard
```

---

# 27. Dashboard Layout

```text
┌──────────────────────────────────────────────────────────┐
│ CareMetric                         Appointment Analytics │
├──────────────────────────────────────────────────────────┤
│ Date Range   Provider   Facility   Status               │
├──────────────────────────────────────────────────────────┤
│ Total      Completed      Cancelled      No Show        │
│  248          176             31           21           │
├──────────────────────────────┬───────────────────────────┤
│ Appointments over time       │ Status distribution       │
│                              │                           │
│        line/bar chart        │ optional small chart      │
├──────────────────────────────┴───────────────────────────┤
│ Appointment table                                         │
├──────────────────────────────────────────────────────────┤
│ Data Integrity Inspector                                  │
└──────────────────────────────────────────────────────────┘
```

One chart is sufficient.

If time is limited, build only the daily appointments chart.

---

# 28. KPI Cards

Required:

- Total Appointments
- Completed
- Cancelled
- No Show

Optional:

- Confirmed

Each card must update using the same active filters.

---

# 29. Filter Controls

Required filters:

```text
Date range
Provider
Facility
Appointment status
```

Also provide:

```text
Reset filters
```

Filters should update URL query parameters.

Example:

```text
/dashboard?from=2026-09-01&to=2026-09-30&providerId=...&facilityId=...&status=COMPLETED
```

---

# 30. URL State

The URL is the source of truth for dashboard filtering.

Benefits:

- Shareable filtered dashboard
- Browser navigation works
- Refresh preserves filters
- Easy debugging
- Clear mapping between frontend state and API requests

Do not maintain a separate hidden filter state that can diverge from the URL.

---

# 31. Frontend Request Flow

```text
URL search params
       ↓
parse filter values
       ↓
request analytics API
       ↓
backend validation
       ↓
database filter predicates
       ↓
aggregation
       ↓
API response
       ↓
dashboard components
```

This flow should be documented in the README.

---

# 32. Appointment Table

Columns:

```text
Appointment
Patient
Provider
Facility
Status
Scheduled At
```

Example:

```text
APT-0102
PAT-0021
Dr. Maya Silva
Central Medical Center
COMPLETED
Sep 12, 2026 13:00
```

Include:

- loading state
- empty state
- error state
- pagination

Keep styling clean and compact.

---

# 33. Data Integrity Inspector UI

This should be visually prominent but not overwhelming.

Example:

```text
Data Integrity Check

Unique appointments             248
Rows from diagnostic join       267
Duplicate rows detected          19
Affected appointments            12

Status: Warning
```

Then:

```text
Affected appointments

APT-0102      3 occurrences
APT-0188      2 occurrences
APT-0201      4 occurrences
```

And:

```text
Root Cause

The appointments table has a one-to-many relationship
with appointment_status_history.

Counting rows after joining the history table causes
appointment records to be multiplied.
```

And:

```text
Correct Strategy

Filter appointments first → aggregate appointment metrics →
join historical data only when explicitly required.
```

---

# 34. Optional "Compare Query" Visualization

If implementation time allows, add a compact panel:

```text
Naive Joined Count
267

Correct Appointment Count
248

Difference
+19
```

This is highly useful for a portfolio demo.

Do not build a full SQL editor.

---

# 35. Backend Architecture

Recommended internal flow:

```text
HTTP Request
    ↓
Route
    ↓
Zod query validation
    ↓
Controller
    ↓
Analytics Service
    ↓
Appointment Filter Builder
    ↓
Drizzle Query
    ↓
PostgreSQL
```

Keep database logic out of route files.

---

# 36. Suggested Backend Module Structure

```text
apps/api/src/modules/analytics/
├── analytics.routes.ts
├── analytics.controller.ts
├── analytics.service.ts
├── analytics.repository.ts
├── analytics.schemas.ts
└── analytics.types.ts
```

Appointments:

```text
apps/api/src/modules/appointments/
├── appointments.routes.ts
├── appointments.controller.ts
├── appointments.service.ts
├── appointments.repository.ts
└── appointments.schemas.ts
```

Reference data:

```text
providers/
facilities/
```

These can be simpler.

---

# 37. Shared Filter Builder

Create one function responsible for translating validated filters into Drizzle predicates.

Conceptual example:

```ts
function buildAppointmentWhere(filters: AppointmentFilters) {
  const conditions = [];

  if (filters.from) {
    conditions.push(gte(appointments.scheduledAt, filters.from));
  }

  if (filters.toExclusive) {
    conditions.push(lt(appointments.scheduledAt, filters.toExclusive));
  }

  if (filters.providerId) {
    conditions.push(eq(appointments.providerId, filters.providerId));
  }

  if (filters.facilityId) {
    conditions.push(eq(appointments.facilityId, filters.facilityId));
  }

  if (filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  return conditions.length ? and(...conditions) : undefined;
}
```

Every analytics query should reuse this logic.

---

# 38. Validation

Use Zod.

Example:

```ts
const analyticsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  providerId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  status: z
    .enum([
      "SCHEDULED",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .optional(),
});
```

Invalid parameters should produce HTTP `400`.

Example:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid analytics filter parameters"
  }
}
```

---

# 39. API Error Format

Use a consistent response.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to calculate appointment analytics"
  }
}
```

Do not expose database stack traces to the client.

---

# 40. Logging

Keep logging simple.

Recommended:

- method
- route
- status code
- duration
- error stack server-side

Example:

```text
GET /api/analytics/appointments 200 24ms
```

Use `pino` / `pino-http` if convenient.

Do not spend significant development time on observability infrastructure.

---

# 41. Frontend Architecture

Suggested:

```text
apps/web/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── dashboard/
│   │   ├── dashboard-filters.tsx
│   │   ├── metric-card.tsx
│   │   ├── appointment-trend-chart.tsx
│   │   ├── appointment-table.tsx
│   │   └── integrity-inspector.tsx
│   └── ui/
│
├── lib/
│   ├── api.ts
│   ├── filters.ts
│   └── types.ts
│
└── hooks/
```

---

# 42. Loading / Empty / Error States

Each major section must handle:

## Loading

Show skeletons.

## Empty

Example:

```text
No appointments match the selected filters.
```

## Error

Example:

```text
Unable to load appointment metrics.
Retry
```

Do not silently display zeros when the API has failed.

This is important for analytics reliability.

---

# 43. Data Consistency Rules

The frontend must never independently recalculate primary appointment metrics from table rows.

The backend is the canonical source of analytics metrics.

For example:

Bad:

```text
load first page of appointments
→ count rows in browser
→ show count as Total Appointments
```

Correct:

```text
GET /api/analytics/appointments
→ use returned total
```

This distinction should be documented.

---

# 44. Automated Tests

Tests are important because the project is specifically about analytics correctness.

At minimum, implement backend integration tests covering:

```text
✓ unfiltered appointment total

✓ date-range filter

✓ provider filter

✓ facility filter

✓ status filter

✓ provider + facility combined filter

✓ provider + date combined filter

✓ all filters combined

✓ filtered metric total equals unique filtered appointment count

✓ diagnostic joined-row count can exceed appointment count

✓ status-history join does not affect production metric count
```

---

# 45. Key Regression Test

A specific test must create:

```text
1 appointment
3 appointment-status-history rows
```

Then verify:

```text
production metric total = 1
```

while:

```text
diagnostic joined row count = 3
```

This is the strongest single test in the project.

Pseudo-test:

```ts
it("does not multiply appointment metrics when status history contains multiple rows", async () => {
  // create appointment
  // create three history rows

  const analytics = await getAppointmentMetrics(...);

  expect(analytics.total).toBe(1);

  const integrity = await getIntegrityReport(...);

  expect(integrity.summary.uniqueAppointments).toBe(1);
  expect(integrity.summary.joinedRows).toBe(3);
  expect(integrity.summary.duplicateRows).toBe(2);
});
```

---

# 46. Additional Invariants

Tests should verify:

```text
total >= 0
```

and:

```text
total =
scheduled +
confirmed +
completed +
cancelled +
noShow
```

when no status filter excludes statuses.

Trend counts should also sum to the same filtered total for the selected range when grouped purely by `scheduled_at`.

---

# 47. Database Migration Workflow

Use Drizzle Kit.

Typical flow:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Provide package scripts such as:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

Exact commands may be adjusted to match the current Drizzle version installed.

---

# 48. Environment Variables

Create:

```text
.env.example
```

Example:

```env
NODE_ENV=development

DATABASE_URL=postgresql://caremetric:caremetric@localhost:5432/caremetric

API_PORT=4000

NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

For Docker networking, internal URLs may differ.

Never commit actual secrets.

---

# 49. Docker

Create Dockerfiles for:

- web
- api

Use Docker Compose for:

- web
- api
- postgres

Conceptual:

```yaml
services:
  postgres:
    image: postgres:latest

  api:
    build: ./apps/api
    depends_on:
      - postgres

  web:
    build: ./apps/web
    depends_on:
      - api
```

Use stable image tags in the final implementation rather than blindly relying on `latest`.

---

# 50. Docker Compose Ports

Suggested development mapping:

```text
Web           3000
API           4000
PostgreSQL    5432
```

In production, PostgreSQL does not need to be publicly exposed.

---

# 51. Production Deployment Architecture

```text
Internet
   ↓
Nginx
   ↓
┌──────────────────────────┐
│ caremetric.example.com   │
│ Next.js                  │
│ internal port 3000       │
└──────────────────────────┘

/api/*
   ↓
┌──────────────────────────┐
│ Express API              │
│ internal port 4000       │
└──────────────────────────┘
   ↓
┌──────────────────────────┐
│ PostgreSQL               │
│ private Docker network   │
└──────────────────────────┘
```

---

# 52. Nginx Behavior

Conceptually:

```text
/      → Next.js
/api/  → Express
```

Preserve normal forwarding headers.

Enable HTTPS using the deployment environment's certificate strategy.

---

# 53. UI Design Direction

The dashboard should look like a professional analytics tool.

Recommended visual principles:

- light neutral background
- white cards
- compact spacing
- restrained color usage
- strong typography
- subtle borders
- clear metric hierarchy
- responsive layout
- desktop-first but mobile usable

Avoid:

- excessive gradients
- glassmorphism
- animated backgrounds
- unnecessary healthcare imagery
- giant hero sections

This should look like internal business software.

---

# 54. README Requirements

The README is part of the portfolio deliverable.

It must contain:

## Overview

What CareMetric is.

## Problem

Explain inconsistent analytics caused by relational joins.

## Architecture

```text
PostgreSQL
   ↓
Drizzle ORM
   ↓
Express analytics service
   ↓
REST API
   ↓
Next.js dashboard
```

## Data Integrity Scenario

Explain:

```text
appointments
1 → N
appointment_status_history
```

## Example Failure

```text
248 actual appointments
267 joined rows
19 duplicate rows
```

## Root Cause

Explain one-to-many join multiplication.

## Fix

Explain filtered base dataset + safe aggregation.

## Regression Protection

Explain tests.

## Technology Stack

List all technologies.

## Running Locally

Provide commands.

## Environment Setup

Document `.env`.

## Database Migration

Document Drizzle commands.

## Seed Data

Document seed command.

## Docker

Document Docker Compose setup.

## Deployment

Briefly describe VPS architecture.

---

# 55. Portfolio Case Study Section

The README should include a case-study-style section:

```text
Scenario

A healthcare analytics dashboard displayed correct overall
appointment totals, but filtered counts became inconsistent.

Investigation

The database, API, and frontend filtering flow were traced.

Root Cause

A one-to-many join between appointments and appointment status
history multiplied appointment rows before aggregation.

Resolution

Appointment filters and metrics were calculated from the base
appointment set before joining historical data.

Verification

Regression tests were added for individual filters, combined
filters, and duplicate-history scenarios.
```

This mirrors a real client troubleshooting engagement.

---

# 56. Sample Technical Explanation

The README may show:

## Incorrect

```text
Appointments
     ↓
JOIN Appointment Status History
     ↓
Rows Multiply
     ↓
COUNT(*)
     ↓
Incorrect KPI
```

## Correct

```text
Appointments
     ↓
Apply Filters
     ↓
Stable Appointment Dataset
     ↓
Aggregate Metrics
     ↓
Correct KPI
```

---

# 57. Suggested Scripts

Root scripts should make the project easy to operate.

Example:

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "db:generate": "pnpm --filter api db:generate",
    "db:migrate": "pnpm --filter api db:migrate",
    "db:seed": "pnpm --filter api db:seed"
  }
}
```

The exact workspace package names can be adjusted.

---

# 58. Development Priorities

If development time is limited, implement in this order.

## Priority 1

- repository setup
- PostgreSQL
- Drizzle
- schema
- migrations
- seed data

## Priority 2

- reusable filter parser
- analytics service
- correct metrics endpoint

## Priority 3

- dashboard KPI cards
- filters
- URL state

## Priority 4

- appointment table
- trend chart

## Priority 5

- integrity endpoint
- integrity inspector

## Priority 6

- integration tests

## Priority 7

- Docker
- README
- deployment polish

Do not expand scope before all priorities above work.

---

# 59. One-Day Build Plan

## Phase 1 — Foundation

Create:

```text
pnpm monorepo
Next.js app
Express API
PostgreSQL
Drizzle ORM
Docker Compose
```

Verify:

```text
web loads
api health endpoint works
database connection works
```

---

## Phase 2 — Database

Create:

```text
providers
facilities
patients
appointments
appointment_status_history
```

Run migrations.

Seed synthetic data.

Verify row counts.

---

## Phase 3 — Analytics Backend

Implement:

```text
filter validation
shared appointment filter builder
metrics endpoint
trend endpoint
appointments endpoint
```

Verify all filters manually.

---

## Phase 4 — Dashboard

Implement:

```text
filter toolbar
KPI cards
trend chart
appointment table
```

Synchronize filters with URL search parameters.

---

## Phase 5 — Integrity Inspector

Implement:

```text
diagnostic joined count
unique appointment count
duplicate row calculation
affected appointment detection
root-cause explanation
```

Add the frontend panel.

---

## Phase 6 — Tests

Implement regression tests for:

```text
date
provider
facility
status
combined filters
join multiplication
```

---

## Phase 7 — Deployment

Build Docker images.

Run:

```text
web
api
postgres
```

behind Nginx.

Add HTTPS.

Verify production API and dashboard.

---

# 60. Definition of Done

The project is complete when all of the following are true.

## Database

- Drizzle schema exists
- migrations run successfully
- seed data loads successfully
- one-to-many history data exists

## API

- health endpoint works
- providers endpoint works
- facilities endpoint works
- appointments endpoint works
- analytics endpoint works
- trend endpoint works
- integrity endpoint works

## Filtering

- date filter works
- provider filter works
- facility filter works
- status filter works
- filters work in combination

## Metrics

- appointment counts are based on unique appointment records
- status-history rows do not inflate production metrics
- KPI values remain consistent across filters

## Frontend

- dashboard loads
- URL-based filters work
- KPI cards update
- chart updates
- table updates
- integrity report updates
- loading state exists
- empty state exists
- error state exists

## Tests

- main analytics tests pass
- duplicate-history regression test passes

## Deployment

- Docker build succeeds
- Docker Compose runs
- app is reachable through Nginx
- `/api` reaches Express
- database is not publicly exposed

## Documentation

- README explains problem
- README explains root cause
- README explains fix
- README explains testing
- README contains local run instructions
- README contains deployment overview

---

# 61. Acceptance Criteria

### AC-01

Given no filters, when analytics are requested, the API returns the number of appointment records in the database rather than the number of appointment-history join rows.

### AC-02

Given a provider filter, all returned appointment metrics and table records belong to that provider.

### AC-03

Given a facility filter, all returned appointment metrics and table records belong to that facility.

### AC-04

Given a status filter, metrics reflect appointment current status, not historical status rows.

### AC-05

Given a date range, appointments outside that range are excluded consistently from metrics, charts, tables, and integrity diagnostics.

### AC-06

Given multiple filters, all conditions are combined using AND semantics.

### AC-07

Given one appointment with multiple status-history records, the production analytics count that appointment exactly once.

### AC-08

The Integrity Inspector reports that the same appointment would appear multiple times in the intentionally naive diagnostic join.

### AC-09

Dashboard filters survive browser refresh because they are represented in URL query parameters.

### AC-10

API errors do not cause the UI to display misleading zero metrics.

---

# 62. Performance Expectations

This is a compact demo system, but follow sensible practices.

Add indexes for:

```text
appointments.provider_id
appointments.facility_id
appointments.status
appointments.scheduled_at
appointment_status_history.appointment_id
```

Avoid N+1 queries.

Do not load all appointments into Node.js just to calculate totals.

Perform aggregation in PostgreSQL.

---

# 63. Security / Privacy Rules

Because the project has a healthcare theme:

- use synthetic data only
- do not use real names where avoidable
- do not store medical conditions
- do not store diagnoses
- do not store treatment information
- do not imply HIPAA compliance
- do not claim regulatory certification

This is an analytics engineering demonstration, not a certified healthcare system.

---

# 64. Naming

Project name:

```text
CareMetric
```

Tagline:

```text
Healthcare Analytics with Verifiable Metrics
```

Optional subtitle:

```text
End-to-end appointment analytics integrity demo
```

---

# 65. Demo Script

The finished application should support a short client demo.

## Step 1

Open dashboard.

Say:

```text
This dashboard calculates appointment metrics directly from
the PostgreSQL-backed API.
```

## Step 2

Change provider and facility filters.

Say:

```text
All widgets share the same backend filter definition so their
numbers remain consistent.
```

## Step 3

Open the Data Integrity Inspector.

Say:

```text
The integrity check intentionally compares the correct appointment
population against a naive one-to-many history join.
```

## Step 4

Show:

```text
Unique appointments       248
Joined rows               267
Duplicate rows             19
```

Say:

```text
This is the sort of relational-data issue that can make a dashboard
look correct overall but break under filters.
```

## Step 5

Show regression test or README architecture.

Say:

```text
The fix is protected with integration tests covering filter
combinations and duplicate-history scenarios.
```

The entire demo should be understandable in approximately 2–3 minutes.

---

# 66. Key Engineering Principles

The AI agent building this project must follow these principles.

## One source of truth for filtering

Do not reimplement filter logic separately across every endpoint.

## Aggregate in the database

Do not download all records and count them in Node.js.

## Separate diagnostic logic from production metric logic

The intentionally naive join exists only to demonstrate the bug.

## Do not hide incorrect query design with arbitrary frontend fixes

The frontend must render trusted backend analytics.

## Prefer correctness over unnecessary abstraction

This project is intentionally small.

## Keep the portfolio story visible

The application should make the data-integrity problem easy to understand.

---

# 67. AI Agent Implementation Instructions

When building this project:

1. Do not expand the product scope.
2. Do not add authentication.
3. Do not add AI functionality.
4. Do not create unrelated healthcare features.
5. Use PostgreSQL and Drizzle ORM.
6. Keep the backend as a separate Express application.
7. Use TypeScript throughout.
8. Use synthetic data only.
9. Reuse the same filter logic across endpoints.
10. Perform aggregation in PostgreSQL.
11. Implement the intentional diagnostic join separately from the production query.
12. Add integration tests for metric correctness.
13. Keep the dashboard to one main page.
14. Use URL search parameters for filters.
15. Ensure Docker deployment works.
16. Document every important setup command.
17. Do not mark the project complete until the Definition of Done and Acceptance Criteria are satisfied.

---

# 68. Final Deliverable

The repository should contain a complete runnable application with:

```text
Next.js frontend
Express TypeScript API
PostgreSQL database
Drizzle ORM
Drizzle migrations
Synthetic seed data
Appointment analytics
Dashboard filtering
Appointment table
Trend chart
Data Integrity Inspector
Duplicate-count diagnostics
Integration tests
Docker Compose
Nginx-ready deployment
Comprehensive README
```

The result should communicate:

> **CareMetric demonstrates how to diagnose and prevent inconsistent analytics metrics caused by filtering, aggregation, and one-to-many relational joins in a production-style full-stack application.**

The project's strength is not the number of features.

Its strength is that it clearly demonstrates **full-stack analytical debugging, SQL correctness, data integrity, and production-minded engineering** in a compact system that can realistically be built and deployed within a day.
