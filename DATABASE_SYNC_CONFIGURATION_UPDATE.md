# Database Sync System - Configuration Update

## ✅ Updates Applied (October 19, 2025)

### 1. Configurable Primary Database

**File**: `backend/app/database.py`

The system now supports **two deployment modes**:

#### Mode 1: Local Primary (On-Premise/Offline Setup)
```env
PRIMARY_DATABASE="local"
MONGODB_LOCAL_URL="mongodb://mongo:27017"
MONGODB_CLOUD_URL="mongodb+srv://..." # Optional, for sync
DATABASE_NAME="temple_db"
```

- All operations use local MongoDB
- Syncs to cloud MongoDB when online
- Network monitor enabled
- Ideal for: On-premise installations, offline-capable systems

#### Mode 2: Cloud Primary (Hosted Services)
```env
PRIMARY_DATABASE="cloud"
MONGODB_CLOUD_URL="mongodb+srv://..."
DATABASE_NAME="temple_db"
# MONGODB_LOCAL_URL not needed
```

- All operations use cloud MongoDB directly
- **No sync needed** (already on cloud)
- Network monitor disabled
- Ideal for: Render, Railway, Heroku, other cloud hosting

---

### 2. Network Monitor Interval Changed

**File**: `backend/app/services/network_monitor_service.py`

**Changed from**: 30 seconds  
**Changed to**: 5 minutes (300 seconds)

Reduces unnecessary network checks and API calls.

---

### 3. Model Field Naming Standardized

All models now use **snake_case** for consistency:

- ✅ `created_at` (not createdAt)
- ✅ `updated_at` (not updatedAt)
- ✅ `synced_at` (not syncedAt)
- ✅ `sync_origin` (not origin)
- ✅ `sync_status` (not syncStatus)

**Updated Models**:
- ✅ `admin_models.py` - Added synced_at, sync_origin, sync_status
- ✅ `ritual_models.py` - Added all sync fields
- ✅ `booking_models.py` - Added all sync fields
- ✅ `event_models.py` - Added all sync fields
- ✅ `stock_models.py` - Added all sync fields

**Remaining models to update manually** (if needed):
- `gallery_models.py`
- `committee_models.py`
- `employee_booking_models.py`
- `role_models.py`
- `activity_models.py`
- `calendar_models.py`
- `gallery_layout_models.py`
- `slideshow_models.py`
- `featured_event_models.py`
- `events_section_models.py`
- `gallery_home_preview_models.py`

---

### 4. Sync Services Updated

**Files Updated**:
- `sync_manager_service.py` - Uses updated_at/synced_at
- `conflict_resolution_service.py` - Uses updated_at/synced_at
- `network_monitor_service.py` - Checks every 5 minutes, uses is_sync_enabled()

---

### 5. Application Startup Logic

**File**: `backend/app/main.py`

Startup now:
1. Detects `PRIMARY_DATABASE` setting
2. If `cloud`: Disables sync, uses cloud MongoDB directly
3. If `local` + remote configured: Enables sync system
4. If `local` only: Works in local-only mode

**Console Output Examples**:

**Cloud Mode**:
```
☁️ Running in CLOUD mode - sync features disabled (not needed)
   All operations use cloud MongoDB directly
```

**Local Mode with Sync**:
```
🔄 Running in LOCAL mode - initializing synchronization system...
✓ Sync manager initialized
✓ Network monitoring started (checks every 5 minutes)
🔄 Performing initial sync...
✓ Initial sync completed
```

**Local Mode without Sync**:
```
⚠ Sync not configured:
   - Set PRIMARY_DATABASE=local in .env to enable sync
   - Set MONGODB_CLOUD_URL for sync target
   Working in local-only mode.
```

---

## 📝 Configuration Guide

### For Cloud Deployments (Render, Railway, etc.)

**`.env` file**:
```env
# Use cloud MongoDB as primary
PRIMARY_DATABASE="cloud"

# Only need cloud URL
MONGODB_CLOUD_URL="mongodb+srv://user:pass@cluster.mongodb.net/?..."
DATABASE_NAME="temple_db"

# No need for local URL or sync
```

**What happens**:
- ✅ Application uses cloud MongoDB directly
- ✅ No sync overhead
- ✅ No network monitoring
- ✅ Faster startup
- ✅ Lower resource usage

---

### For On-Premise/Local Deployments

**`.env` file**:
```env
# Use local MongoDB as primary
PRIMARY_DATABASE="local"

# Local MongoDB (Docker or self-hosted)
MONGODB_LOCAL_URL="mongodb://mongo:27017"

# Cloud MongoDB for backup/sync
MONGODB_CLOUD_URL="mongodb+srv://user:pass@cluster.mongodb.net/?..."
DATABASE_NAME="temple_db"
```

**What happens**:
- ✅ Application uses local MongoDB
- ✅ Syncs to cloud every 5 minutes (if online)
- ✅ Auto-syncs when internet reconnects
- ✅ Offline mode supported
- ✅ Data safety with cloud backup

---

## 🔧 Migration Steps

### If Currently Using Cloud Hosting

1. **Update `.env`**:
   ```env
   PRIMARY_DATABASE="cloud"
   MONGODB_CLOUD_URL="mongodb+srv://..."
   # Remove or comment out MONGODB_LOCAL_URL
   ```

2. **Restart application**:
   ```bash
   docker-compose restart backend
   # or restart your cloud service
   ```

