import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Repeat, Power, Calendar } from 'lucide-react';
import { getRecurring, createRecurring, toggleRecurring, deleteRecurring, getCategories } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const paymentModes = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'OTHER'];

const emptyForm = {
  title: '', amount: '', categoryId: '', frequency: 'MONTHLY',
  startDate: new Date().toISOString().slice(0, 10), paymentMode: 'CASH',
};

export default function Recurring() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, catRes] = await Promise.all([getRecurring(), getCategories()]);
      setItems(recRes.data);
      setCategories(catRes.data);
    } catch {
      showToast('Failed to load recurring expenses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRecurring({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: parseInt(form.categoryId, 10),
      });
      showToast('Recurring expense scheduled.', 'success');
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule recurring expense.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRecurring(id);
      loadData();
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring expense?')) return;
    try {
      await deleteRecurring(id);
      showToast('Recurring expense removed.', 'success');
      loadData();
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const currency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recurring Expenses</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rent, subscriptions, EMIs — set once and they'll auto-log every cycle
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-card"
        >
          <Plus size={16} /> Schedule Expense
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <Repeat size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No recurring expenses yet. Schedule rent or a subscription to automate tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {items.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${r.category?.color}18` }}
                  >
                    <Repeat size={16} style={{ color: r.category?.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>{r.category?.name}</span>·<span className="capitalize">{r.frequency.toLowerCase()}</span>·
                      <span className="flex items-center gap-1"><Calendar size={11} /> Next: {r.nextDueDate}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{currency(r.amount)}</span>
                  <button
                    onClick={() => handleToggle(r.id)}
                    title={r.active ? 'Active — click to pause' : 'Paused — click to activate'}
                    className={`p-1.5 rounded-lg ${r.active ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <Power size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Recurring Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
            <input
              type="text" required value={form.title} placeholder="e.g. Netflix subscription"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Amount (₹)</label>
              <input
                type="number" step="0.01" min="0" required value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-primary-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {frequencies.map((f) => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Start Date</label>
              <input
                type="date" required value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-primary-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            A backend job checks daily and automatically logs this as a real expense whenever it's due.
          </p>

          <button
            type="submit" disabled={submitting || categories.length === 0}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            Schedule Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
