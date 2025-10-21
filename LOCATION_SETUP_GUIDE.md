# GPS Attendance Setup - Quick Fix Guide

## Issue: Location Config Not Found (404 Error)

### Problem
The Flutter app is showing errors because no temple location has been configured yet:
```
Failed to fetch location config from server: GET request failed: Not found: {"detail":"Not Found"}
```

### Solution: Configure Temple Location

You need to create a location configuration via the web interface **BEFORE** using the mobile app.

## Step-by-Step Setup

### 1. Access Web Interface
```bash
# Make sure backend is running
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Access web interface
# Open browser: http://localhost:5173 (or your frontend URL)
```

### 2. Login as Super Admin
- Login with a user that has `role_id: 0` (super admin)
- Only super admins can configure location

### 3. Navigate to Location Management
- Look for "Location Management" in the sidebar
- Or go directly to: `http://localhost:5173/admin/location-management`

### 4. Set Temple Location

**Required Fields:**
- **Name**: Temple name (e.g., "Sree Krishna Temple")
- **Latitude**: Temple GPS latitude (e.g., 10.1234)
- **Longitude**: Temple GPS longitude (e.g., 76.5678)

**Optional Fields:**
- **Check-in Radius**: Distance required to check-in (default: 100 meters)
- **Outside Radius**: Distance considered "outside" (default: 500 meters)
- **Address**: Full address
- **Notes**: Additional information

**How to Get Coordinates:**
1. Open Google Maps
2. Right-click on temple location
3. Click on coordinates to copy them
4. First number = Latitude, Second number = Longitude

Example: `10.123456, 76.789012`
- Latitude: 10.123456
- Longitude: 76.789012

### 5. Save Configuration
- Click "Save Location Configuration"
- Configuration is now active and ready for mobile apps

### 6. Test Mobile App
- Restart Flutter app or pull to refresh
- App will now fetch location configuration
- Check-in will work when within check-in radius (100m default)

## Alternative: Create via API (for testing)

If you don't have web interface ready, create via API:

```bash
# Get your JWT token first by logging in
TOKEN="your_jwt_token_here"

# Create location config
curl -X POST http://localhost:8080/api/location/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sree Krishna Temple",
    "latitude": 10.1234,
    "longitude": 76.5678,
    "check_in_radius": 100,
    "outside_radius": 500,
    "address": "Temple Road, City, State",
    "notes": "Main temple location"
  }'
```

## Verification

### Check if Location Config Exists
```bash
curl -X GET http://localhost:8080/api/location/config \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": "...",
  "name": "Sree Krishna Temple",
  "latitude": 10.1234,
  "longitude": 76.5678,
  "check_in_radius": 100,
  "outside_radius": 500,
  "is_active": true,
  ...
}
```

### Check MongoDB Directly
```javascript
// In MongoDB shell or Compass
db.location_config.find().pretty()

// Should show at least one document with is_active: true
```

## Mobile App Behavior

### Before Location Config Setup
- ❌ "Location configuration not available" message
- ❌ Distance shows 0.0 km
- ❌ Cannot check-in/check-out
- ℹ️ App works offline but needs initial config

### After Location Config Setup
- ✅ Shows actual distance from temple
- ✅ Can check-in when within radius
- ✅ GPS validation works
- ✅ Config cached locally for offline use

## Troubleshooting

### "Only super admins can manage location"
**Problem:** User doesn't have super admin privileges  
**Solution:** 
1. Check user's `role_id` in MongoDB
2. Set `role_id: 0` for super admin
3. Or login with correct super admin account

### "Location services are disabled"
**Problem:** Device location/GPS is off  
**Solution:** Enable location in device settings

### "Location permission denied"
**Problem:** App doesn't have location permission  
**Solution:** Grant location permission when prompted (choose "Always" for background tracking)

### Distance still shows 0.0
**Problem:** Location config not loaded or GPS not available  
**Solution:**
1. Pull to refresh in app
2. Check internet connection
3. Ensure location services enabled
4. Force close and restart app

## Summary

✅ **Before using mobile app:**
1. Login to web interface as super admin
2. Go to Location Management
3. Set temple GPS coordinates and radius
4. Save configuration

✅ **Then mobile app will:**
1. Fetch location config automatically
2. Show accurate distance
3. Enable GPS-based check-in/check-out
4. Cache config for offline use

🔒 **Security:**
- Only super admins (`role_id: 0`) can create/edit location
- All users can view location (needed for GPS validation)
- Config synced securely via JWT authentication

---

**Next Steps:** Once location is configured, mobile users can check-in/check-out with GPS validation! 🎉
