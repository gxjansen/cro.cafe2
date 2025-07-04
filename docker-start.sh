#!/bin/bash

# CRO.cafe Docker Management Script
# This script helps you manage the Docker environment for the CRO.cafe project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    else
        # Linux
        ip route get 8.8.8.8 | awk '{print $7}' | head -1
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment"
    echo "  prod        Start production environment"
    echo "  stop        Stop all containers"
    echo "  clean       Stop containers and remove volumes"
    echo "  rebuild     Rebuild containers"
    echo "  logs        Show container logs"
    echo "  status      Show container status"
    echo "  ip          Show local network access information"
    echo "  help        Show this help message"
}

# Function to start development environment
start_dev() {
    print_status "Starting CRO.cafe development environment..."
    check_docker
    
    # Build and start development container
    docker-compose up -d cro-cafe-dev
    
    # Wait a moment for the container to start
    sleep 3
    
    local_ip=$(get_local_ip)
    
    print_status "Development server started successfully!"
    echo ""
    print_info "Local access:     http://localhost:4321"
    print_info "Network access:   http://${local_ip}:4321"
    echo ""
    print_info "You can now access the site from any device on your local network using the network URL."
    print_warning "Make sure your firewall allows connections on port 4321."
    echo ""
    print_info "To view logs: ./docker-start.sh logs"
    print_info "To stop:      ./docker-start.sh stop"
}

# Function to start production environment
start_prod() {
    print_status "Starting CRO.cafe production environment..."
    check_docker
    
    # Build and start production container
    docker-compose --profile production up -d cro-cafe-prod
    
    # Wait a moment for the container to start
    sleep 3
    
    local_ip=$(get_local_ip)
    
    print_status "Production server started successfully!"
    echo ""
    print_info "Local access:     http://localhost:4322"
    print_info "Network access:   http://${local_ip}:4322"
    echo ""
    print_info "To view logs: ./docker-start.sh logs"
    print_info "To stop:      ./docker-start.sh stop"
}

# Function to stop containers
stop_containers() {
    print_status "Stopping CRO.cafe containers..."
    docker-compose down
    print_status "All containers stopped."
}

# Function to clean up
clean_up() {
    print_status "Stopping containers and cleaning up..."
    docker-compose down -v
    docker system prune -f
    print_status "Cleanup completed."
}

# Function to rebuild containers
rebuild() {
    print_status "Rebuilding CRO.cafe containers..."
    docker-compose down
    docker-compose build --no-cache
    print_status "Containers rebuilt successfully."
}

# Function to show logs
show_logs() {
    if docker-compose ps -q cro-cafe-dev > /dev/null 2>&1; then
        print_info "Showing development container logs..."
        docker-compose logs -f cro-cafe-dev
    elif docker-compose ps -q cro-cafe-prod > /dev/null 2>&1; then
        print_info "Showing production container logs..."
        docker-compose logs -f cro-cafe-prod
    else
        print_warning "No containers are currently running."
    fi
}

# Function to show status
show_status() {
    print_info "Container status:"
    docker-compose ps
    echo ""
    
    if docker-compose ps -q cro-cafe-dev > /dev/null 2>&1; then
        local_ip=$(get_local_ip)
        print_info "Development server running:"
        print_info "  Local:    http://localhost:4321"
        print_info "  Network:  http://${local_ip}:4321"
    fi
    
    if docker-compose ps -q cro-cafe-prod > /dev/null 2>&1; then
        local_ip=$(get_local_ip)
        print_info "Production server running:"
        print_info "  Local:    http://localhost:4322"
        print_info "  Network:  http://${local_ip}:4322"
    fi
}

# Function to show IP information
show_ip() {
    local_ip=$(get_local_ip)
    print_info "Network access information:"
    echo ""
    print_info "Your local IP address: ${local_ip}"
    echo ""
    print_info "If development server is running:"
    print_info "  Access from any device: http://${local_ip}:4321"
    echo ""
    print_info "If production server is running:"
    print_info "  Access from any device: http://${local_ip}:4322"
    echo ""
    print_warning "Note: Make sure devices are on the same network and firewall allows the connections."
}

# Main script logic
case "${1:-help}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_containers
        ;;
    clean)
        clean_up
        ;;
    rebuild)
        rebuild
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    ip)
        show_ip
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac