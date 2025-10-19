# Database Sync Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure Environment Variables

Edit `backend/.env` and add:

```env
# Your existing local MongoDB (no changes needed)
MONGODB_LOCAL_URL="mongodb://mongo:27017"

# Add your MongoDB Atlas connection string
MONGODB_CLOUD_URL="mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority"

# Database name
DATABASE_NAME="temple_db"
```

---

### Step 2: Start the Application

The sync system initializes automatically on startup:

```bash
cd backend
docker-compose up
```

Look for these messages:
```
✓ Sync manager initialized
✓ Network monitoring started
🔄 Performing initial sync...
✓ Initial sync completed
```

---

### Step 3: Verify Sync Status

**Option A: Using API**
```bash
curl http://localhost:8000/api/sync/status
```

**Option B: Using CLI**
```bash
python -m app.cli.sync_cli status
```

You should see:
- ✓ Remote database: CONFIGURED
- 🟢 ONLINE
- Last sync completed successfully

---

## 📋 Common Tasks

### Trigger Manual Sync

**CLI (Recommended):**
```bash
python -m app.cli.sync_cli sync
```

**API:**
```bash
curl -X POST http://localhost:8000/api/sync/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Check for Conflicts

```bash
python -m app.cli.sync_cli conflicts
```

If conflicts exist:
```bash
# Auto-resolve simple conflicts
python -m app.cli.sync_cli auto-resolve

# Or manually resolve
python -m app.cli.sync_cli resolve CONFLICT_ID --strategy rename_local --value new_username
```

---

### Monitor Sync Status

```bash
# Quick status check
python -m app.cli.sync_cli status

# View recent sync logs
curl http://localhost:8000/api/sync/logs
```

---

## 🔧 Configuration Options

### Enable/Disable Auto-Sync

**Via API:**
```bash
curl -X PUT http://localhost:8000/api/sync/config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoSyncEnabled": true,
    "syncIntervalMinutes": 60
  }'
```

**Via Database:**
```javascript
db.sync_config.updateOne(
  {_id: "default"},
  {$set: {autoSyncEnabled: true}}
)
```

---

### Sync Specific Collections Only

```bash
python -m app.cli.sync_cli sync --collections admins bookings events
```

---

## 🆘 Troubleshooting

### Problem: "Remote database not configured"

**Fix:**
1. Check `MONGODB_CLOUD_URL` in `.env`
2. Test connection:
   ```bash
   mongosh "$MONGODB_CLOUD_URL"
   ```
3. Restart application

---

### Problem: Conflicts prevent sync

**Fix:**
```bash
# List conflicts
python -m app.cli.sync_cli conflicts

# Auto-resolve
python -m app.cli.sync_cli auto-resolve

# Manual resolve
python -m app.cli.sync_cli resolve <conflict_id> --strategy rename_local --value new_value

# Then sync again
python -m app.cli.sync_cli sync
```

---

### Problem: Sync takes too long

**Fix:**
1. Sync specific collections:
   ```bash
   python -m app.cli.sync_cli sync --collections admins
   ```

2. Adjust batch size (in config):
   ```json
   {"batchSize": 50}
   ```

3. Schedule syncs during off-peak hours

---

## 📊 How It Works (Simple Explanation)

1. **Local First**: All data writes go to local MongoDB
2. **Change Tracking**: Every change updates `updatedAt` timestamp
3. **Network Detection**: System monitors internet connection
4. **Auto Sync**: When internet returns, system automatically syncs
5. **Conflict Detection**: If same username exists, marks as conflict
6. **Resolution**: Admin resolves conflicts (rename or choose version)
7. **Retry**: After resolution, changes sync to remote

---

## 🎯 Best Practices

### ✅ DO:
- Resolve conflicts promptly
- Monitor sync status daily
- Use auto-resolve for simple conflicts
- Backup before major operations
- Test in staging first

### ❌ DON'T:
- Ignore conflicts for long periods
- Modify remote database directly
- Disable auto-sync without good reason
- Forget to commit `.env` changes to `.env.example`

---

## 📚 Next Steps

1. Read full documentation: `DATABASE_SYNC_DOCUMENTATION.md`
2. Set up monitoring dashboard (optional)
3. Configure periodic sync schedule
4. Train team on conflict resolution
5. Document your unique field constraints

---

## 🔗 Quick Reference

### Most Used Commands

```bash
# Status check
python -m app.cli.sync_cli status

# Manual sync
python -m app.cli.sync_cli sync

# List conflicts
python -m app.cli.sync_cli conflicts

# Auto-resolve
python -m app.cli.sync_cli auto-resolve

# View config
python -m app.cli.sync_cli config
```

### API Endpoints

```
GET  /api/sync/status              - Sync status
POST /api/sync/sync                - Trigger sync
GET  /api/sync/conflicts           - List conflicts
POST /api/sync/conflicts/{id}/resolve - Resolve conflict
GET  /api/sync/logs                - View logs
GET  /api/sync/config              - Get config
PUT  /api/sync/config              - Update config
```

---

**Need Help?** Check the full documentation or contact the dev team.
