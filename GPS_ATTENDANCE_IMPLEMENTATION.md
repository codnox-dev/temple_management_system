# GPS-Based Attendance System - Complete Implementation (Updated)

## Overview
This document outlines the implementation of a comprehensive GPS-based attendance system for the temple management application. The system includes backend APIs, frontend management interface, and preparations for a Flutter mobile app.

---

## Architecture Changes

### Location Management (Separate from Attendance)
- **Temple location** is now stored in a separate `location_config` MongoDB collection
- **Super admins** can configure temple coordinates via web interface
- **Mobile apps** fetch location settings from the server on connection
- **Attendance records** only store check-in/check-out GPS coordinates, not temple location

---

## Backend Changes

### 1. New Models (`backend/app/models/location_models.py`)

**LocationConfigBase**
- `name`: Location name (e.g., "Main Temple")
- `latitude`: GPS latitude (-90 to 90)
- `longitude`: GPS longitude (-180 to 180)
- `check_in_radius`: Radius for valid check-in/out (10-1000m, default: 100m)
- `outside_radius`: Beyond this, user is "outside" (100-5000m, default: 500m)
- `address`: Optional physical address
- `notes`: Optional notes
- `is_active`: Whether this location is currently active

### 2. New Router (`backend/app/routers/location.py`)

**Endpoints:**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/location/config` | GET | All authenticated users | Get active location config (for mobile apps) |
| `/api/location/config` | POST | Super admin only | Create new location config |
| `/api/location/config` | PUT | Super admin only | Update active location config |
| `/api/location/config/{id}` | DELETE | Super admin only | Delete location config |
| `/api/location/config/all` | GET | Super admin only | List all location configs |
| `/api/location/config/{id}/activate` | PATCH | Super admin only | Activate specific location |

**Security:**
- Only users with `role_id === 0` (Super Admin) can create, update, or delete
- All authenticated users can fetch active location (needed for mobile app)

### 3. Updated Attendance Models

**Changes to `backend/app/models/priest_attendance_models.py`:**
- Added `outside_hours` field (float, tracks time spent outside work zone)
- Changed `location` to two separate fields:
  - `check_in_location`: GPS coordinates at check-in
  - `check_out_location`: GPS coordinates at check-out

**Updated Fields:**
```python
class AttendanceRecordBase(BaseModel):
    # ... existing fields ...
    outside_hours: float = 0.0  # NEW
    check_in_location: Optional[dict] = None  # NEW
    check_out_location: Optional[dict] = None  # NEW
