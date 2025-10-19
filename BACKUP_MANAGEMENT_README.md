# 🗄️ Backup Management System - Complete Guide

## 📑 Table of Contents

1. [Overview](#overview)
2. [Quick Links](#quick-links)
3. [Key Features](#key-features)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Architecture](#architecture)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)
9. [FAQs](#faqs)

## Overview

The Backup Management system provides enterprise-grade database backup capabilities for the Temple Management System. It supports **LOCAL mode deployments** where a local MongoDB instance syncs with a remote MongoDB Atlas database.

### What It Does

✅ Syncs local and remote databases before backup  
✅ Creates timestamped MongoDB backups using `mongodump`  
✅ Automatically deletes `activities` collection after backup  
✅ Optionally deletes `bookings` and `employee_bookings` (with confirmation)  
✅ Provides easy viewing of backed-up data through web UI  
✅ Tracks all backup operations with detailed metadata  
✅ Supports both local and remote collection deletion  

## Quick Links

- **[Installation Guide](BACKUP_MANAGEMENT_INSTALLATION.md)** - Step-by-step setup
- **[Quick Start](BACKUP_MANAGEMENT_QUICKSTART.md)** - Fast reference for users
- **[Full Documentation](BACKUP_MANAGEMENT_DOCUMENTATION.md)** - Complete technical docs
- **[Implementation Summary](BACKUP_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)** - What was built

## Key Features

### 🔄 Sync Before Backup
- Bidirectional sync between local and remote MongoDB
- Conflict resolution using timestamps
- Ensures backup contains latest data from both sources

### 💾 Smart Backup Creation
- Timestamped backup folders: `backup_YYYYMMDD_HHMMSS/`
- All collections backed up as BSON files
- Metadata file included for easy tracking
- Stored locally at `/backend/backups/`

### 🗑️ Intelligent Deletion
- **Always deleted**: `activities` collection
- **User-confirmed deletion**: `bookings` and `employee_bookings`
- Deleted from **both** local and remote databases
- Safe workflow: backup → verify → delete

### 👁️ Data Viewer
- Browse all available backups
- View collections and document counts
- Inspect individual documents as JSON
- Search and filter functionality
- Expand/collapse document viewer

### 🔐 Role-Based Access
- Only Super Admin (role_id=0) and Admin (role_id=1)
- Protected by JWT authentication
- Frontend and backend validation
- Audit trail in database

### ⚡ User Experience
- Clean, intuitive interface
- Real-time progress indicators
- Comprehensive error messages
- Confirmation dialogs for destructive actions
- System status at a glance

## Installation

### Prerequisites

```bash
# 1. Install MongoDB Database Tools
# Ubuntu/Debian:
sudo apt-get install mongodb-database-tools

# macOS:
brew install mongodb-database-tools

# Verify:
mongodump --version
```

### Configuration

```bash
# 2. Edit .env file
nano backend/.env

# Add/update these lines:
PRIMARY_DATABASE=local
MONGODB_LOCAL_URL=mongodb://localhost:27017
MONGODB_CLOUD_URL=mongodb+srv://user:pass@cluster.mongodb.net
DATABASE_NAME=temple_db
```

### Setup

```bash
# 3. Create backups directory
cd backend
mkdir -p backups
chmod 755 backups

# 4. Restart services
# Backend: (in backend directory)
python -m uvicorn app.main:app --reload

# Frontend: (in frontend directory)
npm run dev
```

### Verification

1. Login as Admin or Super Admin
2. Navigate to: **Admin → Admin Management → Backup Management**
3. Verify "System Status" shows:
   - Primary Database: **LOCAL**
   - Backup Available: **YES**
   - Sync Enabled: **YES**

**📖 Full installation guide:** [BACKUP_MANAGEMENT_INSTALLATION.md](BACKUP_MANAGEMENT_INSTALLATION.md)

## Usage

### Trigger a Backup

#### Option 1: Keep Bookings (Safe)
```
1. Click "Trigger Backup (Keep Bookings)"
2. Wait for completion
3. Review success message
```

**Result:**
- ✅ Syncs databases
- ✅ Creates backup
- ✅ Deletes `activities`
- ❌ Keeps `bookings` and `employee_bookings`

#### Option 2: Delete Bookings (Destructive)
```
1. Click "Trigger Backup (Delete Bookings)"
2. Confirm in dialog
3. Wait for completion
4. Review success message
```

**Result:**
- ✅ Syncs databases
- ✅ Creates backup
- ✅ Deletes `activities`
- ✅ Deletes `bookings` and `employee_bookings` (local + remote)

### View Backed-Up Data

```
1. Click "Load Backups"
2. Select backup date
3. Select collection
4. Browse/search documents
5. Click document to expand
```

**📖 Detailed usage guide:** [BACKUP_MANAGEMENT_QUICKSTART.md](BACKUP_MANAGEMENT_QUICKSTART.md)

## Architecture

### System Flow

```
┌─────────────────┐
│  Frontend UI    │
│ (React/TSX)     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Backend API    │
│  (FastAPI)      │
└────────┬────────┘
         │
         ├──────────────────────┐
         ▼                      ▼
┌─────────────────┐    ┌──────────────┐
│  Sync Manager   │    │   mongodump  │
│   (Python)      │    │   (binary)   │
└────────┬────────┘    └──────┬───────┘
         │                    │
         ▼                    ▼
┌─────────────────┐    ┌──────────────┐
│  Local MongoDB  │◄──►│  Backups     │
│                 │    │  Directory   │
└────────┬────────┘    └──────────────┘
         │
         │ Sync
         ▼
┌─────────────────┐
│ Remote MongoDB  │
│  (Atlas)        │
└─────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React, TypeScript | User interface |
| Backend API | FastAPI, Python | REST endpoints |
| Sync Manager | Python, Motor | Database sync |
| Backup Service | Python, subprocess | mongodump wrapper |
| Storage | Filesystem | Backup storage |
| Database | MongoDB | Data + metadata |

### File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── backup_models.py      # Data models
│   ├── services/
│   │   └── backup_service.py     # Core logic
│   ├── routers/
│   │   └── backup.py              # API endpoints
│   └── database.py                 # DB collections
└── backups/                        # Backup storage
    ├── backup_20250119_143022/
    │   ├── metadata.json
    │   └── temple_db/
    │       ├── bookings.bson
    │       └── ...
    └── ...

frontend/
└── src/
    ├── api/
    │   └── backup.ts               # API client
    ├── pages/
    │   └── BackupManagement.tsx    # UI component
    ├── components/
    │   ├── TempleSidebar.tsx       # Navigation
    │   └── AdminLayout.tsx
    └── App.tsx                      # Routing
```

**📖 Architecture details:** [BACKUP_MANAGEMENT_DOCUMENTATION.md](BACKUP_MANAGEMENT_DOCUMENTATION.md)

## Security

### Access Control

✅ **Authentication**: JWT token required  
✅ **Authorization**: role_id ≤ 1 (Super Admin & Admin only)  
✅ **Mode Validation**: PRIMARY_DATABASE must be "local"  
✅ **Frontend Guards**: Menu hidden for unauthorized users  
✅ **Backend Guards**: API rejects unauthorized requests  

### Data Protection

✅ **No Direct File Access**: Backups not exposed via HTTP  
✅ **BSON Parsing**: Sanitized on backend before sending to frontend  
✅ **Audit Trail**: All operations logged in backup_metadata  
✅ **Confirmation Dialogs**: For destructive operations  
✅ **Error Handling**: Safe failures, no data corruption  

### Best Practices

✅ Regular backups (weekly recommended)  
✅ Monitor disk space  
✅ Test restoration quarterly  
✅ Keep last 10 backups, delete older  
✅ Document why bookings were deleted  
✅ Verify backup completion  

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Not available in LOCAL mode" | PRIMARY_DATABASE not set | Set `PRIMARY_DATABASE=local` in .env |
| "Permission denied" | Wrong role | Login as Super Admin or Admin |
| "mongodump: command not found" | Not installed | Install mongodb-database-tools |
| Backup timeout | Large database | Increase timeout in code |
| Sync failed | Network/Atlas issue | Check MONGODB_CLOUD_URL |
| Can't see backups | No backups created | Trigger a backup first |

### Debug Steps

```bash
# 1. Check environment
cat backend/.env | grep PRIMARY_DATABASE
# Should output: PRIMARY_DATABASE=local

# 2. Check mongodump
mongodump --version
# Should output version number

# 3. Check backups directory
ls -la backend/backups
# Should show existing backups or empty directory

# 4. Check backend logs
# Look for: "✓ Backups directory ready"

# 5. Test API (with JWT token)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/backup/status
```

### Getting Help

1. Check error message in UI
2. Review backend console logs
3. Consult [Full Documentation](BACKUP_MANAGEMENT_DOCUMENTATION.md)
4. Check [Quick Start](BACKUP_MANAGEMENT_QUICKSTART.md)
5. Contact development team

## FAQs

### Q: When should I use "Delete Bookings"?
**A:** Use this option:
- At year-end after generating annual reports
- Quarterly when historical data is no longer needed
- When cleaning up test/demo data
- Always ensure backup completes first!

### Q: How often should I backup?
**A:** Recommended schedule:
- **Production**: Weekly (Sunday night, low traffic)
- **Development**: As needed before major changes
- **Before**: Major updates or data migrations

### Q: Can I restore from a backup?
**A:** Currently manual restore only:
```bash
mongorestore --uri="mongodb://..." \
  --db=temple_db \
  /backend/backups/backup_YYYYMMDD_HHMMSS/temple_db
```
One-click restore is planned for future release.

### Q: Where are backups stored?
**A:** On the backend server at `/backend/backups/` directory. Each backup is in a timestamped folder.

### Q: What if I'm in cloud mode?
**A:** Backup features are disabled in cloud mode since:
- Cloud databases have built-in backups
- No local database to backup
- Sync is not needed (already in cloud)

### Q: How much disk space do backups use?
**A:** Depends on database size. Example:
- Small DB (100 MB) → ~10 MB compressed
- Medium DB (1 GB) → ~100 MB compressed
- Monitor with: `du -sh backend/backups`

### Q: Can I download backups?
**A:** Not directly from UI (security). Access via:
```bash
# SSH into server
cd /backend/backups
tar -czf backup.tar.gz backup_YYYYMMDD_HHMMSS/
# Download via SCP/SFTP
```

### Q: What happens if backup fails?
**A:** Safe failure modes:
- Sync fails → Backup stops (no deletion)
- Backup fails → No deletion occurs
- Deletion fails → Marked as PARTIAL status
- All tracked in backup_metadata

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Installation Guide](BACKUP_MANAGEMENT_INSTALLATION.md)** | Setup instructions | DevOps, Admins |
| **[Quick Start](BACKUP_MANAGEMENT_QUICKSTART.md)** | Fast reference | End Users |
| **[Full Documentation](BACKUP_MANAGEMENT_DOCUMENTATION.md)** | Technical details | Developers |
| **[Implementation Summary](BACKUP_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)** | What was built | Project Managers |
| **This README** | Overview + navigation | Everyone |

## 🎯 Quick Action Matrix

| I want to... | Go to... |
|--------------|----------|
| Install the system | [Installation Guide](BACKUP_MANAGEMENT_INSTALLATION.md) |
| Learn how to use it | [Quick Start](BACKUP_MANAGEMENT_QUICKSTART.md) |
| Understand architecture | [Full Documentation](BACKUP_MANAGEMENT_DOCUMENTATION.md) |
| Troubleshoot issues | This README → Troubleshooting section |
| See what was built | [Implementation Summary](BACKUP_MANAGEMENT_IMPLEMENTATION_SUMMARY.md) |

## 🚀 Getting Started (3 Steps)

1. **Install Prerequisites**
   ```bash
   sudo apt-get install mongodb-database-tools
   ```

2. **Configure Environment**
   ```env
   PRIMARY_DATABASE=local
   MONGODB_LOCAL_URL=mongodb://localhost:27017
   ```

3. **Access the UI**
   ```
   Login → Admin → Admin Management → Backup Management
   ```

**That's it! You're ready to backup.** 🎉

---

## 📄 License & Credits

Part of Temple Management System  
Developed: October 2025  
Version: 1.0.0

## 🤝 Contributing

For feature requests or bug reports:
1. Document the issue
2. Include error messages/screenshots
3. Note your environment (OS, versions)
4. Contact development team

---

**Need Help?** Start with [Quick Start Guide](BACKUP_MANAGEMENT_QUICKSTART.md) →
