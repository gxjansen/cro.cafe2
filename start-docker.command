#!/bin/bash
# Double-click this file to start Claude Code in Docker

cd "$(dirname "$0")"

echo "🚀 Starting CRO.CAFE Claude Code Docker Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running!"
    echo "Please start Docker Desktop and try again."
    read -p "Press any key to exit..."
    exit 1
fi

# Build if needed
echo "📦 Building Docker image (this may take a few minutes on first run)..."
docker-compose build

# Start the container
echo "🏃 Starting container..."
docker-compose up -d

# Show status
echo ""
echo "✅ Container started successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Open Docker Desktop to see your running container"
echo "2. Click on 'cro-cafe-claude-code' container"
echo "3. Click 'Terminal' tab to access the container"
echo "4. Or run: docker-compose exec claude-code zsh"
echo ""
echo "🌐 Dev server will be available at:"
echo "   - http://localhost:3000 (Astro default)"
echo "   - http://localhost:4321 (Astro preview)"
echo ""
read -p "Press any key to continue..."