import React, { useState } from 'react';
import { User, IndianRupee, Save } from 'lucide-react';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    monthlyIncome: user?.monthlyIncome ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await updateProfile({
        fullName: form.fullName,
        monthlyIncome: parseFloat(form.monthlyIncome) || 0,
      });
      updateUserData({ ...user, ...res.data });
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (form.fullName || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update your details and monthly income for accurate insights</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 font-bold text-xl flex items-center justify-center">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{user?.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" required value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input
              type="email" disabled value={user?.email}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monthly Income (₹)</label>
            <div className="relative">
              <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number" min="0" step="0.01" value={form.monthlyIncome}
                onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                placeholder="50000"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Used to calculate your Remaining Budget, Health Score and savings-rate insights.
            </p>
          </div>

          <button
            type="submit" disabled={submitting}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
