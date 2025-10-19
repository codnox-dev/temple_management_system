# Backup Management System Documentation

## Overview

The Backup Management system provides a comprehensive solution for backing up, syncing, and managing MongoDB databases in a Temple Management System. This system is designed for **LOCAL mode deployments** where the primary database is a local MongoDB instance that syncs with a remote Atlas MongoDB.

## System Architecture

### Components

1. **Backend Service** (`backup_service.py`)
   - Manages sync operations
   - Creates MongoDB backups using `mongodump`
   - Handles collection deletion (local + remote)
   - Tracks backup metadata

2. **Backend Router** (`backup.py`)
   - REST API endpoints for backup operations
   - Role-based access control (Super Admin & Admin only)
   - Validates LOCAL mode requirement

3. **Frontend Interface** (`BackupManagement.tsx`)
   - User-friendly backup trigger UI
   - Backup viewer with collection browser
   - Document search and inspection
   - Confirmation dialogs for destructive operations

4. **Database Collections**
   - `backup_metadata` - Tracks all backup operations with timestamps, status, and logs

## Configuration Requirements

### Environment Variables

```env
# Required for backup functionality
PRIMARY_DATABASE=local           # MUST be "local" for backup features
MONGODB_LOCAL_URL=mongodb://...  # Local MongoDB connection
MONGODB_CLOUD_URL=mongodb+srv://... # Remote Atlas MongoDB (for sync)
DATABASE_NAME=temple_db          # Database name
```

### System Requirements

- **mongodump** utility installed and accessible in PATH
- Read/write permissions to `/backend/backups` directory
- Network connectivity to remote MongoDB (for sync)

## Features

### 1. Backup Trigger

Initiates a comprehensive backup workflow:

```
1. Sync local ↔ remote databases (bidirectional)
2. Create backup using mongodump → /backend/backups/backup_YYYYMMDD_HHMMSS/
3. Delete activities collection (automatic)
4. Delete bookings + employee_bookings (user-confirmed, both local + remote)
```

#### API Endpoint
```
POST /api/backup
Body: { "delete_bookings": true/false }
```

#### Workflow Details

**Step 1: Database Sync**
- Uses existing `sync_manager_service`
- Performs bidirectional sync (pull remote → local, push local → remote)
- Resolves conflicts using `updatedAt` timestamps
- Ensures local database is up-to-date before backup

**Step 2: Create Backup**
- Executes `mongodump --uri=<local_url> --db=<db_name> --out=<backup_path>`
- Creates timestamped backup folder: `backup_YYYYMMDD_HHMMSS/`
- Stores BSON files for each collection
- Generates `metadata.json` with backup details

**Step 3: Automatic Deletion**
- **activities** collection: Always deleted (no prompt)
- **bookings** & **employee_bookings**: Deleted only if user confirms
  - Deleted from **local** database
  - Deleted from **remote** database (if sync enabled)

### 2. View Backed-Up Data

Browse and inspect data from previous backups:

#### API Endpoints

```
GET /api/backups                                    # List all backups
GET /api/backups/{backup_id}/collections           # List collections in backup
GET /api/backups/{backup_id}/collections/{name}    # Get collection documents
```

#### Frontend Features

- **Backup Browser**: Select from available backup dates
- **Collection Browser**: View collections in selected backup
- **Document Viewer**: 
  - Expandable document cards
  - JSON formatted display
  - Search/filter documents
  - Document count and size info

### 3. Status Monitoring

Check backup system configuration and availability:

```
GET /api/backup/status
```

Returns:
- Primary database type (local/cloud)
- Backup availability
- Sync enabled status
- System messages

## Access Control

### Permissions

Only users with **role_id ≤ 1** (Super Admin & Admin) can access:
- Backup Management page
- All backup API endpoints

### Role Guards

- Backend: `verify_admin_permissions` dependency
- Frontend: `hasPermission` check based on `user.role_id`
- Routing: `RoleGuard` component in App.tsx

### Mode Restrictions

Backup features are **only available** when:
- `PRIMARY_DATABASE=local` in environment
- Frontend shows informational message if in cloud mode
- Backend returns 403 error if accessed in cloud mode

## UI/UX

### Navigation

**Path**: Admin → Admin Management → Backup Management

**Sidebar**: 
- Icon: Database icon
- Visible only if `role_id ≤ 1`

### Page Sections

1. **System Status Card**
   - Shows primary database type
   - Backup availability badge
   - Sync enabled badge

