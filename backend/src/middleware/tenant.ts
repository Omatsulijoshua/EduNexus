import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

declare global {
  namespace Express {
    interface Request {
      schoolId?: string;
    }
  }
}

// Middleware to resolve and enforce school tenant isolation
export const resolveTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 1. If user is authenticated
  if (req.user) {
    const { role, schoolId } = req.user;

    if (role === 'SUPER_ADMIN') {
      // Super Admin can specify which school they want to inspect via header
      const targetSchoolId = req.headers['x-school-id'] as string;
      if (targetSchoolId) {
        req.schoolId = targetSchoolId;
      }
      return next();
    }

    // For all other roles, enforce their token-embedded schoolId
    if (!schoolId) {
      res.status(400).json({ error: 'User is not associated with any school tenant.' });
      return;
    }

    req.schoolId = schoolId;
    return next();
  }

  // 2. If public route (not authenticated, e.g. landing pages)
  // Resolve schoolId by slug from header or query parameter
  const schoolSlug = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);

  if (schoolSlug) {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true, status: true },
      });

      if (!school) {
        res.status(404).json({ error: 'School not found.' });
        return;
      }

      if (school.status === 'SUSPENDED') {
        res.status(403).json({ error: 'This school portal has been suspended.' });
        return;
      }

      req.schoolId = school.id;
      return next();
    } catch (error) {
      console.error('Error resolving tenant by slug:', error);
      res.status(500).json({ error: 'Internal server error resolving tenant.' });
      return;
    }
  }

  // If no tenant context is provided or required
  next();
};

// Helper middleware to block requests that require a tenant but don't have one
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.schoolId) {
    res.status(400).json({ error: 'School tenant context (schoolId) is required for this resource.' });
    return;
  }
  next();
};
