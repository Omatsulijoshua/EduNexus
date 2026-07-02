import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

// Validation Schemas
const sessionSchema = z.object({
  name: z.string().regex(/^\d{4}\/\d{4}$/, 'Session name must be in format YYYY/YYYY (e.g. 2026/2027)'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  isCurrent: z.boolean().default(false),
});

const termSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().min(2, 'Term name is required'),
  type: z.enum(['FIRST', 'SECOND', 'THIRD']),
  isCurrent: z.boolean().default(false),
});

const classSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  order: z.number().int().default(0),
});

const classArmSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1, 'Arm name is required'),
});

const subjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required').toUpperCase(),
  description: z.string().optional(),
});

const assignmentSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

// ==========================================
// 📅 ACADEMIC SESSIONS
// ==========================================

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.academicSession.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { name: 'desc' },
    });
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('GetSessions Error:', error);
    res.status(500).json({ error: 'Internal server error fetching sessions.' });
  }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = sessionSchema.parse(req.body);

    const existing = await prisma.academicSession.findFirst({
      where: { name: parsedData.name, schoolId: req.schoolId },
    });
    if (existing) {
      res.status(400).json({ error: 'Academic session already exists.' });
      return;
    }

    const session = await prisma.$transaction(async (tx) => {
      if (parsedData.isCurrent) {
        // Deactivate other current sessions
        await tx.academicSession.updateMany({
          where: { schoolId: req.schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return await tx.academicSession.create({
        data: {
          schoolId: req.schoolId!,
          name: parsedData.name,
          startDate: parsedData.startDate,
          endDate: parsedData.endDate,
          isCurrent: parsedData.isCurrent,
        },
      });
    });

    res.status(201).json({ message: 'Session created successfully.', session });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateSession Error:', error);
    res.status(500).json({ error: 'Internal server error creating session.' });
  }
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = sessionSchema.parse(req.body);

    const session = await prisma.academicSession.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!session) {
      res.status(404).json({ error: 'Academic session not found.' });
      return;
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      if (parsedData.isCurrent) {
        await tx.academicSession.updateMany({
          where: { schoolId: req.schoolId, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }

      return await tx.academicSession.update({
        where: { id },
        data: {
          name: parsedData.name,
          startDate: parsedData.startDate,
          endDate: parsedData.endDate,
          isCurrent: parsedData.isCurrent,
        },
      });
    });

    res.status(200).json({ message: 'Session updated successfully.', session: updatedSession });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateSession Error:', error);
    res.status(500).json({ error: 'Internal server error updating session.' });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const session = await prisma.academicSession.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    await prisma.academicSession.delete({ where: { id } });
    res.status(200).json({ message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('DeleteSession Error:', error);
    res.status(550).json({ error: 'Internal server error deleting session. Ensure no records depend on it.' });
  }
};

// ==========================================
// 📅 TERMS MANAGEMENT
// ==========================================

export const getTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const terms = await prisma.term.findMany({
      where: { schoolId: req.schoolId },
      include: {
        session: { select: { name: true } },
      },
      orderBy: [{ session: { name: 'desc' } }, { type: 'asc' }],
    });
    res.status(200).json({ terms });
  } catch (error) {
    console.error('GetTerms Error:', error);
    res.status(500).json({ error: 'Internal server error fetching terms.' });
  }
};

export const createTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = termSchema.parse(req.body);

    const existing = await prisma.term.findFirst({
      where: { sessionId: parsedData.sessionId, type: parsedData.type },
    });
    if (existing) {
      res.status(400).json({ error: 'This term type already exists in the selected session.' });
      return;
    }

    const term = await prisma.$transaction(async (tx) => {
      if (parsedData.isCurrent) {
        // Deactivate other current terms in the school
        await tx.term.updateMany({
          where: { schoolId: req.schoolId!, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return await tx.term.create({
        data: {
          schoolId: req.schoolId!,
          sessionId: parsedData.sessionId,
          name: parsedData.name,
          type: parsedData.type,
          isCurrent: parsedData.isCurrent,
        },
      });
    });

    res.status(201).json({ message: 'Term created successfully.', term });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateTerm Error:', error);
    res.status(500).json({ error: 'Internal server error creating term.' });
  }
};

export const updateTerm = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = termSchema.parse(req.body);

    const term = await prisma.term.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!term) {
      res.status(404).json({ error: 'Term not found.' });
      return;
    }

    const updatedTerm = await prisma.$transaction(async (tx) => {
      if (parsedData.isCurrent) {
        await tx.term.updateMany({
          where: { schoolId: req.schoolId!, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }

      return await tx.term.update({
        where: { id },
        data: {
          name: parsedData.name,
          isCurrent: parsedData.isCurrent,
        },
      });
    });

    res.status(200).json({ message: 'Term updated successfully.', term: updatedTerm });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateTerm Error:', error);
    res.status(500).json({ error: 'Internal server error updating term.' });
  }
};

// ==========================================
// 🏫 CLASSES MANAGEMENT
// ==========================================

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const classes = await prisma.class.findMany({
      where: { schoolId: req.schoolId },
      include: {
        arms: true,
      },
      orderBy: { order: 'asc' },
    });
    res.status(200).json({ classes });
  } catch (error) {
    console.error('GetClasses Error:', error);
    res.status(500).json({ error: 'Internal server error fetching classes.' });
  }
};

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = classSchema.parse(req.body);

    const existing = await prisma.class.findFirst({
      where: { name: parsedData.name, schoolId: req.schoolId },
    });
    if (existing) {
      res.status(400).json({ error: 'Class name already exists.' });
      return;
    }

    const klass = await prisma.class.create({
      data: {
        schoolId: req.schoolId!,
        name: parsedData.name,
        order: parsedData.order,
      },
    });

    res.status(201).json({ message: 'Class created successfully.', class: klass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateClass Error:', error);
    res.status(500).json({ error: 'Internal server error creating class.' });
  }
};

export const updateClass = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = classSchema.parse(req.body);

    const klass = await prisma.class.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!klass) {
      res.status(404).json({ error: 'Class not found.' });
      return;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: parsedData.name,
        order: parsedData.order,
      },
    });

    res.status(200).json({ message: 'Class updated successfully.', class: updatedClass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateClass Error:', error);
    res.status(500).json({ error: 'Internal server error updating class.' });
  }
};

