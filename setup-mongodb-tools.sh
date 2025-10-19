#!/bin/bash
# Setup script to copy MongoDB tools and rebuild Docker

echo "📦 Copying MongoDB Database Tools package..."
cp ~/mongodb-database-tools-debian10-x86_64-100.13.0.deb ./backend/

if [ ! -f "./backend/mongodb-database-tools-debian10-x86_64-100.13.0.deb" ]; then
    echo "❌ Error: Failed to copy .deb file"
    echo "Please ensure ~/mongodb-database-tools-debian10-x86_64-100.13.0.deb exists"
    exit 1
fi

echo "✅ Package copied successfully"
echo ""
echo "🏗️  Rebuilding Docker container..."
docker-compose build --no-cache backend

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Verifying mongodump installation..."
docker-compose exec backend mongodump --version

echo ""
echo "✨ Setup complete!"
echo ""
echo "📂 Backup directory: $(pwd)/backend/backups"
echo "🌐 Backend API: http://localhost:8080"
echo "🖥️  Frontend: http://localhost:5173"
echo ""
echo "Test backup at: Login → Admin → Admin Management → Backup Management"
