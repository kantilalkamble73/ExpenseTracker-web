import React from 'react';
import { HeartPulse } from 'lucide-react';

const labelColors = {
  Excellent: { ring: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  Good: { ring: '#6366f1', bg: 'bg-primary-50 dark:bg-primary-500/10', text: 'text-primary-700 dark:text-primary-400' },
  Fair: { ring: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  'Needs Attention': { ring: '#ef4444', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400' },
};

export default function HealthGauge({ score = 0, label = 'Fair', breakdown = [] }) {
  const cfg = labelColors[label] || labelColors.Fair;
  const safeScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  const safeBreakdown = Array.isArray(breakdown) ? breakdown : [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse size={18} className="text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Financial Health Score</h3>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
              className="text-slate-100 dark:text-slate-800" />
            <circle
              cx="64" cy="64" r={radius} fill="none" stroke={cfg.ring} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{safeScore}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 ${cfg.bg} ${cfg.text}`}>
            {label}
          </span>
          <div className="space-y-2">
            {safeBreakdown.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                  <span>{f.label}</span>
                  <span>{f.score}/{f.max}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${f.max ? (f.score / f.max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
