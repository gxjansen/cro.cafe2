#!/bin/bash
# Simple Docker wrapper for Claude Code - similar to claude-yolo but tailored for this project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="cro-cafe-claude"
CONTAINER_NAME="cro-cafe-claude-session"
WORKSPACE_DIR="$(pwd)"

# Build image if it doesn't exist
if ! docker image inspect $IMAGE_NAME >/dev/null 2>&1; then
    echo -e "${YELLOW}Building Claude Code container...${NC}"
    docker build -t $IMAGE_NAME .devcontainer/
fi

# Check if container is already running
if docker ps -q -f name=$CONTAINER_NAME >/dev/null 2>&1; then
    echo -e "${GREEN}Attaching to existing container...${NC}"
    docker exec -it $CONTAINER_NAME zsh
else
    echo -e "${GREEN}Starting new Claude Code container...${NC}"
    
    # Run container with all necessary mounts and environment
    docker run -it --rm \
        --name $CONTAINER_NAME \
        -v "$WORKSPACE_DIR":/workspace \
        -v cro-cafe-claude-config:/home/node/.claude \
        -v cro-cafe-npm-cache:/home/node/.npm \
        -v cro-cafe-bashhistory:/commandhistory \
        -e CLAUDE_API_KEY="${CLAUDE_API_KEY:-}" \
        -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
        -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
        -e AWS_REGION="${AWS_REGION:-}" \
        -p 3000:3000 \
        -p 4321:4321 \
        -p 5173:5173 \
        --cap-add=NET_ADMIN \
        --cap-add=NET_RAW \
        -w /workspace \
        $IMAGE_NAME \
        zsh -c "
            echo -e '${GREEN}🚀 Claude Code Docker Environment${NC}'
            echo -e '${YELLOW}Run \"claude auth\" to authenticate if needed${NC}'
            echo ''
            exec zsh
        "
fi