```

### 4. Updated Attendance Router

**Changes to `backend/app/routers/attendance.py`:**
- `attendance_helper()` now returns `check_in_location` and `check_out_location`
- `/api/attendance/mark` accepts `outside_hours`, `check_in_location`, `check_out_location`
- Bulk attendance marking also updated to handle new fields

---

## Frontend Changes

### 1. New Page (`frontend/src/pages/admin/LocationManagement.tsx`)

**Features:**
- View current location configuration with Google Maps link
- Edit mode for updating coordinates and radius settings
- Create new location if none exists
- Form validation for coordinates and radius values
- Helpful instructions for getting coordinates from Google Maps

**UI Components:**
- Coordinate display with map link
- Check-in radius display (meters)
- Outside zone radius display (meters)
- Address and notes fields
- Real-time validation feedback

**Permissions:**
- Auto-redirects non-super-admins to `/admin`
- Only visible in sidebar for `role_id === 0`

### 2. Updated Routes (`frontend/src/App.tsx`)

Added protected route:
```tsx
<Route path="location-management" element={
  <RoleGuard allow={(rid) => rid === 0}>
    <LocationManagement />
  </RoleGuard>
} />
```

### 3. Updated Sidebar (`frontend/src/components/TempleSidebar.tsx`)

Added location management link in Priest Attendance section:
```tsx
{roleId === 0 && (
  <NavLink to="/admin/location-management">
    <MapPin className="h-4 w-4" />
    <span>Location Management</span>
  </NavLink>
)}
```

---

## Flutter App Changes (Prepared)

### 1. Updated Dependencies (`temple_app/pubspec.yaml`)

**Added:**
- `geolocator: ^13.0.2` - GPS location tracking
- `permission_handler: ^11.3.1` - Runtime permissions
- `hive: ^2.2.3` & `hive_flutter: ^1.1.0` - Offline storage
- `workmanager: ^0.5.2` - Background tasks
- `flutter_background_service: ^5.0.10` - Background location tracking
- `connectivity_plus: ^6.1.2` - Network connectivity checks
- `path_provider: ^2.1.5` - File system access

### 2. New Configuration (`temple_app/lib/config/location_config.dart`)

**Default Settings:**
- `checkInRadius`: 100m
- `outsideRadius`: 500m
- `locationUpdateInterval`: 30 seconds
- Helper methods for zone status checks

**Note:** These defaults are overridden by server configuration when mobile app connects.

### 3. Updated Attendance Model (`temple_app/lib/models/attendance_model.dart`)

**New Status Enum:**
```dart
enum AttendanceStatus {
  checkedIn,   // User has checked in, tracking location
  checkedOut,  // User has checked out for the day
  synced,      // Record synced to server
  pending,     // Pending sync to server
  failed,      // Sync failed
}
```

**New LocationData Class:**
```dart
class LocationData {
  final double latitude;
  final double longitude;
  final DateTime timestamp;
}
```

**Updated Attendance Model:**
- Added `outsideHours` (double)
- Added `checkInLocation` (LocationData?)
- Added `checkOutLocation` (LocationData?)
- Added `lastOutsideTimestamp` (int? - for monotonic time tracking)
- Added `copyWith()` method for state updates

---

## Remaining Flutter Implementation

### Services to Create:

1. **`lib/services/database_service.dart`**
   - Hive initialization
   - Local storage of attendance records
   - CRUD operations for offline data

2. **`lib/services/location_service.dart`**
   - Fetch location config from server
   - GPS validation (check if within radius)
   - Calculate distance from temple
   - Handle permissions

3. **`lib/services/background_tracking_service.dart`**
   - Continuous GPS monitoring after check-in
   - Track time spent outside work zone
   - Calculate `outside_hours`
   - Use monotonic time to prevent tampering

4. **`lib/services/sync_service.dart`**
   - Detect connectivity changes
   - Upload pending records to server
   - Handle conflicts
   - Retry failed uploads

5. **`lib/services/attendance_service.dart` (update)**
   - Integrate GPS validation
   - Offline-first check-in/check-out
   - Start/stop background tracking
   - Calculate outside hours

### Screens to Create:

1. **`lib/screens/gps_attendance_screen.dart`**
   - Single dynamic button (Check In / Check Out)
   - Live GPS status display
   - Zone status indicator (Inside/Outside Zone)
   - Distance from temple
   - Today's outside hours
   - Offline indicator

### Configuration Files:

1. **`android/app/src/main/AndroidManifest.xml`**
   - Add location permissions:
     - `ACCESS_FINE_LOCATION`
     - `ACCESS_COARSE_LOCATION`
     - `ACCESS_BACKGROUND_LOCATION`
     - `FOREGROUND_SERVICE`
     - `WAKE_LOCK`

2. **`lib/main.dart`**
   - Initialize Hive
   - Initialize WorkManager
   - Request permissions on startup
   - Fetch location config from server

---

## How It Works

### Web Admin Flow:
1. Super admin logs in
2. Navigates to "Location Management" (in Priest Attendance sidebar)
3. Enters temple GPS coordinates and radius settings
4. Configuration saved to MongoDB `location_config` collection
5. Becomes active location for all mobile apps

### Mobile App Flow:

#### Initial Setup:
1. User logs in on mobile app
2. App fetches active location config from `/api/location/config`
3. Stores config locally for offline use
4. Requests location permissions

#### Daily Check-In:
1. User opens app
2. App validates GPS location (must be within check-in radius)
3. If valid, user taps "Check In"
4. App records:
   - Check-in time
   - GPS coordinates at check-in
   - Creates local attendance record
5. Background service starts tracking location

#### During Work (Background Tracking):
1. App monitors GPS every 30 seconds
2. If user moves beyond `outside_radius` (500m):
   - Starts counting time as "outside"
   - Uses monotonic timestamp (can't be manipulated)
3. When user returns within radius:
   - Stops outside timer
   - Updates `outside_hours` in local record

#### Check-Out:
1. User returns to temple location (within check-in radius)
2. Taps "Check Out"
3. App records:
   - Check-out time
   - GPS coordinates at check-out
   - Final `outside_hours`
4. Background tracking stops
5. Record marked for sync

#### Sync:
1. When device has connectivity:
   - Sync service uploads pending records
   - Server validates and stores
   - Local records marked as synced

---

## Data Flow Diagram

```
┌─────────────────┐
│  Super Admin    │
│   (Web App)     │
└────────┬────────┘
         │
         ↓ Configures location
