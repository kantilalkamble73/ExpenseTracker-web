import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { getBudgets, createOrUpdateBudget, deleteBudget, getCategories } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusConfig = {
  SAFE: { color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'On Track' },
  WARNING: { color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Approaching Limit' },
  EXCEEDED: { color: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', label: 'Exceeded' },
};

export default function Budgets() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categoryId: '', limitAmount: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = async (m, y) => {
    setLoading(true);
    try {
      const [budRes, catRes] = await Promise.all([getBudgets(m, y), getCategories()]);
      setBudgets(budRes.data);
      setCategories(catRes.data);
    } catch {
      showToast('Failed to load budgets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(month, year); }, [month, year]);

  const shiftMonth = (delta) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m); setYear(y);
  };

  const openModal = () => {
    setForm({ categoryId: categories[0]?.id || '', limitAmount: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createOrUpdateBudget({
        categoryId: parseInt(form.categoryId, 10),
        limitAmount: parseFloat(form.limitAmount),
        month, year,
      });
      showToast('Budget saved successfully.', 'success');
      setModalOpen(false);
      loadData(month, year);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save budget.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await deleteBudget(id);
      showToast('Budget deleted.', 'success');
      loadData(month, year);
    } catch {
      showToast('Failed to delete budget.', 'error');
    }
  };

  const currency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Budgets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set monthly limits and track your spending health</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 shadow-card">
            <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-28 text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-card"
          >
            <Plus size={16} /> Set Budget
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-10 text-center">
          <PiggyBank size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No budgets set for {monthNames[month - 1]} {year} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const cfg = statusConfig[b.status] || statusConfig.SAFE;
            const pct = Math.min(b.percentageUsed, 100);
            return (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{b.categoryName}</h3>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{currency(b.spentAmount)}</span>
                  <span className="text-sm text-slate-400 dark:text-slate-500">/ {currency(b.limitAmount)}</span>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${cfg.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {b.status === 'SAFE' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {cfg.label} · {b.percentageUsed}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set Monthly Budget">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            For {monthNames[month - 1]} {year}. Setting a budget for a category that already has one will update it.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Category</label>
            <select
              required value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-primary-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="" disabled>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Monthly Limit (₹)</label>
            <input
              type="number" step="0.01" min="0" required value={form.limitAmount}
              onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
            />
          </div>
          <button
            type="submit" disabled={submitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            Save Budget
          </button>
        </form>
      </Modal>
    </div>
  );
}
