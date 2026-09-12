'use client';

import { useAnalyticsTrend } from '../../lib/api/endpoints';
import type { FilterQueryParams } from '@caremetric/shared';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

export function AppointmentTrendChart({ filters }: { filters: FilterQueryParams }) {
  const { data, isLoading, isError } = useAnalyticsTrend(filters);

  const trendData = data?.data || [];
  const totalVolume = trendData.reduce((sum, item) => sum + item.count, 0);

  const formattedData = trendData.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate: label,
    };
  });

  return (
    <div className="medical-card-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#f0f0f0] gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#eaf2ff] text-[#0667fd]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="section-title">
              Appointments Volume Over Time
            </h2>
            <p className="text-xs muted-text">
              Daily appointments grouped strictly by scheduled date in PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-blue text-xs py-1 px-3">
            Filtered Total: <strong className="ml-1 text-[#0667fd]">{totalVolume.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 w-full bg-[#f8f8f8] animate-pulse rounded-xl flex items-center justify-center text-xs text-[#969696]">
          Loading trend analytics...
        </div>
      ) : isError ? (
        <div className="h-64 w-full flex items-center justify-center text-xs text-[#dc4545]">
          Unable to load trend data
        </div>
      ) : formattedData.length === 0 ? (
        <div className="h-64 w-full flex flex-col items-center justify-center text-xs text-[#969696] gap-2">
          <Info className="h-6 w-6 text-[#dedede]" />
          <span>No appointments scheduled in the selected range</span>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0667fd" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#0667fd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebebeb" />
              <XAxis
                dataKey="displayDate"
                stroke="#969696"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#969696"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="medical-card p-3 shadow-md text-xs border border-[#ebebeb] bg-white">
                        <p className="font-semibold text-[#111111]">{label}</p>
                        <p className="text-[#0667fd] font-medium mt-0.5">
                          Appointments: <span className="font-bold text-[#111111]">{payload[0]?.value}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0667fd"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#primaryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
