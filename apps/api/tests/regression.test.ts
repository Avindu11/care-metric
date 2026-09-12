import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';
import {
  providers,
  facilities,
  patients,
  appointments,
  appointmentStatusHistory,
} from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('Key Regression Test: One-to-Many Join Multiplication (Section 45)', () => {
  let testProviderId: string;
  let testFacilityId: string;
  let testPatientId: string;
  let testAppointmentId: string;

  it('does not multiply appointment metrics when status history contains multiple rows', async () => {
    // 1. Create unique test fixture entities isolated from other data
    const [testProvider] = await db
      .insert(providers)
      .values({
        name: 'Dr. Test Regression Specialist',
        specialty: 'Diagnostic Research',
      })
      .returning();
    testProviderId = testProvider!.id;

    const [testFacility] = await db
      .insert(facilities)
      .values({
        name: 'Regression Verification Lab',
        city: 'Analytics City',
      })
      .returning();
    testFacilityId = testFacility!.id;

    const [testPatient] = await db
      .insert(patients)
      .values({
        patientCode: 'PAT-REG-9999',
      })
      .returning();
    testPatientId = testPatient!.id;

    // 2. Create exactly 1 appointment
    const [testAppointment] = await db
      .insert(appointments)
      .values({
        appointmentCode: 'APT-REG-0001',
        patientId: testPatientId,
        providerId: testProviderId,
        facilityId: testFacilityId,
        status: 'COMPLETED',
        scheduledAt: new Date('2026-09-15T10:00:00.000Z'),
      })
      .returning();
    testAppointmentId = testAppointment!.id;

    // 3. Create 3 status history records for this single appointment
    await db.insert(appointmentStatusHistory).values([
      {
        appointmentId: testAppointmentId,
        status: 'SCHEDULED',
        changedAt: new Date('2026-09-12T10:00:00.000Z'),
      },
      {
        appointmentId: testAppointmentId,
        status: 'CONFIRMED',
        changedAt: new Date('2026-09-14T10:00:00.000Z'),
      },
      {
        appointmentId: testAppointmentId,
        status: 'COMPLETED',
        changedAt: new Date('2026-09-15T10:00:00.000Z'),
      },
    ]);

    // 4. Query production analytics filtered to this test provider
    const analyticsRes = await request(app).get(
      `/api/analytics/appointments?providerId=${testProviderId}`,
    );
    expect(analyticsRes.status).toBe(200);

    // CRITICAL ASSERTION: Production metric total MUST BE EXACTLY 1, NOT 3!
    expect(analyticsRes.body.metrics.total).toBe(1);
    expect(analyticsRes.body.metrics.completed).toBe(1);
    expect(analyticsRes.body.metrics.scheduled).toBe(0);

    // 5. Query integrity inspector filtered to this test provider
    const integrityRes = await request(app).get(
      `/api/analytics/integrity?providerId=${testProviderId}`,
    );
    expect(integrityRes.status).toBe(200);

    // CRITICAL ASSERTION: Diagnostic join demonstrates the bug
    const { summary, duplicates } = integrityRes.body;
    expect(summary.uniqueAppointments).toBe(1);
    expect(summary.joinedRows).toBe(3);
    expect(summary.duplicateRows).toBe(2);
    expect(summary.affectedAppointments).toBe(1);
    expect(summary.integrityStatus).toBe('WARNING');

    expect(duplicates.length).toBe(1);
    expect(duplicates[0].appointmentCode).toBe('APT-REG-0001');
    expect(duplicates[0].occurrences).toBe(3);
  });

  afterAll(async () => {
    // Clean up test records
    if (testAppointmentId) {
      await db
        .delete(appointmentStatusHistory)
        .where(eq(appointmentStatusHistory.appointmentId, testAppointmentId));
      await db.delete(appointments).where(eq(appointments.id, testAppointmentId));
    }
    if (testPatientId) {
      await db.delete(patients).where(eq(patients.id, testPatientId));
    }
    if (testFacilityId) {
      await db.delete(facilities).where(eq(facilities.id, testFacilityId));
    }
    if (testProviderId) {
      await db.delete(providers).where(eq(providers.id, testProviderId));
    }
  });
});
