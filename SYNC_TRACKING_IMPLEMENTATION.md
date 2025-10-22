# Sync Tracking Implementation - MongoDB Schema Update

## Overview
Updated the attendance system to properly track sync origin and timestamps when records are synced from the mobile app to MongoDB.

## Changes Made

### 1. Updated Attendance Models (`priest_attendance_models.py`)

#### AttendanceRecordInDB
Added sync tracking fields:
```python
# Sync tracking fields
synced_at: Optional[datetime] = None           # Timestamp when synced from mobile
sync_origin: Optional[str] = None              # "web" or "cloud"
sync_device_id: Optional[str] = None           # Future: Device identifier
```

#### AttendanceRecordResponse
Added sync fields to API responses:
```python
synced_at: Optional[datetime] = None
sync_origin: Optional[str] = None
sync_device_id: Optional[str] = None
```

**Removed fields:**
- `sync_status` (not needed - presence of record means it's synced)

### 2. Updated Attendance Router (`attendance.py`)

#### Mark Attendance Endpoint (`POST /api/attendance/mark`)
**Logic:**
- Detects if request contains GPS location data (`check_in_location` or `check_out_location`)
- If GPS data exists → **sync_origin = "cloud"** (from mobile app)
- If no GPS data → **sync_origin = "web"** (from web interface)
- Sets `synced_at` to current timestamp when GPS data present

```python
# Determine sync origin based on presence of GPS location data
has_gps_data = attendance.check_in_location is not None or attendance.check_out_location is not None

attendance_dict["synced_at"] = datetime.utcnow() if has_gps_data else None
attendance_dict["sync_origin"] = "cloud" if has_gps_data else "web"
attendance_dict["sync_device_id"] = None
```

#### Bulk Mark Endpoint (`POST /api/attendance/mark-bulk`)
Same logic applied for bulk operations.

#### attendance_helper Function
Updated to include sync fields in responses:
```python
# Add sync tracking fields if they exist
if "synced_at" in attendance:
    result["synced_at"] = attendance["synced_at"]
if "sync_origin" in attendance:
    result["sync_origin"] = attendance["sync_origin"]
if "sync_device_id" in attendance:
    result["sync_device_id"] = attendance["sync_device_id"]
```

## MongoDB Schema

### Attendance Record Document Structure
```json
{
  "_id": ObjectId("68f5ec853e57a7820a6391dc"),
  "user_id": "68f5ea15dd58e679166403e8",
  "username": "test",
  "attendance_date": ISODate("2025-10-21T00:00:00.000Z"),
  "is_present": true,
  "check_in_time": "09:00",
  "check_out_time": "17:00",
  "overtime_hours": 0.0,
  "outside_hours": 1.5,
  "check_in_location": {
    "lat": 10.1234,
    "lon": 76.5678
  },
  "check_out_location": {
    "lat": 10.1234,
    "lon": 76.5678
  },
  "notes": "Attended puja",
  "marked_by": "68f494d39bf2434b11cb73ee",
  "created_at": ISODate("2025-10-21T09:00:00.000Z"),
  "updated_at": ISODate("2025-10-21T17:00:00.000Z"),
  
  // Sync tracking fields
  "synced_at": ISODate("2025-10-21T17:00:05.123Z"),  // When synced from mobile
  "sync_origin": "cloud",                             // "cloud" or "web"
  "sync_device_id": null                              // Future enhancement
}
```

## Sync Origin Logic

### "cloud" Origin
**Trigger:** Record contains GPS location data (`check_in_location` or `check_out_location`)
**Source:** Mobile app (Flutter) syncing attendance to MongoDB
**Characteristics:**
- Has `synced_at` timestamp
- Has GPS coordinates
- Created by mobile user checking in/out

### "web" Origin
**Trigger:** No GPS location data present
**Source:** Web admin manually marking attendance
**Characteristics:**
- `synced_at` is `null`
- No GPS coordinates
- Created by admin via web interface

## API Response Examples

### Mobile Check-In Response (sync_origin: "cloud")
```json
{
  "id": "68f5ec853e57a7820a6391dc",
  "user_id": "68f5ea15dd58e679166403e8",
  "username": "priest1",
  "user_name": "Priest One",
  "attendance_date": "2025-10-21",
  "is_present": true,
  "check_in_time": "09:00",
  "check_out_time": null,
  "overtime_hours": 0.0,
  "outside_hours": 0.0,
  "check_in_location": {
    "lat": 10.1234,
    "lon": 76.5678
  },
  "check_out_location": null,
  "notes": null,
  "marked_by": "68f5ea15dd58e679166403e8",
  "marked_by_name": "Priest One",
  "created_at": "2025-10-21T09:00:00Z",
  "updated_at": "2025-10-21T09:00:00Z",
  "synced_at": "2025-10-21T09:00:05Z",
  "sync_origin": "cloud",
  "sync_device_id": null
}
```

### Web Admin Mark Response (sync_origin: "web")
```json
{
  "id": "68f5ec853e57a7820a6391dd",
  "user_id": "68f5ea15dd58e679166403e8",
  "username": "priest1",
  "user_name": "Priest One",
  "attendance_date": "2025-10-21",
  "is_present": true,
  "check_in_time": "09:00",
  "check_out_time": "17:00",
  "overtime_hours": 0.0,
  "outside_hours": 0.0,
  "check_in_location": null,
  "check_out_location": null,
  "notes": "Marked by admin",
  "marked_by": "68f494d39bf2434b11cb73ee",
  "marked_by_name": "Super Admin",
  "created_at": "2025-10-21T17:30:00Z",
  "updated_at": "2025-10-21T17:30:00Z",
  "synced_at": null,
  "sync_origin": "web",
  "sync_device_id": null
}
```

## Benefits

1. **Audit Trail**: Can distinguish between web-marked and mobile-synced records
2. **GPS Validation**: Records with `sync_origin: "cloud"` are guaranteed to have GPS validation
3. **Sync Tracking**: `synced_at` shows exactly when mobile app synced the record
4. **Analytics**: Can query how many users are using mobile vs web for attendance
5. **Troubleshooting**: Helps identify sync issues and timing

## Query Examples

### Get all mobile-synced records
```javascript
db.attendance_records.find({ sync_origin: "cloud" })
```

### Get all web-marked records
```javascript
db.attendance_records.find({ sync_origin: "web" })
```

### Get records synced today
```javascript
db.attendance_records.find({
  synced_at: {
    $gte: ISODate("2025-10-21T00:00:00Z"),
    $lt: ISODate("2025-10-22T00:00:00Z")
  }
})
```

### Get records with GPS coordinates
```javascript
db.attendance_records.find({
  $or: [
    { check_in_location: { $ne: null } },
    { check_out_location: { $ne: null } }
  ]
})
```

## Future Enhancements

### Device Tracking
Add device identification:
```python
sync_device_id: str  # Device UUID from mobile app
```

### Conflict Resolution
Track conflicts when record exists:
```python
sync_conflict: bool
conflict_resolved_at: datetime
conflict_resolution: str  # "keep_local", "use_remote", "merge"
```

### Sync Statistics
Add sync metrics:
```python
sync_attempt_count: int
last_sync_error: str
sync_retry_count: int
```

## Testing

### Test Mobile Sync (with GPS)
```bash
curl -X POST http://localhost:8080/api/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "username": "test_user",
    "attendance_date": "2025-10-21",
    "is_present": true,
    "check_in_time": "09:00",
    "check_in_location": {"lat": 10.1234, "lon": 76.5678}
  }'
```

**Expected Result:**
- `sync_origin: "cloud"`
- `synced_at: "2025-10-21T09:00:05Z"`
- `check_in_location` populated

### Test Web Mark (no GPS)
```bash
curl -X POST http://localhost:8080/api/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "username": "test_user",
    "attendance_date": "2025-10-21",
    "is_present": true,
    "check_in_time": "09:00"
  }'
```

**Expected Result:**
- `sync_origin: "web"`
- `synced_at: null`
- `check_in_location: null`

## Summary

✅ **Sync tracking implemented** - All attendance records now track their origin  
✅ **GPS detection automatic** - Presence of location data determines origin  
✅ **MongoDB schema updated** - New fields: `synced_at`, `sync_origin`, `sync_device_id`  
✅ **API responses include sync data** - Clients can see sync status  
✅ **No breaking changes** - All fields are optional, backward compatible  

Records synced from mobile app will have:
- `sync_origin: "cloud"`
- `synced_at: <timestamp>`
- GPS coordinates in `check_in_location` and/or `check_out_location`

Records marked via web will have:
- `sync_origin: "web"`
- `synced_at: null`
- No GPS coordinates