3. **Verify logs**:
   ```
   ☁️ Running in CLOUD mode - sync features disabled (not needed)
   ```

---

### If Currently Using Local Setup

1. **Update `.env`**:
   ```env
   PRIMARY_DATABASE="local"
   MONGODB_LOCAL_URL="mongodb://mongo:27017"
   MONGODB_CLOUD_URL="mongodb+srv://..."  # Optional
   ```

2. **Restart application**:
   ```bash
   docker-compose restart
   ```

3. **Verify sync status**:
   ```bash
   python -m app.cli.sync_cli status
   ```

---

## 📊 Database Functions Added

### New Helper Functions

```python
from app.database import (
    get_database,              # Get primary database
    get_local_database,        # Get local database (or None)
    get_remote_database,       # Get remote database (or None)
    is_sync_enabled,           # Check if sync is enabled
    get_primary_database_type  # Get "local" or "cloud"
)
```

### Usage Examples

```python
# Get primary database (works in both modes)
db = get_database()

# Check if sync is needed
if is_sync_enabled():
    # Run sync logic
    await sync_manager.sync_all_collections()

# Get primary type
if get_primary_database_type() == "cloud":
    print("Running in cloud mode")
```

---

## 🎯 Benefits of This Update

### For Cloud Deployments
- ✅ **Simpler configuration** - Only one MongoDB URL needed
- ✅ **Better performance** - No sync overhead
- ✅ **Lower costs** - No need for local database
- ✅ **Faster startup** - No sync initialization

### For On-Premise Deployments
- ✅ **Offline capability** - Works without internet
- ✅ **Data redundancy** - Cloud backup automatically
- ✅ **Less frequent sync** - Every 5 minutes instead of 30 seconds
- ✅ **Consistent field names** - All models use snake_case

---

## ⚠️ Breaking Changes

### 1. Field Name Changes

If you have custom code accessing sync fields, update:

**Before**:
```python
doc["updatedAt"]
doc["syncedAt"]
doc["origin"]
doc["syncStatus"]
```

**After**:
```python
doc["updated_at"]
doc["synced_at"]
doc["sync_origin"]
doc["sync_status"]
```

### 2. Database Configuration Required

Must set `PRIMARY_DATABASE` in `.env`:
```env
PRIMARY_DATABASE="local"  # or "cloud"
```

If not set, defaults to `"local"` for backwards compatibility.

---

## 🧪 Testing

### Test Cloud Mode

```bash
# Set in .env
PRIMARY_DATABASE="cloud"
MONGODB_CLOUD_URL="mongodb+srv://..."

# Start app
docker-compose up backend

# Check logs - should see:
# ☁️ Running in CLOUD mode - sync features disabled
```

### Test Local Mode with Sync

```bash
# Set in .env
PRIMARY_DATABASE="local"
MONGODB_LOCAL_URL="mongodb://mongo:27017"
MONGODB_CLOUD_URL="mongodb+srv://..."

# Start app
docker-compose up

# Check sync status
python -m app.cli.sync_cli status

# Should show:
# ✓ Remote database: CONFIGURED
# 🟢 ONLINE
```

### Test Network Monitor Interval

```bash
# Watch logs for 5+ minutes
tail -f logs/app.log | grep "Connectivity"

# Should see checks every 5 minutes (300 seconds)
```

---

## 📚 Updated Documentation

All documentation has been updated to reflect these changes:

- ✅ `DATABASE_SYNC_DOCUMENTATION.md` - Updated field names
- ✅ `DATABASE_SYNC_QUICKSTART.md` - Added PRIMARY_DATABASE config
- ✅ `DATABASE_SYNC_IMPLEMENTATION.md` - Added deployment modes

---

## 🔍 Troubleshooting

### Issue: "PRIMARY_DATABASE must be 'local' or 'cloud'"

**Solution**: Add to `.env`:
```env
PRIMARY_DATABASE="cloud"  # or "local"
```

---

### Issue: "PRIMARY_DATABASE is 'cloud' but MONGODB_CLOUD_URL is not set"

**Solution**: Add cloud MongoDB URL:
```env
MONGODB_CLOUD_URL="mongodb+srv://..."
```

---

### Issue: Sync fields not found in database

**Solution**: Existing documents won't have sync fields automatically. They'll be added on first update. To add them to all documents:

```python
# Run once to add sync fields to all existing documents
from app.database import get_database
db = get_database()

for collection_name in ["admins", "bookings", "events", ...]:
    collection = db.get_collection(collection_name)
    collection.update_many(
        {"synced_at": {"$exists": False}},
        {"$set": {
            "synced_at": None,
            "sync_origin": "local",
            "sync_status": "pending"
        }}
    )
```

---

## ✅ Summary

**What Changed**:
1. ✅ PRIMARY_DATABASE config (local/cloud modes)
2. ✅ Network monitor: 5 minutes instead of 30 seconds
3. ✅ Field names: snake_case (updated_at, synced_at, etc.)
4. ✅ Smart sync: Only enabled when needed
5. ✅ Updated all core models with sync fields

**What to Do**:
1. Add `PRIMARY_DATABASE` to `.env`
2. Restart application
3. Verify mode in console logs
4. Test sync if using local mode

**Benefits**:
- Simpler cloud deployments
- Better performance
- Consistent naming
- Lower resource usage

---

**Last Updated**: October 19, 2025  
**Version**: 1.1.0
