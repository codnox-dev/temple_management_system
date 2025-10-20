import 'package:intl/intl.dart';
import '../models/attendance_model.dart';
import '../config/api_config.dart';
import 'api_client.dart';
import 'auth_service.dart';

class AttendanceService {
  static final AttendanceService _instance = AttendanceService._internal();
  factory AttendanceService() => _instance;
  
  AttendanceService._internal();

  final ApiClient _apiClient = ApiClient();
  final AuthService _authService = AuthService();

  // Mock function for distance (can be implemented with GPS later)
  Future<Map<String, dynamic>> getDistanceToTemple() async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    // For now, always return a valid distance
    // In production, you would use GPS to calculate actual distance
    return {
      'success': true,
      'distance': 100.0, // meters
      'unit': 'meters',
    };
  }

  // Mark attendance for today
  Future<Map<String, dynamic>> markAttendance() async {
    try {
      final user = _authService.getCurrentUser();
      if (user == null) {
        return {
          'success': false,
          'message': 'User not logged in',
        };
      }

      final now = DateTime.now();
      final timeFormat = DateFormat('HH:mm');
      
      // Create attendance record
      final attendanceData = {
        'user_id': user.id,
        'username': user.name,
        'attendance_date': DateFormat('yyyy-MM-dd').format(now),
        'is_present': true,
        'check_in_time': timeFormat.format(now),
        'overtime_hours': 0.0,
      };

      // Call backend API
      final response = await _apiClient.post(
        ApiConfig.markAttendanceEndpoint,
        body: attendanceData,
      );

      // Create Attendance object from response
      final attendance = Attendance.fromJson(response);
      
      return {
        'success': true,
        'message': '✅ Attendance marked successfully.',
        'attendance': attendance,
      };
    } on UnauthorizedException {
      return {
        'success': false,
        'message': 'Unauthorized. Please login again.',
      };
    } catch (e) {
      print('Mark attendance error: $e');
      return {
        'success': false,
        'message': 'Failed to mark attendance. Please try again.',
      };
    }
  }

  // Mark check-out
  Future<Map<String, dynamic>> markCheckOut() async {
    try {
      final user = _authService.getCurrentUser();
      if (user == null) {
        return {
          'success': false,
          'message': 'User not logged in',
        };
      }

      final now = DateTime.now();
      final timeFormat = DateFormat('HH:mm');
      
      // Create attendance record with check-out time
      final attendanceData = {
        'user_id': user.id,
        'username': user.name,
        'attendance_date': DateFormat('yyyy-MM-dd').format(now),
        'is_present': true,
        'check_out_time': timeFormat.format(now),
        'overtime_hours': 0.0,
      };

      // Call backend API
      final response = await _apiClient.post(
        ApiConfig.markAttendanceEndpoint,
        body: attendanceData,
      );

      final attendance = Attendance.fromJson(response);
      
      return {
        'success': true,
        'message': '✅ Check-out marked successfully.',
        'attendance': attendance,
      };
    } on UnauthorizedException {
      return {
        'success': false,
        'message': 'Unauthorized. Please login again.',
      };
    } catch (e) {
      print('Mark check-out error: $e');
      return {
        'success': false,
        'message': 'Failed to mark check-out. Please try again.',
      };
    }
  }

  // Get attendance records with pagination
  Future<List<Attendance>> getAttendanceRecords({
    int page = 1,
    int pageSize = 20,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };

      if (startDate != null) {
        queryParams['start_date'] = startDate;
      }
      if (endDate != null) {
        queryParams['end_date'] = endDate;
      }

      final response = await _apiClient.get(
        ApiConfig.attendanceRecordsEndpoint,
        queryParams: queryParams,
      );

      // Parse the records array
      final recordsList = response['records'] as List;
      return recordsList
          .map((json) => Attendance.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('Get attendance records error: $e');
      return [];
    }
  }

  // Get recent attendances (last 5 by default)
  Future<List<Attendance>> getRecentAttendances({int limit = 5}) async {
    return await getAttendanceRecords(page: 1, pageSize: limit);
  }

  // Get all attendances
  Future<List<Attendance>> getAllAttendances() async {
    return await getAttendanceRecords(page: 1, pageSize: 100);
  }

  // Get attendances by date range
  Future<List<Attendance>> getAttendancesByDateRange(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final startDateStr = DateFormat('yyyy-MM-dd').format(startDate);
    final endDateStr = DateFormat('yyyy-MM-dd').format(endDate);
    
    return await getAttendanceRecords(
      startDate: startDateStr,
      endDate: endDateStr,
      pageSize: 100,
    );
  }

  // Get attendance dashboard statistics
  Future<Map<String, dynamic>> getAttendanceStats() async {
    try {
      final response = await _apiClient.get(
        ApiConfig.attendanceDashboardEndpoint,
      );

      return {
        'thisMonth': response['total_present'] ?? 0,
        'total': response['total_days'] ?? 0,
        'pending': 0, // Backend doesn't have pending concept
        'presentDays': response['total_present'] ?? 0,
        'absentDays': response['total_absent'] ?? 0,
        'attendancePercentage': response['attendance_percentage'] ?? 0.0,
      };
    } catch (e) {
      print('Get attendance stats error: $e');
      return {
        'thisMonth': 0,
        'total': 0,
        'pending': 0,
        'presentDays': 0,
        'absentDays': 0,
        'attendancePercentage': 0.0,
      };
    }
  }

  // Get attendance report
  Future<Map<String, dynamic>> getAttendanceReport({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final queryParams = {
        'start_date': DateFormat('yyyy-MM-dd').format(startDate),
        'end_date': DateFormat('yyyy-MM-dd').format(endDate),
      };

      final response = await _apiClient.get(
        ApiConfig.attendanceReportEndpoint,
        queryParams: queryParams,
      );

      return response;
    } catch (e) {
      print('Get attendance report error: $e');
      return {};
    }
  }
}
