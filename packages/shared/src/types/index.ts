import type { AppointmentStatus } from '../constants/index';
import type { FilterQueryParams, AppointmentListQueryParams } from '../schemas/index';

export * from '../constants/index';
export * from '../schemas/index';

export interface Provider {
  id: string;
  name: string;
  specialty: string | null;
}

export interface Facility {
  id: string;
  name: string;
  city: string | null;
}

export interface Patient {
  id: string;
  patientCode: string;
}

export interface AppointmentListItem {
  id: string;
  appointmentCode: string;
  patientCode: string;
  provider: {
    id: string;
    name: string;
  };
  facility: {
    id: string;
    name: string;
  };
  status: AppointmentStatus;
  scheduledAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AppointmentListResponse {
  data: AppointmentListItem[];
  pagination: Pagination;
}

export interface KPIMetrics {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface AnalyticsAppointmentsResponse {
  filters: {
    from: string | null;
    to: string | null;
    providerId: string | null;
    facilityId: string | null;
    status: AppointmentStatus | null;
  };
  metrics: KPIMetrics;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface TrendResponse {
  data: TrendDataPoint[];
}

export interface IntegritySummary {
  uniqueAppointments: number;
  joinedRows: number;
  duplicateRows: number;
  affectedAppointments: number;
  integrityStatus: 'CLEAN' | 'WARNING';
}

export interface DuplicateRecord {
  appointmentId: string;
  appointmentCode: string;
  occurrences: number;
}

export interface IntegrityDiagnosis {
  type: string;
  relationship: string;
  message: string;
}

export interface IntegrityResponse {
  summary: IntegritySummary;
  duplicates: DuplicateRecord[];
  diagnosis: IntegrityDiagnosis;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
