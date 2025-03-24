#!/bin/bash

# This script cleans up Next.js build artifacts and restarts the development server
# to fix "missing required components" errors

echo "🧹 Starting cleanup process..."

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next dev" || true

# Remove the .next directory
echo "🗑️ Removing .next directory..."
rm -rf .next

# Clear npm cache
echo "🧼 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Start the dev server
echo "🚀 Starting development server..."
npm run dev
