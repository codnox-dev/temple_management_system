class ApiConfig {
  // Base URL for your backend
  static const String baseUrl = 'http://192.168.18.224:8080';
  
  // ⚠️ IMPORTANT: Mobile App Secret
  // This must match MOBILE_APP_SECRET in your backend .env file
  // Generate a secure secret with: python -c "import secrets; print(secrets.token_urlsafe(32))"
  // TODO: Change this to your actual secret from backend .env
  static const String mobileAppSecret = '86fQw6ozUYU21OqdvpBt5ar9DLeY5LPyZHSpGi_uHr0';
  
  // API endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String verifyTokenEndpoint = '/api/auth/verify-token';
  static const String refreshTokenEndpoint = '/api/auth/refresh-token';
  
  // Attendance endpoints
  static const String markAttendanceEndpoint = '/api/attendance/mark';
  static const String attendanceRecordsEndpoint = '/api/attendance/records';
  static const String attendanceDashboardEndpoint = '/api/attendance/dashboard';
  static const String attendanceReportEndpoint = '/api/attendance/report';
  
  // Headers
  static Map<String, String> getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Mobile verification header - required by backend
      'X-Mobile-Auth': mobileAppSecret,
      // Note: We intentionally don't set Origin header
      // Mobile apps don't need it and it may cause CORS issues
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
  
  // Full URL helper
  static String getFullUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
}
