# Docker Setup for CRO.cafe

This document explains how to set up and use Docker for the CRO.cafe project, enabling local network access for testing across multiple devices.

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Project files cloned to `/Users/gxjansen/Documents/GitHub/cro.cafe2`

### Basic Commands

```bash
# Start development server (accessible on local network)
./docker-start.sh dev

# Start production build server
./docker-start.sh prod

# Stop all containers
./docker-start.sh stop

# View container logs
./docker-start.sh logs

# Show network access info
./docker-start.sh ip
```

## Network Access

### Development Server
- **Local access**: http://localhost:4321
- **Network access**: http://[YOUR_LOCAL_IP]:4321

### Production Server  
- **Local access**: http://localhost:4322
- **Network access**: http://[YOUR_LOCAL_IP]:4322

### Finding Your Local IP
Run `./docker-start.sh ip` to see your current local IP address and access URLs.

## Detailed Setup

### 1. Server Configuration (Already Done)
Your `astro.config.mjs` is already configured with:
```javascript
server: {
  host: true, // Binds to all network interfaces (0.0.0.0)
  port: 4321
}
```

### 2. Docker Files Created

#### `Dockerfile.dev` - Development Environment
- Uses Node.js 18 Alpine
- Installs all dependencies including dev dependencies
- Mounts source code for hot reload
- Runs `npm run dev`

#### `Dockerfile` - Production Environment
- Optimized for production builds
- Only production dependencies
- Runs `npm run preview`

#### `docker-compose.yml` - Service Orchestration
- **cro-cafe-dev**: Development service on port 4321
- **cro-cafe-prod**: Production service on port 4322
- Volume mounting for hot reload
- Network isolation

#### `docker-start.sh` - Management Script
Convenient script with commands:
- `dev` - Start development environment
- `prod` - Start production environment  
- `stop` - Stop all containers
- `clean` - Clean up containers and volumes
- `rebuild` - Rebuild containers from scratch
- `logs` - View container logs
- `status` - Show container status
- `ip` - Show network access information

### 3. .dockerignore
Excludes unnecessary files from Docker context:
- Node modules
- Git files
- Documentation
- Development files
- Build outputs

## Usage Scenarios

### Local Development with Hot Reload
```bash
./docker-start.sh dev
```
- Source code changes trigger automatic rebuilds
- Access from any device on your network
- Perfect for mobile testing

### Production Testing
```bash
./docker-start.sh prod
```
- Tests the actual production build
- Simulates production environment
- Useful for final testing before deployment

### Multi-Device Testing
1. Start the development server: `./docker-start.sh dev`
2. Get your network IP: `./docker-start.sh ip`
3. Access from mobile devices, tablets, other computers using the network URL
4. All devices will see live updates as you develop

## Troubleshooting

### Port Already in Use
If port 4321 is already in use:
```bash
# Stop existing processes
./docker-start.sh stop

# Or check what's using the port
lsof -i :4321
```

### Container Won't Start
```bash
# Check Docker is running
docker info

# Rebuild containers
./docker-start.sh rebuild

# Check logs for errors
./docker-start.sh logs
```

### Network Access Issues
1. Ensure your firewall allows connections on ports 4321/4322
2. Verify devices are on the same network
3. Check your router doesn't block local network traffic

### Hot Reload Not Working
```bash
# Clean rebuild
./docker-start.sh clean
./docker-start.sh rebuild
./docker-start.sh dev
```

## Docker Commands Reference

### Manual Docker Commands (if needed)
```bash
# Build development image
docker-compose build cro-cafe-dev

# Start development container
docker-compose up -d cro-cafe-dev

# View logs
docker-compose logs -f cro-cafe-dev

# Stop containers
docker-compose down

# Clean up everything
docker-compose down -v
docker system prune -f
```

### Container Management
```bash
# See running containers
docker-compose ps

# Access container shell
docker-compose exec cro-cafe-dev sh

# Restart a service
docker-compose restart cro-cafe-dev
```

## Performance Notes

### Development Container
- Mounts source code as volume for hot reload
- Includes all dev dependencies
- Optimized for development workflow

### Production Container
- Only includes production dependencies
- Smaller image size
- Optimized for performance

### Network Performance
- Docker's bridge network provides good performance
- Local network access adds minimal latency
- Hot reload works efficiently with volume mounts

## Integration with Existing Workflow

### With npm scripts
Your existing npm scripts work inside containers:
```bash
# Inside container
docker-compose exec cro-cafe-dev npm run build
docker-compose exec cro-cafe-dev npm run test
```

### With VS Code
1. Install Docker extension
2. Attach VS Code to running container
3. Edit files with full IntelliSense support

### With git
Git operations should be done on the host machine, not inside containers, to maintain proper file permissions and git configuration.

## Next Steps

1. Test the setup: `./docker-start.sh dev`
2. Verify network access from another device
3. Integrate into your development workflow
4. Consider adding environment-specific configurations if needed

## Security Considerations

- Containers only expose necessary ports
- Development server is not suitable for production deployment
- Local network access should only be used in trusted environments
- Regular security updates for base Docker images recommended