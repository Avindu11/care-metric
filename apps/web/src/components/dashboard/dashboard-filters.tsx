'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useProviders, useFacilities } from '../../lib/api/endpoints';
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '@caremetric/shared';
import { Filter, RotateCcw, Calendar, UserCheck, Building2, Tag } from 'lucide-react';

export function DashboardFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { data: providers, isLoading: isLoadingProviders } = useProviders();
  const { data: facilities, isLoading: isLoadingFacilities } = useFacilities();

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const providerId = searchParams.get('providerId') || '';
  const facilityId = searchParams.get('facilityId') || '';
  const status = searchParams.get('status') || '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const resetFilters = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  const hasActiveFilters = Boolean(from || to || providerId || facilityId || status);

  return (
    <div className="medical-card-white p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[#eaf2ff] text-[#0667fd]">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <span className="section-title">
            Unified Analytics Filter Controls
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn-secondary text-xs h-8 px-3"
            title="Reset All Parameters"
          >
            <RotateCcw className="h-3 w-3 text-[#5f5f5f]" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* From Date */}
        <div>
          <label className="label mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-[#969696]" />
            From Date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => updateParam('from', e.target.value)}
            className="medical-input text-xs"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="label mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-[#969696]" />
            To Date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => updateParam('to', e.target.value)}
            className="medical-input text-xs"
          />
        </div>

        {/* Provider Select */}
        <div>
          <label className="label mb-1.5 flex items-center gap-1.5">
            <UserCheck className="h-3 w-3 text-[#969696]" />
            Healthcare Provider
          </label>
          <select
            value={providerId}
            onChange={(e) => updateParam('providerId', e.target.value)}
            disabled={isLoadingProviders}
            className="medical-input text-xs"
          >
            <option value="">All Providers ({providers?.length || 0})</option>
            {providers?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.specialty || 'General'})
              </option>
            ))}
          </select>
        </div>

        {/* Facility Select */}
        <div>
          <label className="label mb-1.5 flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-[#969696]" />
            Clinical Facility
          </label>
          <select
            value={facilityId}
            onChange={(e) => updateParam('facilityId', e.target.value)}
            disabled={isLoadingFacilities}
            className="medical-input text-xs"
          >
            <option value="">All Facilities ({facilities?.length || 0})</option>
            {facilities?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.city})
              </option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div>
          <label className="label mb-1.5 flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-[#969696]" />
            Current Status
          </label>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="medical-input text-xs"
          >
            <option value="">All Statuses</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