2. **Trigger Backup Card**
   - Workflow explanation
   - Two action buttons:
     - "Trigger Backup (Keep Bookings)" - Green
     - "Trigger Backup (Delete Bookings)" - Red (destructive)
   - Confirmation dialog for deletion option

3. **View Backed-Up Data Card**
   - Load Backups button
   - Backup selector dropdown
   - Collection selector dropdown
   - Document viewer with search
   - Expandable document cards

### User Flow

```
1. Navigate to Backup Management
2. Review system status
3. Choose backup option:
   a. Keep bookings → Click green button
   b. Delete bookings → Click red button → Confirm in dialog
4. Wait for backup completion (progress indicator)
5. View success/error message with details
6. Browse backed-up data:
   - Click "Load Backups"
   - Select backup date
   - Select collection
   - Search and view documents
```

## Data Structures

### Backup Metadata

```python
{
  "backup_id": "20250119_143022",
  "backup_timestamp": "2025-01-19T14:30:22",
  "backup_path": "/backend/backups/backup_20250119_143022",
  "status": "success",  # success | failed | partial | in_progress
  "sync_status": "success",  # success | failed | skipped | in_progress
  "collections_backed_up": ["bookings", "employee_bookings", ...],
  "collections_deleted_local": ["activities (50 documents)", ...],
  "collections_deleted_remote": ["activities (50 documents)", ...],
  "delete_bookings_requested": true,
  "error_message": null,
  "created_by": "admin",
  "created_at": "2025-01-19T14:30:22"
}
```

### Backup Folder Structure

```
/backend/backups/
├── backup_20250119_143022/
│   ├── metadata.json
│   └── temple_db/
│       ├── bookings.bson
│       ├── bookings.metadata.json
│       ├── employee_bookings.bson
│       ├── employee_bookings.metadata.json
│       ├── events.bson
│       ├── events.metadata.json
│       └── ...
├── backup_20250118_120000/
│   └── ...
```

## Error Handling

### Backend Errors

1. **Validation Errors**
   - PRIMARY_DATABASE not "local" → 403 Forbidden
   - MONGODB_LOCAL_URL not configured → 500 Internal Error

2. **Sync Errors**
   - Remote database unavailable → Backup continues with warning
   - Sync conflicts → Resolved using timestamps

3. **Backup Errors**
   - mongodump timeout (5 minutes) → 500 error
   - Disk space issues → 500 error
   - Permission errors → 500 error

4. **Deletion Errors**
   - Local deletion fails → Status: PARTIAL
   - Remote deletion fails → Status: PARTIAL
   - Both tracked in metadata

### Frontend Error Handling

- **Permission denied**: Shows alert with role requirement
- **Mode mismatch**: Shows informational alert about LOCAL mode
- **Network errors**: Displays error message with details
- **Loading states**: Shows spinner during operations

## Security Considerations

### Authentication

- All endpoints protected by `EnhancedJWTAuthMiddleware`
- JWT token required in Authorization header
- Session validation and device fingerprinting

### Authorization

- Role-based access control (RBAC)
- Only Super Admin (0) and Admin (1) roles
- Frontend + Backend validation

### Data Protection

- Backups stored on server filesystem (not exposed)
- No direct file download from frontend
- BSON parsing on backend (sanitized JSON response)
- ObjectId and datetime conversion to strings

### Audit Trail

- All backup operations logged in `backup_metadata` collection
- Tracks who triggered backup (`created_by`)
- Tracks what was deleted and when
- Sync logs maintained in `sync_logs` collection

## Monitoring and Maintenance

### Recommended Practices

1. **Regular Backups**
   - Schedule weekly backups during low-traffic periods
   - Verify backup completion and status

2. **Disk Space Management**
   - Monitor `/backend/backups` directory size
   - Implement backup retention policy (e.g., keep last 10)
   - Manual or automated cleanup of old backups

3. **Sync Health**
   - Verify sync_status in backup metadata
   - Check network connectivity to Atlas
   - Review sync_logs for conflicts

4. **Testing Restores**
   - Periodically test backup restoration
   - Verify data integrity in backups
   - Document restore procedures

### Backup Retention Script (Example)

```python
# Keep only last N backups
from pathlib import Path
import shutil

BACKUP_DIR = Path("/backend/backups")
KEEP_LAST = 10

backups = sorted(BACKUP_DIR.glob("backup_*"), reverse=True)
for old_backup in backups[KEEP_LAST:]:
    shutil.rmtree(old_backup)
    print(f"Deleted old backup: {old_backup.name}")
```

