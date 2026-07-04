'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../lib/api';

interface ResultDetail {
  subjectCode: string;
  subjectName: string;
  caScore: number;
  examScore: number;
  total: number;
  grade: string;
  classAverage: number;
}

interface ReportSheetData {
  school: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className: string;
    armName: string;
  };
  academic: {
    sessionName: string;
    termName: string;
  };
  results: ResultDetail[];
  stats: {
    totalSubjects: number;
    totalScore: number;
    average: number;
    position: string;
    classCount: number;
  };
}

function ReportCardContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const termId = searchParams.get('termId');
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportSheetData | null>(null);

  useEffect(() => {
    const fetchReportSheet = async () => {
      if (!studentId || !termId || !sessionId) {
        setError('Missing query parameters (studentId, termId, sessionId).');
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<ReportSheetData>(
          `/reports/report-sheet?studentId=${studentId}&termId=${termId}&sessionId=${sessionId}`
        );
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load student report card.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportSheet();
  }, [studentId, termId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-650 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-550">Generating report sheet...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-lg">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold mt-2 text-rose-500">Report Card Error</h2>
          <p className="text-xs text-slate-500 mt-2">{error || 'Unable to retrieve record.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 print:py-0 print:bg-white text-slate-900 dark:text-slate-100 flex flex-col items-center">
      {/* Floating Action Header (Hidden during print) */}
      <div className="w-full max-w-4xl px-6 mb-6 flex justify-between items-center no-print">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.close();
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-850 dark:hover:text-white"
        >
          ← Close Window
        </a>
        <button
          onClick={() => window.print()}
          className="py-2 px-5 bg-blue-650 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          <span>🖨</span> Print Report Card
        </button>
      </div>

      {/* A4 Report Sheet Block */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 print:bg-white print:text-black border border-slate-200 dark:border-slate-800 print:border-none p-8 md:p-12 shadow-2xl print:shadow-none rounded-3xl print:rounded-none flex flex-col justify-between min-h-[297mm] font-serif">
        
        {/* Header Block */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-double border-slate-900 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 uppercase">{data.school.name}</h1>
              <p className="text-xs text-slate-550 italic font-mono mt-1">Official Terminal Progress Report</p>
              <div className="text-[11px] text-slate-550 font-sans mt-3 space-y-0.5">
                <p>📍 {data.school.address}</p>
                <p>📞 {data.school.phone} | ✉ {data.school.email}</p>
              </div>
            </div>
            {/* Crest SVG emblem */}
            <div className="w-20 h-20 text-slate-900 dark:text-slate-400 opacity-80 print:opacity-100 flex items-center justify-center">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>

          {/* Student Profile Metadata block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 print:bg-slate-100 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-800 dark:text-slate-200 print:text-black">
            <div>
              <span className="block text-[10px] font-bold text-slate-455">STUDENT NAME</span>
              <span className="font-bold text-sm">{data.student.firstName} {data.student.lastName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-455">ADMISSION NUMBER</span>
              <span className="font-mono font-bold text-sm text-blue-650 dark:text-blue-450 print:text-black">{data.student.admissionNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-455">CLASS SECTION</span>
              <span className="font-semibold">{data.student.className} - {data.student.armName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-455">TERM / SESSION</span>
              <span className="font-semibold">{data.academic.termName} ({data.academic.sessionName})</span>
            </div>
          </div>

          {/* Scores Table */}
          <div className="overflow-hidden mt-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-950 font-bold uppercase font-sans">
                  <th className="py-2.5 px-2">Subject Name</th>
                  <th className="py-2.5 px-2 text-center">CA (Max 40)</th>
                  <th className="py-2.5 px-2 text-center">Exam (Max 60)</th>
                  <th className="py-2.5 px-2 text-center">Total (100)</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                  <th className="py-2.5 px-2 text-center">Class Avg</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((res, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 font-medium">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900 dark:text-white print:text-black">{res.subjectName}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{res.subjectCode}</div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{res.caScore}</td>
                    <td className="py-3 px-2 text-center font-mono">{res.examScore}</td>
                    <td className="py-3 px-2 text-center font-bold font-mono">{res.total}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold border border-slate-400 dark:border-slate-800 px-2 py-0.5 rounded font-mono">
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-550">{res.classAverage}%</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500 italic">
                      No grades have been entered for this student in the selected term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote Summary Stats & Signature Blocks */}
        <div className="space-y-8 mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-300 dark:border-slate-800 pt-6 font-sans">
            {/* Term Summary Statistics */}
            <div className="bg-slate-50 dark:bg-slate-950 print:bg-slate-150 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-800 dark:text-slate-200 print:text-black">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                Term Academic Summary
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium">
                <div>Total Subjects:</div>
                <div className="font-bold text-right">{data.stats.totalSubjects}</div>
                <div>Total Score:</div>
                <div className="font-bold text-right">{data.stats.totalScore}</div>
                <div>Overall Average:</div>
                <div className="font-bold text-right text-blue-650 dark:text-blue-450 print:text-black">{data.stats.average}%</div>
                <div>Class Position:</div>
                <div className="font-bold text-right text-slate-950 dark:text-white print:text-black">
                  {data.stats.position} of {data.stats.classCount}
                </div>
              </div>
            </div>

            {/* Assessment Remarks */}
            <div className="bg-slate-50 dark:bg-slate-950 print:bg-slate-150 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-800 dark:text-slate-200 print:text-black">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                Assessor Remarks
              </h4>
              <div className="text-xs leading-relaxed italic">
                {data.stats.average >= 70
                  ? 'Excellent term performance! Exhibited outstanding comprehension and effort across all coursework.'
                  : data.stats.average >= 50
                  ? 'Satisfactory performance. Showing steady understanding, with potential for higher grades next term.'
                  : 'Requires improvement. Encouraged to seek academic tutorials and increase preparation hours.'}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 pt-10 text-center text-xs font-sans text-slate-500">
            <div className="space-y-12">
              <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">Class Teacher Signature</p>
            </div>
            <div className="space-y-12">
              <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">School Principal Signature</p>
            </div>
          </div>
        </div>

      </div>

      {/* Global CSS Inject to customize printing size to A4 */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          /* Setup A4 Page */
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-650 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-550">Loading report card details...</p>
        </div>
      </div>
    }>
      <ReportCardContent />
    </Suspense>
  );
}
