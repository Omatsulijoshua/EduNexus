'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

interface AssignmentInfo {
  id: string;
  class: { id: string; name: string };
  classArm: { id: string; name: string };
  subject: { id: string; name: string; code: string };
  session: { id: string; name: string };
}

interface StudentInfo {
  id: string;
  admissionNumber: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TeacherDashboardData {
  classesCount: number;
  subjectsCount: number;
  assignmentsCount: number;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [stats, setStats] = useState<TeacherDashboardData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [selectedAssignmentIdx, setSelectedAssignmentIdx] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await api.get<TeacherDashboardData>('/teacher/dashboard');
      setStats(statsData);

      const assignData = await api.get<{ assignments: AssignmentInfo[] }>('/teacher/classes');
      setAssignments(assignData.assignments);

      if (user) {
        setPhone(user.phone || '');
      }

      // Automatically select the first assignment if it exists
      if (assignData.assignments.length > 0) {
        setSelectedAssignmentIdx(0);
        await loadStudents(assignData.assignments[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (assignment: AssignmentInfo) => {
    setStudentsLoading(true);
    setStudents([]);
    try {
      const res = await api.get<{ students: StudentInfo[] }>(
        `/teacher/students?classId=${assignment.class.id}&classArmId=${assignment.classArm.id}`
      );
      setStudents(res.students);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleSelectAssignment = async (idx: number) => {
    setSelectedAssignmentIdx(idx);
    await loadStudents(assignments[idx]);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    try {
      const payload: any = { phone };
      if (password) payload.password = password;

      await api.put('/teacher/profile', payload);
      setUpdateSuccess(true);
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Teacher</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Teacher Portal</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-455 font-bold uppercase">My Assignments</p>
              <div className="space-y-1 overflow-y-auto max-h-[250px]">
                {assignments.map((asg, idx) => (
                  <button
                    key={asg.id}
                    onClick={() => handleSelectAssignment(idx)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold truncate transition-colors ${
                      selectedAssignmentIdx === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    📚 {asg.class.name} ({asg.classArm.name}) - {asg.subject.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-500 dark:text-rose-455 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Teacher Account Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
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
              <p className="text-slate-450 text-sm">Loading teacher portal...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Stats and Students list */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-xl">🏫</span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.classesCount}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Unique Classes</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-xl">📚</span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.subjectsCount}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Unique Subjects</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-xl">👨‍🏫</span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.assignmentsCount}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Assignments</p>
                  </div>
                </div>

                {/* Selected Class Students */}
                {selectedAssignmentIdx !== null && assignments[selectedAssignmentIdx] && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono">
                          {assignments[selectedAssignmentIdx].subject.code} - {assignments[selectedAssignmentIdx].subject.name}
                        </span>
                        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                          Students in {assignments[selectedAssignmentIdx].class.name} ({assignments[selectedAssignmentIdx].classArm.name})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 italic">
                        Session: {assignments[selectedAssignmentIdx].session.name}
                      </span>
                    </div>

                    {studentsLoading ? (
                      <p className="text-xs text-slate-500 py-6 text-center">Loading enrolled class lists...</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-350">
                          <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Admission Number</th>
                              <th className="py-2.5 px-3">First Name</th>
                              <th className="py-2.5 px-3">Last Name</th>
                              <th className="py-2.5 px-3">Email Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((st) => (
                              <tr key={st.id} className="border-b border-slate-100 dark:border-slate-850">
                                <td className="py-3 px-3 font-semibold text-blue-650 dark:text-blue-450">{st.admissionNumber}</td>
                                <td className="py-3 px-3 text-slate-900 dark:text-white">{st.user.firstName}</td>
                                <td className="py-3 px-3 text-slate-900 dark:text-white">{st.user.lastName}</td>
                                <td className="py-3 px-3 text-xs text-slate-500">{st.user.email}</td>
                              </tr>
                            ))}
                            {students.length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-xs text-slate-550 italic">
                                  No students currently enrolled in this class arm.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Quick select class & Settings */}
              <div className="space-y-6">
                {/* Assignments Selector for mobile / quick click */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 md:hidden">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Quick Class Selector</h3>
                  <div className="space-y-2">
                    {assignments.map((asg, idx) => (
                      <div
                        key={asg.id}
                        onClick={() => handleSelectAssignment(idx)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAssignmentIdx === idx
                            ? 'bg-blue-600/10 border-blue-650 text-blue-650 dark:text-blue-450'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <h4 className="font-bold text-xs">{asg.class.name} ({asg.classArm.name})</h4>
                        <p className="text-[10px] text-slate-550 mt-1">{asg.subject.code} - {asg.subject.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile settings card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Profile Settings</h3>
                  {updateSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-xl font-semibold">
                      Profile settings updated successfully.
                    </div>
                  )}
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">PHONE NUMBER</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-550 mb-1">CHANGE PASSWORD</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
                    >
                      {updating ? 'Updating...' : 'Save Settings'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
