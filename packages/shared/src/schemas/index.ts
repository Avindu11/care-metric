import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../constants/index';

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const filterQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')
    .optional(),
  providerId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  status: appointmentStatusSchema.optional(),
});

export const appointmentListQuerySchema = filterQuerySchema.extend({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type FilterQueryParams = z.infer<typeof filterQuerySchema>;
export type AppointmentListQueryParams = z.infer<typeof appointmentListQuerySchema>;
