'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SchoolData {
  name: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string | null;
  landingPage: {
    heroTitle: string;
    heroDescription: string;
    primaryColor: string;
    secondaryColor: string;
    aboutText: string;
    contactEmail: string | null;
    contactPhone: string | null;
    contactAddress: string | null;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    } | null;
    galleryImages: string[] | null;
    news: Array<{
      title: string;
      content: string;
      date: string;
    }> | null;
  };
}

export default function PublicSchoolPortal() {
  const { slug } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SchoolData | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPortal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/public/school/${slug}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'School portal not found.');
        }
        const json = await res.json();
        setData(json.school);
      } catch (err: any) {
        setError(err.message || 'Failed to load school portal.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortal();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 rounded-full animate-spin border-t-transparent animate-spin"></div>
        <p className="text-slate-400 text-sm">Resolving school portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-2xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-white">Portal Unavailable</h1>
        <p className="text-slate-450 max-w-md text-sm">{error || 'This school portal does not exist or has not been published.'}</p>
        <Link href="/" className="py-2 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors">
          Return to EduNexus
        </Link>
      </div>
    );
  }

  const { landingPage } = data;
  const primary = landingPage.primaryColor || '#1e3a8a';
  const secondary = landingPage.secondaryColor || '#d97706';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-150 flex flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              <div
                style={{ backgroundColor: primary }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
              >
                {data.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-xs md:max-w-md">
              {data.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              style={{ color: primary, borderColor: `${primary}30` }}
              className="py-1.5 px-4 border hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold rounded-lg text-xs transition-all"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative max-w-4xl mx-auto px-6 text-center space-y-6">
          <span
            style={{ color: primary, backgroundColor: `${primary}10` }}
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
          >
            Welcome to Our School
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {landingPage.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-slate-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {landingPage.heroDescription}
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              style={{ backgroundColor: primary }}
              onClick={() => {
                const el = document.getElementById('contact');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-3 px-8 text-white font-bold rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-lg shadow-blue-500/10"
            >
              Contact Admissions
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('about');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ color: primary, borderColor: `${primary}20` }}
              className="py-3 px-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-sm transition-transform border"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
        <div className="md:col-span-3 space-y-4">
          <h2
            style={{ color: primary }}
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            About Our Institution
          </h2>
          <p className="text-sm md:text-base text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line">
            {landingPage.aboutText}
          </p>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-950 dark:text-white">Why Choose Us?</h3>
          <ul className="space-y-3 text-xs md:text-sm text-slate-550 dark:text-slate-400">
            <li className="flex items-start gap-2.5">
              <span style={{ color: secondary }} className="font-bold">✔</span>
              <span>Exceptional Academic Excellence & Mentorship</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span style={{ color: secondary }} className="font-bold">✔</span>
              <span>Fully Equipped Classrooms & Modern Science Labs</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span style={{ color: secondary }} className="font-bold">✔</span>
              <span>Holistic Extracurricular Activities & Sports Programs</span>
            </li>
          </ul>
        </div>
      </section>

      {/* News & Announcements Section */}
      {landingPage.news && landingPage.news.length > 0 && (
        <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-6 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                News & Announcements
              </h2>
              <p className="text-sm text-slate-500">Stay updated with our latest events and school calendars</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {landingPage.news.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <span style={{ color: secondary }} className="text-xs font-semibold">{item.date}</span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed truncate-2-lines">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {landingPage.galleryImages && landingPage.galleryImages.length > 0 && (
        <section className="py-20 max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Campus Gallery
            </h2>
            <p className="text-sm text-slate-500">Explore snapshots of student activities and facilities</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {landingPage.galleryImages.map((imgUrl, idx) => (
              <div key={idx} className="aspect-video relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-100 shadow-sm">
                <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer / Contact Section */}
      <footer id="contact" style={{ borderTopColor: primary }} className="bg-slate-900 text-slate-300 py-16 border-t-4 mt-auto">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">{data.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Providing holistic and standard-setting education to students around the country.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>📞 {landingPage.contactPhone || data.phone}</li>
              <li>✉ {landingPage.contactEmail || data.email}</li>
              <li className="leading-relaxed">📍 {landingPage.contactAddress || data.address}</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Follow Us</h4>
            <div className="flex gap-4">
              {landingPage.socialLinks?.facebook && (
                <a href={landingPage.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white">
                  Facebook
                </a>
              )}
              {landingPage.socialLinks?.twitter && (
                <a href={landingPage.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white">
                  Twitter
                </a>
              )}
              {landingPage.socialLinks?.instagram && (
                <a href={landingPage.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white">
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {data.name}. Powered by <Link href="/" className="hover:underline">EduNexus</Link>.
        </div>
      </footer>
    </div>
  );
}
