import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/db';

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// ==========================================
// 🎓 STUDENT PORTAL ENDPOINTS
// ==========================================

export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        class: {
          select: { id: true, name: true },
        },
        classArm: {
          select: { id: true, name: true },
        },
        school: {
          select: { name: true },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    // Get current active session
    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId: student.schoolId, isCurrent: true },
    });

    // Get subjects assigned to this class and arm
    let subjectsCount = 0;
    let subjectsList: any[] = [];
    if (currentSession) {
      const assignments = await prisma.teacherAssignment.findMany({
        where: {
          schoolId: student.schoolId,
          classId: student.classId,
          classArmId: student.classArmId,
          sessionId: currentSession.id,
        },
        include: {
          subject: { select: { name: true, code: true } },
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      subjectsCount = assignments.length;
      subjectsList = assignments.map((asg) => ({
        id: asg.id,
        code: asg.subject.code,
        name: asg.subject.name,
        teacher: `${asg.teacher.user.firstName} ${asg.teacher.user.lastName}`,
      }));
    }

    // Get recent results/scores
    const recentScores = await prisma.resultScore.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        subject: { select: { name: true, code: true } },
        result: {
          include: {
            term: { select: { name: true } },
            session: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.status(200).json({
      schoolName: student.school.name,
      className: student.class.name,
      armName: student.classArm.name,
      admissionNumber: student.admissionNumber,
      subjectsCount,
      subjectsList,
      recentScores: recentScores.map((score) => ({
        id: score.id,
        subjectCode: score.subject.code,
        subjectName: score.subject.name,
        caScore: score.caScore,
        examScore: score.examScore,
        total: score.caScore + score.examScore,
        term: score.result.term.name,
        session: score.result.session.name,
      })),
    });
  } catch (error) {
    console.error('GetStudentDashboard Error:', error);
    res.status(500).json({ error: 'Internal server error fetching student dashboard.' });
  }
};

export const getStudentProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        class: { select: { name: true } },
        classArm: { select: { name: true } },
        parent: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error('GetStudentProfile Error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
};

export const updateStudentProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const parsedData = updateProfileSchema.parse(req.body);
    const updateData: any = {};

    if (parsedData.phone) {
      updateData.phone = parsedData.phone;
    }

    if (parsedData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(parsedData.password, salt);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No update data provided.' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('UpdateStudentProfile Error:', error);
    res.status(500).json({ error: 'Internal server error updating profile.' });
  }
};

// ==========================================
// 👪 PARENT PORTAL ENDPOINTS
// ==========================================

export const getParentDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        children: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } },
            classArm: { select: { name: true } },
          },
        },
      },
    });

    if (!parent) {
      res.status(404).json({ error: 'Parent profile not found.' });
      return;
    }

    res.status(200).json({
      childrenCount: parent.children.length,
      childrenList: parent.children.map((child) => ({
        id: child.id,
        firstName: child.user.firstName,
        lastName: child.user.lastName,
        admissionNumber: child.admissionNumber,
        className: child.class.name,
        armName: child.classArm.name,
      })),
    });
  } catch (error) {
    console.error('GetParentDashboard Error:', error);
    res.status(500).json({ error: 'Internal server error fetching parent dashboard.' });
  }
};

export const getParentChildren = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId },
    });

    if (!parent) {
      res.status(404).json({ error: 'Parent profile not found.' });
      return;
    }

    const children = await prisma.studentProfile.findMany({
      where: { parentId: parent.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        class: { select: { name: true } },
        classArm: { select: { name: true } },
        resultScores: {
          include: {
            subject: { select: { name: true, code: true } },
            result: {
              include: {
                term: { select: { name: true } },
                session: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.status(200).json({ children });
  } catch (error) {
    console.error('GetParentChildren Error:', error);
    res.status(500).json({ error: 'Internal server error fetching children academic details.' });
  }
};
