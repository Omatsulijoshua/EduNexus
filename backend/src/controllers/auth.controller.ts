import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// Zod Validation Schemas
const signupAdminSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  schoolEmail: z.string().email('Invalid school email address'),
  schoolPhone: z.string().min(7, 'Invalid school phone number'),
  schoolAddress: z.string().min(5, 'School address must be at least 5 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  adminEmail: z.string().email('Invalid admin email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  adminFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  adminLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  adminPhone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 1. School Admin Signup (Creates School + Admin User)
export const signupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = signupAdminSchema.parse(req.body);

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.adminEmail },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    // Check if school email already exists
    const existingSchoolEmail = await prisma.school.findUnique({
      where: { email: parsedData.schoolEmail },
    });
    if (existingSchoolEmail) {
      res.status(400).json({ error: 'School email is already registered' });
      return;
    }

    // Check if slug is already taken
    const existingSlug = await prisma.school.findUnique({
      where: { slug: parsedData.slug },
    });
    if (existingSlug) {
      res.status(400).json({ error: 'School URL slug is already taken' });
      return;
    }

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsedData.adminPassword, salt);

    // Run creation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create School
      const school = await tx.school.create({
        data: {
          name: parsedData.schoolName,
          email: parsedData.schoolEmail,
          phone: parsedData.schoolPhone,
          address: parsedData.schoolAddress,
          slug: parsedData.slug,
          status: 'PENDING', // Awaiting Super Admin approval
        },
      });

      // Create Default School Landing Page
      await tx.schoolLandingPage.create({
        data: {
          schoolId: school.id,
          heroTitle: `Welcome to ${school.name}`,
          heroDescription: `Providing quality education for a brighter future at ${school.name}.`,
          aboutText: `We are dedicated to academic excellence at ${school.name}.`,
          contactEmail: school.email,
          contactPhone: school.phone,
          contactAddress: school.address,
        },
      });

      // Create Admin User linked to School
      const user = await tx.user.create({
        data: {
          email: parsedData.adminEmail,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          firstName: parsedData.adminFirstName,
          lastName: parsedData.adminLastName,
          phone: parsedData.adminPhone || null,
          schoolId: school.id,
          isActive: true,
        },
      });

      return { school, user };
    });

    res.status(201).json({
      message: 'School and Admin registered successfully. Awaiting approval.',
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        status: result.school.status,
      },
      admin: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// 2. User Login (All Roles)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: parsedData.email },
      include: { school: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      return;
    }

    // Verify School Status if the user is associated with a school
    if (user.school && user.school.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your school portal has been suspended. Please contact admin.' });
      return;
    }

    // Verify Password
    const isPasswordValid = await bcrypt.compare(parsedData.password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate Tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolSlug: user.school?.slug || null,
        schoolName: user.school?.name || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

// 3. Refresh Access Token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User is inactive or no longer exists' });
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const newAccessToken = generateAccessToken(payload);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// 4. Get Current User Profile
export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
