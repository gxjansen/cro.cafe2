# Docker Setup for Claude Code

This setup provides a secure Docker container for running Claude Code with your CRO.CAFE project.

## Prerequisites

- Docker Desktop installed and running
- Claude Code authentication (API key or Claude App OAuth)

## Setup Options

### Option 1: Using VS Code Dev Containers (Recommended)

1. **Install VS Code Extension**:
   - Install the "Dev Containers" extension in VS Code

2. **Open in Container**:
   - Open this project in VS Code
   - Click the green "Reopen in Container" button when prompted
   - Or use Command Palette: "Dev Containers: Reopen in Container"

3. **Wait for Build**:
   - First build takes ~5 minutes
   - Subsequent starts are much faster

### Option 2: Using Docker Compose

1. **Build the Container**:
   ```bash
   docker-compose build
   ```

2. **Start the Container**:
   ```bash
   docker-compose up -d
   ```

3. **Enter the Container**:
   ```bash
   docker-compose exec claude-code zsh
   ```

4. **Inside Container - Authenticate Claude**:
   ```bash
   # Option A: Using API Key
   export CLAUDE_API_KEY="your-api-key-here"
   
   # Option B: Using Claude App OAuth (interactive)
   claude auth
   ```

### Option 3: Direct Docker Commands

1. **Build the Image**:
   ```bash
   docker build -t cro-cafe-claude .devcontainer/
   ```

2. **Run the Container**:
   ```bash
   docker run -it \
     -v $(pwd):/workspace \
     -v cro-cafe-claude-config:/home/node/.claude \
     -p 3000:3000 -p 4321:4321 \
     --name cro-cafe-dev \
     cro-cafe-claude
   ```

## Using Claude Code in the Container

Once inside the container:

```bash
# Start development server
npm run dev

# Run Claude Code
claude chat

# Or use the alias
cc chat

# Run Claude Code with a specific task
claude "Help me optimize the GuestCard component for performance"
```

## Authentication Methods

### 1. API Key (Simplest)
Add to your `.env` file (don't commit!):
```bash
CLAUDE_API_KEY=sk-ant-...
```

### 2. Claude App OAuth
Run inside container:
```bash
claude auth
```

### 3. AWS Bedrock
Add to `.env`:
```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### 4. Google Vertex AI
Mount your credentials:
```yaml
volumes:
  - ~/.config/gcloud:/home/node/.config/gcloud:ro
```

## Port Mappings

- `3000` - Default Astro dev server
- `4321` - Astro build preview
- `5173` - Vite (if used)

## Volume Mounts

- `/workspace` - Your project files
- `/home/node/.claude` - Claude configuration
- `/home/node/.npm` - NPM cache
- `/commandhistory` - Persistent shell history

## Security Features

- Node.js 24 (current version)
- Runs as non-root user (`node`)
- Network restrictions via iptables
- Isolated from host system
- Only project directory is mounted

## Tips

1. **Performance**: Use Docker Desktop's resource settings to allocate enough CPU/RAM
2. **File Watching**: May need to increase file watcher limits on macOS/Linux
3. **Permissions**: Files created in container are owned by `node` user (UID 1000)

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs claude-code

# Rebuild without cache
docker-compose build --no-cache
```

### Permission Issues
```bash
# Inside container, fix permissions
sudo chown -R node:node /workspace
```

### Claude Auth Issues
```bash
# Check config directory
ls -la ~/.claude/

# Re-authenticate
claude auth logout
claude auth
```

### Slow Performance on macOS
- Enable VirtioFS in Docker Desktop settings
- Or use delegated mount consistency (already configured)

## Cleanup

```bash
# Stop container
docker-compose down

# Remove volumes (loses Claude config!)
docker-compose down -v

# Remove all
docker system prune -a
```