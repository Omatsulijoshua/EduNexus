'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  teacher: string;
}

interface ScoreInfo {
  id: string;
  subjectCode: string;
  subjectName: string;
  caScore: number;
  examScore: number;
  total: number;
  term: string;
  termId: string;
  session: string;
  sessionId: string;
}

interface StudentDashboardData {
  studentId: string;
  schoolName: string;
  className: string;
  armName: string;
  admissionNumber: string;
  subjectsCount: number;
  subjectsList: SubjectInfo[];
  recentScores: ScoreInfo[];
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentDashboardData | null>(null);

  // Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dbData = await api.get<StudentDashboardData>('/student/dashboard');
      setData(dbData);

      // Fetch profile details to populate phone
      const profData = await api.get<{ student: any }>('/student/profile');
      setPhone(profData.student.user.phone || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    try {
      const payload: any = { phone };
      if (password) payload.password = password;

      await api.put('/student/profile', payload);
      setUpdateSuccess(true);
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Portal</span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Student Dashboard</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-450 font-bold uppercase">Enrollment Info</p>
              <div className="text-xs text-slate-650 dark:text-slate-350 space-y-1.5">
                <p><span className="font-semibold text-slate-900 dark:text-white">Class:</span> {data?.className} ({data?.armName})</p>
                <p><span className="font-semibold text-slate-900 dark:text-white">Adm No:</span> {data?.admissionNumber}</p>
                <p className="truncate"><span className="font-semibold text-slate-900 dark:text-white">School:</span> {data?.schoolName}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-500 dark:text-rose-450 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Welcome back</p>
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
              <p className="text-slate-450 text-sm">Loading student dashboard...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Academic info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-xl">📚</span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{data?.subjectsCount}</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Enrolled Subjects</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-xl">🏫</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 truncate">{data?.className} ({data?.armName})</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Current Class Section</p>
                  </div>
                </div>

                {/* Enrolled Subjects List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Subject Outline & Assigned Teachers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data?.subjectsList.map((sub) => (
                      <div key={sub.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-semibold text-blue-650 dark:text-blue-400 font-mono">{sub.code}</span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h4>
                        </div>
                        <span className="text-xs text-slate-500 italic truncate max-w-[120px]">{sub.teacher}</span>
                      </div>
                    ))}
                    {data?.subjectsList.length === 0 && (
                      <p className="text-xs text-slate-500 col-span-2">No subjects assigned for the current academic session.</p>
                    )}
                  </div>
                </div>

                {/* Recent Academic Scores */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Term Grade Summaries</h3>
                    {data?.recentScores && data.recentScores.length > 0 && (
                      <a
                        href={`/reports/report-card?studentId=${data.studentId}&termId=${data.recentScores[0].termId}&sessionId=${data.recentScores[0].sessionId}`}
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
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3">CA Score</th>
                          <th className="py-2 px-3">Exam Score</th>
                          <th className="py-2 px-3">Total</th>
                          <th className="py-2 px-3">Term (Session)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentScores.map((score) => (
                          <tr key={score.id} className="border-b border-slate-100 dark:border-slate-850">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              {score.subjectName} ({score.subjectCode})
                            </td>
                            <td className="py-3 px-3">{score.caScore} / 40</td>
                            <td className="py-3 px-3">{score.examScore} / 60</td>
                            <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">{score.total} / 100</td>
                            <td className="py-3 px-3 text-xs text-slate-500">
                              {score.term} ({score.session})
                            </td>
                          </tr>
                        ))}
                        {data?.recentScores.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-xs text-slate-550 italic">
                              No grade reports published yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Update Password */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Update Profile Settings</h3>
                  {updateSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-xl font-semibold">
                      Profile settings updated successfully.
                    </div>
                  )}
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Change Password</label>
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
