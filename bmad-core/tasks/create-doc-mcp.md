# Create Document from Template (MCP Enhanced)

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

This MCP-enhanced version provides structured document storage and tracking with interactive workflow requirements.

## MCP Availability Check

**Initial Setup:**
Ask the user if they have MCP tools available. If they respond yes, use MCP-enhanced workflow. If no, inform the user that MCP tools are required for this enhanced workflow.

## MCP-Enhanced Document Creation Flow

### 0. MCP Context Setup

**Project Context Loading:**
1. Use `bmad://project/info` resource to get project metadata
2. Check if project has existing documents of the same type
3. Use `bmad_create_document` tool for structured storage

### 1. Template Discovery and Document Planning

**Enhanced Template Selection:**
- Load template from traditional file system (templates still file-based)
- Use `bmad://project/info` to understand project context for template customization
- Check for existing similar documents via MCP resources

**Document Initialization:**
1. **Document Metadata Setup:**
   ```json
   {
     "type": "prd|architecture|epic|story",
     "title": "<document_title>",
     "status": "DRAFT",
     "version": "1.0"
   }
   ```

2. **MCP Document Creation:** Use `bmad_create_document` tool:
   ```json
   {
     "type": "<doc_type>",
     "title": "<document_title>", 
     "content": "<initial_content>",
     "status": "DRAFT"
   }
   ```

### 2. Interactive Section Processing

**Enhanced Section Workflow:**

**For Each Template Section:**

1. **Context Enhancement:** Before processing section, gather relevant context:
   - Use `bmad://project/prd` or `bmad://project/architecture` to reference existing docs
   - Use `bmad://project/progress` to understand current project state
   - Use `bmad_query_tasks` to understand implementation context

2. **Interactive Processing (Maintaining Original Requirements):**
   - Draft content using section instruction + MCP context
   - Present content + detailed rationale (including MCP insights)
   - **IF elicit: true** → MANDATORY 1-9 options format (unchanged from original)
   - Wait for user response and process feedback

3. **MCP Storage:** After each section is approved:
   - Update document content via `bmad_create_document` tool
   - Maintain version history and change tracking
   - Store section metadata for future reference

### 3. Enhanced Rationale with MCP Insights

**When presenting section content, include:**

- **Traditional rationale** (trade-offs, assumptions, decisions)
- **Project context insights** from `bmad://project/info`
- **Cross-reference insights** from existing documents
- **Implementation readiness** based on current project progress
- **Dependency analysis** from task database

**Example Enhanced Rationale:**
```
SECTION: Product Overview
CONTENT: [Generated content]

RATIONALE:
- Trade-offs: Chose mobile-first approach over desktop due to user research
- Assumptions: Assuming React/Node.js stack based on project architecture
- MCP Insights: Project is 45% complete with 3 active epics in progress
- Cross-references: Aligns with existing architecture document section 3.2
- Dependencies: No blocking tasks for this feature scope

[Standard 1-9 elicitation options...]
```

### 4. Document Completion and Storage

**MCP-Enhanced Completion:**

1. **Final Document Assembly:**
   - Compile all sections into complete document
   - Update document status from DRAFT to FINAL
   - Store complete document via `bmad_create_document`

2. **Cross-Reference Updates:**
   - Link to related documents in project database
   - Update project metadata if this is a primary document (PRD/Architecture)
   - Create any necessary epic records if document defines epics

3. **File System Sync:** 
   - Save document to traditional file location for backwards compatibility
   - Maintain both MCP database and file system versions

### 5. Project Integration

**Enhanced Project Workflow:**

**For PRD Documents:**
1. Use `bmad_create_document` with type="prd"
2. Extract and create epic records using `bmad_create_epic`
3. Update project metadata to reference new PRD

**For Architecture Documents:**
1. Use `bmad_create_document` with type="architecture" 
2. Update project technical constraints and specifications
3. Link to relevant epics and stories for implementation tracking

**For Epic/Story Documents:**
1. Create structured epic/story records in database
2. Link to parent PRD or requirements documents
3. Enable tracking and progress monitoring

### 6. Enhanced Benefits

**MCP Integration Advantages:**

1. **Document Versioning:** Automatic version tracking and history
2. **Cross-Reference Integrity:** Links between documents maintained automatically
3. **Progress Tracking:** Document creation integrated with project progress
4. **Search and Discovery:** Documents accessible via MCP resources
5. **Collaborative Updates:** Multiple agents can reference and update documents

**Real-Time Context:**
- **Live Progress Data:** Access current sprint/epic progress during document creation
- **Implementation Feedback:** Reference actual development progress when planning
- **Resource Availability:** Check what components/features already exist

## Elicitation with MCP Context

**Enhanced Elicitation Methods:**

When user selects elicitation options 2-9, enhance with MCP data:

- **Stakeholder Analysis:** Include current project stakeholders from MCP
- **Risk Assessment:** Factor in current project risks and blockers from task database
- **Feasibility Check:** Cross-reference with current architecture and capabilities
- **Impact Analysis:** Consider effects on existing epics and stories
- **Timeline Estimation:** Use historical project data for realistic planning

## Fallback Strategy

**If MCP tools unavailable:**
1. Display warning: "MCP tools not available, document creation requires MCP server"
2. Inform user that MCP server setup is required for document management
3. Provide instructions for enabling MCP server
4. Do not proceed without MCP tools

**MCP Requirements:**
- All documents created in MCP database with optional file export
- MCP server must be running for enhanced document management
- Enhanced features require MCP integration

## CRITICAL WORKFLOW REQUIREMENTS

**Core workflow requirements:**

1. **MANDATORY ELICITATION FORMAT** - 1-9 numbered options when elicit=true
2. **NO SHORTCUTS** - Full user interaction required for elicit sections
3. **SEQUENTIAL PROCESSING** - Each section processed step-by-step
4. **DETAILED RATIONALE** - Explain all trade-offs and decisions

**MCP enhancements supplement but do not replace these core requirements.**

## MCP Tools Reference

**Available for Document Creation:**
- `bmad_create_document` - Store documents in database
- `bmad_create_epic` - Create epic records from PRD
- `bmad://project/info` - Access project context
- `bmad://project/prd` - Reference existing PRD
- `bmad://project/architecture` - Reference existing architecture
- `bmad://project/progress` - Get current project status