import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

// Validation Schema for Landing Page Customization
const landingPageSchema = z.object({
  heroTitle: z.string().min(3, 'Hero title must be at least 3 characters'),
  heroDescription: z.string().min(5, 'Hero description must be at least 5 characters'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Primary color must be a valid hex color code'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Secondary color must be a valid hex color code'),
  aboutText: z.string().min(10, 'About text must be at least 10 characters'),
  contactEmail: z.string().email('Invalid contact email').nullable().optional(),
  contactPhone: z.string().min(7, 'Invalid contact phone').nullable().optional(),
  contactAddress: z.string().min(5, 'Invalid contact address').nullable().optional(),
  socialLinks: z.object({
    facebook: z.string().url().or(z.literal('')).optional(),
    twitter: z.string().url().or(z.literal('')).optional(),
    instagram: z.string().url().or(z.literal('')).optional(),
  }).optional().nullable(),
  galleryImages: z.array(z.string().url()).optional().nullable(),
  news: z.array(z.object({
    title: z.string().min(2),
    content: z.string().min(5),
    date: z.string(),
  })).optional().nullable(),
  isPublished: z.boolean().default(false),
});

// ==========================================
// 🏫 SCHOOL ADMIN ENDPOINTS
// ==========================================

// 1. Get own school landing page configuration
export const getLandingPageConfig = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;

  if (!schoolId) {
    res.status(400).json({ error: 'School context is required.' });
    return;
  }

  try {
    let landingPage = await prisma.schoolLandingPage.findUnique({
      where: { schoolId },
    });

    // If it doesn't exist, create default landing page
    if (!landingPage) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });
      landingPage = await prisma.schoolLandingPage.create({
        data: {
          schoolId,
          heroTitle: `Welcome to ${school?.name || 'Our School'}`,
          heroDescription: 'Providing quality education for a brighter future.',
          aboutText: 'We are dedicated to academic excellence.',
          contactEmail: school?.email,
          contactPhone: school?.phone,
          contactAddress: school?.address,
        },
      });
    }

    res.status(200).json({ landingPage });
  } catch (error) {
    console.error('GetLandingPageConfig Error:', error);
    res.status(500).json({ error: 'Internal server error fetching landing page configuration.' });
  }
};

// 2. Update own school landing page configuration
export const updateLandingPageConfig = async (req: Request, res: Response): Promise<void> => {
  const schoolId = req.schoolId;

  if (!schoolId) {
    res.status(400).json({ error: 'School context is required.' });
    return;
  }

  try {
    const parsedData = landingPageSchema.parse(req.body);

    const landingPage = await prisma.schoolLandingPage.upsert({
      where: { schoolId },
      update: {
        heroTitle: parsedData.heroTitle,
        heroDescription: parsedData.heroDescription,
        primaryColor: parsedData.primaryColor,
        secondaryColor: parsedData.secondaryColor,
        aboutText: parsedData.aboutText,
        contactEmail: parsedData.contactEmail || null,
        contactPhone: parsedData.contactPhone || null,
        contactAddress: parsedData.contactAddress || null,
        socialLinks: parsedData.socialLinks || null,
        galleryImages: parsedData.galleryImages || null,
        news: parsedData.news || null,
        isPublished: parsedData.isPublished,
      },
      create: {
        schoolId,
        heroTitle: parsedData.heroTitle,
        heroDescription: parsedData.heroDescription,
        primaryColor: parsedData.primaryColor,
        secondaryColor: parsedData.secondaryColor,
        aboutText: parsedData.aboutText,
        contactEmail: parsedData.contactEmail || null,
        contactPhone: parsedData.contactPhone || null,
        contactAddress: parsedData.contactAddress || null,
        socialLinks: parsedData.socialLinks || null,
        galleryImages: parsedData.galleryImages || null,
        news: parsedData.news || null,
        isPublished: parsedData.isPublished,
      },
    });

    res.status(200).json({ message: 'Landing page updated successfully.', landingPage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateLandingPageConfig Error:', error);
    res.status(500).json({ error: 'Internal server error updating landing page configuration.' });
  }
};

// ==========================================
// 🌐 PUBLIC SCHOOL ROUTE ENDPOINT
// ==========================================

// 3. Get public school portal info resolved by slug
export const getPublicSchoolPortal = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  try {
    const school = await prisma.school.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        status: true,
        landingPage: true,
      },
    });

    if (!school) {
      res.status(404).json({ error: 'School portal not found.' });
      return;
    }

    if (school.status === 'SUSPENDED') {
      res.status(403).json({ error: 'This school portal has been suspended by administration.' });
      return;
    }

    if (!school.landingPage || !school.landingPage.isPublished) {
      res.status(404).json({ error: 'This school portal has not been published yet.' });
      return;
    }

    res.status(200).json({
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        logoUrl: school.logoUrl,
        landingPage: school.landingPage,
      },
    });
  } catch (error) {
    console.error('GetPublicSchoolPortal Error:', error);
    res.status(500).json({ error: 'Internal server error fetching school portal.' });
  }
};
