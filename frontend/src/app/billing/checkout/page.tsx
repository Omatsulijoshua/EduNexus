'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId');

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<any | null>(null);

  // Form mock inputs
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('•••');
  const [nameOnCard, setNameOnCard] = useState('School Principal');

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!planId) {
        setError('Missing subscription plan context.');
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<any>('/billing/active');
        const selectedPlan = res.plans.find((p: any) => p.id === planId);
        if (!selectedPlan) {
          setError('Selected subscription plan not found.');
        } else {
          setPlan(selectedPlan);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize checkout.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    setError(null);
    try {
      await api.post('/billing/confirm-checkout', { planId });
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Payment confirmation failed.');
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-550">Initializing secure payment gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Order Summary */}
        <div className="md:w-1/2 bg-slate-50 dark:bg-slate-950 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase tracking-wider text-blue-650 dark:text-blue-450">EduNexus SaaS Checkout</span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Order Summary</h2>
            {plan && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-lg">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-black">${plan.price}</span>
                    <span className="text-xs text-slate-550">/mo</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-550 space-y-2">
                  <li>✔ Student Limit: <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.studentLimit} student accounts</span></li>
                  <li>✔ Teacher Limit: <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.teacherLimit} teacher accounts</span></li>
                  <li>✔ Access: Full modules, reporting sheets, dynamic customization</li>
                </ul>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-550">
            Powered by <span className="font-bold">Stripe Checkout</span>. Secure, encrypted checkout.
          </div>
        </div>

        {/* Right Side: Credit Card Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {success ? (
            <div className="text-center space-y-4 py-8 animate-fadeIn">
              <span className="text-4xl">🎉</span>
              <h3 className="text-xl font-black text-emerald-500">Payment Successful!</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Thank you! Your school subscription has been activated. Redirecting you back to the admin billing dashboard in a moment...
              </p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Mock Checkout</h3>
                <p className="text-xs text-slate-550">Click Pay Now to activate this mock payment log.</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CARD NUMBER</label>
                  <input
                    type="text"
                    disabled
                    value={cardNumber}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">EXPIRY DATE</label>
                    <input
                      type="text"
                      disabled
                      value={expiry}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      disabled
                      value={cvc}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CARDHOLDER NAME</label>
                  <input
                    type="text"
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={confirming}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/10"
              >
                {confirming ? 'Processing Transaction...' : `💳 Pay Now $${plan?.price || '0.00'}`}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-550">Loading checkout session...</p>
        </div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
