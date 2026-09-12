import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { APPOINTMENT_STATUSES } from '@caremetric/shared';

export const appointmentStatusEnum = pgEnum('appointment_status', APPOINTMENT_STATUSES);

export const providers = pgTable('providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  specialty: varchar('specialty', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const facilities = pgTable('facilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  city: varchar('city', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientCode: varchar('patient_code', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appointmentCode: varchar('appointment_code', { length: 50 }).notNull().unique(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id),
    status: appointmentStatusEnum('status').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('appointments_provider_idx').on(table.providerId),
    index('appointments_facility_idx').on(table.facilityId),
    index('appointments_status_idx').on(table.status),
    index('appointments_scheduled_at_idx').on(table.scheduledAt),
  ],
);

export const appointmentStatusHistory = pgTable(
  'appointment_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),
    status: appointmentStatusEnum('status').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointment_status_history_appointment_idx').on(table.appointmentId),
  ],
);

export const providersRelations = relations(providers, ({ many }) => ({
  appointments: many(appointments),
}));

export const facilitiesRelations = relations(facilities, ({ many }) => ({
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  provider: one(providers, {
    fields: [appointments.providerId],
    references: [providers.id],
  }),
  facility: one(facilities, {
    fields: [appointments.facilityId],
    references: [facilities.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  statusHistory: many(appointmentStatusHistory),
}));

export const appointmentStatusHistoryRelations = relations(
  appointmentStatusHistory,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentStatusHistory.appointmentId],
      references: [appointments.id],
    }),
  }),
);

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentStatusHistory = typeof appointmentStatusHistory.$inferSelect;
export type NewAppointmentStatusHistory = typeof appointmentStatusHistory.$inferInsert;