## Troubleshooting

### Common Issues

**1. "Backup operations are only available in LOCAL mode"**
- Solution: Set `PRIMARY_DATABASE=local` in `.env`

**2. "mongodump: command not found"**
- Solution: Install MongoDB Database Tools
- Ubuntu: `sudo apt-get install mongodb-database-tools`
- macOS: `brew install mongodb/brew/mongodb-database-tools`

**3. Backup timeout**
- Cause: Large database (>5 minutes to dump)
- Solution: Increase timeout in `backup_service.py`:
  ```python
  result = subprocess.run(..., timeout=600)  # 10 minutes
  ```

**4. Sync failed before backup**
- Cause: Network issues or Atlas unavailable
- Action: Check `MONGODB_CLOUD_URL` and network
- Backup will NOT proceed if sync fails (safety mechanism)

**5. Permission denied on backups directory**
- Solution: Ensure write permissions:
  ```bash
  chmod 755 /backend/backups
  ```

**6. Remote deletion failed (PARTIAL status)**
- Cause: Network issues or Atlas credentials
- Action: Manually delete collections from Atlas
- Check `backup_metadata` for details

## API Reference

### POST /api/backup

Trigger backup operation.

**Request:**
```json
{
  "delete_bookings": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "backup_id": "20250119_143022",
  "backup_path": "/backend/backups/backup_20250119_143022",
  "backup_timestamp": "2025-01-19T14:30:22.000Z",
  "sync_status": "success",
  "collections_backed_up": ["bookings", "employee_bookings", "events", ...],
  "collections_deleted_local": ["activities (50 documents)", ...],
  "collections_deleted_remote": ["activities (50 documents)", ...],
  "message": "Backup completed successfully"
}
```

**Response (Error):**
```json
{
  "detail": "Backup operations are only available in LOCAL mode"
}
```

### GET /api/backups

List all available backups.

**Response:**
```json
[
  {
    "backup_id": "20250119_143022",
    "backup_date": "2025-01-19",
    "backup_timestamp": "2025-01-19T14:30:22",
    "status": "success",
    "collections_count": 15
  },
  ...
]
```

### GET /api/backups/{backup_id}/collections

List collections in a backup.

**Response:**
```json
[
  {
    "collection_name": "bookings",
    "document_count": 150,
    "file_size": "45.67 KB"
  },
  ...
]
```

### GET /api/backups/{backup_id}/collections/{collection_name}

Get documents from a collection.

**Response:**
```json
{
  "collection_name": "bookings",
  "documents": [
    {
      "_id": {"$oid": "507f1f77bcf86cd799439011"},
      "name": "John Doe",
      "ritual": "Puja",
      ...
    },
    ...
  ],
  "total_documents": 150
}
```

### GET /api/backup/status

Get backup system status.

**Response:**
```json
{
  "primary_database": "local",
  "backup_available": true,
  "sync_enabled": true,
  "message": "Backup system ready"
}
```

## Future Enhancements

### Planned Features

1. **Automated Backup Scheduling**
   - Cron job integration
   - Configurable schedule (daily/weekly)
   - Email notifications on completion

2. **Backup Restoration**
   - One-click restore from backup
   - Selective collection restore
   - Restore preview/dry-run

3. **Backup Compression**
   - Gzip compression for BSON files
   - Reduce disk space usage
   - Faster transfer if moving backups

4. **Cloud Backup Storage**
   - Upload backups to S3/Azure Blob
   - Offsite backup redundancy
   - Long-term archival

5. **Incremental Backups**
   - Only backup changed documents
   - Faster backup operations
   - Space efficiency

6. **Backup Verification**
   - Automated integrity checks
   - BSON validation
   - Document count verification

## Support and Maintenance

### Development Team Responsibilities

- Monitor backup disk usage
- Review backup logs weekly
- Update documentation as features evolve
- Test backup restoration quarterly

### User Training

- Educate Super Admin and Admin on backup workflows
- Document restore procedures for disaster recovery
- Train on when to use "Keep Bookings" vs "Delete Bookings"

## Conclusion

The Backup Management system provides enterprise-grade backup capabilities for LOCAL mode deployments, ensuring data safety, sync integrity, and easy data inspection. By following the guidelines in this documentation, administrators can maintain a robust backup strategy for the Temple Management System.
