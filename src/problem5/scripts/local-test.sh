#!/bin/bash

# Local testing script for deployment
# Tests the application locally before deploying

set -e

echo "🧪 Starting local deployment test..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

# Build the application
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Test the built application
echo "🚀 Testing built application..."
timeout 10s npm start &
APP_PID=$!

# Wait for app to start
sleep 5

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

# Test API endpoint
echo "🔍 Testing API endpoint..."
if curl -f http://localhost:3000/api/users > /dev/null 2>&1; then
    echo "✅ API endpoint test passed!"
else
    echo "❌ API endpoint test failed!"
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

# Clean up
echo "🧹 Cleaning up..."
kill $APP_PID 2>/dev/null || true

echo "✅ All tests passed! Ready for deployment."
