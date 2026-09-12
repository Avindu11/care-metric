'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '../components/dashboard/dashboard-header';
import { DashboardFilters } from '../components/dashboard/dashboard-filters';
import { MetricCards } from '../components/dashboard/metric-cards';
import { AppointmentTrendChart } from '../components/dashboard/appointment-trend-chart';
import { AppointmentTable } from '../components/dashboard/appointment-table';
import { IntegrityInspector } from '../components/dashboard/integrity-inspector';
import type { FilterQueryParams, AppointmentStatus } from '@caremetric/shared';

function DashboardContent() {
  const searchParams = useSearchParams();

  const filters: FilterQueryParams = {
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    providerId: searchParams.get('providerId') || undefined,
    facilityId: searchParams.get('facilityId') || undefined,
    status: (searchParams.get('status') as AppointmentStatus) || undefined,
  };

  return (
    <div className="medical-dashboard">
      <div className="dashboard-shell flex flex-col">
        <DashboardHeader />

        <div className="flex-1 p-6 md:p-8 space-y-6 bg-white">
          {/* Top Filter Controls */}
          <DashboardFilters />

          {/* Metric KPI Statistics */}
          <MetricCards filters={filters} />

          {/* Appointments Over Time Trend Chart */}
          <AppointmentTrendChart filters={filters} />

          {/* Data Integrity Inspector Panel */}
          <IntegrityInspector filters={filters} />

          {/* Canonical Appointment Population Table */}
          <AppointmentTable filters={filters} />
        </div>

        {/* Footer */}
        <footer className="border-t border-[#ebebeb] bg-[#fafafa] px-6 py-5 text-center text-xs muted-text">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 max-w-7xl mx-auto">
            <span className="font-medium text-[#111111]">
              CareMetric &mdash; Healthcare Appointment Analytics & Integrity Engine
            </span>
            <span className="text-[11px] muted-text">
              PostgreSQL &bull; Drizzle ORM &bull; Express API &bull; Next.js Turbopack &bull; Vitest
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="medical-dashboard flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 border-2 border-[#0667fd] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs muted-text font-medium">Initializing CareMetric Clinical Analytics...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
