import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { appointments, patients, providers, facilities } from '../../db/schema.js';
import { buildAppointmentWhere } from '../../lib/filters.js';
import { appointmentListQuerySchema } from '@caremetric/shared';
import { count, desc, eq } from 'drizzle-orm';

export const appointmentsRouter: Router = Router();

appointmentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = appointmentListQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid appointment list filter parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { page, pageSize, ...filters } = parseResult.data;
    const { whereClause } = buildAppointmentWhere(filters);

    // 1. Get total count of matching unique appointments
    const [totalRecord] = await db
      .select({ count: count() })
      .from(appointments)
      .where(whereClause);

    const total = totalRecord?.count ? Number(totalRecord.count) : 0;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;

    // 2. Fetch paginated appointments with joined details
    const rows = await db
      .select({
        id: appointments.id,
        appointmentCode: appointments.appointmentCode,
        patientCode: patients.patientCode,
        providerId: providers.id,
        providerName: providers.name,
        facilityId: facilities.id,
        facilityName: facilities.name,
        status: appointments.status,
        scheduledAt: appointments.scheduledAt,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(providers, eq(appointments.providerId, providers.id))
      .innerJoin(facilities, eq(appointments.facilityId, facilities.id))
      .where(whereClause)
      .orderBy(desc(appointments.scheduledAt))
      .limit(pageSize)
      .offset(offset);

    const formattedData = rows.map((row) => ({
      id: row.id,
      appointmentCode: row.appointmentCode,
      patientCode: row.patientCode,
      provider: {
        id: row.providerId,
        name: row.providerName,
      },
      facility: {
        id: row.facilityId,
        name: row.facilityName,
      },
      status: row.status,
      scheduledAt: row.scheduledAt.toISOString(),
    }));

    res.status(200).json({
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});
