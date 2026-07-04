import { Request, Response } from 'express';
import prisma from '../utils/db';

// Helper function to assign ordinal positions (e.g., 1st, 2nd, 3rd)
const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ==========================================
// 🏫 SCHOOL ADMIN - MASTER SHEET API
// ==========================================

export const getMasterSheet = async (req: Request, res: Response): Promise<void> => {
  const { classId, classArmId, termId, sessionId } = req.query;

  if (!classId || !classArmId || !termId || !sessionId) {
    res.status(400).json({ error: 'Missing query parameters: classId, classArmId, termId, sessionId.' });
    return;
  }

  try {
    // 1. Fetch all students in the class section
    const students = await prisma.studentProfile.findMany({
      where: {
        classId: classId as string,
        classArmId: classArmId as string,
        schoolId: req.schoolId,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { admissionNumber: 'asc' },
    });

    if (students.length === 0) {
      res.status(200).json({ students: [], subjects: [], classAverages: {} });
      return;
    }

    // 2. Fetch all subjects taught in this class section
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        classId: classId as string,
        classArmId: classArmId as string,
        sessionId: sessionId as string,
        schoolId: req.schoolId,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    // Extract unique subjects
    const subjectsMap = new Map();
    assignments.forEach((asg) => {
      subjectsMap.set(asg.subject.id, {
        id: asg.subject.id,
        name: asg.subject.name,
        code: asg.subject.code,
      });
    });
    const subjects = Array.from(subjectsMap.values());

    // 3. Fetch all result records for these students, term, and session
    const results = await prisma.result.findMany({
      where: {
        classId: classId as string,
        classArmId: classArmId as string,
        termId: termId as string,
        sessionId: sessionId as string,
        studentId: { in: students.map((s) => s.id) },
      },
      include: {
        scores: true,
      },
    });

    // 4. Calculate student sums, averages, and compile grid matrix
    const studentGrades = students.map((student) => {
      const studentResults = results.filter((r) => r.studentId === student.id);
      
      let totalAccumulated = 0;
      let subjectsGraded = 0;
      const scoresMap: { [key: string]: number | null } = {};

      subjects.forEach((sub) => {
        const resObj = studentResults.find((r) => r.subjectId === sub.id);
        if (resObj) {
          scoresMap[sub.id] = resObj.totalScore;
          totalAccumulated += resObj.totalScore;
          subjectsGraded++;
        } else {
          scoresMap[sub.id] = null;
        }
      });

      const average = subjectsGraded > 0 ? parseFloat((totalAccumulated / subjectsGraded).toFixed(2)) : 0;

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        scores: scoresMap,
        totalAccumulated,
        average,
        subjectsCount: subjectsGraded,
        position: 0, // Assigned below
      };
    });

    // 5. Rank students based on average score descending
    const rankedStudents = [...studentGrades].sort((a, b) => b.average - a.average);
    
    // Assign position ranks (handles ties cleanly)
    let currentRank = 1;
    for (let i = 0; i < rankedStudents.length; i++) {
      if (i > 0 && rankedStudents[i].average < rankedStudents[i - 1].average) {
        currentRank = i + 1;
      }
      const originalIndex = studentGrades.findIndex((s) => s.studentId === rankedStudents[i].studentId);
      if (originalIndex !== -1) {
        studentGrades[originalIndex].position = currentRank;
      }
    }

    // 6. Calculate class subject-wide averages
    const subjectAverages: { [key: string]: number } = {};
    subjects.forEach((sub) => {
      let sum = 0;
      let count = 0;
      studentGrades.forEach((st) => {
        const score = st.scores[sub.id];
        if (score !== null) {
          sum += score;
          count++;
        }
      });
      subjectAverages[sub.id] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    });

    res.status(200).json({
      students: studentGrades,
      subjects,
      subjectAverages,
    });
  } catch (error) {
    console.error('GetMasterSheet Error:', error);
    res.status(500).json({ error: 'Internal server error generating master sheet.' });
  }
};

// ==========================================
// 🎓 SHARED - REPORT SHEET API
// ==========================================

