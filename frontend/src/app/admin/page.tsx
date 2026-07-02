'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

// Interface Declarations
interface SchoolProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  logoUrl: string | null;
  status: string;
}

interface Teacher {
  id: string;
  qualification: string | null;
  specialization: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
  };
}

interface Parent {
  id: string;
  address: string | null;
  occupation: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

interface Student {
  id: string;
  admissionNumber: string;
  class: { id: string; name: string };
  classArm: { id: string; name: string };
  parent: { id: string; user: { firstName: string; lastName: string } } | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Session {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Term {
  id: string;
  name: string;
  type: 'FIRST' | 'SECOND' | 'THIRD';
  isCurrent: boolean;
  session: { name: string };
}

interface ClassModel {
  id: string;
  name: string;
  order: number;
}

interface ArmModel {
  id: string;
  name: string;
  class: { name: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface Assignment {
  id: string;
  teacher: { user: { firstName: string; lastName: string } };
  class: { name: string };
  classArm: { name: string };
  subject: { name: string; code: string };
  session: { name: string };
}

export default function SchoolAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'users' | 'assignments'>('profile');

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [arms, setArms] = useState<ArmModel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Sub-tabs for Academic tab
  const [academicSubTab, setAcademicSubTab] = useState<'sessions' | 'terms' | 'classes' | 'arms' | 'subjects'>('sessions');
  // Sub-tabs for Users tab
  const [usersSubTab, setUsersSubTab] = useState<'teachers' | 'parents' | 'students'>('teachers');

  // Form States (Modals)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    | 'edit_profile'
    | 'add_teacher' | 'edit_teacher'
    | 'add_parent' | 'edit_parent'
    | 'add_student' | 'edit_student'
    | 'add_session'
    | 'add_term'
    | 'add_class'
    | 'add_arm'
    | 'add_subject'
    | 'add_assignment'
  >('edit_profile');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Field States
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', address: '', slug: '', logoUrl: '' });
  const [teacherForm, setTeacherForm] = useState({ email: '', firstName: '', lastName: '', phone: '', qualification: '', specialization: '', password: '' });
  const [parentForm, setParentForm] = useState({ email: '', firstName: '', lastName: '', phone: '', address: '', occupation: '', password: '' });
  const [studentForm, setStudentForm] = useState({ email: '', firstName: '', lastName: '', admissionNumber: '', classId: '', classArmId: '', parentId: '', password: '' });
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [termForm, setTermForm] = useState({ sessionId: '', name: '', type: 'FIRST' as 'FIRST' | 'SECOND' | 'THIRD', isCurrent: false });
  const [classForm, setClassForm] = useState({ name: '', order: 0 });
  const [armForm, setArmForm] = useState({ classId: '', name: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', classId: '', classArmId: '', subjectId: '', sessionId: '' });

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await api.get<{ school: SchoolProfile }>('/admin/school/profile');
      setSchoolProfile(profileData.school);
      setProfileForm({
        name: profileData.school.name,
        email: profileData.school.email,
        phone: profileData.school.phone,
        address: profileData.school.address,
        slug: profileData.school.slug,
        logoUrl: profileData.school.logoUrl || '',
      });

      const teachersData = await api.get<{ teachers: Teacher[] }>('/admin/teachers');
      setTeachers(teachersData.teachers);

      const parentsData = await api.get<{ parents: Parent[] }>('/admin/parents');
      setParents(parentsData.parents);

      const studentsData = await api.get<{ students: Student[] }>('/admin/students');
      setStudents(studentsData.students);

      const sessionsData = await api.get<{ sessions: Session[] }>('/admin/sessions');
      setSessions(sessionsData.sessions);

      const termsData = await api.get<{ terms: Term[] }>('/admin/terms');
      setTerms(termsData.terms);

      const classesData = await api.get<{ classes: ClassModel[] }>('/admin/classes');
      setClasses(classesData.classes);

      const armsData = await api.get<{ arms: ArmModel[] }>('/admin/arms');
      setArms(armsData.arms);

      const subjectsData = await api.get<{ subjects: Subject[] }>('/admin/subjects');
      setSubjects(subjectsData.subjects);

      const assignmentsData = await api.get<{ assignments: Assignment[] }>('/admin/assignments');
      setAssignments(assignmentsData.assignments);
    } catch (err: any) {
      setError(err.message || 'Failed to load school management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/school/profile', profileForm);
      setIsModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  // CRUD Submissions
  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      switch (modalType) {
        case 'add_teacher':
          await api.post('/admin/teachers', teacherForm);
          break;
        case 'edit_teacher':
          await api.put(`/admin/teachers/${editingId}`, teacherForm);
          break;
        case 'add_parent':
          await api.post('/admin/parents', parentForm);
          break;
        case 'edit_parent':
          await api.put(`/admin/parents/${editingId}`, parentForm);
          break;
        case 'add_student':
          await api.post('/admin/students', studentForm);
          break;
        case 'edit_student':
          await api.put(`/admin/students/${editingId}`, studentForm);
          break;
        case 'add_session':
          await api.post('/admin/sessions', sessionForm);
          break;
        case 'add_term':
          await api.post('/admin/terms', termForm);
          break;
        case 'add_class':
          await api.post('/admin/classes', classForm);
          break;
        case 'add_arm':
          await api.post('/admin/arms', armForm);
          break;
        case 'add_subject':
          await api.post('/admin/subjects', subjectForm);
          break;
        case 'add_assignment':
          await api.post('/admin/assignments', assignmentForm);
          break;
      }
      setIsModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteItem = async (type: 'teacher' | 'parent' | 'student' | 'session' | 'class' | 'arm' | 'subject' | 'assignment', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      let endpoint = '';
      if (type === 'teacher') endpoint = `/admin/teachers/${id}`;
      else if (type === 'parent') endpoint = `/admin/parents/${id}`;
      else if (type === 'student') endpoint = `/admin/students/${id}`;
      else if (type === 'session') endpoint = `/admin/sessions/${id}`;
      else if (type === 'class') endpoint = `/admin/classes/${id}`;
      else if (type === 'arm') endpoint = `/admin/arms/${id}`;
      else if (type === 'subject') endpoint = `/admin/subjects/${id}`;
      else if (type === 'assignment') endpoint = `/admin/assignments/${id}`;

      await api.delete(endpoint);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || `Failed to delete ${type}`);
    }
  };

  // Set forms for editing
  const openEditModal = (type: 'teacher' | 'parent' | 'student', item: any) => {
    setEditingId(item.id);
    if (type === 'teacher') {
      setTeacherForm({
        email: item.user.email,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        phone: item.user.phone || '',
        qualification: item.qualification || '',
        specialization: item.specialization || '',
        password: '',
      });
      setModalType('edit_teacher');
    } else if (type === 'parent') {
      setParentForm({
        email: item.user.email,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        phone: item.user.phone || '',
        address: item.address || '',
        occupation: item.occupation || '',
        password: '',
      });
      setModalType('edit_parent');
    } else if (type === 'student') {
      setStudentForm({
        email: item.user.email,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        admissionNumber: item.admissionNumber,
        classId: item.class.id,
        classArmId: item.classArm.id,
        parentId: item.parent?.id || '',
        password: '',
      });
      setModalType('edit_student');
    }
    setIsModalOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Admin</span>
              <span className="text-xs text-slate-500 truncate font-semibold uppercase tracking-wider">{schoolProfile?.name}</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'profile' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                🏫 School Profile
              </button>
              <button
                onClick={() => setActiveTab('academic')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'academic' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                📅 Academic Structure
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                👨‍👩‍👧 User Accounts
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'assignments' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                👨‍🏫 Teacher Assignments
              </button>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">School Administration</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
                {schoolProfile?.name} Management
              </h1>
            </div>
            <button
              onClick={logout}
              className="md:hidden py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold rounded-xl text-sm transition-colors"
            >
              Logout
            </button>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 rounded-full animate-spin border-t-transparent animate-spin"></div>
              <p className="text-slate-450 text-sm">Loading portal management...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Tab 1: SCHOOL PROFILE */}
              {activeTab === 'profile' && schoolProfile && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</h2>
                      <button
                        onClick={() => {
                          setModalType('edit_profile');
                          setIsModalOpen(true);
                        }}
                        className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-650 dark:text-slate-350">
                      <p><span className="font-semibold text-slate-800 dark:text-white">School Name:</span> {schoolProfile.name}</p>
                      <p><span className="font-semibold text-slate-800 dark:text-white">Subdomain Slug:</span> {schoolProfile.slug}.edunexus.com</p>
                      <p><span className="font-semibold text-slate-800 dark:text-white">Contact Email:</span> {schoolProfile.email}</p>
                      <p><span className="font-semibold text-slate-800 dark:text-white">Contact Phone:</span> {schoolProfile.phone}</p>
                      <p className="md:col-span-2"><span className="font-semibold text-slate-800 dark:text-white">Physical Address:</span> {schoolProfile.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: ACADEMIC STRUCTURE */}
              {activeTab === 'academic' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Academic sub navigation */}
                  <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {(['sessions', 'terms', 'classes', 'arms', 'subjects'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setAcademicSubTab(sub)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                          academicSubTab === sub
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  {/* Sessions CRUD */}
                  {academicSubTab === 'sessions' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Academic Sessions</h3>
                        <button
                          onClick={() => {
                            setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false });
                            setModalType('add_session');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Session
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Session Name</th>
                              <th className="py-2.5 px-4">Start Date</th>
                              <th className="py-2.5 px-4">End Date</th>
                              <th className="py-2.5 px-4">Current?</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map((s) => (
                              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                                <td className="py-3 px-4">{new Date(s.startDate).toLocaleDateString()}</td>
                                <td className="py-3 px-4">{new Date(s.endDate).toLocaleDateString()}</td>
                                <td className="py-3 px-4">
                                  {s.isCurrent ? (
                                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">Current</span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteItem('session', s.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Terms CRUD */}
                  {academicSubTab === 'terms' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Academic Terms</h3>
                        <button
                          onClick={() => {
                            setTermForm({ sessionId: sessions[0]?.id || '', name: '', type: 'FIRST', isCurrent: false });
                            setModalType('add_term');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Term
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Term Name</th>
                              <th className="py-2.5 px-4">Session</th>
                              <th className="py-2.5 px-4">Type</th>
                              <th className="py-2.5 px-4">Current?</th>
                            </tr>
                          </thead>
                          <tbody>
                            {terms.map((t) => (
                              <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{t.name}</td>
                                <td className="py-3 px-4">{t.session.name}</td>
                                <td className="py-3 px-4 uppercase">{t.type}</td>
                                <td className="py-3 px-4">
                                  {t.isCurrent ? (
                                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">Active</span>
                                  ) : (
                                    <span className="text-slate-500 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Classes CRUD */}
                  {academicSubTab === 'classes' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Classes Setup</h3>
                        <button
                          onClick={() => {
                            setClassForm({ name: '', order: classes.length + 1 });
                            setModalType('add_class');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Class
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Class Name</th>
                              <th className="py-2.5 px-4">Display Order</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classes.map((c) => (
                              <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                                <td className="py-3 px-4">{c.order}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteItem('class', c.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Class Arms CRUD */}
                  {academicSubTab === 'arms' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Class Arms (Sections)</h3>
                        <button
                          onClick={() => {
                            setArmForm({ classId: classes[0]?.id || '', name: '' });
                            setModalType('add_arm');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Class Arm
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Class</th>
                              <th className="py-2.5 px-4">Arm Section</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {arms.map((a) => (
                              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{a.class.name}</td>
                                <td className="py-3 px-4">{a.name}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteItem('arm', a.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Subjects CRUD */}
                  {academicSubTab === 'subjects' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">School Subjects</h3>
                        <button
                          onClick={() => {
                            setSubjectForm({ name: '', code: '', description: '' });
                            setModalType('add_subject');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Subject
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Subject Code</th>
                              <th className="py-2.5 px-4">Subject Name</th>
                              <th className="py-2.5 px-4">Description</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjects.map((sub) => (
                              <tr key={sub.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-450">{sub.code}</td>
                                <td className="py-3 px-4 text-slate-900 dark:text-white">{sub.name}</td>
                                <td className="py-3 px-4 text-xs max-w-xs truncate">{sub.description || '-'}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteItem('subject', sub.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: USER ACCOUNTS */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Users sub navigation */}
                  <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {(['teachers', 'parents', 'students'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setUsersSubTab(sub)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                          usersSubTab === sub
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  {/* Teachers Table */}
                  {usersSubTab === 'teachers' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">School Teachers</h3>
                        <button
                          onClick={() => {
                            setTeacherForm({ email: '', firstName: '', lastName: '', phone: '', qualification: '', specialization: '', password: '' });
                            setModalType('add_teacher');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Teacher
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Name</th>
                              <th className="py-2.5 px-4">Email</th>
                              <th className="py-2.5 px-4">Qualification</th>
                              <th className="py-2.5 px-4">Specialization</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teachers.map((t) => (
                              <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{t.user.firstName} {t.user.lastName}</td>
                                <td className="py-3 px-4">{t.user.email}</td>
                                <td className="py-3 px-4">{t.qualification || '-'}</td>
                                <td className="py-3 px-4 text-xs">{t.specialization || '-'}</td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => openEditModal('teacher', t)}
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('teacher', t.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Parents Table */}
                  {usersSubTab === 'parents' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Parents / Guardians</h3>
                        <button
                          onClick={() => {
                            setParentForm({ email: '', firstName: '', lastName: '', phone: '', address: '', occupation: '', password: '' });
                            setModalType('add_parent');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Parent
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Name</th>
                              <th className="py-2.5 px-4">Email / Phone</th>
                              <th className="py-2.5 px-4">Linked Children</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parents.map((p) => (
                              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{p.user.firstName} {p.user.lastName}</td>
                                <td className="py-3 px-4">
                                  <div>{p.user.email}</div>
                                  <div className="text-xs text-slate-500">{p.user.phone || '-'}</div>
                                </td>
                                <td className="py-3 px-4 text-xs font-semibold text-blue-600 dark:text-blue-450">
                                  {p.children.map((child) => `${child.user.firstName} (${child.admissionNumber})`).join(', ') || '-'}
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => openEditModal('parent', p)}
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('parent', p.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Students Table */}
                  {usersSubTab === 'students' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Student Enrollments</h3>
                        <button
                          onClick={() => {
                            setStudentForm({ email: '', firstName: '', lastName: '', admissionNumber: '', classId: classes[0]?.id || '', classArmId: arms[0]?.id || '', parentId: parents[0]?.id || '', password: '' });
                            setModalType('add_student');
                            setIsModalOpen(true);
                          }}
                          className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Add Student
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4">Adm No.</th>
                              <th className="py-2.5 px-4">Name</th>
                              <th className="py-2.5 px-4">Class arm</th>
                              <th className="py-2.5 px-4">Parent</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((st) => (
                              <tr key={st.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-450">{st.admissionNumber}</td>
                                <td className="py-3 px-4 text-slate-900 dark:text-white">{st.user.firstName} {st.user.lastName}</td>
                                <td className="py-3 px-4">{st.class.name} ({st.classArm.name})</td>
                                <td className="py-3 px-4 text-xs">{st.parent ? `${st.parent.user.firstName} ${st.parent.user.lastName}` : <span className="italic text-slate-500">Unlinked</span>}</td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => openEditModal('student', st)}
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('student', st.id)}
                                    className="text-xs text-rose-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: TEACHER ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Teacher Course & Class Assignments</h3>
                    <button
                      onClick={() => {
                        setAssignmentForm({
                          teacherId: teachers[0]?.id || '',
                          classId: classes[0]?.id || '',
                          classArmId: arms[0]?.id || '',
                          subjectId: subjects[0]?.id || '',
                          sessionId: sessions[0]?.id || '',
                        });
                        setModalType('add_assignment');
                        setIsModalOpen(true);
                      }}
                      className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Assign Teacher
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-350">
                      <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Teacher Name</th>
                          <th className="py-2.5 px-4">Subject assigned</th>
                          <th className="py-2.5 px-4">Class (Arm)</th>
                          <th className="py-2.5 px-4">Academic Session</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((asg) => (
                          <tr key={asg.id} className="border-b border-slate-100 dark:border-slate-800/50">
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {asg.teacher.user.firstName} {asg.teacher.user.lastName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold">{asg.subject.code}</span> - {asg.subject.name}
                            </td>
                            <td className="py-3 px-4">{asg.class.name} ({asg.classArm.name})</td>
                            <td className="py-3 px-4">{asg.session.name}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('assignment', asg.id)}
                                className="text-xs text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Forms Modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp text-slate-800 dark:text-slate-100">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {modalType === 'edit_profile' ? 'Edit School Profile' :
                 modalType.startsWith('add_') ? `Add ${modalType.split('_')[1].toUpperCase()}` : `Edit ${modalType.split('_')[1].toUpperCase()}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Profile update form */}
            {modalType === 'edit_profile' ? (
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={profileForm.slug}
                    onChange={(e) => setProfileForm({ ...profileForm, slug: e.target.value.toLowerCase().trim() })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCrudSubmit} className="p-6 space-y-4">
                {/* 1. TEACHER FIELDS */}
                {(modalType === 'add_teacher' || modalType === 'edit_teacher') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">FIRST NAME</label>
                        <input
                          type="text"
                          required
                          value={teacherForm.firstName}
                          onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">LAST NAME</label>
                        <input
                          type="text"
                          required
                          value={teacherForm.lastName}
                          onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">EMAIL</label>
                      <input
                        type="email"
                        required
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                    {modalType === 'add_teacher' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">DEFAULT PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={teacherForm.password}
                          onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="Min 6 characters"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">QUALIFICATION</label>
                        <input
                          type="text"
                          value={teacherForm.qualification}
                          onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="e.g. B.Ed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">SPECIALIZATION</label>
                        <input
                          type="text"
                          value={teacherForm.specialization}
                          onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="e.g. Mathematics"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PARENT FIELDS */}
                {(modalType === 'add_parent' || modalType === 'edit_parent') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">FIRST NAME</label>
                        <input
                          type="text"
                          required
                          value={parentForm.firstName}
                          onChange={(e) => setParentForm({ ...parentForm, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">LAST NAME</label>
                        <input
                          type="text"
                          required
                          value={parentForm.lastName}
                          onChange={(e) => setParentForm({ ...parentForm, lastName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">EMAIL</label>
                      <input
                        type="email"
                        required
                        value={parentForm.email}
                        onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                    {modalType === 'add_parent' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={parentForm.password}
                          onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STUDENT FIELDS */}
                {(modalType === 'add_student' || modalType === 'edit_student') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">FIRST NAME</label>
                        <input
                          type="text"
                          required
                          value={studentForm.firstName}
                          onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">LAST NAME</label>
                        <input
                          type="text"
                          required
                          value={studentForm.lastName}
                          onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">EMAIL</label>
                        <input
                          type="email"
                          required
                          value={studentForm.email}
                          onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">ADMISSION NUMBER</label>
                        <input
                          type="text"
                          required
                          value={studentForm.admissionNumber}
                          onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    {modalType === 'add_student' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">CLASS</label>
                        <select
                          value={studentForm.classId}
                          onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">ARM</label>
                        <select
                          value={studentForm.classArmId}
                          onChange={(e) => setStudentForm({ ...studentForm, classArmId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {arms.filter(a => a.class.name === classes.find(c => c.id === studentForm.classId)?.name).map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">LINK PARENT (OPTIONAL)</label>
                      <select
                        value={studentForm.parentId}
                        onChange={(e) => setStudentForm({ ...studentForm, parentId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      >
                        <option value="">-- Select Parent --</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>{p.user.firstName} {p.user.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. ACADEMIC SESSIONS FIELDS */}
                {modalType === 'add_session' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">SESSION NAME (YYYY/YYYY)</label>
                      <input
                        type="text"
                        required
                        value={sessionForm.name}
                        onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        placeholder="e.g. 2026/2027"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">START DATE</label>
                        <input
                          type="date"
                          required
                          value={sessionForm.startDate}
                          onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">END DATE</label>
                        <input
                          type="date"
                          required
                          value={sessionForm.endDate}
                          onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isCurrent"
                        checked={sessionForm.isCurrent}
                        onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
                      />
                      <label htmlFor="isCurrent" className="text-sm font-semibold text-slate-650">Set as Current Session</label>
                    </div>
                  </div>
                )}

                {/* 5. ACADEMIC TERMS FIELDS */}
                {modalType === 'add_term' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">ACADEMIC SESSION</label>
                      <select
                        value={termForm.sessionId}
                        onChange={(e) => setTermForm({ ...termForm, sessionId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">TERM NAME</label>
                        <input
                          type="text"
                          required
                          value={termForm.name}
                          onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="e.g. First Term"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">TERM TYPE</label>
                        <select
                          value={termForm.type}
                          onChange={(e) => setTermForm({ ...termForm, type: e.target.value as 'FIRST' | 'SECOND' | 'THIRD' })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          <option value="FIRST">First Term</option>
                          <option value="SECOND">Second Term</option>
                          <option value="THIRD">Third Term</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isCurrentTerm"
                        checked={termForm.isCurrent}
                        onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
                      />
                      <label htmlFor="isCurrentTerm" className="text-sm font-semibold text-slate-650">Set as Current Active Term</label>
                    </div>
                  </div>
                )}

                {/* 6. CLASS FIELDS */}
                {modalType === 'add_class' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">CLASS NAME</label>
                      <input
                        type="text"
                        required
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        placeholder="e.g. JSS 1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">DISPLAY ORDER</label>
                      <input
                        type="number"
                        required
                        value={classForm.order}
                        onChange={(e) => setClassForm({ ...classForm, order: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 7. CLASS ARM FIELDS */}
                {modalType === 'add_arm' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">SELECT CLASS</label>
                      <select
                        value={armForm.classId}
                        onChange={(e) => setArmForm({ ...armForm, classId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">ARM NAME</label>
                      <input
                        type="text"
                        required
                        value={armForm.name}
                        onChange={(e) => setArmForm({ ...armForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        placeholder="e.g. A"
                      />
                    </div>
                  </div>
                )}

                {/* 8. SUBJECT FIELDS */}
                {modalType === 'add_subject' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">SUBJECT NAME</label>
                        <input
                          type="text"
                          required
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="e.g. Mathematics"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">SUBJECT CODE</label>
                        <input
                          type="text"
                          required
                          value={subjectForm.code}
                          onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                          placeholder="e.g. MTH"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">DESCRIPTION (OPTIONAL)</label>
                      <input
                        type="text"
                        value={subjectForm.description}
                        onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 9. TEACHER ASSIGNMENT FIELDS */}
                {modalType === 'add_assignment' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">TEACHER</label>
                      <select
                        value={assignmentForm.teacherId}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.user.firstName} {t.user.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">CLASS</label>
                        <select
                          value={assignmentForm.classId}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">ARM</label>
                        <select
                          value={assignmentForm.classArmId}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, classArmId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {arms.filter(a => a.class.name === classes.find(c => c.id === assignmentForm.classId)?.name).map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">SUBJECT</label>
                        <select
                          value={assignmentForm.subjectId}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-1">ACADEMIC SESSION</label>
                        <select
                          value={assignmentForm.sessionId}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, sessionId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                        >
                          {sessions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">
                    Confirm Action
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
