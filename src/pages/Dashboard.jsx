import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import {
  Wallet, TrendingUp, Sparkles, Receipt, PiggyBank, ChevronLeft, ChevronRight,
  Download, FileText, FileSpreadsheet, Flame, Landmark,
} from 'lucide-react';
import { getDashboard, downloadPdfReport, downloadCsvReport } from '../services/api';
import StatCard from '../components/StatCard';
import HealthGauge from '../components/HealthGauge';
import { downloadBlob } from '../utils/download';
import { useToast } from '../context/ToastContext';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#0ea5e9', '#64748b'];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Dashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const fetchDashboard = async (m, y) => {
    setLoading(true);
    try {
      const res = await getDashboard(m, y);
      setData(res.data);
    } catch (err) {
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const currency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === 'pdf') {
        const res = await downloadPdfReport(month, year);
        downloadBlob(res.data, `expense-report-${year}-${String(month).padStart(2, '0')}.pdf`, 'application/pdf');
      } else {
        const res = await downloadCsvReport(month, year);
        downloadBlob(res.data, `expenses-${year}-${String(month).padStart(2, '0')}.csv`, 'text/csv');
      }
      showToast(`${type.toUpperCase()} report downloaded.`, 'success');
    } catch (err) {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your spending patterns at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 shadow-card">
            <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-28 sm:w-32 text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="relative group">
            <button
              disabled={exporting}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium px-3 py-2.5 rounded-xl shadow-card hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              <Download size={16} /> Export
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card-hover opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
              <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <FileText size={15} /> Download PDF
              </button>
              <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <FileSpreadsheet size={15} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spent" value={currency(data.totalSpentThisMonth)} icon={Wallet} trend={data.percentageChange} trendLabel="vs last month" />
        <StatCard label="Monthly Income" value={currency(data.monthlyIncome)} icon={TrendingUp} />
        <StatCard
          label="Remaining Budget"
          value={currency(data.remainingBudget)}
          icon={PiggyBank}
          accent={data.remainingBudget < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
        />
        <StatCard label="Transactions" value={data.totalTransactions} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <HealthGauge score={data.healthScore} label={data.healthLabel} breakdown={data.healthBreakdown} />
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 sm:p-6 shadow-card-hover">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-primary-200" />
            <h3 className="text-white font-semibold">Smart Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.smartInsights.map((insight, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-white/95 border border-white/10">
                {insight}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10 text-white/90 text-xs">
            <div className="flex items-center gap-1.5"><Flame size={14} /> Daily avg: {currency(data.dailyAverage)}</div>
            <div className="flex items-center gap-1.5"><Landmark size={14} /> Month-end forecast: {currency(data.projectedMonthEnd)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Daily Spending Trend</h3>
          {data.dailyTrend.length === 0 ? (
            <EmptyChart label="No expenses recorded for this month yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Category Breakdown</h3>
          {data.categoryBreakdown.length === 0 ? (
            <EmptyChart label="No category data yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.categoryBreakdown} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                {data.categoryBreakdown.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-300">{c.category}</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Top Expenses This Month</h3>
          {data.topExpenses.length === 0 ? (
            <EmptyChart label="No expenses to rank yet." />
          ) : (
            <div className="space-y-3">
              {data.topExpenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{e.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{e.category} · {e.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 shrink-0 ml-3">{currency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-52 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 text-center px-4">
      {label}
    </div>
  );
}
