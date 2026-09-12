import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { appointments, appointmentStatusHistory } from '../../db/schema.js';
import { buildAppointmentWhere } from '../../lib/filters.js';
import { filterQuerySchema } from '@caremetric/shared';
import { sql, eq } from 'drizzle-orm';

export const analyticsRouter: Router = Router();

/**
 * GET /api/analytics/appointments
 * Safe aggregation directly from the filtered appointments table.
 */
analyticsRouter.get('/appointments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = filterQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid analytics filter parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const filters = parseResult.data;
    const { whereClause } = buildAppointmentWhere(filters);

    const [record] = await db
      .select({
        total: sql<number>`count(*)::int`,
        scheduled: sql<number>`count(case when ${appointments.status} = 'SCHEDULED' then 1 end)::int`,
        confirmed: sql<number>`count(case when ${appointments.status} = 'CONFIRMED' then 1 end)::int`,
        completed: sql<number>`count(case when ${appointments.status} = 'COMPLETED' then 1 end)::int`,
        cancelled: sql<number>`count(case when ${appointments.status} = 'CANCELLED' then 1 end)::int`,
        noShow: sql<number>`count(case when ${appointments.status} = 'NO_SHOW' then 1 end)::int`,
      })
      .from(appointments)
      .where(whereClause);

    const metrics = {
      total: record?.total ?? 0,
      scheduled: record?.scheduled ?? 0,
      confirmed: record?.confirmed ?? 0,
      completed: record?.completed ?? 0,
      cancelled: record?.cancelled ?? 0,
      noShow: record?.noShow ?? 0,
    };

    res.status(200).json({
      filters: {
        from: filters.from ?? null,
        to: filters.to ?? null,
        providerId: filters.providerId ?? null,
        facilityId: filters.facilityId ?? null,
        status: filters.status ?? null,
      },
      metrics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/appointments/trend
 * Daily appointment counts grouped by appointment scheduled_at.
 */
analyticsRouter.get('/appointments/trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = filterQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid trend filter parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const filters = parseResult.data;
    const { whereClause } = buildAppointmentWhere(filters);

    const dateSql = sql<string>`to_char(${appointments.scheduledAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

    const rows = await db
      .select({
        date: dateSql,
        count: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .where(whereClause)
      .groupBy(dateSql)
      .orderBy(dateSql);

    res.status(200).json({
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/integrity
 * Signature Data Integrity Inspector comparing safe unique appointments
 * against a naive one-to-many join with status history.
 */
analyticsRouter.get('/integrity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = filterQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid integrity filter parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const filters = parseResult.data;
    const { whereClause } = buildAppointmentWhere(filters);

    // 1. Correct count: unique appointments from appointments table
    const [uniqueResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .where(whereClause);

    const uniqueAppointments = uniqueResult?.count ?? 0;

    // 2. Diagnostic naive joined count: joining status history directly
    const [joinedResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .leftJoin(
        appointmentStatusHistory,
        eq(appointmentStatusHistory.appointmentId, appointments.id),
      )
      .where(whereClause);

    const joinedRows = joinedResult?.count ?? 0;
    const duplicateRows = Math.max(0, joinedRows - uniqueAppointments);

    // 3. Find affected appointments with multiple joined occurrences
    const duplicateRowsList = await db
      .select({
        appointmentId: appointments.id,
        appointmentCode: appointments.appointmentCode,
        occurrences: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .leftJoin(
        appointmentStatusHistory,
        eq(appointmentStatusHistory.appointmentId, appointments.id),
      )
      .where(whereClause)
      .groupBy(appointments.id, appointments.appointmentCode)
      .having(sql`count(*) > 1`)
      .orderBy(sql`count(*) desc`, appointments.appointmentCode)
      .limit(50);

    const affectedAppointments = duplicateRowsList.length;
    const integrityStatus = duplicateRows > 0 ? 'WARNING' : 'CLEAN';

    res.status(200).json({
      summary: {
        uniqueAppointments,
        joinedRows,
        duplicateRows,
        affectedAppointments,
        integrityStatus,
      },
      duplicates: duplicateRowsList,
      diagnosis: {
        type: 'ONE_TO_MANY_JOIN_MULTIPLICATION',
        relationship: 'appointments -> appointment_status_history',
        message:
          'Joining appointment status history directly multiplies appointment rows. Appointment metrics must be aggregated from the filtered appointment set.',
      },
    });
  } catch (error) {
    next(error);
  }
});
