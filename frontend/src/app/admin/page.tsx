'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function SchoolAdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar Mockup */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Portal</span>
              <span className="text-xs text-slate-555 truncate font-semibold uppercase tracking-wider">{user?.schoolName}</span>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-blue-550/10 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl font-medium text-sm transition-all">
                📊 Portal Overview
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                🏫 Academic Structure
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                👨‍🏫 Manage Teachers
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                🎓 Manage Students
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                📝 Result Approvals
              </a>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-550 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">School Administrator</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
                {user?.schoolName} Admin
              </h1>
            </div>
            <button
              onClick={logout}
              className="md:hidden py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold rounded-xl text-sm transition-colors"
            >
              Logout
            </button>
          </header>

          {/* User Profile Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Logged in as {user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Email: {user?.email} | Subdomain: <span className="text-blue-600 dark:text-blue-400">{user?.schoolSlug}.edunexus.com</span></p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Portal Active
            </span>
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Students</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">124</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Teachers</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">15</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Classes & Arms</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">8 Classes / 12 Arms</p>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
