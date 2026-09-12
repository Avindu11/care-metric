import { db, queryClient } from './index.js';
import {
  providers,
  facilities,
  patients,
  appointments,
  appointmentStatusHistory,
} from './schema.js';
import type { AppointmentStatus } from '@caremetric/shared';

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createPrng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedDatabase() {
  console.log('🌱 Starting CareMetric database seed...');
  const random = createPrng(42);

  // 1. Clear existing data in reverse order of foreign keys
  await db.delete(appointmentStatusHistory);
  await db.delete(appointments);
  await db.delete(patients);
  await db.delete(facilities);
  await db.delete(providers);

  // 2. Insert 5 Providers
  const providerData = [
    { name: 'Dr. Maya Silva', specialty: 'Cardiology' },
    { name: 'Dr. Rajesh Patel', specialty: 'Pediatrics' },
    { name: 'Dr. Sarah Jenkins', specialty: 'Orthopedics' },
    { name: 'Dr. Marcus Vance', specialty: 'Neurology' },
    { name: 'Dr. Elena Rostova', specialty: 'Dermatology' },
  ];

  const insertedProviders = await db
    .insert(providers)
    .values(providerData)
    .returning();
  console.log(`✓ Inserted ${insertedProviders.length} providers`);

  // 3. Insert 3 Facilities
  const facilityData = [
    { name: 'Central Medical Center', city: 'Colombo' },
    { name: 'Metro Health Pavilion', city: 'Kandy' },
    { name: 'Westside Specialty Clinic', city: 'Galle' },
  ];

  const insertedFacilities = await db
    .insert(facilities)
    .values(facilityData)
    .returning();
  console.log(`✓ Inserted ${insertedFacilities.length} facilities`);

  // 4. Insert 100 Patients
  const patientData = Array.from({ length: 100 }, (_, i) => ({
    patientCode: `PAT-${String(i + 1).padStart(4, '0')}`,
  }));

  const insertedPatients = await db
    .insert(patients)
    .values(patientData)
    .returning();
  console.log(`✓ Inserted ${insertedPatients.length} patients`);

  // 5. Generate 500 Appointments with realistic status transitions
  // Base date around September 2026 as in project spec
  const baseDate = new Date('2026-09-01T08:00:00.000Z');

  interface AppointmentToInsert {
    appointmentCode: string;
    patientId: string;
    providerId: string;
    facilityId: string;
    status: AppointmentStatus;
    scheduledAt: Date;
  }

  interface HistoryToInsert {
    appointmentCode: string;
    status: AppointmentStatus;
    changedAt: Date;
  }

  const appointmentsToInsert: AppointmentToInsert[] = [];
  const statusHistoryRecords: HistoryToInsert[] = [];

  for (let i = 1; i <= 500; i++) {
    const code = `APT-${String(i).padStart(4, '0')}`;
    const patient = insertedPatients[Math.floor(random() * insertedPatients.length)]!;
    const provider = insertedProviders[Math.floor(random() * insertedProviders.length)]!;
    const facility = insertedFacilities[Math.floor(random() * insertedFacilities.length)]!;

    // Distribute scheduled dates between 2026-08-15 and 2026-10-15
    const dayOffset = Math.floor(random() * 60) - 20; // -20 to +40 days from baseDate
    const hour = 8 + Math.floor(random() * 9); // 8:00 to 17:00
    const minute = random() < 0.5 ? 0 : 30;

    const scheduledDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    scheduledDate.setUTCHours(hour, minute, 0, 0);

    // Pick final status realistically based on whether the date is past or future
    const isPast = scheduledDate.getTime() < new Date('2026-09-15T00:00:00.000Z').getTime();
    let finalStatus: AppointmentStatus;
    const historyTransitions: { status: AppointmentStatus; hoursBefore: number }[] = [];

    if (isPast) {
      const roll = random();
      if (roll < 0.65) {
        finalStatus = 'COMPLETED';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 72 });
        historyTransitions.push({ status: 'CONFIRMED', hoursBefore: 24 });
        historyTransitions.push({ status: 'COMPLETED', hoursBefore: 0 });
      } else if (roll < 0.82) {
        finalStatus = 'CANCELLED';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 48 });
        historyTransitions.push({ status: 'CANCELLED', hoursBefore: 12 });
      } else {
        finalStatus = 'NO_SHOW';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 48 });
        historyTransitions.push({ status: 'CONFIRMED', hoursBefore: 24 });
        historyTransitions.push({ status: 'NO_SHOW', hoursBefore: 0 });
      }
    } else {
      const roll = random();
      if (roll < 0.5) {
        finalStatus = 'CONFIRMED';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 72 });
        historyTransitions.push({ status: 'CONFIRMED', hoursBefore: 24 });
      } else if (roll < 0.85) {
        finalStatus = 'SCHEDULED';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 48 });
      } else {
        finalStatus = 'CANCELLED';
        historyTransitions.push({ status: 'SCHEDULED', hoursBefore: 72 });
        historyTransitions.push({ status: 'CANCELLED', hoursBefore: 24 });
      }
    }

    appointmentsToInsert.push({
      appointmentCode: code,
      patientId: patient.id,
      providerId: provider.id,
      facilityId: facility.id,
      status: finalStatus,
      scheduledAt: scheduledDate,
    });

    for (const transition of historyTransitions) {
      const changedAt = new Date(
        scheduledDate.getTime() - transition.hoursBefore * 60 * 60 * 1000,
      );
      statusHistoryRecords.push({
        appointmentCode: code,
        status: transition.status,
        changedAt,
      });
    }
  }

  // Batch insert appointments
  const insertedAppointments = await db
    .insert(appointments)
    .values(appointmentsToInsert)
    .returning({ id: appointments.id, code: appointments.appointmentCode });
  console.log(`✓ Inserted ${insertedAppointments.length} appointments`);

  // Map appointment code to id for history insert
  const codeToId = new Map(insertedAppointments.map((a) => [a.code, a.id]));

  const historyToInsert = statusHistoryRecords.map((h) => ({
    appointmentId: codeToId.get(h.appointmentCode)!,
    status: h.status,
    changedAt: h.changedAt,
  }));

  // Batch insert history in chunks of 200
  for (let i = 0; i < historyToInsert.length; i += 200) {
    const chunk = historyToInsert.slice(i, i + 200);
    await db.insert(appointmentStatusHistory).values(chunk);
  }
  console.log(`✓ Inserted ${historyToInsert.length} appointment status history rows`);

  console.log('✅ CareMetric database seeded successfully!');
}

// Allow direct execution
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Failed to seed database:', err);
      process.exit(1);
    })
    .finally(async () => {
      await queryClient.end();
    });
}
