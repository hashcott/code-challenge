#!/bin/bash

# Docker build and test script
# Tests the Docker build process locally

set -e

echo "🐳 Starting Docker build test..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t express-crud-api:test .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Docker build completed successfully!"
else
    echo "❌ Docker build failed!"
    exit 1
fi

# Test the Docker container
echo "🚀 Testing Docker container..."
docker run -d --name express-crud-test -p 3001:3000 express-crud-api:test

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs express-crud-test
    docker stop express-crud-test > /dev/null 2>&1 || true
    docker rm express-crud-test > /dev/null 2>&1 || true
    exit 1
fi

# Test API endpoint
echo "🔍 Testing API endpoint..."
if curl -f http://localhost:3001/api/users > /dev/null 2>&1; then
    echo "✅ API endpoint test passed!"
else
    echo "❌ API endpoint test failed!"
    docker logs express-crud-test
    docker stop express-crud-test > /dev/null 2>&1 || true
    docker rm express-crud-test > /dev/null 2>&1 || true
    exit 1
fi

# Clean up
echo "🧹 Cleaning up..."
docker stop express-crud-test > /dev/null 2>&1 || true
docker rm express-crud-test > /dev/null 2>&1 || true

echo "✅ All Docker tests passed! Ready for deployment."
