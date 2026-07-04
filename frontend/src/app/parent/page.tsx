'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

interface ChildData {
  id: string;
  admissionNumber: string;
  class: { name: string };
  classArm: { name: string };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  resultScores: Array<{
    id: string;
    caScore: number;
    examScore: number;
    subject: { name: string; code: string };
    result: {
      term: { name: string };
      session: { name: string };
    };
  }>;
}

interface ParentDashboardData {
  childrenCount: number;
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);

  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Selected child index for viewing academic reports
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dbData = await api.get<ParentDashboardData>('/parent/dashboard');
      const childData = await api.get<{ children: ChildData[] }>('/parent/children');
      setChildren(childData.children);
      
      // Prepopulate phone from current authenticated user session context
      if (user) {
        setPhone(user.phone || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load parent dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    try {
      const payload: any = { phone };
      if (password) payload.password = password;

      await api.put('/parent/profile', payload);
      setUpdateSuccess(true);
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Parent</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Parent Portal</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-450 font-bold uppercase">Children Registered</p>
              <div className="space-y-1">
                {children.map((child, idx) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildIndex(idx)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold truncate transition-colors ${
                      selectedChildIndex === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    👦 {child.user.firstName} {child.user.lastName}
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
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Parent Portal Account</p>
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
              <p className="text-slate-450 text-sm">Loading children stats...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
              {error}
            </div>
          ) : children.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3 max-w-xl mx-auto shadow-sm">
              <span className="text-3xl">ℹ</span>
              <h3 className="font-bold text-lg text-slate-950 dark:text-white">No Children Linked</h3>
              <p className="text-sm text-slate-500">
                There are no students linked to your parent email on this school portal. Please contact the school administrator to link your child using your email: <span className="font-bold">{user?.email}</span>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Selected Child's Card & Academics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Child Card Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Child Details</span>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {children[selectedChildIndex].user.firstName} {children[selectedChildIndex].user.lastName}
                      </h2>
                    </div>
                    <span className="px-3 py-1 bg-blue-600/10 text-blue-600 border border-blue-500/20 text-xs font-bold rounded-lg uppercase">
                      Active Student
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-sm text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/65">
                    <p><span className="font-bold text-slate-850 dark:text-white">Admission No:</span> {children[selectedChildIndex].admissionNumber}</p>
                    <p><span className="font-bold text-slate-850 dark:text-white">Class Section:</span> {children[selectedChildIndex].class.name} ({children[selectedChildIndex].classArm.name})</p>
                    <p><span className="font-bold text-slate-850 dark:text-white">Student Email:</span> {children[selectedChildIndex].user.email}</p>
                  </div>
                </div>

                {/* Child's Academic Scores */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Academic Results & Grades</h3>
                    {children[selectedChildIndex].resultScores && children[selectedChildIndex].resultScores.length > 0 && (
                      <a
                        href={`/reports/report-card?studentId=${children[selectedChildIndex].id}&termId=${children[selectedChildIndex].resultScores[0].result.termId}&sessionId=${children[selectedChildIndex].resultScores[0].result.sessionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-4 bg-blue-650 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        🖨 Print Report Card
                      </a>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-350">
                      <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">CA Score</th>
                          <th className="py-2.5 px-3">Exam Score</th>
                          <th className="py-2.5 px-3">Total Grade</th>
                          <th className="py-2.5 px-3">Term</th>
                        </tr>
                      </thead>
                      <tbody>
                        {children[selectedChildIndex].resultScores.map((score) => (
                          <tr key={score.id} className="border-b border-slate-100 dark:border-slate-850">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              {score.subject.name}
                            </td>
                            <td className="py-3 px-3">{score.caScore} / 40</td>
                            <td className="py-3 px-3">{score.examScore} / 60</td>
                            <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-450">{score.caScore + score.examScore} / 100</td>
                            <td className="py-3 px-3 text-xs text-slate-500">
                              {score.result.term.name} ({score.result.session.name})
                            </td>
                          </tr>
                        ))}
                        {children[selectedChildIndex].resultScores.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-xs text-slate-550 italic">
                              No grade reports published for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Children List & info */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Children Selector</h3>
                  <div className="space-y-2">
                    {children.map((child, idx) => (
                      <div
                        key={child.id}
                        onClick={() => setSelectedChildIndex(idx)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedChildIndex === idx
                            ? 'bg-blue-600/10 border-blue-650 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <h4 className="font-bold text-sm">{child.user.firstName} {child.user.lastName}</h4>
                        <p className="text-xs text-slate-500 mt-1">{child.class.name} ({child.classArm.name}) • {child.admissionNumber}</p>
                      </div>
                    ))}
                  </div>
                </div>

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
