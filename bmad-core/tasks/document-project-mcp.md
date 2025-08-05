# Document Project Task (MCP Enhanced)

## Purpose

MCP-enhanced project documentation with real-time data integration, automated cross-referencing, and comprehensive project state capture using structured MCP queries.

## SEQUENTIAL Task Execution

### 0. MCP Availability and Project State Analysis

**MCP Availability Check:**
- Verify MCP tools are available for comprehensive project analysis
- If MCP unavailable, fall back to manual documentation with warning
- If MCP available, use enhanced workflow with real-time data integration

**Project State Baseline:**
1. Use `bmad_get_project_progress` to capture current project status
2. Use `bmad_query_epics` to document all epics and their status
3. Use `bmad_query_tasks` to analyze story completion patterns
4. Use `bmad_get_current_sprint` to document active sprint context

### 1. Comprehensive Project Documentation Generation

**MCP-Enhanced Project Documentation:**

1. **Project Overview Section:**
   ```markdown
   # Project Documentation - ${project_name}
   
   ## Project Status (Real-Time MCP Data)
   - **Overall Completion**: ${completion_percentage}%
   - **Total Epics**: ${epic_count}
   - **Total Stories**: ${story_count}
   - **Active Sprint**: ${current_sprint_name}
   - **Documentation Date**: ${current_date}
   
   ## Epic Status Summary
   ${epic_status_table_from_mcp}
   
   ## Recent Progress
   ${recent_activity_from_mcp_data}
   ```

2. **Store Project Documentation:** Use `bmad_create_document`:
   ```json
   {
     "type": "project-documentation",
     "title": "Project Documentation - ${project_name}",
     "content": "<comprehensive_project_docs_markdown>",
     "metadata": {
       "documentation_date": "${date}",
       "project_completion": ${completion_percentage},
       "epic_count": ${epic_count},
       "story_count": ${story_count}
     }
   }
   ```

### 2. Automated Cross-Reference Generation

**MCP-Enhanced Cross-Referencing:**

1. **Link Documentation to All Project Entities:**
   - Link to all epics via `bmad_link_entity_to_document`
   - Reference key stories and milestones
   - Connect to architectural decisions and technical documentation

2. **Generate Entity Relationship Map:**
   - Epic to story mappings from MCP data
   - Document to entity relationship matrix
   - Progress tracking cross-references

## MCP Tools Reference

### Required Tools:
- `bmad_get_project_progress` - Real-time project status
- `bmad_query_epics` - Epic documentation and status
- `bmad_query_tasks` - Story analysis and completion tracking
- `bmad_create_document` - Store comprehensive documentation
- `bmad_link_entity_to_document` - Cross-reference project entities

This MCP-enhanced approach provides living project documentation that stays current with real project data and maintains comprehensive cross-references to all project entities.