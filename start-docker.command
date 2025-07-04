#!/bin/bash

# macOS double-click launcher for CRO.cafe Docker development
cd "$(dirname "$0")"

echo "🚀 Starting CRO.cafe Docker Development Environment"
echo "================================================="
echo ""

# Check if Docker Desktop is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running."
    echo "   Please start Docker Desktop and try again."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Start development environment
./docker-start.sh dev

echo ""
echo "✅ Development environment started!"
echo ""
echo "📱 You can now access the site from any device on your network:"
echo "   Local:   http://localhost:4321"
echo "   Network: http://$(./docker-start.sh ip | grep "Your local IP" | awk '{print $5}'):4321"
echo ""
echo "💡 Useful commands:"
echo "   View logs:  ./docker-start.sh logs"
echo "   Stop:       ./docker-start.sh stop"
echo "   Status:     ./docker-start.sh status"
echo ""
echo "🔄 This terminal will stay open to show container status."
echo "   Close this window or press Ctrl+C to stop the containers."
echo ""

# Keep terminal open and show logs
trap './docker-start.sh stop; echo "Containers stopped. Press Enter to exit..."; read' INT

# Show status every 30 seconds
while true; do
    sleep 30
    echo "$(date): Checking container status..."
    if ! docker-compose ps -q cro-cafe-dev > /dev/null 2>&1; then
        echo "❌ Container stopped unexpectedly"
        break
    fi
done