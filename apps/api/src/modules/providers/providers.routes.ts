import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { providers } from '../../db/schema.js';
import { asc } from 'drizzle-orm';

export const providersRouter: Router = Router();

providersRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await db
      .select({
        id: providers.id,
        name: providers.name,
        specialty: providers.specialty,
      })
      .from(providers)
      .orderBy(asc(providers.name));

    res.status(200).json({ data: list });
  } catch (error) {
    next(error);
  }
});
