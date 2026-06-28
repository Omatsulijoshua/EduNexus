'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              EN
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              EduNexus
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <Link
                href={
                  user.role === 'SUPER_ADMIN'
                    ? '/super-admin'
                    : user.role === 'SCHOOL_ADMIN'
                    ? '/admin'
                    : user.role === 'TEACHER'
                    ? '/teacher'
                    : user.role === 'PARENT'
                    ? '/parent'
                    : '/student'
                }
                className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="py-2 px-4 text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                  Register School
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center py-20 px-4 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>
        
        {/* Decorative Glowing Blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            ✨ Multi-Tenant School Management SaaS
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Complete Digital Infrastructure <br />
            <span className="bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
              For Modern Education
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            EduNexus simplifies school administration, result processing, student tracking, and parent communication. Bring your school online in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto py-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              Get Started (Register School)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto py-4 px-8 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl font-semibold transition-all flex items-center justify-center"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-slate-950 border-t border-slate-900 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 border border-slate-900 p-8 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-white">Tenant Isolation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every school operates in a secure sandbox. Zero risk of data crossing between institutions.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-900 p-8 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              📊
            </div>
            <h3 className="text-lg font-bold text-white">Advanced Result Engines</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated compilation of CA, exams, averages, grades, positions, and high-quality report cards.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-900 p-8 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white">Subdomains & Landing Pages</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Custom URL slugs (e.g., school.edunexus.com) and a fully editable public landing page builder.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        EduNexus School Management System SaaS © 2026. All rights reserved.
      </footer>
    </div>
  );
}
