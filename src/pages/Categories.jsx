import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const colorPalette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#0ea5e9', '#64748b'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', color: colorPalette[0], icon: 'tag' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch {
      showToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: '', color: colorPalette[Math.floor(Math.random() * colorPalette.length)], icon: 'tag' });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, color: cat.color, icon: cat.icon });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        showToast('Category updated.', 'success');
      } else {
        await createCategory(form);
        showToast('Category added.', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      showToast('Category deleted.', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Categories</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize your expenses your way</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-card"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-4 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${cat.color}18` }}>
                <Tag size={18} style={{ color: cat.color }} />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{cat.name}</p>
              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(cat)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Name</label>
            <input
              type="text" required value={form.name} placeholder="e.g. Groceries"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorPalette.map((c) => (
                <button
                  type="button" key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit" disabled={submitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {editingId ? 'Update Category' : 'Add Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
