import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../utils/db';

// Validation Schemas
const teacherSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
});

const parentSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

const studentSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  admissionNumber: z.string().min(2, 'Admission number is required'),
  classId: z.string().uuid('Invalid class selection'),
  classArmId: z.string().uuid('Invalid class arm selection'),
  parentId: z.string().uuid('Invalid parent selection').nullable().optional(),
});

// ==========================================
// 👨‍🏫 TEACHERS MANAGEMENT
// ==========================================

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      where: { schoolId: req.schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('GetTeachers Error:', error);
    res.status(500).json({ error: 'Internal server error fetching teachers.' });
  }
};

export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = teacherSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsedData.password || 'password123', salt);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsedData.email,
          passwordHash,
          role: 'TEACHER',
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          phone: parsedData.phone || null,
          schoolId: req.schoolId!,
        },
      });

      const profile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          schoolId: req.schoolId!,
          qualification: parsedData.qualification || null,
          specialization: parsedData.specialization || null,
        },
      });

      return { user, profile };
    });

    res.status(201).json({ message: 'Teacher created successfully.', teacher: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateTeacher Error:', error);
    res.status(500).json({ error: 'Internal server error creating teacher.' });
  }
};

export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // TeacherProfile ID

  try {
    const parsedData = teacherSchema.parse(req.body);

    const profile = await prisma.teacherProfile.findFirst({
      where: { id, schoolId: req.schoolId },
      include: { user: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'Teacher not found.' });
      return;
    }

    // Check email uniqueness if email is changed
    if (parsedData.email !== profile.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email: parsedData.email, id: { not: profile.userId } },
      });
      if (emailExists) {
        res.status(400).json({ error: 'Email is already registered.' });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update User details
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          email: parsedData.email,
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          phone: parsedData.phone || null,
        },
      });

      // Update TeacherProfile details
      await tx.teacherProfile.update({
        where: { id },
        data: {
          qualification: parsedData.qualification || null,
          specialization: parsedData.specialization || null,
        },
      });
    });

    res.status(200).json({ message: 'Teacher updated successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateTeacher Error:', error);
    res.status(500).json({ error: 'Internal server error updating teacher.' });
  }
};

export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // TeacherProfile ID

  try {
    const profile = await prisma.teacherProfile.findFirst({
      where: { id, schoolId: req.schoolId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Teacher not found.' });
      return;
    }

    // Deleting the user will cascade delete the teacher profile due to schema constraints
    await prisma.user.delete({
      where: { id: profile.userId },
    });

    res.status(200).json({ message: 'Teacher deleted successfully.' });
  } catch (error) {
    console.error('DeleteTeacher Error:', error);
    res.status(500).json({ error: 'Internal server error deleting teacher.' });
  }
};

// ==========================================
// 👪 PARENTS MANAGEMENT
// ==========================================

export const getParents = async (req: Request, res: Response): Promise<void> => {
  try {
    const parents = await prisma.parentProfile.findMany({
      where: { schoolId: req.schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        },
        children: {
          select: {
            id: true,
            admissionNumber: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ parents });
  } catch (error) {
    console.error('GetParents Error:', error);
    res.status(500).json({ error: 'Internal server error fetching parents.' });
  }
};

export const createParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = parentSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsedData.password || 'password123', salt);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsedData.email,
          passwordHash,
          role: 'PARENT',
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          phone: parsedData.phone || null,
          schoolId: req.schoolId!,
        },
      });

      const profile = await tx.parentProfile.create({
        data: {
          userId: user.id,
          schoolId: req.schoolId!,
          address: parsedData.address || null,
          occupation: parsedData.occupation || null,
        },
      });

      return { user, profile };
    });

    res.status(201).json({ message: 'Parent created successfully.', parent: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateParent Error:', error);
    res.status(500).json({ error: 'Internal server error creating parent.' });
  }
};

