import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, CreditCard, Search, Sparkles } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories, suggestCategory } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const paymentModes = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'OTHER'];

const emptyForm = {
  amount: '', title: '', description: '', expenseDate: new Date().toISOString().slice(0, 10),
  paymentMode: 'CASH', categoryId: '',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState(null);
  const suggestTimer = useRef(null);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([getExpenses(), getCategories()]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch (err) {
      showToast('Failed to load expenses.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setSuggestedCategoryId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingId(expense.id);
    setSuggestedCategoryId(null);
    setForm({
      amount: expense.amount,
      title: expense.title || '',
      description: expense.description || '',
      expenseDate: expense.expenseDate,
      paymentMode: expense.paymentMode,
      categoryId: expense.category?.id,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (value) => {
    setForm((f) => ({ ...f, title: value }));
    if (editingId) return; // only auto-suggest for new expenses
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (value.trim().length < 3) { setSuggestedCategoryId(null); return; }
      try {
        const res = await suggestCategory(value.trim());
        if (res.data) {
          setSuggestedCategoryId(res.data);
        } else {
          setSuggestedCategoryId(null);
        }
      } catch { /* silent - suggestion is a nice-to-have */ }
    }, 500);
  };

  const applySuggestion = () => {
    if (suggestedCategoryId) {
      setForm((f) => ({ ...f, categoryId: suggestedCategoryId }));
      setSuggestedCategoryId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId, 10) };
      if (editingId) {
        await updateExpense(editingId, payload);
        showToast('Expense updated successfully.', 'success');
      } else {
        await createExpense(payload);
        showToast('Expense added successfully.', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      showToast('Expense deleted.', 'success');
      loadData();
    } catch {
      showToast('Failed to delete expense.', 'error');
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || String(e.category?.id) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const currency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const suggestedCategory = categories.find((c) => c.id === suggestedCategoryId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Expenses</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{expenses.length} transactions recorded</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-card"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-primary-500 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No expenses found. Start by adding one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{expense.title || 'Untitled'}</p>
                      {expense.description && <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{expense.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${expense.category?.color}18`, color: expense.category?.color }}
                      >
                        {expense.category?.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{expense.expenseDate}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                        <CreditCard size={13} /> {expense.paymentMode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">{currency(expense.amount)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(expense)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
              <input
                type="date" required value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
            <input
              type="text" value={form.title} placeholder="e.g. Grocery shopping"
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
            />
            {suggestedCategory && suggestedCategory.id !== parseInt(form.categoryId, 10) && (
              <button
                type="button" onClick={applySuggestion}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Sparkles size={12} /> Suggested: {suggestedCategory.name} (click to apply)
              </button>
            )}
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
            {categories.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">No categories found. Go to the Categories page and add one first.</p>
            )}
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

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Notes (optional)</label>
            <textarea
              rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none resize-none"
            />
          </div>

          <button
            type="submit" disabled={submitting || categories.length === 0}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
