'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function ParentDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
        {/* Sidebar Mockup */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduNexus Portal</span>
              <span className="text-xs text-slate-500 truncate font-semibold uppercase tracking-wider">{user?.schoolName}</span>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl font-medium text-sm transition-all">
                👪 Parent Center
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                🎓 My Children
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                📢 Announcements
              </a>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-650 dark:text-blue-405 uppercase tracking-wider">Parent Portal</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
                Welcome, Mr./Mrs. {user?.lastName}
              </h1>
            </div>
            <button
              onClick={logout}
              className="md:hidden py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold rounded-xl text-sm transition-colors"
            >
              Logout
            </button>
          </header>

          {/* Children List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Children</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/85 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 dark:text-white">Tobi Eze</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Class: JSS 1A | Adm No: ADM2026001</p>
                </div>
                <button className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
