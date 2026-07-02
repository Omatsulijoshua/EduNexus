'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

interface SchoolDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  logoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  createdAt: string;
  counts: {
    students: number;
    teachers: number;
    parents: number;
  };
  subscription: {
    planName: string;
    status: string;
    endDate: string;
  } | null;
}

interface SaaSAnalytics {
  totalSchools: number;
  statusCounts: {
    approved: number;
    pending: number;
    suspended: number;
  };
  totalRevenue: number;
  activeSubscriptions: number;
  recentPayments: Array<{
    id: string;
    schoolName: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  maxStudents: number;
  maxTeachers: number;
  features: string[];
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'plans'>('overview');

  // SaaS States
  const [schools, setSchools] = useState<SchoolDetail[]>([]);
  const [analytics, setAnalytics] = useState<SaaSAnalytics | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');

  // Modal / Plan Form States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'monthly' as 'monthly' | 'yearly',
    maxStudents: 100,
    maxTeachers: 10,
    featuresText: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const schoolsRes = await api.get<{ schools: SchoolDetail[] }>('/super-admin/schools');
      const analyticsRes = await api.get<{ analytics: SaaSAnalytics }>('/super-admin/analytics');
      const plansRes = await api.get<{ plans: SubscriptionPlan[] }>('/super-admin/plans');
      
      setSchools(schoolsRes.schools);
      setAnalytics(analyticsRes.analytics);
      setPlans(plansRes.plans);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch SaaS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update School Status
  const handleUpdateSchoolStatus = async (schoolId: string, newStatus: 'APPROVED' | 'SUSPENDED') => {
    try {
      await api.request(`/super-admin/schools/${schoolId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // Refresh data
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Plan Form handlers
  const handleOpenPlanModal = (plan: SubscriptionPlan | null = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        maxStudents: plan.maxStudents,
        maxTeachers: plan.maxTeachers,
        featuresText: plan.features.join(', '),
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        description: '',
        price: 0,
        interval: 'monthly',
        maxStudents: 100,
        maxTeachers: 10,
        featuresText: 'Student Management, Result Uploads, Printable Report Sheets',
      });
    }
    setIsPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: planForm.name,
      description: planForm.description,
      price: Number(planForm.price),
      interval: planForm.interval,
      maxStudents: Number(planForm.maxStudents),
      maxTeachers: Number(planForm.maxTeachers),
      features: planForm.featuresText.split(',').map((f) => f.trim()).filter(Boolean),
    };

    try {
      if (editingPlan) {
        await api.put(`/super-admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/super-admin/plans', payload);
      }
      setIsPlanModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.delete(`/super-admin/plans/${planId}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  // Filtered Schools list
  const filteredSchools = schools.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          school.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          school.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
                EN
              </div>
              <span className="font-bold text-lg tracking-wide">EduNexus SaaS</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'overview' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📊 Dashboard Overview
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'schools' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🏫 Manage Schools
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${activeTab === 'plans' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                💳 Subscription Plans
              </button>
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-rose-450 hover:bg-rose-500/10 rounded-xl font-medium text-sm transition-all text-left"
          >
            🚪 Logout
          </button>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen">
          <header className="flex justify-between items-center border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Super Administrator</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
                Welcome back, {user?.firstName}!
              </h1>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchData}
                className="py-2 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-sm font-medium transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={logout}
                className="md:hidden py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              <p className="text-slate-450 text-sm">Fetching SaaS analytics...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Tab 1: OVERVIEW */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Stats Grid */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Schools</span>
                      <p className="text-3xl font-extrabold text-white">{analytics.totalSchools}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>{analytics.statusCounts.approved} Approved</span>
                        <span>•</span>
                        <span>{analytics.statusCounts.pending} Pending</span>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Active Subscriptions</span>
                      <p className="text-3xl font-extrabold text-white">{analytics.activeSubscriptions}</p>
                      <span className="text-xs text-emerald-400 font-medium">SaaS Active</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</span>
                      <p className="text-3xl font-extrabold text-white">
                        ₦{analytics.totalRevenue.toLocaleString()}
                      </p>
                      <span className="text-xs text-blue-400 font-medium">Paystack Sandbox</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 uppercase font-semibold">SaaS Platform status</span>
                      <p className="text-3xl font-extrabold text-emerald-400">ONLINE</p>
                      <span className="text-xs text-slate-500 font-medium">All services operational</span>
                    </div>
                  </section>

                  {/* Secondary analytics view */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Registrations summary */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Latest Schools</h2>
                        <button
                          onClick={() => setActiveTab('schools')}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View all schools
                        </button>
                      </div>
                      <div className="divide-y divide-slate-800/50">
                        {schools.slice(0, 3).map((school) => (
                          <div key={school.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{school.name}</p>
                              <p className="text-xs text-slate-500">{school.email}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                school.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : school.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {school.status}
                            </span>
                          </div>
                        ))}
                        {schools.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No schools registered yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Payments summary */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                      <h2 className="text-lg font-bold">Recent SaaS Payments</h2>
                      <div className="divide-y divide-slate-800/50">
                        {analytics.recentPayments.map((p) => (
                          <div key={p.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{p.schoolName}</p>
                              <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">
                                ₦{p.amount.toLocaleString()}
                              </p>
                              <span className="text-xs text-emerald-400 uppercase font-semibold">{p.status}</span>
                            </div>
                          </div>
                        ))}
                        {analytics.recentPayments.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-4">No payments recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: MANAGE SCHOOLS */}
              {activeTab === 'schools' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Filters bar */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800/50">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search school name, slug, or email..."
                      className="w-full sm:max-w-xs px-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                    <div className="flex gap-2">
                      {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            statusFilter === status
                              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schools Table */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-450 uppercase border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">School Details</th>
                            <th className="py-3 px-4">Subdomain Slug</th>
                            <th className="py-3 px-4">Users Count</th>
                            <th className="py-3 px-4">Subscription Plan</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {filteredSchools.map((school) => (
                            <tr key={school.id}>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-white">{school.name}</div>
                                <div className="text-xs text-slate-500">{school.email} | {school.phone}</div>
                              </td>
                              <td className="py-4 px-4 text-blue-400 font-medium">
                                {school.slug}.edunexus.com
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-xs space-y-0.5">
                                  <div>Students: <strong>{school.counts.students}</strong></div>
                                  <div>Teachers: <strong>{school.counts.teachers}</strong></div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {school.subscription ? (
                                  <div>
                                    <div className="font-semibold text-white">{school.subscription.planName}</div>
                                    <div className="text-xs text-slate-500">Exp: {new Date(school.subscription.endDate).toLocaleDateString()}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">No plan active</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    school.status === 'APPROVED'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                      : school.status === 'PENDING'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                  }`}
                                >
                                  {school.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                                {school.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleUpdateSchoolStatus(school.id, 'APPROVED')}
                                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                                {school.status === 'APPROVED' ? (
                                  <button
                                    onClick={() => handleUpdateSchoolStatus(school.id, 'SUSPENDED')}
                                    className="py-1 px-3 bg-rose-650 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Suspend
                                  </button>
                                ) : school.status === 'SUSPENDED' ? (
                                  <button
                                    onClick={() => handleUpdateSchoolStatus(school.id, 'APPROVED')}
                                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Reactivate
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                          {filteredSchools.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center text-slate-500 py-6 text-sm">
                                No schools match the search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: SUBSCRIPTION PLANS */}
              {activeTab === 'plans' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">SaaS Subscription Plans</h2>
                    <button
                      onClick={() => handleOpenPlanModal()}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      ➕ Add New Plan
                    </button>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6"
                      >
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-slate-450 text-sm mt-1">{plan.description}</p>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white">
                              ₦{plan.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">
                              / {plan.interval}
                            </span>
                          </div>
                          <div className="border-t border-slate-800 pt-4 space-y-2 text-sm text-slate-350">
                            <div>Max Students: <strong>{plan.maxStudents}</strong></div>
                            <div>Max Teachers: <strong>{plan.maxTeachers}</strong></div>
                            <div className="font-semibold text-slate-400 mt-2">Enabled Features:</div>
                            <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs">
                              {plan.features.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleOpenPlanModal(plan)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-slate-750"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {plans.length === 0 && (
                      <p className="text-slate-500 text-sm italic col-span-3 text-center py-8">
                        No subscription plans defined. Add a plan to enable school subscriptions.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Plan Form Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePlanSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    placeholder="e.g. Premium Plan"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Plan Description</label>
                  <input
                    type="text"
                    required
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    placeholder="Perfect for large academies..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Billing Interval</label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value as 'monthly' | 'yearly' })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Max Students</label>
                  <input
                    type="number"
                    required
                    value={planForm.maxStudents}
                    onChange={(e) => setPlanForm({ ...planForm, maxStudents: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Max Teachers</label>
                  <input
                    type="number"
                    required
                    value={planForm.maxTeachers}
                    onChange={(e) => setPlanForm({ ...planForm, maxTeachers: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Enabled Features (comma separated)</label>
                  <textarea
                    required
                    value={planForm.featuresText}
                    onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm h-20"
                    placeholder="Student Management, Result Uploads, Report Sheets"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
