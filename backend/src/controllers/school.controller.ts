import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

// Zod Validation Schemas
const updateSchoolStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED']),
});

const updateSchoolProfileSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

// ==========================================
// 👑 SUPER ADMIN ENDPOINTS
// ==========================================

// 1. Get all registered schools with user counts
export const getAllSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        users: {
          select: {
            role: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format the response with role counts
    const formattedSchools = schools.map((school) => {
      const studentsCount = school.users.filter((u) => u.role === 'STUDENT').length;
      const teachersCount = school.users.filter((u) => u.role === 'TEACHER').length;
      const parentsCount = school.users.filter((u) => u.role === 'PARENT').length;
      const activeSubscription = school.subscriptions[0] || null;

      return {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        slug: school.slug,
        logoUrl: school.logoUrl,
        status: school.status,
        createdAt: school.createdAt,
        counts: {
          students: studentsCount,
          teachers: teachersCount,
          parents: parentsCount,
        },
        subscription: activeSubscription
          ? {
              planName: activeSubscription.plan.name,
              status: activeSubscription.status,
              endDate: activeSubscription.endDate,
            }
          : null,
      };
    });

    res.status(200).json({ schools: formattedSchools });
  } catch (error) {
    console.error('GetAllSchools Error:', error);
    res.status(500).json({ error: 'Internal server error fetching schools.' });
  }
};

// 2. Update school status (Approve, Suspend, Activate)
export const updateSchoolStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = updateSchoolStatusSchema.parse(req.body);

    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      res.status(404).json({ error: 'School not found.' });
      return;
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: { status: parsedData.status },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_SCHOOL_STATUS',
        details: `Updated school ${school.name} status to ${parsedData.status}`,
      },
    });

    res.status(200).json({
      message: `School status updated to ${parsedData.status} successfully.`,
      school: updatedSchool,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateSchoolStatus Error:', error);
    res.status(500).json({ error: 'Internal server error updating school status.' });
  }
};

// ==========================================
// 🏫 SCHOOL ADMIN ENDPOINTS
// ==========================================

// 3. Get own school profile
export const getSchoolProfile = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;

  if (!schoolId) {
    res.status(400).json({ error: 'School context is required.' });
    return;
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        landingPage: true,
      },
    });

    if (!school) {
      res.status(404).json({ error: 'School profile not found.' });
      return;
    }

    res.status(200).json({ school });
  } catch (error) {
    console.error('GetSchoolProfile Error:', error);
    res.status(500).json({ error: 'Internal server error fetching school profile.' });
  }
};

// 4. Update own school profile
export const updateSchoolProfile = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;

  if (!schoolId) {
    res.status(400).json({ error: 'School context is required.' });
    return;
  }

  try {
    const parsedData = updateSchoolProfileSchema.parse(req.body);

    // Check if new slug is taken by another school
    const existingSchoolWithSlug = await prisma.school.findFirst({
      where: {
        slug: parsedData.slug,
        id: { not: schoolId },
      },
    });

    if (existingSchoolWithSlug) {
      res.status(400).json({ error: 'The subdomain URL slug is already taken by another school.' });
      return;
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        address: parsedData.address,
        slug: parsedData.slug,
        logoUrl: parsedData.logoUrl || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        schoolId,
        userId: req.user!.userId,
        action: 'UPDATE_SCHOOL_PROFILE',
        details: `Updated school profile details.`,
      },
    });

    res.status(200).json({
      message: 'School profile updated successfully.',
      school: updatedSchool,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateSchoolProfile Error:', error);
    res.status(500).json({ error: 'Internal server error updating school profile.' });
  }
};
