// Centralized API service
// This creates a single axios instance so base URL, headers, and interceptors
// can be managed in one place instead of scattering http://localhost:8000 across files.

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

// Resolve base URL: prefer explicit env var, fallback to window location heuristic, then hardcoded dev default.
// Vite exposes env vars prefixed with VITE_.
// Provide a lightweight type guard for Vite's import.meta.env to appease TS without adding a global type file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteEnv = (import.meta as any)?.env as { VITE_API_BASE_URL?: string } | undefined;
const envBase = viteEnv?.VITE_API_BASE_URL;

function deriveBaseURL(): string {
	if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
	// Heuristic: if frontend served from same host (e.g., via docker compose), use same origin port 8000 by default
	if (typeof window !== 'undefined') {
		const { protocol, hostname } = window.location;
		return `${protocol}//${hostname}:8080`;
	}
	return 'http://localhost:8080';
}

export const API_BASE_URL = deriveBaseURL();

// Create axios instance
const api: AxiosInstance = axios.create({
	baseURL: `${API_BASE_URL}/api`, // unify so calls only specify endpoint paths e.g., /events
	withCredentials: false,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Token management helper
export const setAuthToken = (token: string | null) => {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		localStorage.setItem('token', token);
	} else {
		delete api.defaults.headers.common['Authorization'];
		localStorage.removeItem('token');
	}
};

// On initialization, if a token exists in localStorage set it.
const existing = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
if (existing) {
	setAuthToken(existing);
}

// Optional request interceptor (extendable for logging, retry tags, etc.)
api.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => config,
	(error) => Promise.reject(error)
);

// Response interceptor for global error handling (401, etc.)
api.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error) => {
		if (error?.response?.status === 401) {
			// Auto remove invalid token
			setAuthToken(null);
		}
		return Promise.reject(error);
	}
);

// Helper typed GET wrapper (optional usage)
export const get = <T = unknown>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then(r => r.data);
export const post = <T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) => api.post<T>(url, body, config).then(r => r.data);
export const put = <T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) => api.put<T>(url, body, config).then(r => r.data);
export const patch = <T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) => api.patch<T>(url, body, config).then(r => r.data);
export const del = <T = unknown>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config).then(r => r.data);

export default api;

// Usage examples (remove or comment out in prod):
// import api from '@/api/api';
// const events = await api.get('/events/');
// const rituals = await get<Ritual[]>('/rituals/');
