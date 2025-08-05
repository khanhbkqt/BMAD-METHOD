# BMAD MCP Migration Guide

## Overview

This guide helps you migrate existing BMAD projects to use the new MCP (Model Context Protocol) enhanced features. MCP provides structured data management, real-time progress tracking, and enhanced cross-references while maintaining full backwards compatibility.

## Quick Start

### Prerequisites

1. **Node.js**: Version 20.0.0 or higher
2. **BMAD Method**: Version 4.33.1+ with MCP support
3. **Existing BMAD Project**: With core-config.yaml configured

### Enable MCP in 3 Steps

```bash
# 1. Update BMAD to latest version
npm update bmad-method

# 2. Update core-config.yaml (add MCP section)
# See configuration section below

# 3. Start MCP server
npx bmad-method bmad-mcp-server
```

## Migration Paths

### Path 1: Gradual Migration (Recommended)

**Best for**: Existing projects with ongoing development

1. **Enable MCP with fallback**
2. **Start using MCP commands for new work**
3. **Migrate historical data when needed**

```yaml
# core-config.yaml
mcp:
  enabled: true
  features:
    fallbackToFiles: true  # Keep this true during migration
```

### Path 2: Full Migration

**Best for**: New development phases or clean slate migration

1. **Enable full MCP features**
2. **Import existing stories and epics**
3. **Use MCP workflows exclusively**

```yaml
# core-config.yaml  
mcp:
  enabled: true
  features:
    fallbackToFiles: false  # Disable after full migration
```

## Configuration Update

### Add MCP Section to core-config.yaml

Add this configuration to your existing `core-config.yaml`:

```yaml
# MCP (Model Context Protocol) Configuration
mcp:
  enabled: true
  
  server:
    command: "npx bmad-method bmad-mcp-server"
    workingDirectory: "."
    timeout: 30000
  
  database:
    path: ".bmad/project.db"
    autoCreate: true
    backup: true
  
  features:
    mcpStoryCreation: true
    mcpDocumentManagement: true
    mcpProgressTracking: true
    mcpProjectManagement: true
    fallbackToFiles: true  # Change to false after full migration
  
  agents:
    sm:
      preferMcpTasks: true
    dev:
      preferMcpValidation: true
    pm:
      preferMcpDocuments: true
```

## Agent Command Updates

### New MCP-Enhanced Commands

**Scrum Master (SM) Agent:**
```
@sm
*draft-mcp          # MCP-enhanced story creation
*help               # Shows both traditional and MCP commands
```

**Developer (Dev) Agent:**
```
@dev
*validate-story-mcp # MCP-enhanced story validation
*help               # Shows both traditional and MCP commands
```

**Product Manager (PM) Agent:**
```
@pm
*create-prd-mcp     # MCP-enhanced PRD creation
*help               # Shows both traditional and MCP commands
```

### Command Compatibility

| Traditional Command | MCP Enhanced Version | Notes |
|-------------------|---------------------|--------|
| `*draft` | `*draft-mcp` | Story creation with database storage |
| `*validate-story` | `*validate-story-mcp` | Enhanced validation with cross-refs |
| `*create-prd` | `*create-prd-mcp` | Document creation with versioning |

## Data Migration

### Existing Stories

**Option 1: Import Existing Stories (Manual)**

For each existing story file:

1. **Load story in SM agent**:
   ```
   @sm
   *draft-mcp
   ```

2. **Recreate using story file data**:
   - Copy title, description, acceptance criteria
   - Use bmad_create_story tool
   - Mark as appropriate status

**Option 2: Continue File-Based (Recommended during transition)**

- Keep using existing story files
- New stories use MCP enhanced workflow
- Gradually migrate as stories are updated

### Existing Documents

**PRD Migration:**

1. **Access existing PRD**:
   ```
   @pm
   *create-prd-mcp
   ```

2. **Import content**:
   - Load existing docs/prd.md content
   - Use MCP document creation workflow
   - Save to both MCP database and file system

**Architecture Migration:**

1. **Create MCP architecture document**:
   ```
   @architect  
   # Use create-doc-mcp.md task with architecture template
   ```

2. **Import existing architecture**:
   - Reference existing docs/architecture.md
   - Create structured MCP version
   - Maintain file-based backup

## Testing Migration

### Verify MCP Setup

```bash
# Test MCP server
node tools/mcp-server/test-mcp.js

# Expected output:
# ✅ All MCP tests passed!
# 🎉 BMAD MCP Server is working correctly!
```

### Test Basic Operations