export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const klass = await prisma.class.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!klass) {
      res.status(404).json({ error: 'Class not found.' });
      return;
    }

    await prisma.class.delete({ where: { id } });
    res.status(200).json({ message: 'Class deleted successfully.' });
  } catch (error) {
    console.error('DeleteClass Error:', error);
    res.status(500).json({ error: 'Internal server error deleting class. Ensure no student records are linked.' });
  }
};

// ==========================================
// 🏫 CLASS ARMS MANAGEMENT
// ==========================================

export const getClassArms = async (req: Request, res: Response): Promise<void> => {
  try {
    const arms = await prisma.classArm.findMany({
      where: { schoolId: req.schoolId },
      include: {
        class: { select: { name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
    });
    res.status(200).json({ arms });
  } catch (error) {
    console.error('GetClassArms Error:', error);
    res.status(500).json({ error: 'Internal server error fetching class arms.' });
  }
};

export const createClassArm = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = classArmSchema.parse(req.body);

    const existing = await prisma.classArm.findFirst({
      where: { classId: parsedData.classId, name: parsedData.name },
    });
    if (existing) {
      res.status(400).json({ error: 'Class arm name already exists in selected class.' });
      return;
    }

    const arm = await prisma.classArm.create({
      data: {
        schoolId: req.schoolId!,
        classId: parsedData.classId,
        name: parsedData.name,
      },
    });

    res.status(201).json({ message: 'Class arm created successfully.', arm });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateClassArm Error:', error);
    res.status(500).json({ error: 'Internal server error creating class arm.' });
  }
};

export const deleteClassArm = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const arm = await prisma.classArm.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!arm) {
      res.status(404).json({ error: 'Class arm not found.' });
      return;
    }

    await prisma.classArm.delete({ where: { id } });
    res.status(200).json({ message: 'Class arm deleted successfully.' });
  } catch (error) {
    console.error('DeleteClassArm Error:', error);
    res.status(500).json({ error: 'Internal server error deleting class arm.' });
  }
};

