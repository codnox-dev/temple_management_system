# Backup Management - Quick Start Guide

## Prerequisites

✅ `PRIMARY_DATABASE=local` in `.env`  
✅ `mongodump` utility installed  
✅ Super Admin or Admin role (role_id ≤ 1)

## Quick Access

**Navigate to:** Admin → Admin Management → Backup Management

## Trigger a Backup

### Option 1: Keep Bookings (Safe)
```
1. Click "Trigger Backup (Keep Bookings)" button
2. Wait for completion
3. Review success message
```

**What happens:**
- ✅ Syncs local ↔ remote database
- ✅ Creates backup at `/backend/backups/backup_YYYYMMDD_HHMMSS/`
- ✅ Deletes `activities` collection
- ❌ Keeps `bookings` and `employee_bookings`

### Option 2: Delete Bookings (Destructive)
```
1. Click "Trigger Backup (Delete Bookings)" button
2. Confirm in dialog
3. Wait for completion
4. Review success message
```

**What happens:**
- ✅ Syncs local ↔ remote database
- ✅ Creates backup at `/backend/backups/backup_YYYYMMDD_HHMMSS/`
- ✅ Deletes `activities` collection
- ✅ Deletes `bookings` and `employee_bookings` (local + remote)

## View Backed-Up Data

```
1. Click "Load Backups" button
2. Select backup date from dropdown
3. Select collection from dropdown
4. Browse documents:
   - Click document to expand/collapse
   - Use search box to filter
   - View JSON formatted data
```

## System Status

Check the **System Status** card to verify:
- **Primary Database**: Should show "LOCAL"
- **Backup Available**: Should show "YES"
- **Sync Enabled**: Shows "YES" if remote MongoDB configured

## Backup Folder Structure

```
/backend/backups/
├── backup_20250119_143022/    ← Timestamped folder
│   ├── metadata.json           ← Backup info
│   └── temple_db/              ← Database dump
│       ├── bookings.bson       ← Collection data
│       ├── bookings.metadata.json
│       └── ...
```

## Common Questions

**Q: When should I delete bookings?**  
A: Delete bookings after year-end or quarterly when historical data is no longer needed for active operations. Always keep a backup first!

**Q: How often should I backup?**  
A: Recommended: Weekly during low-traffic hours (e.g., Sunday night)

**Q: What if backup fails?**  
A: Check error message. Common issues:
- Network connection to Atlas (for sync)
- Disk space
- Permissions on /backend/backups

**Q: Can I restore from a backup?**  
A: Currently, restoration must be done manually using `mongorestore`. One-click restore is planned for future release.

**Q: Where are backups stored?**  
A: On the backend server at `/backend/backups/` directory

**Q: How do I clean up old backups?**  
A: Manually delete old backup folders from `/backend/backups/` when disk space is needed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows "not available in LOCAL mode" | Set `PRIMARY_DATABASE=local` in `.env` and restart backend |
| "Permission denied" error | Only Super Admin and Admin can access this feature |
| Backup timeout | Large database; increase timeout in code or contact dev team |
| Sync failed | Check network and `MONGODB_CLOUD_URL`; backup will not proceed |
| Can't see backed-up data | Ensure backup completed successfully; check backup folder exists |

## Emergency Contacts

- **Development Team**: [Your contact info]
- **System Admin**: [Your contact info]

## Best Practices

✅ Test backup restoration quarterly  
✅ Verify backup completion after each trigger  
✅ Monitor disk space on backup server  
✅ Document why bookings were deleted (if applicable)  
✅ Keep last 10 backups, delete older ones  

## Manual Restore (If Needed)

```bash
# Restore entire database
mongorestore --uri="mongodb://..." --db=temple_db /backend/backups/backup_YYYYMMDD_HHMMSS/temple_db

# Restore specific collection
mongorestore --uri="mongodb://..." --db=temple_db --collection=bookings /backend/backups/backup_YYYYMMDD_HHMMSS/temple_db/bookings.bson
```

⚠️ **Warning:** Restoring will overwrite existing data. Always backup current state first!

## Support

For detailed documentation, see: `BACKUP_MANAGEMENT_DOCUMENTATION.md`

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0
