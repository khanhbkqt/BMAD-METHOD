# BMAD MCP Server

A proper Model Context Protocol (MCP) server implementation for BMAD-Method that provides tools, resources, and prompts for AI agents.

## What is MCP?

MCP (Model Context Protocol) is Anthropic's open standard for connecting AI assistants to external tools and data sources. It enables AI agents to:

- **Call Tools**: Execute functions like creating stories, updating tasks
- **Access Resources**: Read project data, documents, progress information  
- **Use Prompts**: Get structured workflow templates

## BMAD MCP Server Features

### 🔧 Tools (AI Agent Actions)
- `bmad_create_story`: Create new stories with automatic numbering
- `bmad_update_task_status`: Update task status and assignments
- `bmad_create_epic`: Create new epics for organizing stories
- `bmad_query_tasks`: Query tasks with flexible filters
- `bmad_get_project_progress`: Get comprehensive progress statistics
- `bmad_create_document`: Create/update project documents
- `bmad_create_sprint`: Create sprints for planning

### 📚 Resources (Data Access)
- `bmad://project/info`: Project metadata and overview
- `bmad://project/progress`: Real-time progress statistics
- `bmad://tasks/all`: Complete task listing
- `bmad://tasks/todo`: Tasks ready for work
- `bmad://tasks/in-progress`: Currently active tasks
- `bmad://tasks/blocked`: Blocked tasks needing attention
- `bmad://epics/all`: All epics with progress
- `bmad://epics/{num}/tasks`: Tasks in specific epic
- `bmad://project/prd`: Product Requirements Document
- `bmad://project/architecture`: System Architecture Document

### 📝 Prompts (Workflow Templates)
- `bmad_create_story`: Guided story creation workflow
- `bmad_review_sprint`: Sprint review and retrospective
- `bmad_plan_epic`: Epic planning and breakdown
- `bmad_project_status`: Comprehensive status reporting
- `bmad_daily_standup`: Daily standup facilitation
- `bmad_task_handoff`: Task transfer between team members

## Quick Start

### 1. Start the MCP Server

```bash
# From your BMAD project directory
bmad-mcp-server
```

The server runs on stdio and communicates via JSON-RPC 2.0.

### 2. Configure Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "bmad": {
      "command": "npx",
      "args": ["bmad-method", "bmad-mcp-server"],
      "cwd": "/path/to/your/bmad/project"
    }
  }
}
```

### 3. Use with AI Agents

The server automatically discovers your BMAD project and provides access to all project data.

**Example Tool Calls:**
```
"Create a new story in Epic 1 for user authentication"
→ Uses bmad_create_story tool

"Show me all blocked tasks"  
→ Accesses bmad://tasks/blocked resource

"Help me plan Epic 2"
→ Uses bmad_plan_epic prompt
```

## Project Structure

The server automatically detects BMAD projects by looking for `.bmad/project.db` in the current directory tree.

```
your-project/
├── .bmad/
│   └── project.db          # SQLite database
├── src/                    # Your code
└── docs/                   # Generated documentation
```

If no database exists, the server creates one automatically.

## Architecture

```
┌─────────────┐    JSON-RPC 2.0    ┌──────────────┐
│   AI Agent  │ ←──────────────→   │  MCP Server  │
│  (Claude)   │      stdio         │   (BMAD)     │
└─────────────┘                    └──────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │    SQLite    │
                                   │  (Project    │
                                   │   Database)  │
                                   └──────────────┘
```

### Components

- **server.js**: Main MCP server with JSON-RPC 2.0 protocol
- **tools/**: Tool implementations for agent actions
- **resources/**: Resource providers for data access
- **prompts/**: Workflow templates and guided interactions
- **storage/**: SQLite adapter for data persistence

## Testing

Run the test suite to verify functionality:

```bash
node tools/mcp-server/test-mcp.js
```

This validates:
- ✅ MCP protocol compliance
- ✅ Tool execution
- ✅ Resource access
- ✅ Data persistence
- ✅ Project discovery

## Integration Examples

### Creating Stories

```javascript
// AI agent calls the bmad_create_story tool
{
  "name": "bmad_create_story",
  "arguments": {
    "epic_num": 1,
    "title": "Implement user authentication",
    "description": "Create JWT-based authentication system with login/logout",
    "assignee": "dev",
    "priority": "HIGH"
  }
}
```

### Querying Project Data

```javascript
// AI agent accesses project progress resource
{
  "uri": "bmad://project/progress"
}

// Returns real-time project statistics
{
  "project_name": "My Application",
  "total_tasks": 15,
  "completion_percentage": 67,
  "task_breakdown": {
    "TODO": 3,
    "IN_PROGRESS": 2,
    "DONE": 10
  }
}
```

### Guided Workflows

```javascript
// AI agent gets story creation prompt
{
  "name": "bmad_create_story",
  "arguments": { "epic_num": 1 }
}

// Returns structured workflow with:
// - Epic context
// - Previous stories
// - Creation guidelines  
// - Acceptance criteria templates
```

## Security & Permissions

The MCP server:
- ✅ Runs locally (no network access required)
- ✅ Uses local SQLite database
- ✅ Requires explicit tool calls (no automatic actions)
- ✅ Provides read-only resources by default
- ✅ Maintains audit trail of all changes

## Troubleshooting

**Server won't start:**
- Ensure you're in a directory with BMAD project
- Check Node.js version (requires >= 20.0.0)
- Verify MCP SDK installation

**No project data:**
- Server auto-creates database if none exists
- Use tools to create initial epics and stories
- Check `.bmad/project.db` was created

**Claude can't connect:**
- Verify MCP configuration in Claude Desktop
- Check server path and working directory
- Ensure server process is running

## Development

### Adding New Tools

1. Implement in `tools/bmad-tools.js`
2. Add to `listTools()` method
3. Add handler in `callTool()` method
4. Update tests

### Adding New Resources

1. Implement in `resources/bmad-resources.js`
2. Add to `listResources()` method  
3. Add handler in `readResource()` method
4. Define URI schema

### Adding New Prompts

1. Implement in `prompts/bmad-prompts.js`
2. Add to `listPrompts()` method
3. Add handler in `getPrompt()` method
4. Create message templates

## Contributing

1. Follow MCP specification exactly
2. Add comprehensive tests
3. Update documentation
4. Ensure backwards compatibility

---

**Transform your BMAD workflow with the power of MCP!** 🚀

AI agents can now seamlessly create stories, track progress, and access project data through the standard Model Context Protocol.