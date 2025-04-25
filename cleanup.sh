#!/bin/bash

# This script cleans up Next.js build artifacts and restarts the development server
# to fix various Next.js caching and static asset issues

echo "🧹 Starting Next.js cleanup process..."

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next" || true

# Check if port 3000 is in use
echo "🔎 Checking if port 3000 is already in use..."
if command -v lsof > /dev/null && lsof -i :3000 > /dev/null; then
  echo "⚠️ Port 3000 is already in use. Killing the process..."
  lsof -ti :3000 | xargs kill -9 || true
fi

# Remove cache directories
echo "🗑️ Removing cache directories..."
rm -rf .next
rm -rf node_modules/.cache

# Clear npm cache
echo "🧼 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Start the development server
echo "🚀 Starting development server..."
npm run dev
