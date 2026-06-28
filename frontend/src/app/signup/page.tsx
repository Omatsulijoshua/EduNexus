'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();

  // Form States
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [slug, setSlug] = useState('');
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/signup-admin', {
        schoolName,
        schoolEmail,
        schoolPhone,
        schoolAddress,
        slug: slug.toLowerCase().trim(),
        adminEmail,
        adminPassword,
        adminFirstName,
        adminLastName,
        adminPhone: adminPhone || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Submitted!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your school <strong>{schoolName}</strong> has been registered. The account is currently <strong>Pending Approval</strong>. Our platform administrator will review your application shortly.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="w-full max-w-2xl space-y-8 z-10">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Register Your School on <span className="text-blue-500">EduNexus</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Create your customized school portal in minutes.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* School Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
                🏫 School Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SCHOOL NAME</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="e.g. Greenwood College"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PREFERRED PORTAL SLUG (SUBDOMAIN)</label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
                      className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-l-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="greenwood"
                    />
                    <span className="inline-flex items-center px-3 bg-slate-850 border border-l-0 border-slate-800 rounded-r-xl text-xs text-slate-450">
                      .edunexus.com
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SCHOOL EMAIL</label>
                  <input
                    type="email"
                    required
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="info@school.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SCHOOL PHONE</label>
                  <input
                    type="text"
                    required
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="+234..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">SCHOOL PHYSICAL ADDRESS</label>
                <input
                  type="text"
                  required
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Street, City, State"
                />
              </div>
            </div>

            {/* Admin Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
                👑 Administrator Account (School Admin)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">FIRST NAME</label>
                  <input
                    type="text"
                    required
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">LAST NAME</label>
                  <input
                    type="text"
                    required
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ADMIN EMAIL</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="admin@school.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ADMIN PHONE (OPTIONAL)</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="+234..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">PASSWORD</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting Registration...' : 'Register School'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Already have an account? Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
