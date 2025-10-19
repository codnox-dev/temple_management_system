# Docker Rebuild Instructions for Backup Management

## Why Rebuild?

The backup management system requires `mongodump` to be installed in the backend Docker container. This wasn't included in the original image.

## What Was Changed

1. **Dockerfile** - Added MongoDB Database Tools installation
2. **docker-compose.yml** - Added:
   - `MONGODB_LOCAL_URL` environment variable
   - `PRIMARY_DATABASE=local` to enable backup features
   - Volume mount for `/app/backups` directory

## Rebuild Steps

### Step 1: Stop Running Containers
```bash
cd ~/temple_management_system
docker-compose down
```

### Step 2: Rebuild Backend Container
```bash
# This will rebuild with the new Dockerfile
docker-compose build --no-cache backend
```

### Step 3: Start All Services
```bash
docker-compose up -d
```

### Step 4: Verify Installation
```bash
# Check if mongodump is available in the container
docker-compose exec backend mongodump --version

# Expected output:
# mongodump version: 100.x.x
# git version: ...
# Go version: ...
```

### Step 5: Check Logs
```bash
# Watch backend logs for startup messages
docker-compose logs -f backend

# Look for:
# ✓ Backups directory ready: /app/backups
# ✓ Primary database: LOCAL MongoDB
```

### Step 6: Test Backup System
1. Login to admin panel at http://localhost:5173
2. Navigate to: Admin → Admin Management → Backup Management
3. Check System Status shows:
   - Primary Database: LOCAL
   - Backup Available: YES
4. Click "Trigger Backup (Keep Bookings)"
5. Verify backup completes successfully

## Troubleshooting

### Issue: "mongodump: command not found"
**Solution**: Rebuild didn't complete properly
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Issue: "Backup directory permission denied"
**Solution**: Fix permissions on host
```bash
mkdir -p backend/backups
chmod 755 backend/backups
docker-compose restart backend
```

### Issue: "Backup not available in LOCAL mode"
**Solution**: Check environment variables
```bash
docker-compose exec backend env | grep PRIMARY_DATABASE
# Should show: PRIMARY_DATABASE=local
```

If not set, add to docker-compose.yml and restart:
```bash
docker-compose down
docker-compose up -d
```

## Quick Rebuild Command (All-in-One)

```bash
cd ~/temple_management_system
docker-compose down && \
docker-compose build --no-cache backend && \
docker-compose up -d && \
docker-compose logs -f backend
```

## Verify Backup Directory

After rebuild, check that backups are accessible on your host:

```bash
ls -la backend/backups/
# Should show directory exists and is writable
```

When a backup is created, you'll see:
```bash
backend/backups/backup_20250119_143022/
```

## Notes

- **Build time**: ~2-3 minutes (downloads and installs MongoDB tools)
- **Disk space**: ~100MB additional for MongoDB tools
- **Backup location**: `backend/backups/` on host, `/app/backups/` in container
- **Backups persist**: Even if you delete the container, backups on host remain

## Next Steps

After successful rebuild:
1. Create a test backup
2. Verify backup files exist in `backend/backups/`
3. Try viewing backed-up data in the UI
4. Set up backup schedule (manual for now)

---

**Last Updated**: October 19, 2025
