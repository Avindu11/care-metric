import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { facilities } from '../../db/schema.js';
import { asc } from 'drizzle-orm';

export const facilitiesRouter: Router = Router();

facilitiesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        city: facilities.city,
      })
      .from(facilities)
      .orderBy(asc(facilities.name));

    res.status(200).json({ data: list });
  } catch (error) {
    next(error);
  }
});