1. **Create Test Epic**:
   ```javascript
   // Use bmad_create_epic tool
   {
     "epic_num": 999,
     "title": "MCP Test Epic", 
     "description": "Testing MCP functionality"
   }
   ```

2. **Create Test Story**:
   ```javascript
   // Use bmad_create_story tool
   {
     "epic_num": 999,
     "title": "MCP Test Story",
     "description": "Testing story creation with MCP",
     "assignee": "dev"
   }
   ```

3. **Query Data**:
   ```javascript
   // Use bmad_query_tasks tool
   {"epic_num": 999}
   ```

4. **Check Progress**:
   ```javascript
   // Use bmad_get_project_progress tool
   {}
   ```

## Troubleshooting

### Common Issues

**MCP Server Won't Start**

```bash
# Check Node.js version
node --version  # Should be 20.0.0+

# Check BMAD version  
npx bmad-method --version  # Should be 4.33.1+

# Check dependencies
npm ls @modelcontextprotocol/sdk
```

**Database Issues**

```bash
# Check database file
ls -la .bmad/project.db

# Reset database (⚠️ loses MCP data)
rm .bmad/project.db
npx bmad-method bmad-mcp-server  # Will recreate
```

**Agent Commands Not Working**

1. **Check MCP config**:
   ```yaml
   # In core-config.yaml
   mcp:
     enabled: true  # Must be true
   ```

2. **Verify agent has MCP tasks**:
   ```
   @sm
   *help  # Should show both traditional and MCP commands
   ```

**File vs MCP Conflicts**

```yaml
# Enable fallback during migration
mcp:
  features:
    fallbackToFiles: true
```

### Recovery Procedures

**Revert to File-Based Only**

```yaml
# Disable MCP in core-config.yaml
mcp:
  enabled: false
```

**Backup MCP Data**

```bash
# Backup database
cp .bmad/project.db .bmad/project.db.backup

# Export to JSON (future feature)
# npx bmad-method export-mcp-data
```

## Migration Checklist

### Pre-Migration

- [ ] Backup existing project files
- [ ] Update BMAD to version 4.33.1+
- [ ] Verify Node.js 20.0.0+
- [ ] Test MCP server startup

### During Migration

- [ ] Add MCP config to core-config.yaml
- [ ] Enable fallback mode
- [ ] Test MCP server functionality
- [ ] Try MCP-enhanced commands
- [ ] Verify existing commands still work

### Post-Migration

- [ ] Import key documents to MCP
- [ ] Train team on new MCP commands
- [ ] Monitor performance and stability
- [ ] Gradually disable fallback mode
- [ ] Update project documentation

## Benefits After Migration

### For Teams

- **Real-time Progress**: Live visibility into story and epic completion
- **No File Conflicts**: Database handles concurrent access safely
- **Audit Trail**: Complete history of who changed what and when
- **Cross-References**: Automatic linking between documents and stories

### For Agents

- **Shared Context**: All agents access same structured data
- **Dependency Tracking**: Automatic detection of story dependencies
- **Progress Monitoring**: Real-time status updates across sessions
- **Enhanced Validation**: Cross-reference validation against architecture

### For Projects

- **Data Integrity**: Structured storage prevents inconsistencies
- **Reporting**: Built-in progress and completion metrics
- **Scalability**: Handles larger projects with better performance
- **Integration**: Foundation for future AI workflow enhancements

## Best Practices

### During Migration

1. **Start Small**: Test with new epics/stories first
2. **Keep Backups**: Maintain file-based copies during transition
3. **Train Gradually**: Introduce MCP commands one agent at a time
4. **Monitor Performance**: Watch for any slowdowns or issues

### After Migration

1. **Use MCP Commands**: Prefer *-mcp versions of commands
2. **Regular Backups**: Backup .bmad/project.db regularly
3. **Monitor Storage**: Check database size growth
4. **Update Documentation**: Keep project docs current with MCP features

## Support

### Getting Help

- **GitHub Issues**: [bmad-method/issues](https://github.com/bmadcode/BMAD-METHOD/issues)
- **Documentation**: Check `/tools/mcp-server/README.md`
- **Test Suite**: Run `node tools/mcp-server/test-mcp.js`

### Reporting Issues

Include in bug reports:
- BMAD version (`npx bmad-method --version`)
- Node.js version (`node --version`)
- MCP server logs (`.ai/mcp-debug.log` if enabled)
- core-config.yaml MCP section
- Steps to reproduce issue

---

**Ready to enhance your BMAD workflow with MCP?** Start with the gradual migration path and enjoy the benefits of structured data management and real-time progress tracking!