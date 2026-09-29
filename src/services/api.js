import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------------- Auth ----------------
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// ---------------- Categories ----------------
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ---------------- User / Profile ----------------
export const getProfile = () => api.get('/users/me');
export const updateProfile = (data) => api.put('/users/me', data);

// ---------------- Smart suggestion ----------------
export const suggestCategory = (title) => api.get('/expenses/suggest-category', { params: { title } });

// ---------------- Recurring Expenses ----------------
export const getRecurring = () => api.get('/recurring');
export const createRecurring = (data) => api.post('/recurring', data);
export const toggleRecurring = (id) => api.patch(`/recurring/${id}/toggle`);
export const deleteRecurring = (id) => api.delete(`/recurring/${id}`);

// ---------------- Reports (PDF / CSV) ----------------
export const downloadPdfReport = (month, year) =>
  api.get('/reports/pdf', { params: { month, year }, responseType: 'blob' });
export const downloadCsvReport = (month, year) =>
  api.get('/reports/csv', { params: { month, year }, responseType: 'blob' });

// ---------------- Expenses ----------------
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// ---------------- Budgets ----------------
export const getBudgets = (month, year) => api.get('/budgets', { params: { month, year } });
export const createOrUpdateBudget = (data) => api.post('/budgets', data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// ---------------- Dashboard ----------------
export const getDashboard = (month, year) => api.get('/dashboard', { params: { month, year } });

export default api;
