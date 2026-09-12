'use client';

import { Activity, ShieldCheck, RefreshCw, Layers, Database, Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function DashboardHeader() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="border-b border-[#ebebeb] bg-white">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0667fd] text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-[#111111]">
                  CareMetric
                </span>
                <span className="badge badge-blue">
                  Clinical OS
                </span>
              </div>
            </div>
          </div>

          <nav className="top-nav hidden md:flex">
            <button className="nav-item nav-item-active">
              Analytics Overview
            </button>
            <button className="nav-item">
              Integrity Inspector
            </button>
            <button className="nav-item">
              Appointments
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#5f5f5f] bg-[#f8f8f8] px-3 py-1.5 rounded-full border border-[#ebebeb]">
            <span className="h-2 w-2 rounded-full bg-[#31b86b] animate-pulse" />
            <Database className="h-3 w-3 text-[#969696]" />
            <span className="font-medium text-[11px]">PostgreSQL Live</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            title="Refresh All Metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#5f5f5f] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Hero Subheader */}
      <div className="px-6 py-5 bg-gradient-to-b from-white to-[#fcfcfc]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#0667fd] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verifiable Metrics Engine
              </span>
            </div>
            <h1 className="dashboard-title">
              Appointment Analytics & Integrity
            </h1>
            <p className="text-xs text-[#5f5f5f] mt-1">
              End-to-end appointment operations, SQL join diagnostics, and regression-protected metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="badge badge-success flex items-center gap-1.5 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5 text-[#31b86b]" />
              Base-Set Aggregation Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
