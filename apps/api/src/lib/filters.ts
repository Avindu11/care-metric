import { and, gte, lt, eq, SQL } from 'drizzle-orm';
import { appointments } from '../db/schema.js';
import type { FilterQueryParams } from '@caremetric/shared';

export interface ParsedAppointmentFilters {
  whereClause: SQL | undefined;
  startDateInclusive?: Date | undefined;
  endDateExclusive?: Date | undefined;
}

/**
 * Parses filter query parameters and constructs a unified Drizzle WHERE clause.
 *
 * Date rules:
 * - `from` is inclusive: scheduledAt >= YYYY-MM-DDT00:00:00.000Z
 * - `to` is exclusive: scheduledAt < (YYYY-MM-DD + 1 day)T00:00:00.000Z
 *
 * Ensures all endpoints (appointments list, KPI analytics, trends, and integrity)
 * share exact identical filter semantics.
 */
export function buildAppointmentWhere(filters: FilterQueryParams): ParsedAppointmentFilters {
  const conditions: (SQL | undefined)[] = [];
  let startDateInclusive: Date | undefined;
  let endDateExclusive: Date | undefined;

  if (filters.from) {
    startDateInclusive = new Date(`${filters.from}T00:00:00.000Z`);
    conditions.push(gte(appointments.scheduledAt, startDateInclusive));
  }

  if (filters.to) {
    const toDate = new Date(`${filters.to}T00:00:00.000Z`);
    // Add 1 day for safe exclusive bound
    endDateExclusive = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
    conditions.push(lt(appointments.scheduledAt, endDateExclusive));
  }

  if (filters.providerId) {
    conditions.push(eq(appointments.providerId, filters.providerId));
  }

  if (filters.facilityId) {
    conditions.push(eq(appointments.facilityId, filters.facilityId));
  }

  if (filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  const validConditions = conditions.filter((c): c is SQL => c !== undefined);

  return {
    whereClause: validConditions.length > 0 ? and(...validConditions) : undefined,
    startDateInclusive,
    endDateExclusive,
  };
}
