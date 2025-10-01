// Centralized API service
// This creates a single axios instance so base URL, headers, and interceptors
// can be managed in one place instead of scattering http://localhost:8000 across files.

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { enhancedJwtAuth } from '../lib/enhancedJwtAuth';

// Resolve base URL: prefer explicit env var, fallback to window location heuristic, then hardcoded dev default.
// Vite exposes env vars prefixed with VITE_.
// Provide a lightweight type guard for Vite's import.meta.env to appease TS without adding a global type file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteEnv = (import.meta as any)?.env as { VITE_API_BASE_URL?: string } | undefined;
const envBase = viteEnv?.VITE_API_BASE_URL;

function deriveBaseURL(): string {
	if (envBase && envBase.trim()) return envBase.replace(/\/$/, '');
	// Prefer local backend only when running on localhost
	if (typeof window !== 'undefined') {
		const { protocol, hostname } = window.location;
		if (hostname === 'localhost' || hostname === '127.0.0.1') {
			return `${protocol}//${hostname}:8080`;
		}
	}
	// Default to Render production API when no env provided (Netlify, etc.)
	return 'https://temple-management-system-3p4x.onrender.com';
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

// Request interceptor to add JWT authentication
api.interceptors.request.use(
	async (config: InternalAxiosRequestConfig) => {
		try {
			// Skip auth for authentication endpoints
			const authPaths = ['/api/auth/get-token', '/api/auth/login', '/api/auth/refresh-token'];
			const isAuthPath = authPaths.some(path => config.url?.includes(path));
			
			if (!isAuthPath) {
				// Get current access token (handles automatic refresh)
				const token = await enhancedJwtAuth.getAccessToken();
				if (token) {
					config.headers.set('Authorization', `Bearer ${token}`);
					
					// Add enhanced security headers
					const deviceFingerprint = enhancedJwtAuth.getDeviceFingerprint();
					const location = enhancedJwtAuth.getCurrentLocationData();
					
					if (deviceFingerprint) {
						config.headers.set('X-Device-Fingerprint', JSON.stringify(deviceFingerprint));
					}
					
					if (location) {
						config.headers.set('X-Client-Latitude', location.latitude.toString());
						config.headers.set('X-Client-Longitude', location.longitude.toString());
					}
				}
			}
		} catch (error) {
			console.error('Failed to set JWT token:', error);
		}
		
		return config;
	},
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
