export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CONFIRMED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  NO_SHOW: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const DEFAULT_PAGE_SIZE = 20;
