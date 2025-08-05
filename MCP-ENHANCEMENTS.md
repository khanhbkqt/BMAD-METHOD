# MCP Enhanced BMad Method

This is an enhanced fork of the original BMad Method with full Model Context Protocol (MCP) integration, providing advanced AI agent capabilities and structured data management.

## 🚀 New MCP Features

### 18 MCP Tools for AI Agents
- **Task Management**: Create, update, query, and delete tasks/stories
- **Epic Management**: Create and manage project epics
- **Sprint Planning**: Create sprints and track progress
- **Document Management**: Create, retrieve, and list project documents
- **Analytics**: Real-time project progress and task analytics
- **Data Export**: Export project data for analysis

### Dynamic MCP Resources
- **Project State**: `bmad://project/info`, `bmad://project/progress`
- **Task Access**: `bmad://tasks/all`, `bmad://tasks/todo`, `bmad://tasks/in-progress`
- **Epic Context**: `bmad://epics/<num>/tasks`, `bmad://epics/<num>/progress`
- **Document Access**: `bmad://project/prd`, `bmad://project/architecture`

### Web UI Dashboard
- Visual sprint management with Kanban boards
- Real-time progress tracking and analytics
- Document creation and management interface
- Task assignment and status updates

### SQLite Data Persistence
- Structured storage for all project data
- Real-time synchronization across agents
- Audit trail and change tracking
- Export capabilities for analysis

## 📦 Installation

```bash
# Install the MCP-enhanced version
npx bmad-method-mcp install

# Or use the global command
npm install -g bmad-method-mcp
bmad-method-mcp install
```

## 🔧 MCP Server Usage

### Start MCP Server
```bash
# Start the MCP server for AI integration
bmad-mcp-server

# Or run directly
node tools/mcp-server/server.js
```

### Claude Desktop Integration
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "bmad": {
      "command": "npx",
      "args": ["bmad-method-mcp", "bmad-mcp-server"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Web UI Access
```bash
# Start web interface
npm run dev

# Access at http://localhost:5173
```

## 🆚 Differences from Original

### Enhanced Agent Tasks
All core tasks now use MCP tools for:
- ✅ Real-time data access and updates
- ✅ Structured query capabilities  
- ✅ Cross-agent data synchronization
- ✅ Progress tracking and analytics

### Migration from File-Based to Database
- ✅ Replaced file-based task management with SQLite
- ✅ Deprecated all non-MCP task versions
- ✅ Updated all agent references to MCP versions
- ✅ Maintained backward compatibility with existing workflows

### New Distribution Components
- ✅ Complete web UI in `/dist/web-ui/`
- ✅ Full MCP server in `/dist/mcp-server/`
- ✅ Updated agent bundles with MCP integration
- ✅ Comprehensive distribution documentation

## 🎯 Use Cases

### AI Agent Development
- Claude Desktop with full MCP integration
- Real-time project state access for agents
- Structured task and epic management
- Cross-agent data consistency

### Team Collaboration
- Visual web interface for project management
- Real-time progress tracking across team members
- Centralized document and story management
- Sprint planning and execution tracking

### Enterprise Workflows
- Structured data export for reporting
- Audit trails for compliance
- Scalable SQLite database backend
- REST API for custom integrations

## 🔄 Migration from Original

Existing BMad Method projects can seamlessly upgrade:

1. **Automatic Detection**: MCP server detects existing projects
2. **Data Migration**: Converts file-based data to SQLite
3. **Agent Compatibility**: All existing agent workflows preserved
4. **Enhanced Features**: Immediate access to new MCP capabilities

## 📊 Benefits

### For Developers
- **Faster Development**: Real-time agent coordination
- **Better Context**: Agents access live project state
- **Improved Quality**: Structured validation and tracking

### For Teams
- **Visual Management**: Web UI for project oversight
- **Real-time Collaboration**: Synchronized agent interactions
- **Progress Transparency**: Live metrics and analytics

### For Organizations
- **Scalable Architecture**: SQLite backend handles growth
- **Integration Ready**: MCP standard enables tool ecosystem
- **Data-Driven Insights**: Export capabilities for analysis

## 🤝 Contributing

This fork maintains compatibility with the original BMad Method while adding MCP capabilities. Contributions welcome:

1. **MCP Tools**: Add new agent capabilities
2. **Web UI Features**: Enhance visual management
3. **Agent Improvements**: Optimize MCP integration
4. **Documentation**: Improve guides and examples

## 📄 License

MIT License - Same as original BMad Method

## 🔗 Links

- **Original Project**: [bmad-method](https://github.com/bmadcode/BMAD-METHOD)
- **MCP Specification**: [Model Context Protocol](https://modelcontextprotocol.io)
- **Claude Desktop**: [Anthropic Claude](https://claude.ai/desktop)

---

**Enhanced BMad Method with MCP - Where AI Agents Meet Structured Development** 🚀