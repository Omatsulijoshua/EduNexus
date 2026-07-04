import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db';

const scoreEntrySchema = z.object({
  studentId: z.string().uuid(),
  caScore: z.number().min(0, 'CA score cannot be negative').max(40, 'CA score cannot exceed 40'),
  examScore: z.number().min(0, 'Exam score cannot be negative').max(60, 'Exam score cannot exceed 60'),
});

const submitGradesSchema = z.object({
  classId: z.string().uuid(),
  classArmId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  sessionId: z.string().uuid(),
  scores: z.array(scoreEntrySchema),
});

// Helper function to calculate letter grade based on total score (out of 100)
const calculateGrade = (total: number): string => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

// ==========================================
// 👨‍🏫 TEACHER GRADING CONTROLLERS
// ==========================================

export const getGradeBook = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { classId, classArmId, subjectId, termId, sessionId } = req.query;

  if (!classId || !classArmId || !subjectId || !termId || !sessionId) {
    res.status(400).json({ error: 'Missing required query parameters: classId, classArmId, subjectId, termId, sessionId.' });
    return;
  }

  try {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId },
    });
    if (!teacher) {
      res.status(404).json({ error: 'Teacher profile not found.' });
      return;
    }

    // Verify assignment security
    const isAssigned = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId: classId as string,
        classArmId: classArmId as string,
        subjectId: subjectId as string,
        sessionId: sessionId as string,
      },
    });

    if (!isAssigned) {
      res.status(403).json({ error: 'Access denied. You are not assigned to teach this class section or subject.' });
      return;
    }

    // Get all students in this class section
    const students = await prisma.studentProfile.findMany({
      where: {
        classId: classId as string,
        classArmId: classArmId as string,
        schoolId: teacher.schoolId,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });

    // Get existing results for these parameters
    const results = await prisma.result.findMany({
      where: {
        classId: classId as string,
        classArmId: classArmId as string,
        subjectId: subjectId as string,
        termId: termId as string,
        sessionId: sessionId as string,
      },
      include: {
        scores: true,
      },
    });

    // Map students with their scores
    const gradeBook = students.map((student) => {
      const studentResult = results.find((r) => r.studentId === student.id);
      const caScoreRecord = studentResult?.scores.find((s) => s.name === 'CA');
      const examScoreRecord = studentResult?.scores.find((s) => s.name === 'Exam');

      return {
        studentId: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        admissionNumber: student.admissionNumber,
        resultId: studentResult?.id || null,
        caScore: caScoreRecord?.score !== undefined ? caScoreRecord.score : null,
        examScore: examScoreRecord?.score !== undefined ? examScoreRecord.score : null,
        totalScore: studentResult?.totalScore !== undefined ? studentResult.totalScore : null,
        grade: studentResult?.grade || null,
        status: studentResult?.status || 'UNGRADED',
      };
    });

    res.status(200).json({ gradeBook });
  } catch (error) {
    console.error('GetGradeBook Error:', error);
    res.status(500).json({ error: 'Internal server error fetching grade book.' });
  }
};

export const submitGrades = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const parsedData = submitGradesSchema.parse(req.body);

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId },
    });
    if (!teacher) {
      res.status(404).json({ error: 'Teacher profile not found.' });
      return;
    }

    // Verify assignment security
    const isAssigned = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId: parsedData.classId,
        classArmId: parsedData.classArmId,
        subjectId: parsedData.subjectId,
        sessionId: parsedData.sessionId,
      },
    });

    if (!isAssigned) {
      res.status(403).json({ error: 'Access denied. You are not assigned to teach this class section or subject.' });
      return;
    }

    // Process all grades in a secure transaction
    await prisma.$transaction(async (tx) => {
      for (const entry of parsedData.scores) {
        const totalScore = entry.caScore + entry.examScore;
        const grade = calculateGrade(totalScore);

        // Find or create result
        const result = await tx.result.upsert({
          where: {
            studentId_subjectId_termId: {
              studentId: entry.studentId,
              subjectId: parsedData.subjectId,
              termId: parsedData.termId,
            },
          },
          update: {
            totalScore,
            grade,
            teacherId: teacher.id,
            classId: parsedData.classId,
            classArmId: parsedData.classArmId,
            sessionId: parsedData.sessionId,
          },
          create: {
            schoolId: teacher.schoolId,
            studentId: entry.studentId,
            classId: parsedData.classId,
            classArmId: parsedData.classArmId,
            subjectId: parsedData.subjectId,
            sessionId: parsedData.sessionId,
            termId: parsedData.termId,
            teacherId: teacher.id,
            status: 'DRAFT',
            totalScore,
            grade,
          },
        });

        // Upsert CA score
        const caRecord = await tx.resultScore.findFirst({
          where: { resultId: result.id, name: 'CA' },
        });
        if (caRecord) {
          await tx.resultScore.update({
            where: { id: caRecord.id },
            data: { score: entry.caScore },
          });
        } else {
          await tx.resultScore.create({
            data: {
              resultId: result.id,
              name: 'CA',
              score: entry.caScore,
              maxScore: 40,
            },
          });
        }

        // Upsert Exam score
        const examRecord = await tx.resultScore.findFirst({
          where: { resultId: result.id, name: 'Exam' },
        });
        if (examRecord) {
          await tx.resultScore.update({
            where: { id: examRecord.id },
            data: { score: entry.examScore },
          });
        } else {
          await tx.resultScore.create({
            data: {
              resultId: result.id,
              name: 'Exam',
              score: entry.examScore,
              maxScore: 60,
            },
          });
        }
      }
    });

    res.status(200).json({ message: 'Grades saved successfully as draft.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('SubmitGrades Error:', error);
    res.status(500).json({ error: 'Internal server error saving grades.' });
  }
};
