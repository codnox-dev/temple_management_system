# Backup Management - Installation & Setup Guide

## 🚀 Quick Installation

### Step 1: Install MongoDB Database Tools

The backup system requires `mongodump` utility.

#### Ubuntu/Debian
```bash
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
sudo apt install ./mongodb-database-tools-*.deb
```

Or via package manager:
```bash
sudo apt-get update
sudo apt-get install mongodb-database-tools
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

#### Windows (WSL)
```bash
# Use Ubuntu/Debian instructions in WSL
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.4.deb
sudo apt install ./mongodb-database-tools-*.deb
```

#### Verify Installation
```bash
mongodump --version
# Should output: mongodump version: 100.9.4
```

### Step 2: Configure Environment Variables

Edit your `.env` file in the backend directory:

```env
# Database Configuration
PRIMARY_DATABASE=local              # REQUIRED: Must be "local" for backup features
MONGODB_LOCAL_URL=mongodb://localhost:27017  # Your local MongoDB connection
MONGODB_CLOUD_URL=mongodb+srv://user:pass@cluster.mongodb.net  # Optional: for sync
DATABASE_NAME=temple_db             # Your database name
```

### Step 3: Create Backups Directory

```bash
# Navigate to backend directory
cd backend

# Create backups directory with proper permissions
mkdir -p backups
chmod 755 backups

# Verify
ls -la backups
# Should show: drwxr-xr-x ... backups
```

### Step 4: Verify Backend Setup

The backend changes are already in place. Verify by checking:

```bash
# Check if backup router exists
ls backend/app/routers/backup.py

# Check if backup service exists
ls backend/app/services/backup_service.py

# Check if backup models exist
ls backend/app/models/backup_models.py
```

### Step 5: Verify Frontend Setup

The frontend changes are already in place. Verify by checking:

```bash
# Check if BackupManagement page exists
ls frontend/src/pages/BackupManagement.tsx

# Check if backup API client exists
ls frontend/src/api/backup.ts
```

### Step 6: Restart Backend

```bash
# Stop backend if running
# Restart backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Check startup logs for:
# ✓ Backups directory ready: /path/to/backups
```

### Step 7: Restart Frontend

```bash
# Stop frontend if running
# Restart frontend
cd frontend
npm run dev
# or
bun run dev
```

### Step 8: Verify Installation

1. **Login as Admin**
   - Navigate to `/login`
   - Use Super Admin or Admin credentials

2. **Access Backup Management**
   - Go to Admin → Admin Management → Backup Management
   - Should see page without errors

3. **Check System Status**
   - Verify "Primary Database" shows "LOCAL"
   - Verify "Backup Available" shows "YES"
   - Verify "Sync Enabled" shows "YES" (if MONGODB_CLOUD_URL configured)

4. **Test Backup (Optional)**
   - Click "Trigger Backup (Keep Bookings)"
   - Wait for completion
   - Check `/backend/backups/` for new folder
   - Verify in UI that backup appears in dropdown

## 🔧 Troubleshooting Installation

### Issue: "mongodump: command not found"

**Solution:**
```bash
# Check if installed
which mongodump

# If not found, reinstall
# Ubuntu/Debian:
sudo apt-get install mongodb-database-tools

# macOS:
brew install mongodb-database-tools

# Add to PATH if needed
export PATH=$PATH:/usr/bin
```

### Issue: "Backup operations are only available in LOCAL mode"

**Solution:**
```bash
# Edit .env file
nano backend/.env

# Change PRIMARY_DATABASE
PRIMARY_DATABASE=local

# Save and restart backend
```

### Issue: "Permission denied" on backups directory

**Solution:**
```bash
# Fix permissions
cd backend
chmod 755 backups
chown $USER:$USER backups

# Or run backend with sudo (not recommended for production)
```

### Issue: "Could not connect to cloud MongoDB"

**Solution:**
```bash
# Check MONGODB_CLOUD_URL in .env
# Test connection manually
mongosh "mongodb+srv://user:pass@cluster.mongodb.net"

# If connection works, verify URL is correctly set
# If sync not needed, ignore warning (backup will still work)
```

### Issue: Menu item not visible

**Solution:**
- Verify user role: Only Super Admin (role_id=0) and Admin (role_id=1) can see menu
- Check browser console for errors
- Clear browser cache and refresh
- Verify frontend restart completed successfully

## 📋 Post-Installation Checklist

- [ ] `mongodump` command available in PATH
- [ ] `PRIMARY_DATABASE=local` in .env
- [ ] `MONGODB_LOCAL_URL` correctly configured
- [ ] `MONGODB_CLOUD_URL` configured (optional, for sync)
- [ ] `/backend/backups` directory exists with write permissions
- [ ] Backend restarted and shows "Backups directory ready" in logs
- [ ] Frontend restarted successfully
- [ ] Can login as Admin or Super Admin
- [ ] "Backup Management" menu item visible in sidebar
- [ ] System Status shows correct configuration
- [ ] Test backup completes successfully

## 🧪 Test the Installation

Run this test to verify everything works:

```bash
# 1. Test mongodump manually
mongodump --uri="mongodb://localhost:27017" --db=temple_db --out=/tmp/test_backup

# 2. Check if backup was created
ls /tmp/test_backup/temple_db
# Should show .bson files

# 3. Clean up test backup
rm -rf /tmp/test_backup

# 4. Test via API (requires JWT token)
# Login and get token first, then:
curl -X POST "http://localhost:8000/api/backup/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return:
# {
#   "primary_database": "local",
#   "backup_available": true,
#   "sync_enabled": true/false,
#   "message": "Backup system ready"
# }
```

## 🐳 Docker Setup (If Applicable)

If using Docker, ensure:

1. **Volume for backups:**
```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./backend/backups:/app/backups
```

2. **Install mongodump in container:**
```dockerfile
# Dockerfile
RUN apt-get update && apt-get install -y mongodb-database-tools
```

3. **Restart containers:**
```bash
docker-compose down
docker-compose up -d --build
```

## 📚 Next Steps

After installation:

1. **Read Documentation**
   - `BACKUP_MANAGEMENT_QUICKSTART.md` - For users
   - `BACKUP_MANAGEMENT_DOCUMENTATION.md` - For technical details

2. **Plan Backup Strategy**
   - Decide backup frequency (daily/weekly)
   - Plan retention policy (how many to keep)
   - Schedule backups during low-traffic hours

3. **Train Team**
   - Educate Super Admins and Admins on backup workflow
   - Document when to use "Delete Bookings" option
   - Practice viewing backed-up data

4. **Set Up Monitoring**
   - Monitor disk space on `/backend/backups`
   - Review `backup_metadata` collection weekly
   - Set up alerts for backup failures (future enhancement)

## 🆘 Support

If you encounter issues during installation:

1. Check console logs (backend and frontend)
2. Verify all prerequisites are met
3. Review troubleshooting section above
4. Check documentation files
5. Contact development team

## ✅ Installation Complete!

Once all checklist items are complete, your Backup Management system is ready to use.

Access it at: **Admin → Admin Management → Backup Management**

---

**Installation Guide Version:** 1.0.0  
**Last Updated:** October 19, 2025  
**System Requirements:** Python 3.8+, Node 18+, MongoDB 4.4+, mongodump 100+
