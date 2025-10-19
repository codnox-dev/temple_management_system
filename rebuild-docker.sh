#!/bin/bash
# Quick rebuild script for Docker with backup support

echo "🔄 Stopping containers..."
docker-compose down

echo "🏗️  Rebuilding backend container with MongoDB tools..."
docker-compose build --no-cache backend

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 5

echo "✅ Verifying mongodump installation..."
docker-compose exec backend mongodump --version

echo "📋 Checking environment..."
docker-compose exec backend env | grep -E "(PRIMARY_DATABASE|MONGODB_LOCAL_URL)"

echo ""
echo "✨ Rebuild complete!"
echo ""
echo "📂 Backup directory: $(pwd)/backend/backups"
echo "🌐 Backend API: http://localhost:8080"
echo "🖥️  Frontend: http://localhost:5173"
echo ""
echo "📊 View logs with: docker-compose logs -f backend"
echo "🗄️  Access Backup Management: Login → Admin → Admin Management → Backup Management"
