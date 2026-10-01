import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, accent }) {
  const hasTrend = typeof trend === 'number' && !isNaN(trend);
  const isPositive = hasTrend && trend >= 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${accent || 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-50 dark:bg-primary-500/15">
            <Icon size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
      {hasTrend && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <ArrowUpRight size={14} className="text-red-500" />
          ) : (
            <ArrowDownRight size={14} className="text-emerald-500" />
          )}
          <span className={`text-xs font-semibold ${isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
