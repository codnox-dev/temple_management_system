# Database Synchronization System Documentation

## Overview

This document describes the **two-way database synchronization system** implemented for the Temple Management System. The system enables automatic and manual synchronization between a **local MongoDB instance** (Docker/self-hosted) and a **remote MongoDB instance** (Atlas cloud).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Features](#key-features)
3. [Setup and Configuration](#setup-and-configuration)
4. [How It Works](#how-it-works)
5. [API Endpoints](#api-endpoints)
6. [CLI Usage](#cli-usage)
7. [Conflict Resolution](#conflict-resolution)
8. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
9. [Best Practices](#best-practices)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Temple Management System              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  Local MongoDB   │◄────►│  Sync Manager    │       │
│  │  (Docker/Local)  │      │                  │       │
│  └──────────────────┘      └──────────────────┘       │
│          ▲                         │                    │
│          │                         │                    │
│          │                         ▼                    │
│          │                ┌──────────────────┐         │
│          │                │ Network Monitor  │         │
│          │                │ (Auto-detect)    │         │
│          │                └──────────────────┘         │
│          │                         │                    │
│          │                         │                    │
│          ▼                         ▼                    │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  Remote MongoDB  │◄────►│ Conflict Logger  │       │
│  │  (Atlas Cloud)   │      │                  │       │
│  └──────────────────┘      └──────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Local First**: All write operations go to the local database
2. **Change Tracking**: Documents track `updatedAt` and `syncedAt` timestamps
3. **Delta Sync**: Only changed documents (`updatedAt > syncedAt`) are synchronized
4. **Conflict Detection**: Unique field violations are detected and logged
5. **Resolution**: Conflicts can be resolved manually or automatically

---

## Key Features

### ✅ Implemented Features

- **Automatic Sync on Reconnect**: Detects internet restoration and triggers sync
- **Delta-Based Sync**: Only syncs changed documents to minimize bandwidth
- **Conflict Detection**: Detects unique field conflicts (e.g., username in admins)
- **Conflict Resolution**: Multiple strategies (rename, keep local/remote, merge)
- **Offline Mode**: System works fully offline with local database only
- **Network Monitoring**: Continuous connectivity checks with configurable intervals
- **REST API**: Full API for sync operations and conflict management
- **CLI Tool**: Command-line interface for manual operations
- **Audit Logging**: Comprehensive logs of all sync operations and conflicts
- **Resilient Sync**: Can resume after interruption

### 🔒 Unique Field Handling

Currently tracked unique fields:
- `admins.username` - Unique username for admin accounts

When conflicts occur on unique fields:
- Local document is marked with `syncStatus: "conflict"`
- Conflict is logged with details (collection, field, values, IDs)
- Remote data is never overwritten without resolution
- Multiple resolution strategies available

---

## Setup and Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
# Local MongoDB (Docker or self-hosted)
MONGODB_LOCAL_URL="mongodb://mongo:27017"

# Remote MongoDB (Atlas Cloud)
MONGODB_CLOUD_URL="mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority"

# Database name (same for both)
DATABASE_NAME="temple_db"
```

### 2. Database Collections

The sync system creates these additional collections:

- `conflict_logs` - Stores conflict information
- `sync_logs` - Audit trail of sync operations
- `sync_config` - Sync configuration settings

### 3. Model Updates

All models that need synchronization should include these fields (already added):

```python
updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
syncedAt: Optional[datetime] = Field(default=None)
origin: Optional[str] = Field(default="local")  # "local" or "remote"
syncStatus: Optional[str] = Field(default="pending")  # "synced", "pending", "conflict"
```

### 4. Startup Configuration

The sync system initializes automatically on application startup:

```python
# In main.py
@app.on_event("startup")
async def startup_db_client():
    # ... other initialization ...
    
    # Initialize sync manager
    sync_manager = await get_sync_manager()
    
    # Start network monitoring
    await start_network_monitoring()
    
    # Optional: Initial sync
    if sync_manager.config.autoSyncEnabled:
        await sync_manager.sync_all_collections(trigger="automatic")
```

---

## How It Works

### Change Tracking

Every document modification updates the `updatedAt` field:

```python
# Example: Updating an admin
await admins_collection.update_one(
    {"_id": admin_id},
    {
        "$set": {
            "name": "New Name",
            "updatedAt": datetime.utcnow()  # Track change
        }
    }
)
```

### Sync Process

#### Phase 1: Push Local Changes to Remote

```python
# Find documents that need syncing
query = {
    "$or": [
        {"syncedAt": {"$exists": False}},
        {"syncedAt": None},
        {"$expr": {"$gt": ["$updatedAt", "$syncedAt"]}}
    ]
}

local_docs = await local_collection.find(query).to_list(length=None)

for doc in local_docs:
    # Check for conflicts on unique fields
    if has_unique_field_conflict(doc):
        mark_as_conflict(doc)
        continue
    
    # Push to remote
    await remote_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": doc},
        upsert=True
    )
    
    # Update syncedAt
    await local_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"syncedAt": datetime.utcnow(), "syncStatus": "synced"}}
    )
```

#### Phase 2: Pull Remote Changes to Local

```python
remote_docs = await remote_collection.find({}).to_list(length=None)

for remote_doc in remote_docs:
    local_doc = await local_collection.find_one({"_id": remote_doc["_id"]})
    
    if local_doc:
        # Compare timestamps
        if remote_doc["updatedAt"] > local_doc["updatedAt"]:
            # Remote is newer, update local
            await local_collection.update_one(
                {"_id": remote_doc["_id"]},
                {"$set": remote_doc}
            )
    else:
        # New document from remote, insert locally
        await local_collection.insert_one(remote_doc)
```

### Network Monitoring

```python
# Continuous connectivity check every 30 seconds
async def _monitor_loop(self):
    while self.is_running:
        is_online = await self.check_connectivity()
        
        # Detect transition from offline to online
        if is_online and not self.was_online:
            logger.info("Internet connection restored!")
            
            # Trigger automatic sync
            if self.on_reconnect_callback:
                await self.on_reconnect_callback()
        
        self.was_online = is_online
        await asyncio.sleep(self.check_interval)
```

---

## API Endpoints

### POST `/api/sync/sync`
**Trigger Manual Sync**

Manually trigger synchronization between databases.

**Request:**
```json
{
  "collections": ["admins", "bookings"]  // Optional: specific collections
}
```

**Response:**
```json
{
  "startTime": "2025-10-19T10:30:00Z",
  "endTime": "2025-10-19T10:30:15Z",
  "status": "completed",
  "trigger": "manual",
  "collections": ["admins", "bookings"],
  "localToRemote": {
    "admins": 5,
    "bookings": 12
  },
  "remoteToLocal": {
    "admins": 2,
    "bookings": 0
  },
  "conflicts": {
    "admins": 1,
    "bookings": 0
  },
  "durationSeconds": 15.2
}
```

---

### GET `/api/sync/status`
**Get Sync Status**

Get current synchronization status and statistics.

**Response:**
```json
{
  "lastSyncTime": "2025-10-19T10:30:00Z",
  "lastSyncStatus": "completed",
  "lastSyncDuration": 15.2,
  "totalSyncsCompleted": 42,
  "totalConflicts": 3,
  "unresolvedConflicts": 1,
  "isOnline": true,
  "isSyncing": false
}
```

---

### GET `/api/sync/conflicts`
**List Conflicts**

Get list of synchronization conflicts.

**Query Parameters:**
- `resolved` (optional): Filter by resolution status (true/false)
- `collection` (optional): Filter by collection name

**Response:**
```json
[
  {
    "_id": "670abc123def456789",
    "collection": "admins",
    "localId": "507f1f77bcf86cd799439011",
    "remoteId": "507f1f77bcf86cd799439012",
    "field": "username",
    "localValue": "john_admin",
    "remoteValue": "john_admin",
    "timestamp": "2025-10-19T10:25:00Z",
    "resolved": false,
    "notes": "Unique field 'username' conflicts with existing remote document"
  }
]
```

---

### POST `/api/sync/conflicts/{conflict_id}/resolve`
**Resolve Conflict**

Resolve a synchronization conflict.

**Request:**
```json
{
  "strategy": "rename_local",
  "newValue": "john_admin_2",
  "notes": "Renamed to avoid conflict"
}
```

**Strategies:**
- `keep_local` - Keep local version (requires newValue if renaming)
- `keep_remote` - Discard local changes
- `merge` - Manual merge (requires newValue)
- `rename_local` - Rename local unique field

**Response:**
```json
{
  "success": true,
  "message": "Conflict resolved using rename_local strategy",
  "conflict_id": "670abc123def456789",
  "resolved_by": "admin_user",
  "resolved_at": "2025-10-19T10:35:00Z"
}
```

---

### GET `/api/sync/logs`
**Get Sync Logs**

Get history of sync operations.

**Query Parameters:**
- `limit` (optional): Maximum number of logs (default: 20)

**Response:** Array of sync log entries

---

### GET `/api/sync/network-status`
**Get Network Status**

Get current network connectivity monitoring status.

**Response:**
```json
{
  "is_running": true,
  "is_online": true,
  "last_check": "2025-10-19T10:34:30Z",
  "check_interval_seconds": 30
}
```

---

### GET `/api/sync/config`
**Get Sync Configuration**

Get current synchronization configuration.

---

### PUT `/api/sync/config`
**Update Sync Configuration**

Update synchronization settings.

**Request:**
```json
{
  "autoSyncEnabled": true,
  "syncIntervalMinutes": 60,
  "conflictResolutionStrategy": "manual",
  "collectionsToSync": ["admins", "bookings", "events"],
  "maxRetries": 3,
  "batchSize": 100
}
```

---

## CLI Usage

The CLI provides a convenient command-line interface for sync operations.

### Installation

```bash
# Navigate to backend directory
cd backend

# The CLI is ready to use
python -m app.cli.sync_cli --help
```

### Commands

#### 1. Check Status

```bash
python -m app.cli.sync_cli status
```

**Output:**
```
=== Synchronization Status ===

✓ Remote database: CONFIGURED

Connection Status: 🟢 ONLINE
Sync Status: ✓ Ready

Last Sync: 2025-10-19 10:30:00 (5 min ago)
Status: completed
Duration: 15.20 seconds

Total Syncs: 42
Total Conflicts: 3
Unresolved Conflicts: 1

⚠ WARNING: 1 conflicts need resolution
   Run: python -m app.cli.sync_cli conflicts
```

---

#### 2. Trigger Manual Sync

```bash
# Sync all collections
python -m app.cli.sync_cli sync

# Sync specific collections
python -m app.cli.sync_cli sync --collections admins bookings
```

**Output:**
```
🔄 Starting manual synchronization...

=== Sync Results ===
Status: COMPLETED
Duration: 15.23 seconds

Pushed to remote:
  • admins: 5 documents
  • bookings: 12 documents

Pulled from remote:
  • admins: 2 documents
  • bookings: 0 documents

Conflicts detected:
  ⚠ admins: 1 conflicts
```

---

#### 3. List Conflicts

```bash
# Show unresolved conflicts only
python -m app.cli.sync_cli conflicts

# Show all conflicts including resolved
python -m app.cli.sync_cli conflicts --all
```

**Output:**
```
=== Sync Conflicts ===

Collection: admins (1 conflicts)
  1. username = 'john_admin' [⚠ Unresolved]

=== Unresolved Conflicts (Detailed) ===

1. Conflict ID: 670abc123def456789
   Collection: admins
   Field: username
   Local Value: john_admin
   Remote Value: john_admin
   Time: 2025-10-19 10:25:00
   Notes: Unique field 'username' conflicts with existing remote document
   
   Recommendations:
     1. Rename local 'username' to 'john_admin_a7k2' to avoid conflict
     2. Discard local changes and use remote value
     3. Manually edit local document to use a different username
     4. Contact the user to choose a new username
   
   To resolve:
     python -m app.cli.sync_cli resolve 670abc123def456789 --strategy <strategy>
```

---

#### 4. Resolve Conflict

```bash
# Rename local value
python -m app.cli.sync_cli resolve 670abc123def456789 --strategy rename_local --value john_admin_2

# Keep remote (discard local)
python -m app.cli.sync_cli resolve 670abc123def456789 --strategy keep_remote

# Manual merge with new value
python -m app.cli.sync_cli resolve 670abc123def456789 --strategy merge --value merged_username
```

**Output:**
```
🔧 Resolving conflict 670abc123def456789...

✓ Conflict resolved successfully using 'rename_local' strategy

Next steps:
  1. Run: python -m app.cli.sync_cli sync
  2. This will sync the resolved document to remote
```

---

#### 5. Auto-Resolve Conflicts

```bash
# Auto-resolve up to 10 conflicts
python -m app.cli.sync_cli auto-resolve

# Auto-resolve up to 50 conflicts
python -m app.cli.sync_cli auto-resolve --max 50
```

**Output:**
```
🤖 Auto-resolving up to 10 conflicts...

=== Auto-Resolution Results ===
✓ Resolved: 3
⚠ Skipped (manual needed): 5
❌ Failed: 0

💡 Tip: Run sync to apply resolved changes to remote
     python -m app.cli.sync_cli sync
```

---

#### 6. View Configuration

```bash
python -m app.cli.sync_cli config
```

**Output:**
```
=== Sync Configuration ===

Auto-sync on reconnect: True
Periodic sync interval: Disabled minutes
Default conflict resolution: manual
Batch size: 100
Max retries: 3

Collections to sync (16):
  • admins
  • available_rituals
  • bookings
  • employee_bookings
  • events
  ... (11 more)
```

---

## Conflict Resolution

### Understanding Conflicts

Conflicts occur when:
1. A local document tries to sync with a unique field value that already exists remotely
2. Both local and remote have been modified since last sync (rare with our strategy)

### Resolution Strategies

#### 1. **rename_local** (Recommended)
Rename the conflicting field locally and retry sync.

**When to use:**
- Local document is new/recent
- User can be contacted to choose new value
- Preserves both local and remote data

**Example:**
```bash
python -m app.cli.sync_cli resolve <id> --strategy rename_local --value new_username_2
```

---

#### 2. **keep_remote**
Discard local changes, keep remote version.

**When to use:**
- Local changes are mistakes/duplicates
- Remote version is authoritative
- Local document can be safely discarded

**Example:**
```bash
python -m app.cli.sync_cli resolve <id> --strategy keep_remote
```

---

#### 3. **keep_local**
Keep local version (requires unique value).

**When to use:**
- Local version is correct
- Need to rename to make it unique

**Example:**
```bash
python -m app.cli.sync_cli resolve <id> --strategy keep_local --value unique_name
```

---

#### 4. **merge**
Manually merge conflicting documents.

**When to use:**
- Need to combine data from both versions
- Custom resolution logic needed

**Example:**
```bash
python -m app.cli.sync_cli resolve <id> --strategy merge --value merged_value
```

---

### Automatic Resolution

The system can automatically resolve some conflicts using smart strategies:

```bash
python -m app.cli.sync_cli auto-resolve
```

**Auto-resolution logic:**
- Documents created < 1 hour ago → rename locally
- No remote conflict → rename locally
- Remote is newer → keep remote
- Complex cases → skip (manual review needed)

---

## Monitoring and Troubleshooting

### Check Sync Status

**Via API:**
```bash
curl http://localhost:8000/api/sync/status
```

**Via CLI:**
```bash
python -m app.cli.sync_cli status
```

---

### View Sync Logs

**Via API:**
```bash
curl http://localhost:8000/api/sync/logs
```

**Via MongoDB:**
```javascript
db.sync_logs.find().sort({startTime: -1}).limit(10)
```

---

### Common Issues

#### Issue: "Remote database not configured"

**Solution:**
1. Check `.env` file has `MONGODB_CLOUD_URL`
2. Verify connection string format
3. Test connection: `python -m app.cli.sync_cli status`

---

#### Issue: "Sync is already in progress"

**Solution:**
Wait for current sync to complete or check if stuck:
```bash
python -m app.cli.sync_cli status
```

If stuck, restart the application.

---

#### Issue: Many unresolved conflicts

**Solution:**
1. Review conflicts: `python -m app.cli.sync_cli conflicts`
2. Try auto-resolve: `python -m app.cli.sync_cli auto-resolve`
3. Manually resolve remaining: `python -m app.cli.sync_cli resolve <id> ...`

---

#### Issue: Network monitor not detecting reconnection

**Solution:**
1. Check network monitor status: `/api/sync/network-status`
2. Verify `MONGODB_CLOUD_URL` is reachable
3. Trigger manual sync: `python -m app.cli.sync_cli sync`

---

### Debugging

Enable detailed logging:

```python
# In main.py or sync service
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check application logs:
```bash
tail -f logs/app.log
```

---

## Best Practices

### 1. Regular Sync Schedule

Set up periodic automatic sync:

```json
{
  "autoSyncEnabled": true,
  "syncIntervalMinutes": 60
}
```

Or use cron for manual triggers:
```cron
# Every hour
0 * * * * cd /path/to/backend && python -m app.cli.sync_cli sync
```

---

### 2. Monitor Conflicts

- Check for conflicts daily
- Resolve conflicts promptly
- Use auto-resolve for simple cases
- Document resolution decisions

---

### 3. Backup Before Sync

Before major sync operations:
```bash
# Backup local database
mongodump --uri="mongodb://localhost:27017/temple_db" --out=/backup/local_$(date +%Y%m%d)

# Backup remote database
mongodump --uri="$MONGODB_CLOUD_URL" --out=/backup/remote_$(date +%Y%m%d)
```

---

### 4. Test in Staging First

- Test sync in staging environment
- Verify conflict resolution strategies
- Monitor performance and bandwidth usage
- Deploy to production after successful tests

---

### 5. Handle Unique Fields Carefully

When adding new unique fields:

1. Update `unique_fields_map` in `sync_manager_service.py`:
```python
self.unique_fields_map = {
    "admins": ["username"],
    "employees": ["employee_id"],  # Add new unique fields
}
```

2. Add validation in conflict resolution
3. Document unique field constraints
4. Test thoroughly before deployment

---

### 6. Optimize Sync Performance

- Use appropriate `batchSize` (default: 100)
- Sync specific collections when needed
- Schedule syncs during low-traffic periods
- Monitor `durationSeconds` in sync logs

---

### 7. Security Considerations

- Use secure connection strings (SSL/TLS)
- Restrict sync API to admin users only
- Rotate database credentials regularly
- Monitor sync logs for suspicious activity
- Keep `MONGODB_CLOUD_URL` in `.env`, never commit

---

## Conclusion

This synchronization system provides a robust, resilient, and user-friendly solution for maintaining data consistency between local and remote MongoDB instances. With automatic reconnection detection, intelligent conflict resolution, and comprehensive monitoring tools, it ensures your Temple Management System can operate seamlessly in both online and offline modes.

For additional support or questions, please refer to the codebase documentation or contact the development team.

---

**Last Updated:** October 19, 2025
**Version:** 1.0.0
