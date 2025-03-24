#!/bin/bash

# Script to debug server issues and fix Bad Gateway errors

echo "🔍 Starting server debugging process..."

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next" || true

# Check if port 3000 is in use
echo "🔎 Checking if port 3000 is already in use..."
if lsof -i :3000 > /dev/null; then
  echo "⚠️ Port 3000 is already in use. Killing the process..."
  lsof -ti :3000 | xargs kill -9
fi

# Remove .next directory
echo "🗑️ Removing .next directory..."
rm -rf .next

# Check environment variables
echo "🔑 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️ Warning: Supabase environment variables may not be set correctly."
fi

# Restart the server with verbose logging
echo "🚀 Starting server with verbose logging..."
NODE_OPTIONS="--trace-warnings" npm run dev
