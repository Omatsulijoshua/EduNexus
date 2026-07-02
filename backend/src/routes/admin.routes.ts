import { Router } from 'express';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getParents,
  createParent,
  updateParent,
  deleteParent,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/user-management.controller';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getTerms,
  createTerm,
  updateTerm,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassArms,
  createClassArm,
  deleteClassArm,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAssignments,
  createAssignment,
  deleteAssignment,
} from '../controllers/academic.controller';
import { authenticate, requireRoles } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

// Protect all routes under this router for SCHOOL_ADMIN role with resolved schoolId tenant context
router.use(authenticate);
router.use(requireRoles(['SCHOOL_ADMIN']));
router.use(resolveTenant);

// 👨‍🏫 Teachers Management Routes
router.get('/admin/teachers', getTeachers);
router.post('/admin/teachers', createTeacher);
router.put('/admin/teachers/:id', updateTeacher);
router.delete('/admin/teachers/:id', deleteTeacher);

// 👪 Parents Management Routes
router.get('/admin/parents', getParents);
router.post('/admin/parents', createParent);
router.put('/admin/parents/:id', updateParent);
router.delete('/admin/parents/:id', deleteParent);

// 🎓 Students Management Routes
router.get('/admin/students', getStudents);
router.post('/admin/students', createStudent);
router.put('/admin/students/:id', updateStudent);
router.delete('/admin/students/:id', deleteStudent);

// 📅 Academic Sessions Routes
router.get('/admin/sessions', getSessions);
router.post('/admin/sessions', createSession);
router.put('/admin/sessions/:id', updateSession);
router.delete('/admin/sessions/:id', deleteSession);

// 📅 Terms Routes
router.get('/admin/terms', getTerms);
router.post('/admin/terms', createTerm);
router.put('/admin/terms/:id', updateTerm);

// 🏫 Classes Routes
router.get('/admin/classes', getClasses);
router.post('/admin/classes', createClass);
router.put('/admin/classes/:id', updateClass);
router.delete('/admin/classes/:id', deleteClass);

// 🏫 Class Arms Routes
router.get('/admin/arms', getClassArms);
router.post('/admin/arms', createClassArm);
router.delete('/admin/arms/:id', deleteClassArm);

// 📚 Subjects Routes
router.get('/admin/subjects', getSubjects);
router.post('/admin/subjects', createSubject);
router.put('/admin/subjects/:id', updateSubject);
router.delete('/admin/subjects/:id', deleteSubject);

// 👨‍🏫 Teacher Assignments Routes
router.get('/admin/assignments', getAssignments);
router.post('/admin/assignments', createAssignment);
router.delete('/admin/assignments/:id', deleteAssignment);

export default router;