// ==========================================
// 📚 SUBJECTS MANAGEMENT
// ==========================================

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ subjects });
  } catch (error) {
    console.error('GetSubjects Error:', error);
    res.status(500).json({ error: 'Internal server error fetching subjects.' });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = subjectSchema.parse(req.body);

    const existingCode = await prisma.subject.findFirst({
      where: { code: parsedData.code, schoolId: req.schoolId },
    });
    if (existingCode) {
      res.status(400).json({ error: 'Subject code already exists.' });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: req.schoolId!,
        name: parsedData.name,
        code: parsedData.code,
        description: parsedData.description || null,
      },
    });

    res.status(201).json({ message: 'Subject created successfully.', subject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateSubject Error:', error);
    res.status(500).json({ error: 'Internal server error creating subject.' });
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const parsedData = subjectSchema.parse(req.body);

    const subject = await prisma.subject.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    // Check code uniqueness
    if (parsedData.code !== subject.code) {
      const codeExists = await prisma.subject.findFirst({
        where: { code: parsedData.code, schoolId: req.schoolId, id: { not: id } },
      });
      if (codeExists) {
        res.status(400).json({ error: 'Subject code already exists.' });
        return;
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name: parsedData.name,
        code: parsedData.code,
        description: parsedData.description || null,
      },
    });

    res.status(200).json({ message: 'Subject updated successfully.', subject: updatedSubject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateSubject Error:', error);
    res.status(500).json({ error: 'Internal server error updating subject.' });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const subject = await prisma.subject.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    res.status(200).json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    console.error('DeleteSubject Error:', error);
    res.status(500).json({ error: 'Internal server error deleting subject.' });
  }
};

// ==========================================
// 👨‍🏫 TEACHER ASSIGNMENTS
// ==========================================

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { schoolId: req.schoolId },
      include: {
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        class: { select: { name: true } },
        classArm: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        session: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ assignments });
  } catch (error) {
    console.error('GetAssignments Error:', error);
    res.status(500).json({ error: 'Internal server error fetching teacher assignments.' });
  }
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedData = assignmentSchema.parse(req.body);

    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        schoolId: req.schoolId!,
        classId: parsedData.classId,
        classArmId: parsedData.classArmId,
        subjectId: parsedData.subjectId,
        sessionId: parsedData.sessionId,
      },
    });

    if (existing) {
      res.status(400).json({ error: 'This subject has already been assigned to a teacher in the selected class and arm.' });
      return;
    }

    const assignment = await prisma.teacherAssignment.create({
      data: {
        schoolId: req.schoolId!,
        teacherId: parsedData.teacherId,
        classId: parsedData.classId,
        classArmId: parsedData.classArmId,
        subjectId: parsedData.subjectId,
        sessionId: parsedData.sessionId,
      },
    });

    res.status(201).json({ message: 'Teacher assigned successfully.', assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('CreateAssignment Error:', error);
    res.status(500).json({ error: 'Internal server error creating teacher assignment.' });
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { id, schoolId: req.schoolId },
    });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    await prisma.teacherAssignment.delete({ where: { id } });
    res.status(200).json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('DeleteAssignment Error:', error);
    res.status(500).json({ error: 'Internal server error deleting assignment.' });
  }
};
