# BMad Method MCP Integration Guide

## Overview

The MCP-enhanced BMad Method provides a unified server architecture that combines MCP (Model Context Protocol) integration for AI agents with a REST API for web interfaces. The system automatically starts a web dashboard when connected to Claude Desktop, similar to the Serena MCP server.

## Key Features

### 🎯 Unified Architecture
- **Single Database**: SQLite database as single source of truth
- **Dual Transport**: Both MCP and REST endpoints use the same service layer
- **Service Architecture**: Enterprise-grade service layer with dependency injection
- **Auto Web UI**: Automatically starts web dashboard when MCP server connects

### 🚀 Auto-Start Web UI (Serena-like)
- Automatically launches web UI when Claude Desktop connects
- Configurable auto-open in browser
- Cross-platform browser detection
- Graceful process management

### 🔧 Configuration Management
- YAML-based configuration with environment overrides
- Multiple config file locations supported
- Development and production profiles
- Claude Desktop integration settings

## Installation

### Method 1: NPX (Recommended)
```bash
npx bmad-method-mcp install
```

### Method 2: Global Installation
```bash
npm install -g bmad-method-mcp
bmad-method-mcp install
```

## Claude Desktop Integration

### Automatic Configuration
The installer will provide Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "bmad-unified-server": {
      "command": "npx",
      "args": ["bmad-unified-server", "--mode=mcp"],
      "env": {
        "BMAD_AUTO_START_WEBUI": "true",
        "BMAD_AUTO_OPEN_WEBUI": "true",
        "BMAD_SERVER_MODE": "mcp",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Manual Configuration
Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Running the Server

### Unified Server (MCP + REST + Auto Web UI)
```bash
# Default dual mode (recommended)
bmad-unified-server

# MCP only mode (with auto web UI)
bmad-unified-server --mode=mcp

# REST only mode (no auto web UI)
bmad-unified-server --mode=rest
```

### Using NPM Scripts
```bash
# Development with auto-restart
npm run dev

# Unified server
npm run unified-server

# REST only
npm run unified-server:rest

# MCP only
npm run unified-server:mcp
```

## Configuration

### Configuration Files
The system loads configuration from multiple sources (in order):
1. `tools/mcp-server/config/bmad-mcp-config.yaml` (default)
2. `./bmad-mcp-config.yaml` (project root)
3. `./.bmad/mcp-config.yaml` (project .bmad directory)

### Environment Variables
Override any configuration with environment variables:

```bash
# Web UI settings
BMAD_AUTO_START_WEBUI=true
BMAD_AUTO_OPEN_WEBUI=true
WEBUI_PORT=5173

# Server settings
PORT=3001
LOG_LEVEL=info

# Database settings
DB_FILE=project.db

# Server mode
BMAD_SERVER_MODE=dual  # dual, mcp, rest
```

### Default Configuration
```yaml
# Web UI Auto-Start Settings
webui:
  auto_start: true          # Auto-start web UI with MCP server
  auto_open: true           # Auto-open in browser
  port: 5173               # Web UI port
  enabled_modes: ["mcp", "dual"]  # Only start in these modes

# Server Settings
server:
  rest_port: 3001          # REST API port
  log_level: "info"        # debug, info, warn, error
  request_logging: false   # Enable request logging

# Database Settings
database:
  auto_create: true        # Auto-create database
  filename: "project.db"   # Database file name
  wal_mode: true          # Enable WAL mode
```

## Usage with Claude Desktop

### 1. Install BMad Method MCP
```bash
npx bmad-method-mcp install
```

### 2. Add MCP Configuration
The installer will provide the Claude Desktop configuration. Add it to your `claude_desktop_config.json`.

### 3. Restart Claude Desktop
Restart Claude Desktop to load the new MCP server.

### 4. Test Integration
In Claude Desktop, you should see:
- ✅ MCP server connects automatically
- ✅ Web UI starts automatically (check logs)
- ✅ Web UI opens in browser (if auto_open enabled)
- ✅ Dashboard available at http://localhost:5173

### 5. Use MCP Tools
Available MCP tools in Claude Desktop:
- `bmad_create_task` - Create new tasks/stories
- `bmad_query_tasks` - Query tasks with filters
- `bmad_update_task_status` - Update task status
- `bmad_get_project_progress` - Get project statistics
- `bmad_create_sprint` - Create new sprints
- `bmad_get_current_sprint` - Get active sprint
- `bmad_get_project_analytics` - Get project analytics

## API Endpoints

### Task Management
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Query tasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/current-sprint` - Get current sprint tasks

### Sprint Management
- `POST /api/sprints` - Create sprint
- `GET /api/sprints/current` - Get current sprint
- `GET /api/sprints` - List all sprints
- `PUT /api/sprints/:id` - Update sprint
- `POST /api/sprints/:id/complete` - Complete sprint

### Project Analytics
- `GET /api/progress` - Project progress
- `GET /api/project/info` - Project information
- `GET /api/project/analytics` - Project analytics
- `GET /api/project/export/:format` - Export project data

### Web UI Control
- `GET /api/webui/status` - Web UI status
- `POST /api/webui/start` - Start Web UI
- `POST /api/webui/stop` - Stop Web UI

### Health Check
- `GET /health` - Server health status

## Architecture Benefits

### Single Source of Truth
- Both MCP and REST use the same SQLite database
- No data synchronization issues
- Consistent state across all interfaces

### Service Layer
- Clean separation of concerns
- Business logic in service classes
- Dependency injection container
- Standardized error handling
- Comprehensive logging

### Auto Web UI (Serena Pattern)
- Seamless Claude Desktop integration
- Automatic dashboard launch
- No manual web UI management
- Cross-platform compatibility

### Configuration Driven
- Flexible YAML configuration
- Environment variable overrides
- Development/production profiles
- Easy customization

## Troubleshooting

### Web UI Not Starting
1. Check if port 5173 is available
2. Verify Web UI directory exists
3. Check auto_start configuration
4. Review server logs

### MCP Connection Issues
1. Verify Claude Desktop configuration
2. Check server logs for errors
3. Ensure correct binary path
4. Test with `--mode=mcp` flag

### Port Conflicts
1. Change REST port: `PORT=3002 bmad-unified-server`
2. Change Web UI port: `WEBUI_PORT=5174 bmad-unified-server`
3. Update configuration files accordingly

### Database Issues
1. Check database file permissions
2. Verify SQLite installation
3. Review auto_create setting
4. Check database file path

## Development

### Local Development
```bash
git clone <repository>
cd bmad-method
npm install
npm run dev
```

### Testing MCP Integration
```bash
# Test MCP only mode
npm run unified-server:mcp

# Test REST only mode  
npm run unified-server:rest

# Test dual mode
npm run unified-server
```

### Configuration Testing
```bash
# Test with custom config
BMAD_AUTO_START_WEBUI=false npm run unified-server

# Test different log levels
LOG_LEVEL=debug npm run unified-server

# Test different ports
PORT=3002 WEBUI_PORT=5174 npm run unified-server
```

## Publishing

### NPM Publication
```bash
npm run build
npm publish --access public
```

### Testing Published Package
```bash
npx bmad-method-mcp@latest install
```

This MCP-enhanced BMad Method provides a seamless integration with Claude Desktop while maintaining all the powerful project management capabilities of the original framework.