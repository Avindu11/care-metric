import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  Provider,
  Facility,
  AppointmentListResponse,
  AnalyticsAppointmentsResponse,
  TrendResponse,
  IntegrityResponse,
  FilterQueryParams,
} from '@caremetric/shared';

function cleanParams(params: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function useProviders() {
  return useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Provider[] }>('/providers');
      return data.data;
    },
  });
}

export function useFacilities() {
  return useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Facility[] }>('/facilities');
      return data.data;
    },
  });
}

export function useAppointments(filters: FilterQueryParams, page = 1, pageSize = 20) {
  return useQuery<AppointmentListResponse>({
    queryKey: ['appointments', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await apiClient.get<AppointmentListResponse>('/appointments', {
        params: cleanParams({ ...filters, page, pageSize }),
      });
      return data;
    },
  });
}

export function useAnalyticsAppointments(filters: FilterQueryParams) {
  return useQuery<AnalyticsAppointmentsResponse>({
    queryKey: ['analytics', 'appointments', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<AnalyticsAppointmentsResponse>(
        '/analytics/appointments',
        {
          params: cleanParams(filters),
        },
      );
      return data;
    },
  });
}

export function useAnalyticsTrend(filters: FilterQueryParams) {
  return useQuery<TrendResponse>({
    queryKey: ['analytics', 'trend', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<TrendResponse>('/analytics/appointments/trend', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}

export function useAnalyticsIntegrity(filters: FilterQueryParams) {
  return useQuery<IntegrityResponse>({
    queryKey: ['analytics', 'integrity', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<IntegrityResponse>('/analytics/integrity', {
        params: cleanParams(filters),
      });
      return data;
    },
  });
}
