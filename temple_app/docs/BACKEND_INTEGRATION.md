# Backend Integration Guide

## Overview
The Temple Attendance Manager app has been integrated with your FastAPI backend at `192.168.18.224:8080`.

## Configuration

### Backend URL
The backend URL is configured in `lib/config/api_config.dart`:
```dart
static const String baseUrl = 'http://192.168.18.224:8080';
```

**Important**: If your backend URL changes, update this value.

## Integrated Features

### 1. Authentication
**File**: `lib/services/auth_service.dart`

**Login Flow**:
- Endpoint: `POST /api/auth/login`
- Input: `username` and `password`
- Response: `access_token`, `refresh_token`, `expires_in`
- Tokens are automatically stored in SharedPreferences

**Logout Flow**:
- Endpoint: `POST /api/auth/logout`
- Clears tokens and user data

### 2. Attendance Marking
**File**: `lib/services/attendance_service.dart`

**Mark Attendance**:
- Endpoint: `POST /api/attendance/mark`
- Automatically sends:
  - `user_id`: Current logged-in user
  - `username`: Current user's name
  - `attendance_date`: Today's date (YYYY-MM-DD format)
  - `is_present`: true
  - `check_in_time`: Current time (HH:MM format)
  - `overtime_hours`: 0.0

**Mark Check-Out**:
- Same endpoint: `POST /api/attendance/mark`
- Sends `check_out_time` instead of `check_in_time`

### 3. Attendance Records
**File**: `lib/services/attendance_service.dart`

**Get Records**:
- Endpoint: `GET /api/attendance/records`
- Query Parameters:
  - `page`: Page number (default: 1)
  - `page_size`: Number of records per page (default: 20)
  - `start_date`: Filter by start date (optional)
  - `end_date`: Filter by end date (optional)

**Get Dashboard Stats**:
- Endpoint: `GET /api/attendance/dashboard`
- Returns: `total_present`, `total_absent`, `attendance_percentage`, etc.

**Get Attendance Report**:
- Endpoint: `GET /api/attendance/report`
- Query Parameters: `start_date`, `end_date`

## API Client

**File**: `lib/services/api_client.dart`

The `ApiClient` class provides:
- **Token Management**: Automatic saving/loading of access and refresh tokens
- **HTTP Methods**: `get()`, `post()`, `put()`, `delete()`
- **Error Handling**: Custom exceptions for different error types
- **Auto-Authentication**: Automatically adds Bearer token to requests

### Usage Example:
```dart
final apiClient = ApiClient();

// GET request
final response = await apiClient.get('/api/attendance/records');

// POST request
final response = await apiClient.post(
  '/api/attendance/mark',
  body: {'user_id': 'user123', 'is_present': true},
);
```

## Data Models

### Attendance Model
**File**: `lib/models/attendance_model.dart`

Aligned with backend `AttendanceRecordResponse`:
- `user_id` (String)
- `username` (String)
- `attendance_date` (DateTime)
- `is_present` (bool)
- `check_in_time` (String, HH:MM format)
- `check_out_time` (String, HH:MM format)
- `overtime_hours` (double)
- `notes` (String, optional)

### User Model
**File**: `lib/models/user_model.dart`

- `id` (String)
- `name` (String)
- `email` (String)
- `role` (String)
- `phone` (String, optional)
- `photoUrl` (String, optional)

## Testing the Integration

### Prerequisites:
1. Ensure your backend is running at `192.168.18.224:8080`
2. Ensure your mobile device/emulator can reach the backend (same network)
3. If using Android emulator, you may need to use `10.0.2.2` instead of `localhost`

### Test Steps:

1. **Test Login**:
   ```
   - Open the app
   - Enter username and password from your backend
   - Tap "Login"
   - Should navigate to Attendance screen
   ```

2. **Test Mark Attendance**:
   ```
   - On Attendance screen, tap "Mark Attendance"
   - Should show success message
   - Recent attendance should update
   ```

3. **Test View Reports**:
   ```
   - Navigate to Report tab
   - Select date range
   - Should display attendance records from backend
   ```

4. **Test Profile**:
   ```
   - Navigate to Profile tab
   - Should show logged-in user's information
   - Test logout functionality
   ```

## Network Configuration

### For Android Emulator:
If testing on Android Emulator, update `lib/config/api_config.dart`:
```dart
static const String baseUrl = 'http://10.0.2.2:8080'; // Maps to localhost
```

### For Physical Device:
Ensure both device and backend are on the same WiFi network and use the backend's local IP address (currently `192.168.18.224`).

### For iOS Simulator:
iOS Simulator can use `localhost` or the machine's local IP address:
```dart
static const String baseUrl = 'http://192.168.18.224:8080';
```

## Error Handling

The app handles several error scenarios:

1. **Network Errors**: Shows "Connection error. Please check your network."
2. **Unauthorized (401)**: Shows "Invalid username or password" or prompts re-login
3. **Not Found (404)**: Shows appropriate error message
4. **Server Errors (5xx)**: Shows "Failed to [action]. Please try again."

## Security Notes

1. **HTTPS**: Consider using HTTPS in production instead of HTTP
2. **Token Storage**: Tokens are stored in SharedPreferences (secure on both iOS and Android)
3. **Token Refresh**: The `ApiClient` includes a `refreshAccessToken()` method for token refresh logic

## Troubleshooting

### "Connection refused" or timeout errors:
- Check if backend is running: `curl http://192.168.18.224:8080/docs`
- Verify firewall settings on backend machine
- Ensure mobile device is on same network

### "Unauthorized" errors:
- Verify credentials are correct in backend database
- Check if token has expired
- Try logging out and logging back in

### Data not showing:
- Check backend logs for errors
- Verify API endpoints are correct
- Use backend Swagger docs (`/docs`) to test endpoints manually

## Future Enhancements

Potential improvements:
1. Implement GPS-based distance checking for `getDistanceToTemple()`
2. Add offline support with local database (SQLite)
3. Implement push notifications integration
4. Add biometric authentication
5. Support for profile photo upload

## Contact

For backend-related issues, check:
- Backend logs
- FastAPI Swagger documentation at `http://192.168.18.224:8080/docs`
- MongoDB database connection

For mobile app issues, check:
- Flutter console logs
- `print()` statements in service files
- Network inspector tools
