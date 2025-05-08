const fs = require('fs');
const path = require('path');

// Check if the .next directory exists
if (!fs.existsSync(path.join(__dirname, '.next'))) {
  console.error('❌ Build failed: .next directory does not exist');
  process.exit(1);
}

// Check if the .next/server directory exists
if (!fs.existsSync(path.join(__dirname, '.next', 'server'))) {
  console.error('❌ Build failed: .next/server directory does not exist');
  process.exit(1);
}

// Check if the .next/static directory exists
if (!fs.existsSync(path.join(__dirname, '.next', 'static'))) {
  console.error('❌ Build failed: .next/static directory does not exist');
  process.exit(1);
}

console.log('✅ Build successful: All required directories exist');
process.exit(0);
