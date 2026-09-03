import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('technova_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 — but NOT for the login endpoint itself
// (otherwise a failed login would instantly reload the page before
//  the error message can be shown to the user)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('technova_token');
      localStorage.removeItem('technova_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
