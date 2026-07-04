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
  children: {
    id: string;
    admissionNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }[];
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
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'users' | 'assignments' | 'landingPage' | 'reports' | 'billing'>('profile');

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Billing States
  const [billingData, setBillingData] = useState<any | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Master Sheet reporting states
  const [reportFilter, setReportFilter] = useState({
    classId: '',
    classArmId: '',
    termId: '',
    sessionId: '',
  });
  const [masterSheet, setMasterSheet] = useState<any | null>(null);
  const [masterSheetLoading, setMasterSheetLoading] = useState(false);

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

  // Landing Page configuration state
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [landingForm, setLandingForm] = useState({
    heroTitle: '',
    heroDescription: '',
    primaryColor: '#1e3a8a',
    secondaryColor: '#d97706',
    aboutText: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    facebook: '',
    twitter: '',
    instagram: '',
    galleryImagesText: '',
    isPublished: false,
  });

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

      // Fetch landing page config
      const lpData = await api.get<{ landingPage: any }>('/admin/landing-page');
      setLandingConfig(lpData.landingPage);
      if (lpData.landingPage) {
        const social = lpData.landingPage.socialLinks || {};
        const gallery = lpData.landingPage.galleryImages || [];
        setLandingForm({
          heroTitle: lpData.landingPage.heroTitle || '',
          heroDescription: lpData.landingPage.heroDescription || '',
          primaryColor: lpData.landingPage.primaryColor || '#1e3a8a',
          secondaryColor: lpData.landingPage.secondaryColor || '#d97706',
          aboutText: lpData.landingPage.aboutText || '',
          contactEmail: lpData.landingPage.contactEmail || '',
          contactPhone: lpData.landingPage.contactPhone || '',
          contactAddress: lpData.landingPage.contactAddress || '',
          facebook: social.facebook || '',
          twitter: social.twitter || '',
          instagram: social.instagram || '',
          galleryImagesText: gallery.join(', '),
          isPublished: lpData.landingPage.isPublished || false,
        });
      }

      // Prepopulate Master Sheet report filters
      setReportFilter({
        sessionId: sessionsData.sessions.find((s: any) => s.isCurrent)?.id || sessionsData.sessions[0]?.id || '',
        termId: termsData.terms.find((t: any) => t.isCurrent)?.id || termsData.terms[0]?.id || '',
        classId: classesData.classes[0]?.id || '',
        classArmId: armsData.arms[0]?.id || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load school management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleGenerateMasterSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterSheetLoading(true);
    setMasterSheet(null);
    try {
      const data = await api.get<any>(
        `/reports/master-sheet?classId=${reportFilter.classId}&classArmId=${reportFilter.classArmId}&termId=${reportFilter.termId}&sessionId=${reportFilter.sessionId}`
      );
      setMasterSheet(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate master sheet.');
    } finally {
      setMasterSheetLoading(false);
    }
  };

  const fetchBillingData = async () => {
    setBillingLoading(true);
    try {
      const res = await api.get<any>('/billing/active');
      setBillingData(res);
    } catch (err: any) {
      console.error('FetchBillingData Error:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await api.post<{ checkoutUrl: string }>('/billing/checkout', { planId });
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      alert(err.message || 'Failed to start billing checkout.');
    }
  };

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBillingData();
    }
  }, [activeTab]);

  const handleUpdateLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      heroTitle: landingForm.heroTitle,
      heroDescription: landingForm.heroDescription,
      primaryColor: landingForm.primaryColor,
      secondaryColor: landingForm.secondaryColor,
      aboutText: landingForm.aboutText,
      contactEmail: landingForm.contactEmail || null,
      contactPhone: landingForm.contactPhone || null,
      contactAddress: landingForm.contactAddress || null,
      socialLinks: {
        facebook: landingForm.facebook || undefined,
        twitter: landingForm.twitter || undefined,
        instagram: landingForm.instagram || undefined,
      },
      galleryImages: landingForm.galleryImagesText.split(',').map((img) => img.trim()).filter(Boolean),
      isPublished: landingForm.isPublished,
    };

    try {
      await api.put('/admin/landing-page', payload);
      alert('Landing page saved successfully!');
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save landing page configurations.');
    }
  };

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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'assignments' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                👨‍🏫 Teacher Assignments
              </button>
              <button
                onClick={() => setActiveTab('landingPage')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'landingPage' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                🎨 Landing Page Builder
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'reports' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                📊 Reports & Master Sheet
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'billing' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                💳 Subscription & Billing
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

              {/* Tab 5: LANDING PAGE BUILDER */}
              {activeTab === 'landingPage' && landingConfig && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm animate-fadeIn text-slate-800 dark:text-slate-100">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customize Landing Page</h2>
                    <a
                      href={`/s/${schoolProfile?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors border border-slate-750"
                    >
                      🔗 View Public Page
                    </a>
                  </div>

                  <form onSubmit={handleUpdateLandingPage} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Hero Title</label>
                        <input
                          type="text"
                          required
                          value={landingForm.heroTitle}
                          onChange={(e) => setLandingForm({ ...landingForm, heroTitle: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Hero Description</label>
                        <input
                          type="text"
                          required
                          value={landingForm.heroDescription}
                          onChange={(e) => setLandingForm({ ...landingForm, heroDescription: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Primary Color (Hex)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={landingForm.primaryColor}
                            onChange={(e) => setLandingForm({ ...landingForm, primaryColor: e.target.value })}
                            className="w-12 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            pattern="^#[0-9a-fA-F]{6}$"
                            value={landingForm.primaryColor}
                            onChange={(e) => setLandingForm({ ...landingForm, primaryColor: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Secondary Color (Hex)</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={landingForm.secondaryColor}
                            onChange={(e) => setLandingForm({ ...landingForm, secondaryColor: e.target.value })}
                            className="w-12 h-10 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            pattern="^#[0-9a-fA-F]{6}$"
                            value={landingForm.secondaryColor}
                            onChange={(e) => setLandingForm({ ...landingForm, secondaryColor: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">About Section Text</label>
                        <textarea
                          required
                          value={landingForm.aboutText}
                          onChange={(e) => setLandingForm({ ...landingForm, aboutText: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm h-28 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Contact Email</label>
                        <input
                          type="email"
                          value={landingForm.contactEmail}
                          onChange={(e) => setLandingForm({ ...landingForm, contactEmail: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Contact Phone</label>
                        <input
                          type="text"
                          value={landingForm.contactPhone}
                          onChange={(e) => setLandingForm({ ...landingForm, contactPhone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-550 mb-2">Contact Physical Address</label>
                        <input
                          type="text"
                          value={landingForm.contactAddress}
                          onChange={(e) => setLandingForm({ ...landingForm, contactAddress: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-2">Facebook URL</label>
                        <input
                          type="url"
                          value={landingForm.facebook}
                          onChange={(e) => setLandingForm({ ...landingForm, facebook: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-550 mb-2">Instagram URL</label>
                        <input
                          type="url"
                          value={landingForm.instagram}
                          onChange={(e) => setLandingForm({ ...landingForm, instagram: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-550 mb-2">Gallery Images (comma separated URLs)</label>
                        <input
                          type="text"
                          value={landingForm.galleryImagesText}
                          onChange={(e) => setLandingForm({ ...landingForm, galleryImagesText: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                          placeholder="URL1, URL2, URL3"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="isLandingPublished"
                        checked={landingForm.isPublished}
                        onChange={(e) => setLandingForm({ ...landingForm, isPublished: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isLandingPublished" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Publish school landing page (makes it publicly visible at /s/{schoolProfile?.slug})
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 6: REPORTS & MASTER SHEET */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Filter Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-850">
                      Select Master Sheet Options
                    </h3>
                    <form onSubmit={handleGenerateMasterSheet} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
                        <select
                          value={reportFilter.classId}
                          onChange={(e) => setReportFilter({ ...reportFilter, classId: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-955 dark:text-slate-100"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Class Arm</label>
                        <select
                          value={reportFilter.classArmId}
                          onChange={(e) => setReportFilter({ ...reportFilter, classArmId: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-955 dark:text-slate-100"
                        >
                          {arms.filter(a => a.class.name === classes.find(c => c.id === reportFilter.classId)?.name).map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Session</label>
                        <select
                          value={reportFilter.sessionId}
                          onChange={(e) => setReportFilter({ ...reportFilter, sessionId: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-955 dark:text-slate-100"
                        >
                          {sessions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Term</label>
                        <select
                          value={reportFilter.termId}
                          onChange={(e) => setReportFilter({ ...reportFilter, termId: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-955 dark:text-slate-100"
                        >
                          {terms.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.session.name})</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-4 flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={masterSheetLoading}
                          className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg"
                        >
                          {masterSheetLoading ? 'Generating...' : '🔍 Generate Master Sheet'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Generated Master Sheet Grid */}
                  {masterSheet && (
                    <div id="master-sheet-print-area" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 overflow-hidden">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850 print:hidden">
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Academic Master Grid Sheet</h4>
                          <p className="text-xs text-slate-550">Overview of student academic grades across subjects</p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-750 font-bold rounded-xl text-xs transition-colors"
                        >
                          🖨 Print Master Sheet
                        </button>
                      </div>

                      {/* Matrix Grid Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase bg-slate-50 dark:bg-slate-950">
                              <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800">Student Info</th>
                              {masterSheet.subjects.map((sub: any) => (
                                <th key={sub.id} className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-mono">
                                  {sub.code}
                                </th>
                              ))}
                              <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center">Total</th>
                              <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center">Avg</th>
                              <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center">Pos</th>
                              <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center print:hidden">Reports</th>
                            </tr>
                          </thead>
                          <tbody>
                            {masterSheet.students.map((student: any) => (
                              <tr key={student.studentId} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                <td className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                                  <div>{student.firstName} {student.lastName}</div>
                                  <div className="text-[9px] text-slate-500 font-mono">{student.admissionNumber}</div>
                                </td>
                                {masterSheet.subjects.map((sub: any) => (
                                  <td key={sub.id} className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-semibold text-slate-655 dark:text-slate-350">
                                    {student.scores[sub.id] !== null ? student.scores[sub.id] : '-'}
                                  </td>
                                ))}
                                <td className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-white">
                                  {student.totalAccumulated}
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-bold text-blue-600 dark:text-blue-450">
                                  {student.average}%
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-extrabold text-slate-950 dark:text-white">
                                  {student.position}
                                </td>
                                <td className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center print:hidden">
                                  <a
                                    href={`/reports/report-card?studentId=${student.studentId}&termId=${reportFilter.termId}&sessionId=${reportFilter.sessionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-blue-600/10 text-blue-600 border border-blue-500/20 text-[10px] font-bold rounded hover:bg-blue-600 hover:text-white transition-colors"
                                  >
                                    Report Card
                                  </a>
                                </td>
                              </tr>
                            ))}

                            {/* Class averages row */}
                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold">
                              <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                Class Average
                              </td>
                              {masterSheet.subjects.map((sub: any) => (
                                <td key={sub.id} className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center text-blue-600 dark:text-blue-450">
                                  {masterSheet.subjectAverages[sub.id] || 0}%
                                </td>
                              ))}
                              <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center">-</td>
                              <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center">-</td>
                              <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center">-</td>
                              <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center print:hidden">-</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: SUBSCRIPTION & BILLING */}
              {activeTab === 'billing' && (
                <div className="space-y-8 animate-fadeIn text-slate-800 dark:text-slate-100">
                  {billingLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                      <p className="text-slate-450 text-sm">Loading billing records...</p>
                    </div>
                  ) : !billingData ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
                      Failed to load billing portal data.
                    </div>
                  ) : (
                    <>
                      {/* Active subscription & usage limits */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Plan Summary Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Current Active Plan</h4>
                          {billingData.subscription ? (
                            <div className="space-y-2">
                              <h3 className="text-2xl font-black text-blue-605 dark:text-blue-400">
                                {billingData.subscription.plan.name}
                              </h3>
                              <div className="text-xs text-slate-550 space-y-1">
                                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">ACTIVE</span></p>
                                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Billing Cycle:</span> Monthly ($ {billingData.subscription.plan.price}/mo)</p>
                                <p><span className="font-semibold text-slate-700 dark:text-slate-300">End Date:</span> {new Date(billingData.subscription.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <p className="text-sm font-semibold text-slate-500 italic">No active subscription plan</p>
                              <p className="text-xs text-slate-450">Please select one of the available plans below to activate school features.</p>
                            </div>
                          )}
                        </div>

                        {/* Student Count Usage Meter */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Student Profile Usage</h4>
                            <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                              {billingData.usage.students} / {billingData.subscription?.plan?.studentLimit || '0'} Limit
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                            <div
                              style={{
                                width: `${Math.min(
                                  ((billingData.usage.students) / (billingData.subscription?.plan?.studentLimit || 1)) * 100,
                                  100
                                )}%`,
                              }}
                              className={`h-full transition-all ${
                                billingData.usage.students >= (billingData.subscription?.plan?.studentLimit || 0)
                                  ? 'bg-rose-500'
                                  : 'bg-blue-600'
                              }`}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-455">
                            {billingData.usage.students >= (billingData.subscription?.plan?.studentLimit || 0)
                              ? '⚠️ Limit reached. New student registrations will be blocked until you upgrade.'
                              : 'Within limits. Accounts are active.'}
                          </p>
                        </div>

                        {/* Teacher Count Usage Meter */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Teacher Profile Usage</h4>
                            <span className="text-xs font-bold text-slate-755 dark:text-slate-300">
                              {billingData.usage.teachers} / {billingData.subscription?.plan?.teacherLimit || '0'} Limit
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 dark:bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                            <div
                              style={{
                                width: `${Math.min(
                                  ((billingData.usage.teachers) / (billingData.subscription?.plan?.teacherLimit || 1)) * 100,
                                  100
                                )}%`,
                              }}
                              className={`h-full transition-all ${
                                billingData.usage.teachers >= (billingData.subscription?.plan?.teacherLimit || 0)
                                  ? 'bg-rose-500'
                                  : 'bg-blue-600'
                              }`}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-455">
                            {billingData.usage.teachers >= (billingData.subscription?.plan?.teacherLimit || 0)
                              ? '⚠️ Limit reached. New teacher additions will be blocked until you upgrade.'
                              : 'Within limits. Accounts are active.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing plans listings */}
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Upgrade or Change Plan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {billingData.plans.map((plan: any) => {
                            const isCurrentPlan = billingData.subscription?.planId === plan.id;
                            return (
                              <div
                                key={plan.id}
                                className={`border p-6 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between space-y-5 shadow-sm relative transition-all ${
                                  isCurrentPlan
                                    ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {isCurrentPlan && (
                                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-wider py-1 px-3.5 rounded-full shadow">
                                    Current Plan
                                  </span>
                                )}
                                <div className="space-y-2">
                                  <h3 className="font-extrabold text-lg text-slate-950 dark:text-white">{plan.name}</h3>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">${plan.price}</span>
                                    <span className="text-xs text-slate-500">/ month</span>
                                  </div>
                                  <ul className="text-xs text-slate-550 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                                    <li>👤 Limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.studentLimit} Students</span></li>
                                    <li>🧑‍🏫 Limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{plan.teacherLimit} Teachers</span></li>
                                    <li>⚡ Access: <span className="font-semibold text-slate-700 dark:text-slate-300">All Portal Modules</span></li>
                                  </ul>
                                </div>
                                <button
                                  onClick={() => handleSubscribe(plan.id)}
                                  disabled={isCurrentPlan}
                                  className={`w-full py-2.5 font-extrabold rounded-xl text-xs transition-colors ${
                                    isCurrentPlan
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-650 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10'
                                  }`}
                                >
                                  {isCurrentPlan ? 'Current Plan Active' : 'Subscribe / Upgrade'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Billing Payment logs */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Transaction & Payment Receipts</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 font-bold">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Reference ID</th>
                                <th className="py-2.5 px-3">Gateway</th>
                                <th className="py-2.5 px-3">Amount</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billingData.payments.map((p: any) => (
                                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-850">
                                  <td className="py-3 px-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                  <td className="py-3 px-3 font-mono font-semibold">{p.reference}</td>
                                  <td className="py-3 px-3 font-semibold text-slate-655">{p.gateway}</td>
                                  <td className="py-3 px-3 font-bold">${p.amount} {p.currency}</td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-bold text-[9px] uppercase tracking-wider">
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {billingData.payments.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-4 text-center text-xs text-slate-550 italic">
                                    No payment transactions recorded.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
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
