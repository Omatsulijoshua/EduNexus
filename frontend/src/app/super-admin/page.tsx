'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        {/* Sidebar Mockup */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                EN
              </div>
              <span className="font-bold text-lg tracking-wide">EduNexus SaaS</span>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 bg-blue-600/10 text-blue-400 rounded-xl font-medium text-sm transition-all">
                📊 Dashboard Overview
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                🏫 Manage Schools
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                💳 Subscription Plans
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-200 rounded-xl font-medium text-sm transition-all">
                📢 Announcements
              </a>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
          <header className="flex justify-between items-center border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Super Administrator</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
                Welcome back, {user?.firstName}!
              </h1>
            </div>
            <button
              onClick={logout}
              className="md:hidden py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl text-sm transition-colors"
            >
              Logout
            </button>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-xs text-slate-450 uppercase font-semibold">Total Registered Schools</span>
              <p className="text-3xl font-extrabold text-white">128</p>
              <span className="text-xs text-emerald-400 font-medium">↑ 12% this month</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-xs text-slate-450 uppercase font-semibold">Active Subscriptions</span>
              <p className="text-3xl font-extrabold text-white">96</p>
              <span className="text-xs text-emerald-400 font-medium">↑ 8% this month</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-xs text-slate-450 uppercase font-semibold">Monthly SaaS Revenue</span>
              <p className="text-3xl font-extrabold text-white">₦4,850,000</p>
              <span className="text-xs text-blue-400 font-medium">Paystack Sandbox</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
              <span className="text-xs text-slate-450 uppercase font-semibold">Platform Uptime</span>
              <p className="text-3xl font-extrabold text-white">99.98%</p>
              <span className="text-xs text-slate-500 font-medium">All systems operational</span>
            </div>
          </section>

          {/* Table Mockup */}
          <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Recent School Registrations</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-450 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">School Name</th>
                    <th className="py-3 px-4">Domain/Slug</th>
                    <th className="py-3 px-4">Admin Email</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">EduNexus Academy</td>
                    <td className="py-3.5 px-4 text-blue-400">edunexus-academy</td>
                    <td className="py-3.5 px-4">admin@edunexusacademy.com</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Approved
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">Greenwood College</td>
                    <td className="py-3.5 px-4 text-blue-400">greenwood-college</td>
                    <td className="py-3.5 px-4">principal@greenwood.com</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
