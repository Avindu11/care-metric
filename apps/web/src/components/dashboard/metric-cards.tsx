'use client';

import { useAnalyticsAppointments } from '../../lib/api/endpoints';
import type { FilterQueryParams } from '@caremetric/shared';
import { CalendarDays, CheckCircle2, Clock, XCircle, UserX, AlertCircle } from 'lucide-react';

export function MetricCards({ filters }: { filters: FilterQueryParams }) {
  const { data, isLoading, isError, error } = useAnalyticsAppointments(filters);

  if (isError) {
    return (
      <div className="medical-card p-4 border border-[#fdecec] bg-[#fdecec]/50 text-[#dc4545] flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div className="text-xs">
          <span className="font-semibold">Unable to load appointment KPI metrics:</span>{' '}
          {error?.message || 'Database error occurred'}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const total = metrics?.total ?? 0;

  const calculatePct = (val: number) => {
    if (!total || total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  const cards = [
    {
      title: 'Total Appointments',
      value: metrics?.total,
      pctNumber: 100,
      badgeClass: 'badge-blue',
      badgeText: 'Filtered Set',
      icon: CalendarDays,
      iconColor: 'text-[#0667fd]',
      progressColor: 'bg-[#0667fd]',
      subtitle: 'Canonical distinct appointments',
    },
    {
      title: 'Completed',
      value: metrics?.completed,
      pctNumber: calculatePct(metrics?.completed ?? 0),
      badgeClass: 'badge-success',
      badgeText: `${calculatePct(metrics?.completed ?? 0)}%`,
      icon: CheckCircle2,
      iconColor: 'text-[#31b86b]',
      progressColor: 'bg-[#31b86b]',
      subtitle: 'Finished clinical visits',
    },
    {
      title: 'Confirmed',
      value: metrics?.confirmed,
      pctNumber: calculatePct(metrics?.confirmed ?? 0),
      badgeClass: 'badge-blue',
      badgeText: `${calculatePct(metrics?.confirmed ?? 0)}%`,
      icon: Clock,
      iconColor: 'text-[#0667fd]',
      progressColor: 'bg-[#0667fd]',
      subtitle: 'Confirmed upcoming',
    },
    {
      title: 'Cancelled',
      value: metrics?.cancelled,
      pctNumber: calculatePct(metrics?.cancelled ?? 0),
      badgeClass: 'badge-danger',
      badgeText: `${calculatePct(metrics?.cancelled ?? 0)}%`,
      icon: XCircle,
      iconColor: 'text-[#dc4545]',
      progressColor: 'bg-[#dc4545]',
      subtitle: 'Patient or clinic cancel',
    },
    {
      title: 'No-Shows',
      value: metrics?.noShow,
      pctNumber: calculatePct(metrics?.noShow ?? 0),
      badgeClass: 'badge-warning',
      badgeText: `${calculatePct(metrics?.noShow ?? 0)}%`,
      icon: UserX,
      iconColor: 'text-[#a67400]',
      progressColor: 'bg-[#f2b329]',
      subtitle: 'Missed without notification',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="stat-card">
            <div className="stat-header">
              <span className="label font-medium">{card.title}</span>
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>

            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-8 w-20 bg-[#ececec] animate-pulse rounded-md" />
              ) : (
                <span className="stat-value">
                  {card.value?.toLocaleString() ?? 0}
                </span>
              )}
              <span className={`badge ${card.badgeClass}`}>
                {card.badgeText}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="progress-track">
                <div
                  className={`progress-fill ${card.progressColor}`}
                  style={{ width: `${card.pctNumber}%` }}
                />
              </div>
              <p className="text-[11px] muted-text">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
