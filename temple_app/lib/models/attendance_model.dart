enum AttendanceStatus {
  synced,
  pending,
  failed,
}

class Attendance {
  final String? id; // Optional for new records
  final String userId;
  final String username;
  final DateTime date;
  final bool isPresent;
  final String? checkInTime; // HH:MM format from backend
  final String? checkOutTime; // HH:MM format from backend
  final double overtimeHours;
  final AttendanceStatus status;
  final double? distance; // Distance from temple in meters
  final String? notes;

  Attendance({
    this.id,
    required this.userId,
    required this.username,
    required this.date,
    required this.isPresent,
    this.checkInTime,
    this.checkOutTime,
    this.overtimeHours = 0.0,
    required this.status,
    this.distance,
    this.notes,
  });

  // Parse backend response
  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['_id'] ?? json['id'],
      userId: json['user_id'] ?? '',
      username: json['username'] ?? '',
      date: DateTime.parse(json['attendance_date']),
      isPresent: json['is_present'] ?? false,
      checkInTime: json['check_in_time'],
      checkOutTime: json['check_out_time'],
      overtimeHours: (json['overtime_hours'] ?? 0.0).toDouble(),
      status: AttendanceStatus.synced,
      notes: json['notes'],
    );
  }

  // Convert to backend format for marking attendance
  Map<String, dynamic> toBackendJson() {
    return {
      'user_id': userId,
      'username': username,
      'attendance_date': '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
      'is_present': isPresent,
      if (checkInTime != null) 'check_in_time': checkInTime,
      if (checkOutTime != null) 'check_out_time': checkOutTime,
      'overtime_hours': overtimeHours,
      if (notes != null) 'notes': notes,
    };
  }

  // Convert to local JSON format
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'username': username,
      'date': date.toIso8601String(),
      'is_present': isPresent,
      'check_in_time': checkInTime,
      'check_out_time': checkOutTime,
      'overtime_hours': overtimeHours,
      'status': status.toString().split('.').last,
      'distance': distance,
      'notes': notes,
    };
  }

  String get statusText {
    switch (status) {
      case AttendanceStatus.synced:
        return 'Synced';
      case AttendanceStatus.pending:
        return 'Pending';
      case AttendanceStatus.failed:
        return 'Failed';
    }
  }

  // Helper to get DateTime from time string
  DateTime? getCheckInDateTime() {
    if (checkInTime == null) return null;
    final parts = checkInTime!.split(':');
    if (parts.length != 2) return null;
    return DateTime(
      date.year,
      date.month,
      date.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }

  DateTime? getCheckOutDateTime() {
    if (checkOutTime == null) return null;
    final parts = checkOutTime!.split(':');
    if (parts.length != 2) return null;
    return DateTime(
      date.year,
      date.month,
      date.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }
}
