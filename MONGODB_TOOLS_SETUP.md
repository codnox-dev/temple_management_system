# Quick Setup for MongoDB Tools in Docker

## Step 1: Copy the .deb file to backend directory

```bash
cd ~/temple_management_system
cp ~/mongodb-database-tools-debian10-x86_64-100.13.0.deb ./backend/
```

## Step 2: Verify the file is copied

```bash
ls -lh ./backend/mongodb-database-tools-debian10-x86_64-100.13.0.deb
```

Expected output:
```
-rw-r--r-- 1 devat devat 50M ... mongodb-database-tools-debian10-x86_64-100.13.0.deb
```

## Step 3: Rebuild Docker container

```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

## Step 4: Verify installation

```bash
docker-compose exec backend mongodump --version
```

Expected output:
```
mongodump version: 100.13.0
git version: 23008ff975be028544710a5da6ae749dc7e90ab7
Go version: go1.23.11
   os: linux
   arch: amd64
   compiler: gc
```

## OR Use the Automated Script

```bash
cd ~/temple_management_system
chmod +x setup-mongodb-tools.sh
./setup-mongodb-tools.sh
```

## That's it! 🎉

Now you can use the Backup Management feature:
1. Go to http://localhost:5173
2. Login as Admin
3. Navigate to: Admin → Admin Management → Backup Management
4. Click "Trigger Backup"

## Troubleshooting

**If .deb file doesn't exist:**
```bash
ls ~/mongodb-database-tools-debian10-x86_64-100.13.0.deb
```

If not found, download it again from MongoDB downloads.

**If Docker build fails:**
```bash
# Check if file is in backend directory
ls -la backend/*.deb

# If missing, copy again
cp ~/mongodb-database-tools-debian10-x86_64-100.13.0.deb ./backend/
```

**Clean rebuild if needed:**
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache backend
docker-compose up -d
```
