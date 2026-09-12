'use client';

import { useAnalyticsIntegrity } from '../../lib/api/endpoints';
import type { FilterQueryParams } from '@caremetric/shared';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  GitBranch,
  Layers,
  FileCode2,
} from 'lucide-react';
import { useState } from 'react';

export function IntegrityInspector({ filters }: { filters: FilterQueryParams }) {
  const { data, isLoading, isError } = useAnalyticsIntegrity(filters);
  const [showSqlComparison, setShowSqlComparison] = useState(false);

  if (isLoading) {
    return (
      <div className="medical-card-white p-6 animate-pulse">
        <div className="h-6 w-48 bg-[#ececec] rounded mb-4" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-20 bg-[#f8f8f8] rounded-xl" />
          <div className="h-20 bg-[#f8f8f8] rounded-xl" />
          <div className="h-20 bg-[#f8f8f8] rounded-xl" />
          <div className="h-20 bg-[#f8f8f8] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  const { summary, duplicates, diagnosis } = data;
  const isWarning = summary.integrityStatus === 'WARNING';

  return (
    <div className="medical-card-white overflow-hidden">
      {/* Inspector Header */}
      <div className="p-5 border-b border-[#f0f0f0] bg-gradient-to-r from-[#fafafa] to-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl ${
              isWarning ? 'bg-[#fff7dd] text-[#f2b329]' : 'bg-[#eaf8f0] text-[#31b86b]'
            }`}
          >
            {isWarning ? (
              <ShieldAlert className="h-6 w-6 text-[#f2b329]" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-[#31b86b]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="section-title text-base font-semibold">
                Data Integrity Inspector
              </h2>
              {isWarning ? (
                <span className="badge badge-warning flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Relational Join Multiplier Flagged
                </span>
              ) : (
                <span className="badge badge-success flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Canonical 1:1 Metric Integrity
                </span>
              )}
            </div>
            <p className="text-xs muted-text mt-0.5">
              Live SQL diagnostic audit comparing distinct appointments against naive 1:N relational joins
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSqlComparison(!showSqlComparison)}
          className="btn-secondary text-xs h-8.5 px-3 self-start md:self-auto"
        >
          <FileCode2 className="h-3.5 w-3.5 text-[#0667fd]" />
          <span>{showSqlComparison ? 'Hide SQL Logic' : 'Inspect SQL Comparison'}</span>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Metric Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Unique Appointments */}
          <div className="stat-card border border-[#eaf8f0] bg-[#eaf8f0]/40 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1c7a43]">
              <span>Canonical Appointments</span>
              <ShieldCheck className="h-4 w-4 text-[#31b86b]" />
            </div>
            <div className="stat-value text-[#1c7a43]">
              {summary.uniqueAppointments.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#2e8b57]">
              True distinct appointments (production count)
            </p>
          </div>

          {/* Card 2: Diagnostic Joined Rows */}
          <div className="stat-card p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5f5f5f]">
              <span>Diagnostic Joined Rows</span>
              <Layers className="h-4 w-4 text-[#969696]" />
            </div>
            <div className="stat-value text-[#111111]">
              {summary.joinedRows.toLocaleString()}
            </div>
            <p className="text-[11px] muted-text">
              Multiplied rows from naive history join
            </p>
          </div>

          {/* Card 3: Duplicate Rows Overcount */}
          <div
            className={`stat-card p-4 border ${
              summary.duplicateRows > 0
                ? 'border-[#ffeeba] bg-[#fff7dd]/50'
                : 'border-[#ebebeb] bg-[#f8f8f8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#5f5f5f]">
              <span>Phantom Multiplied Rows</span>
              <GitBranch className="h-4 w-4 text-[#f2b329]" />
            </div>
            <div
              className={`stat-value ${
                summary.duplicateRows > 0 ? 'text-[#a67400]' : 'text-[#111111]'
              }`}
            >
              +{summary.duplicateRows.toLocaleString()}
            </div>
            <p className="text-[11px] muted-text">
              Overcount if naively using COUNT(*)
            </p>
          </div>

          {/* Card 4: Affected Appointments */}
          <div className="stat-card p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5f5f5f]">
              <span>Multiplied Appointments</span>
              <AlertTriangle className="h-4 w-4 text-[#969696]" />
            </div>
            <div className="stat-value text-[#111111]">
              {summary.affectedAppointments.toLocaleString()}
            </div>
            <p className="text-[11px] muted-text">
              Appointments with &gt;1 historical status transition
            </p>
          </div>
        </div>

        {/* Optional SQL Query Comparison Drawer */}
        {showSqlComparison && (
          <div className="medical-card p-4 bg-[#111111] text-white text-xs font-mono border-0">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262626]">
              <span className="font-semibold text-[#0667fd]">
                SQL Query Comparison: Naive vs Production Architecture
              </span>
              <span className="text-[11px] text-[#969696]">Section 34 Spec Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[#ef6b70] font-bold">
                  ❌ Incorrect: Naive One-to-Many Join
                </span>
                <pre className="p-3 bg-[#171717] rounded-lg text-zinc-300 text-[11px] overflow-x-auto border border-[#331c1d]">
{`SELECT COUNT(*)
FROM appointments a
LEFT JOIN appointment_status_history h
  ON h.appointment_id = a.id
WHERE ...active_filters;
-- Output: ${summary.joinedRows} (corrupted & inflated!)`}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="text-[#31b86b] font-bold">
                  ✓ Correct: Base Population Aggregation
                </span>
                <pre className="p-3 bg-[#171717] rounded-lg text-zinc-300 text-[11px] overflow-x-auto border border-[#143320]">
{`SELECT COUNT(*)
FROM appointments a
WHERE ...active_filters;

-- Output: ${summary.uniqueAppointments} (canonical & exact)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Affected Appointments List & Educational Explanations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Sample Duplicated Appointments */}
          <div className="lg:col-span-1 medical-card p-4 bg-[#f8f8f8]">
            <h3 className="section-title text-xs font-semibold uppercase tracking-wider text-[#5f5f5f] mb-2.5 flex items-center justify-between">
              <span>Affected Appointments</span>
              <span className="text-[11px] muted-text font-normal">Diagnostic Sample</span>
            </h3>

            {duplicates.length === 0 ? (
              <p className="text-xs muted-text py-4">
                No duplicate join occurrences found in the current filtered subset.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {duplicates.map((dup) => (
                  <div
                    key={dup.appointmentId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#ebebeb] text-xs shadow-2xs"
                  >
                    <span className="font-mono font-medium text-[#111111]">
                      {dup.appointmentCode}
                    </span>
                    <span className="badge badge-warning text-[11px]">
                      {dup.occurrences} join rows
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Columns: Root Cause & Solution Details */}
          <div className="lg:col-span-2 space-y-3">
            <div className="medical-card p-4 border border-[#fff7dd] bg-[#fff7dd]/40">
              <h4 className="text-xs font-bold text-[#a67400] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-[#f2b329]" />
                Root Cause: Relational Cardinality Multiplication
              </h4>
              <p className="text-xs text-[#8a6100] leading-relaxed">
                The <code className="font-mono font-semibold">appointments</code> table shares a
                one-to-many relationship with{' '}
                <code className="font-mono font-semibold">appointment_status_history</code>.
                When a query directly joins historical transitions, every status change
                (e.g.{' '}
                <span className="font-semibold text-[#111111]">
                  SCHEDULED &rarr; CONFIRMED &rarr; COMPLETED
                </span>
                ) duplicates the base appointment row. Counting rows after joining causes KPIs to
                overstate volume.
              </p>
            </div>

            <div className="medical-card p-4 border border-[#eaf8f0] bg-[#eaf8f0]/40">
              <h4 className="text-xs font-bold text-[#1c7a43] flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#31b86b]" />
                Engineering Solution: Isolated Base Aggregation
              </h4>
              <p className="text-xs text-[#20693d] leading-relaxed">
                CareMetric enforces consistent SQL filter predicates directly on the base appointment set.
                Metrics are aggregated from the filtered population before joining secondary history tables,
                guaranteeing verifiable and deterministic metrics regardless of active filters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
