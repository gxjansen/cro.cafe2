#!/bin/bash

# CRO Café Thumbnail Generator - Local Development Setup

echo "🎨 Starting CRO Café Thumbnail Generator"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the thumbnail-generator directory"
    echo "   cd services/thumbnail-generator"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Error: Node.js not found. Please install Node.js 20+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Create output directory for test images
mkdir -p output
echo "✅ Output directory ready: ./output/"

# Set environment variables
export PORT=3001
export NODE_ENV=development

echo ""
echo "🚀 Starting thumbnail generator service..."
echo "📡 Service will be available at: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/health"
echo ""
echo "💡 In another terminal, run the test client:"
echo "   node test/test-client.js"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

# Start the service
npm start