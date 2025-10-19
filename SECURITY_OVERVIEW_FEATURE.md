# Security Overview Feature

## Overview
The Security Overview feature provides a comprehensive dashboard for monitoring and analyzing security events in the Temple Management System. This feature is accessible only to Super Admins (role_id: 0) and Admins (role_id: 1).

## Features

### 1. **Security Statistics Dashboard**
- **Total Events**: Count of all security events in a configurable time range
- **Unique Users**: Number of distinct users who triggered security events
- **Unique IPs**: Number of different IP addresses detected
- **Event Type Breakdown**: Distribution of different event types
- **Configurable Time Range**: View stats for last 24h, 3d, 7d, or 30d

### 2. **Advanced Filtering**
Filter security events by:
- **Username**: Search for events by specific user (fuzzy search)
- **Event Type**: Filter by specific security event types
- **Date Range**: Custom start and end date/time filters
- **Combination Filters**: Apply multiple filters simultaneously

### 3. **Event Type Color Coding**
Events are visually categorized with color-coded badges:
- 🟢 **Green**: Success events (login_success, etc.)
- 🔴 **Red**: Failed/Error events (login_failed, etc.)
- 🟡 **Yellow**: Suspicious activity (rate_limit_exceeded, suspicious_activity_detected)
- 🔵 **Blue**: Token operations (refresh_token_rotated, etc.)
- ⚪ **Gray**: Other events

### 4. **Detailed Event Information**
Each event displays:
- Event type with visual badge
- Username (resolved from user_id)
- Timestamp (human-readable format)
- IP address
- Device information (platform, screen resolution, timezone, language)
- Full user agent string
- Raw event details (expandable JSON)

### 5. **Pagination**
- Configurable page size (50 events per page by default)
- Navigate between pages easily
- Shows current page position and total count

## Backend API

### Endpoints

#### 1. GET `/api/security/events`
Retrieve security events with filtering and pagination.

**Query Parameters:**
- `page` (int, default: 1): Page number
- `page_size` (int, default: 50, max: 200): Items per page
- `event_type` (string, optional): Filter by event type
- `username` (string, optional): Filter by username (case-insensitive regex)
- `start_date` (datetime, optional): Filter events from this date
- `end_date` (datetime, optional): Filter events until this date

**Response:**
```json
{
  "events": [
    {
      "_id": "68f49514ece5e9d99d693489",
      "event_type": "login_success",
      "timestamp": "2025-10-19T07:36:52.676Z",
      "ip_address": "172.18.0.1",
      "user_agent": "Mozilla/5.0...",
      "user_id": "68f494d39bf2434b11cb73ee",
      "username": "admin",
      "mobile_number": null,
      "details": { ... }
    }
  ],
  "total_count": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3
}
```

#### 2. GET `/api/security/events/types`
Get all distinct event types for the filter dropdown.

**Response:**
```json
[
  "login_success",
  "login_failed",
  "refresh_token_rotated",
  "rate_limit_exceeded",
  "suspicious_activity_detected"
]
```

#### 3. GET `/api/security/events/stats`
Get security statistics for a specified time range.

**Query Parameters:**
- `hours` (int, default: 24, max: 720): Time range in hours

**Response:**
```json
{
  "time_range_hours": 24,
  "event_counts": {
    "login_success": 45,
    "refresh_token_rotated": 30,
    "login_failed": 5
  },
  "unique_ips": 12,
  "unique_users": 8,
  "total_events": 80
}
```

## Frontend Implementation

### Component: `SecurityDashboard.tsx`
Location: `frontend/src/pages/admin/SecurityDashboard.tsx`

#### Key Features:
1. **Role-Based Access Control**: Automatically blocks non-admin users
2. **Real-time Filtering**: Apply filters without page reload
3. **Responsive Design**: Works on mobile, tablet, and desktop
4. **Loading States**: Shows loading indicators during API calls
5. **Error Handling**: Graceful error messages with toast notifications

#### State Management:
- `events`: Array of security events
- `stats`: Security statistics object
- `eventTypes`: Available event types for filtering
- `loading`: Loading state for events
- `statsLoading`: Loading state for statistics
- Filter states: `usernameFilter`, `eventTypeFilter`, `startDate`, `endDate`
- Pagination states: `currentPage`, `totalPages`, `totalCount`

### Navigation Integration

#### Sidebar (`TempleSidebar.tsx`)
Security Overview appears under "Admin Management" section for Super Admin and Admin roles:
```
Admin Management
├── Manage Admins
├── Activity Log
├── Security Overview  ← New
└── Backup Management
```

#### Routing (`App.tsx`)
```tsx
<Route path="security" element={
  <RoleGuard allow={(rid) => (rid ?? 99) <= 1}>
    <SecurityDashboard />
  </RoleGuard>
} />
```

