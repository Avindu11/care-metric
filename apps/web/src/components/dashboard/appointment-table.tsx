'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppointments } from '../../lib/api/endpoints';
import type { FilterQueryParams } from '@caremetric/shared';
import { Calendar, ChevronLeft, ChevronRight, ListOrdered, Inbox } from 'lucide-react';

export function AppointmentTable({ filters }: { filters: FilterQueryParams }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = 15;

  const { data, isLoading, isError, error } = useAppointments(filters, page, pageSize);

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const appointments = data?.data || [];
  const pagination = data?.pagination;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">{status}</span>;
      case 'CONFIRMED':
        return <span className="badge badge-blue">{status}</span>;
      case 'SCHEDULED':
        return <span className="badge badge-blue bg-[#f0f5ff] text-[#0052d6]">{status}</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">{status}</span>;
      case 'NO_SHOW':
        return <span className="badge badge-warning">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="medical-card-white overflow-hidden">
      <div className="p-5 border-b border-[#f0f0f0] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#f8f8f8] text-[#111111]">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div>
            <h2 className="section-title">
              Filtered Appointments Population
            </h2>
            <p className="text-xs muted-text">
              Canonical appointment records (each unique record counted once)
            </p>
          </div>
        </div>

        <span className="badge badge-blue text-xs py-1 px-3">
          Showing {appointments.length} of {total.toLocaleString()}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="medical-table">
          <thead>
            <tr>
              <th>Appointment</th>
              <th>Patient Code</th>
              <th>Healthcare Provider</th>
              <th>Clinical Facility</th>
              <th>Current Status</th>
              <th>Scheduled Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td><div className="h-4 w-20 bg-[#ececec] rounded" /></td>
                  <td><div className="h-4 w-16 bg-[#ececec] rounded" /></td>
                  <td><div className="h-4 w-28 bg-[#ececec] rounded" /></td>
                  <td><div className="h-4 w-32 bg-[#ececec] rounded" /></td>
                  <td><div className="h-5 w-20 bg-[#ececec] rounded-full" /></td>
                  <td><div className="h-4 w-24 bg-[#ececec] rounded" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#dc4545]">
                  {error?.message || 'Failed to load appointments'}
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#969696]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-[#dedede]" />
                    <span className="font-medium text-[#111111]">No appointments found</span>
                    <span className="text-xs text-[#969696]">Try adjusting your filter parameters or date bounds</span>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td className="font-mono font-medium text-[#111111]">
                    {apt.appointmentCode}
                  </td>
                  <td className="font-mono text-[#5f5f5f]">
                    {apt.patientCode}
                  </td>
                  <td className="font-medium text-[#111111]">
                    {apt.provider.name}
                  </td>
                  <td className="text-[#5f5f5f]">
                    {apt.facility.name}
                  </td>
                  <td>
                    {getStatusBadge(apt.status)}
                  </td>
                  <td className="text-[#5f5f5f] flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-[#969696]" />
                    {formatDate(apt.scheduledAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between text-xs text-[#5f5f5f]">
        <div>
          Page <span className="font-semibold text-[#111111]">{page}</span> of{' '}
          <span className="font-semibold text-[#111111]">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="btn-secondary text-xs h-8 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary text-xs h-8 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