export const updateParent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // ParentProfile ID

  try {
    const parsedData = parentSchema.parse(req.body);

    const profile = await prisma.parentProfile.findFirst({
      where: { id, schoolId: req.schoolId },
      include: { user: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'Parent not found.' });
      return;
    }

    if (parsedData.email !== profile.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email: parsedData.email, id: { not: profile.userId } },
      });
      if (emailExists) {
        res.status(400).json({ error: 'Email is already registered.' });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          email: parsedData.email,
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          phone: parsedData.phone || null,
        },
      });

      await tx.parentProfile.update({
        where: { id },
        data: {
          address: parsedData.address || null,
          occupation: parsedData.occupation || null,
        },
      });
    });

    res.status(200).json({ message: 'Parent updated successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateParent Error:', error);
    res.status(500).json({ error: 'Internal server error updating parent.' });
  }
};

export const deleteParent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // ParentProfile ID

  try {
    const profile = await prisma.parentProfile.findFirst({
      where: { id, schoolId: req.schoolId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Parent not found.' });
      return;
    }

    await prisma.user.delete({
      where: { id: profile.userId },
    });

    res.status(200).json({ message: 'Parent deleted successfully.' });
  } catch (error) {
    console.error('DeleteParent Error:', error);
    res.status(500).json({ error: 'Internal server error deleting parent.' });
  }
};

// ==========================================
// 🎓 STUDENTS MANAGEMENT
// ==========================================

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.studentProfile.findMany({
      where: { schoolId: req.schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        class: {
          select: { id: true, name: true },
        },
        classArm: {
          select: { id: true, name: true },
        },
        parent: {
          select: {
            id: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ students });
  } catch (error) {
    console.error('GetStudents Error:', error);
    res.status(500).json({ error: 'Internal server error fetching students.' });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = studentSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered.' });
      return;
    }

    // Check if admission number is already taken in this school
    const existingAdm = await prisma.studentProfile.findFirst({
      where: { admissionNumber: parsedData.admissionNumber, schoolId: req.schoolId },
    });
    if (existingAdm) {
      res.status(400).json({ error: 'Admission number is already taken.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsedData.password || 'password123', salt);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: parsedData.email,
          passwordHash,
          role: 'STUDENT',
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          schoolId: req.schoolId!,
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          schoolId: req.schoolId!,
          admissionNumber: parsedData.admissionNumber,
          classId: parsedData.classId,
          classArmId: parsedData.classArmId,
          parentId: parsedData.parentId || null,
        },
      });

      return { user, profile };
    });

    res.status(201).json({ message: 'Student created successfully.', student: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateStudent Error:', error);
    res.status(500).json({ error: 'Internal server error creating student.' });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // StudentProfile ID

  try {
    const parsedData = studentSchema.parse(req.body);

    const profile = await prisma.studentProfile.findFirst({
      where: { id, schoolId: req.schoolId },
      include: { user: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    if (parsedData.email !== profile.user.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email: parsedData.email, id: { not: profile.userId } },
      });
      if (emailExists) {
        res.status(400).json({ error: 'Email is already registered.' });
        return;
      }
    }

    // Check admission number uniqueness
    if (parsedData.admissionNumber !== profile.admissionNumber) {
      const admExists = await prisma.studentProfile.findFirst({
        where: {
          admissionNumber: parsedData.admissionNumber,
          schoolId: req.schoolId,
          id: { not: id },
        },
      });
      if (admExists) {
        res.status(400).json({ error: 'Admission number is already taken.' });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: profile.userId },
        data: {
          email: parsedData.email,
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
        },
      });

      await tx.studentProfile.update({
        where: { id },
        data: {
          admissionNumber: parsedData.admissionNumber,
          classId: parsedData.classId,
          classArmId: parsedData.classArmId,
          parentId: parsedData.parentId || null,
        },
      });
    });

    res.status(200).json({ message: 'Student updated successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateStudent Error:', error);
    res.status(500).json({ error: 'Internal server error updating student.' });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // StudentProfile ID

  try {
    const profile = await prisma.studentProfile.findFirst({
      where: { id, schoolId: req.schoolId },
    });

    if (!profile) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    await prisma.user.delete({
      where: { id: profile.userId },
    });

    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('DeleteStudent Error:', error);
    res.status(500).json({ error: 'Internal server error deleting student.' });
  }
};