## Security Event Types

Common event types logged by the system:

1. **Authentication Events**
   - `login_success`: Successful password login
   - `login_failed`: Failed login attempt
   - `otp_verification_success`: Successful OTP verification
   - `otp_verification_failed`: Failed OTP verification

2. **Token Events**
   - `refresh_token_rotated`: Token refresh performed
   - `token_revoked`: Token manually revoked
   - `logout`: User logged out

3. **Security Events**
   - `rate_limit_exceeded`: Rate limit triggered
   - `suspicious_activity_detected`: Suspicious behavior detected
   - `account_locked`: Account locked due to suspicious activity

4. **Admin Events**
   - `admin_created`: New admin user created
   - `admin_updated`: Admin user updated
   - `admin_deleted`: Admin user deleted
   - `password_changed`: Password changed

## Database Collection

### Collection: `security_events`

**Example Document:**
```json
{
  "_id": ObjectId("68f49514ece5e9d99d693489"),
  "event_type": "login_success",
  "timestamp": ISODate("2025-10-19T07:36:52.676Z"),
  "ip_address": "172.18.0.1",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "user_id": "68f494d39bf2434b11cb73ee",
  "mobile_number": null,
  "details": {
    "device_identifier": "{\"screen_width\":2560,\"screen_height\":1440,...}"
  }
}
```

**Indexes:**
- `timestamp`: For efficient date range queries
- `event_type`: For filtering by event type
- `user_id`: For user-specific queries
- `ip_address`: For IP-based analysis

## Usage Examples

### Example 1: View Recent Login Attempts
1. Navigate to Admin Management → Security Overview
2. Set "Event Type" filter to "Login Success" or "Login Failed"
3. Set date range to last 24 hours
4. Click "Apply Filters"

### Example 2: Monitor Specific User Activity
1. Navigate to Security Overview
2. Enter username in the "Username" filter
3. Leave other filters empty to see all events
4. Click "Apply Filters"

### Example 3: Investigate Suspicious Activity
1. Navigate to Security Overview
2. Set "Event Type" to "Suspicious Activity Detected"
3. Review the events for patterns
4. Check IP addresses and device information
5. Expand "View Details" to see full context

### Example 4: Export Security Data
While direct export is not yet implemented, you can:
1. Apply desired filters
2. View event details
3. Use browser's print/PDF function to save the page

## Access Control

### Backend
- `_can_view_security()` function checks if user has `role_id <= 1`
- Returns 403 Forbidden if access denied
- Applied to all security endpoints

### Frontend
- Role check at component level
- Shows "Access Denied" message for unauthorized users
- Navigation link only visible to authorized roles

## Performance Considerations

1. **Pagination**: Events are paginated to prevent loading large datasets
2. **Indexing**: Database indexes optimize query performance
3. **Lazy Loading**: Statistics and event types loaded separately
4. **Efficient Queries**: Username resolution done in batch for all events on a page

## Future Enhancements

Potential improvements for future versions:
1. **Export Functionality**: CSV/Excel export of filtered events
2. **Real-time Updates**: WebSocket integration for live event streaming
3. **Advanced Analytics**: Charts and graphs for event trends
4. **Event Retention Policy**: Automated cleanup of old events
5. **Alert System**: Email/SMS notifications for critical security events
6. **IP Geolocation**: Show geographic location of IP addresses
7. **Device Fingerprinting**: Enhanced device tracking and analysis
8. **Custom Event Types**: Allow admins to define custom security events

## Troubleshooting

### Events Not Showing
1. Verify you have Super Admin or Admin role
2. Check if filters are too restrictive
3. Verify backend API is running
4. Check browser console for errors

### Performance Issues
1. Reduce page size if loading is slow
2. Apply more specific filters to reduce result set
3. Check database indexes are properly created
4. Monitor backend API response times

### Username Not Resolving
1. Verify user exists in admins collection
2. Check if user_id in event matches an admin
3. Look for deleted users whose events remain

## Related Files

### Backend
- `backend/app/routers/security.py` - Security API endpoints
- `backend/app/services/security_service.py` - Security event logging service
- `backend/app/models/security_models.py` - Security event models
- `backend/app/database.py` - Database connection and collections

### Frontend
- `frontend/src/pages/admin/SecurityDashboard.tsx` - Main component
- `frontend/src/components/TempleSidebar.tsx` - Navigation integration
- `frontend/src/App.tsx` - Routing configuration

## Support

For issues or questions regarding the Security Overview feature:
1. Check this documentation first
2. Review related code files listed above
3. Check system logs for errors
4. Contact the development team

---

**Last Updated**: October 19, 2025  
**Version**: 1.0.0  
**Author**: Temple Management System Team