┌─────────────────────┐
│  MongoDB            │
│  location_config    │
│  Collection         │
└────────┬────────────┘
         │
         ↓ Fetches on connect
┌─────────────────────┐
│  Mobile App         │
│  (Flutter)          │
└────────┬────────────┘
         │
         ↓ Validates GPS & tracks
┌─────────────────────┐
│  Local Storage      │
│  (Hive)             │
│  - Attendance       │
│  - Outside Hours    │
└────────┬────────────┘
         │
         ↓ Syncs when online
┌─────────────────────┐
│  MongoDB            │
│  attendance_records │
│  Collection         │
└─────────────────────┘
```

---

## Security Features

### GPS Anti-Tampering:
- Uses monotonic time (not system time) for outside tracking
- Can't be manipulated by changing device time
- GPS coordinates stored with each check-in/out

### Role-Based Access:
- Only Super Admins can configure location
- Attendance data read-only for non-admins
- Mobile app validates with server token

### Offline Integrity:
- Local records cryptographically signed
- Sync conflicts detected and flagged
- Server validates all incoming data

---

## Testing Checklist

### Backend:
- [ ] Super admin can create location config
- [ ] Super admin can update location config
- [ ] Regular admin cannot modify location config
- [ ] All authenticated users can fetch active location
- [ ] Attendance records accept check-in/check-out locations
- [ ] Attendance records track outside_hours

### Frontend:
- [ ] Location Management page only accessible to super admin
- [ ] Page shows active location configuration
- [ ] Edit mode allows updating coordinates
- [ ] Form validation works correctly
- [ ] Google Maps link opens correct location
- [ ] Sidebar link only visible to super admin

### Mobile App (TODO):
- [ ] App fetches location config on startup
- [ ] Check-in validates GPS within radius
- [ ] Background tracking monitors location
- [ ] Outside hours calculated correctly
- [ ] Check-out validates GPS within radius
- [ ] Records sync when online
- [ ] Offline mode works correctly
- [ ] Permissions requested properly

---

## Next Steps

1. **Implement Flutter Services:**
   - Database service with Hive
   - Location service with Geolocator
   - Background tracking service
   - Sync service with retry logic

2. **Create GPS Attendance Screen:**
   - Single button UI
   - Live status indicators
   - Zone distance display

3. **Configure Android Permissions:**
   - Update AndroidManifest.xml
   - Request runtime permissions

4. **Testing:**
   - Test location validation
   - Test background tracking
   - Test offline sync
   - Test GPS accuracy

5. **Documentation:**
   - User guide for mobile app
   - Admin guide for location configuration
   - Troubleshooting guide

---

## File Changes Summary

### Backend Files Modified:
- ✅ `backend/app/models/location_models.py` (NEW)
- ✅ `backend/app/routers/location.py` (NEW)
- ✅ `backend/app/models/priest_attendance_models.py` (UPDATED)
- ✅ `backend/app/routers/attendance.py` (UPDATED)
- ✅ `backend/app/main.py` (UPDATED - added location router)

### Frontend Files Modified:
- ✅ `frontend/src/pages/admin/LocationManagement.tsx` (NEW)
- ✅ `frontend/src/App.tsx` (UPDATED - added route)
- ✅ `frontend/src/components/TempleSidebar.tsx` (UPDATED - added link)

### Flutter Files Modified:
- ✅ `temple_app/pubspec.yaml` (UPDATED - added dependencies)
- ✅ `temple_app/lib/config/location_config.dart` (NEW)
- ✅ `temple_app/lib/models/attendance_model.dart` (UPDATED)

### Flutter Files To Create:
- ⏳ `temple_app/lib/services/database_service.dart`
- ⏳ `temple_app/lib/services/location_service.dart`
- ⏳ `temple_app/lib/services/background_tracking_service.dart`
- ⏳ `temple_app/lib/services/sync_service.dart`
- ⏳ `temple_app/lib/screens/gps_attendance_screen.dart`
- ⏳ `temple_app/android/app/src/main/AndroidManifest.xml` (UPDATE)
- ⏳ `temple_app/lib/main.dart` (UPDATE)

---

## Support

For questions or issues:
1. Check this documentation
2. Review Flutter service implementations (when complete)
3. Test with actual GPS devices
4. Contact development team

---

**Document Version:** 1.0
**Last Updated:** October 21, 2025
**Status:** Backend & Frontend Complete | Flutter Services In Progress