export const getReportSheet = async (req: Request, res: Response): Promise<void> => {
  const { studentId, termId, sessionId } = req.query;

  if (!studentId || !termId || !sessionId) {
    res.status(400).json({ error: 'Missing parameters: studentId, termId, sessionId.' });
    return;
  }

  const userRole = req.user?.role;
  const userId = req.user?.id;

  try {
    // 1. Fetch the target student profile details
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId as string },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true } },
        classArm: { select: { id: true, name: true } },
        school: { select: { name: true, email: true, phone: true, address: true, logoUrl: true } },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    // 2. Security Check: Enforce role-based access restrictions
    if (userRole === 'STUDENT') {
      if (student.userId !== userId) {
        res.status(403).json({ error: 'Access Denied. You can only view your own report card.' });
        return;
      }
    } else if (userRole === 'PARENT') {
      // Find parent record and verify child linking
      const parent = await prisma.parentProfile.findUnique({ where: { userId } });
      if (!parent || student.parentId !== parent.id) {
        res.status(403).json({ error: 'Access Denied. You can only view report cards of your linked children.' });
        return;
      }
    } else if (userRole !== 'SCHOOL_ADMIN') {
      res.status(403).json({ error: 'Access Denied.' });
      return;
    }

    // 3. Fetch all result cards in this class arm, term, and session (to calculate averages & position)
    const classResults = await prisma.result.findMany({
      where: {
        classId: student.classId,
        classArmId: student.classArmId,
        termId: termId as string,
        sessionId: sessionId as string,
      },
      include: {
        scores: true,
      },
    });

    // 4. Fetch the target student's results
    const studentResults = classResults.filter((r) => r.studentId === student.id);

    // Get list of unique subjects
    const subjects = await prisma.subject.findMany({
      where: { schoolId: student.schoolId },
      select: { id: true, name: true, code: true },
    });

    // 5. Build subjects scores list & calculate totals/positions
    const subjectGrades = studentResults.map((result) => {
      const caScore = result.scores.find((s) => s.name === 'CA')?.score || 0;
      const examScore = result.scores.find((s) => s.name === 'Exam')?.score || 0;
      const subject = subjects.find((s) => s.id === result.subjectId);

      // Calculate class average for this subject
      const allSubjectResults = classResults.filter((r) => r.subjectId === result.subjectId);
      const sum = allSubjectResults.reduce((acc, curr) => acc + curr.totalScore, 0);
      const classAverage = allSubjectResults.length > 0 ? parseFloat((sum / allSubjectResults.length).toFixed(2)) : 0;

      return {
        subjectCode: subject?.code || 'N/A',
        subjectName: subject?.name || 'Unknown',
        caScore,
        examScore,
        total: result.totalScore,
        grade: result.grade,
        classAverage,
      };
    });

    // Calculate overall term stats
    const totalStudentsInClass = await prisma.studentProfile.count({
      where: { classId: student.classId, classArmId: student.classArmId },
    });

    // Class ranking compilation
    const studentIdsInClass = await prisma.studentProfile.findMany({
      where: { classId: student.classId, classArmId: student.classArmId },
      select: { id: true },
    });

    const studentRankList = studentIdsInClass.map((st) => {
      const resultsForSt = classResults.filter((r) => r.studentId === st.id);
      const total = resultsForSt.reduce((acc, curr) => acc + curr.totalScore, 0);
      const avg = resultsForSt.length > 0 ? total / resultsForSt.length : 0;
      return { id: st.id, average: avg };
    });

    // Sort descending
    studentRankList.sort((a, b) => b.average - a.average);
    
    let positionIndex = 1;
    for (let i = 0; i < studentRankList.length; i++) {
      if (i > 0 && studentRankList[i].average < studentRankList[i - 1].average) {
        positionIndex = i + 1;
      }
      if (studentRankList[i].id === student.id) {
        break;
      }
    }

    const totalScoreAccumulated = subjectGrades.reduce((acc, curr) => acc + curr.total, 0);
    const overallAverage = subjectGrades.length > 0 ? parseFloat((totalScoreAccumulated / subjectGrades.length).toFixed(2)) : 0;

    // Fetch session and term names
    const session = await prisma.academicSession.findUnique({ where: { id: sessionId as string } });
    const term = await prisma.term.findUnique({ where: { id: termId as string } });

    res.status(200).json({
      school: student.school,
      student: {
        id: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        admissionNumber: student.admissionNumber,
        className: student.class.name,
        armName: student.classArm.name,
      },
      academic: {
        sessionName: session?.name || '',
        termName: term?.name || '',
      },
      results: subjectGrades,
      stats: {
        totalSubjects: subjectGrades.length,
        totalScore: totalScoreAccumulated,
        average: overallAverage,
        position: getOrdinal(positionIndex),
        classCount: totalStudentsInClass,
      },
    });
  } catch (error) {
    console.error('GetReportSheet Error:', error);
    res.status(500).json({ error: 'Internal server error compiling student report sheet.' });
  }
};
