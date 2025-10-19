/**
 * Priest Attendance API Service
 * 
 * Handles all API calls for priest management, attendance marking, and salary reports.
 */

import api from './api';

// ============= Type Definitions =============

export interface Priest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  daily_salary: number;
  address?: string;
  specialization?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_days_worked?: number;
  current_month_days?: number;
  current_month_salary?: number;
}

export interface AttendanceRecord {
  id: string;
  priest_id: string;
  priest_name: string;
  attendance_date: string;
  is_present: boolean;
  check_in_time?: string;
  check_out_time?: string;
  half_day: boolean;
  overtime_hours: number;
  daily_salary: number;
  calculated_salary: number;
  notes?: string;
  marked_by: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyAttendanceStats {
  priest_id: string;
  priest_name: string;
  daily_salary: number;
  total_days_present: number;
  total_half_days: number;
  total_full_days: number;
  total_overtime_hours: number;
  base_salary: number;
  overtime_pay: number;
  total_salary: number;
  attendance_percentage: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  total_working_days: number;
  priests_stats: MonthlyAttendanceStats[];
  total_salary_disbursed: number;
  generated_at: string;
}

export interface AttendanceDashboard {
  today_present: number;
  today_absent: number;
  today_total: number;
  current_month_total_salary: number;
  active_priests_count: number;
  inactive_priests_count: number;
  current_month: number;
  current_year: number;
}

export interface PaginatedPriests {
  priests: Priest[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedAttendance {
  records: AttendanceRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreatePriestData {
  name: string;
  phone?: string;
  email?: string;
  daily_salary: number;
  address?: string;
  specialization?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdatePriestData {
  name?: string;
  phone?: string;
  email?: string;
  daily_salary?: number;
  address?: string;
  specialization?: string;
  is_active?: boolean;
  notes?: string;
}

export interface CreateAttendanceData {
  priest_id: string;
  attendance_date: string;
  is_present?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  half_day?: boolean;
  overtime_hours?: number;
  notes?: string;
}

export interface BulkAttendanceEntry {
  priest_id: string;
  is_present?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  half_day?: boolean;
  overtime_hours?: number;
  notes?: string;
}

export interface BulkAttendanceData {
  attendance_date: string;
  attendances: BulkAttendanceEntry[];
}

export interface UpdateAttendanceData {
  is_present?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  half_day?: boolean;
  overtime_hours?: number;
  notes?: string;
}

// ============= Priest Management APIs =============

export const createPriest = async (data: CreatePriestData): Promise<Priest> => {
  const response = await api.post('/priest-attendance/priests', data);
  return response.data;
};

export const getPriests = async (params?: {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  search?: string;
}): Promise<PaginatedPriests> => {
  const response = await api.get('/priest-attendance/priests', { params });
  return response.data;
};

export const getPriest = async (priestId: string): Promise<Priest> => {
  const response = await api.get(`/priest-attendance/priests/${priestId}`);
  return response.data;
};

export const updatePriest = async (priestId: string, data: UpdatePriestData): Promise<Priest> => {
  const response = await api.put(`/priest-attendance/priests/${priestId}`, data);
  return response.data;
};

export const deletePriest = async (priestId: string): Promise<void> => {
  await api.delete(`/priest-attendance/priests/${priestId}`);
};

// ============= Attendance Marking APIs =============

export const markAttendance = async (data: CreateAttendanceData): Promise<AttendanceRecord> => {
  const response = await api.post('/priest-attendance/attendance', data);
  return response.data;
};

export const markBulkAttendance = async (data: BulkAttendanceData): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  const response = await api.post('/priest-attendance/attendance/bulk', data);
  return response.data;
};

export const getAttendanceRecords = async (params?: {
  page?: number;
  page_size?: number;
  priest_id?: string;
  start_date?: string;
  end_date?: string;
  month?: number;
  year?: number;
  is_present?: boolean;
}): Promise<PaginatedAttendance> => {
  const response = await api.get('/priest-attendance/attendance', { params });
  return response.data;
};

export const getAttendanceRecord = async (attendanceId: string): Promise<AttendanceRecord> => {
  const response = await api.get(`/priest-attendance/attendance/${attendanceId}`);
  return response.data;
};

export const updateAttendance = async (attendanceId: string, data: UpdateAttendanceData): Promise<AttendanceRecord> => {
  const response = await api.put(`/priest-attendance/attendance/${attendanceId}`, data);
  return response.data;
};

export const deleteAttendance = async (attendanceId: string): Promise<void> => {
  await api.delete(`/priest-attendance/attendance/${attendanceId}`);
};

// ============= Reports & Dashboard APIs =============

export const getMonthlyReport = async (params: {
  month: number;
  year: number;
  priest_id?: string;
}): Promise<MonthlyReport> => {
  const response = await api.get('/priest-attendance/reports/monthly', { params });
  return response.data;
};

export const getDashboardStats = async (): Promise<AttendanceDashboard> => {
  const response = await api.get('/priest-attendance/dashboard');
  return response.data;
};

// ============= Helper Functions =============

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get current month and year
 */
export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

/**
 * Format currency (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Get month name
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};

export default {
  // Priest Management
  createPriest,
  getPriests,
  getPriest,
  updatePriest,
  deletePriest,
  
  // Attendance
  markAttendance,
  markBulkAttendance,
  getAttendanceRecords,
  getAttendanceRecord,
  updateAttendance,
  deleteAttendance,
  
  // Reports
  getMonthlyReport,
  getDashboardStats,
  
  // Helpers
  formatDateForAPI,
  getCurrentMonthYear,
  formatCurrency,
  formatDate,
  getMonthName
};
