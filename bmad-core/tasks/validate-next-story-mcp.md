# Validate Next Story Task (MCP Enhanced)

## Purpose

Enhanced story validation using MCP tools for data access and cross-referencing. This task validates story completeness and readiness using structured data from the MCP server while providing fallback to file-based validation.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Check MCP Availability and Load Context

**MCP Availability Check:**
Ask the user if they have MCP tools available. If they respond yes, use MCP workflow. If no, inform user that MCP server is required for validation.

**MCP-Enhanced Context Loading:**
1. Use `bmad://project/info` resource to get project configuration
2. Use `bmad_query_tasks` to identify the story to validate
3. Access story details from MCP database if available

### 1. Story Identification and Loading

**MCP-Enhanced Approach:**

1. **Story Selection:** If story ID not provided, use `bmad_query_tasks` to list recent stories:
   - Query: `{"status": "TODO", "assignee": "dev"}` - Get dev-assigned stories
   - Present list to user for selection

2. **Story Details:** Load story from MCP database:
   - Get complete story details including title, description, tasks
   - Access any metadata and creation context
   - Check story status and assignment

**Example Queries:**
- `bmad_query_tasks`: `{"id": "<story_id>"}` - Get specific story details
- `bmad_query_tasks`: `{"epic_num": 1, "story_num": 2}` - Get story by epic/story number

### 2. Template Completeness Validation

**MCP-Enhanced Validation:**

1. **Template Access:** Load story template from file system (template still file-based)
2. **Story Structure:** Validate story contains all required sections
3. **Database Consistency:** Verify story data in database matches expected structure

**Validation Points:**
- Check story has title, description, acceptance criteria
- Verify tasks/subtasks are properly structured  
- Ensure metadata fields are populated correctly
- Validate status tracking fields exist

### 3. Context and Dependency Validation  

**MCP-Enhanced Context Access:**

1. **Epic Context:** Use `bmad://epics/<epic_num>/tasks` to get epic context:
   - Verify story fits within epic scope
   - Check dependencies on other stories in epic
   - Validate epic requirements coverage

2. **Architecture Alignment:** Use `bmad://project/architecture` resource:
   - Verify technical approaches align with architecture
   - Check component and file path specifications
   - Validate integration patterns

3. **PRD Alignment:** Use `bmad://project/prd` resource:
   - Ensure story requirements match PRD specifications
   - Verify functional requirements coverage
   - Check business value alignment

**Example Resource Access:**
- Access `bmad://epics/1/tasks` - Get all tasks in Epic 1 for dependency analysis
- Access `bmad://project/architecture` - Validate technical specifications
- Access `bmad://project/prd` - Cross-reference business requirements

### 4. Implementation Readiness Assessment

**MCP-Enhanced Readiness Checks:**

1. **Previous Story Analysis:** Use `bmad_query_tasks` to check story sequence:
   - Query: `{"epic_num": <epic>, "status": "DONE"}` - Get completed stories
   - Verify dependencies are satisfied
   - Check if prerequisite stories are complete

2. **Resource Availability:** Check if all referenced resources exist:
   - Verify architecture documents are accessible
   - Confirm PRD sections are available
   - Validate template and configuration files

3. **Task Granularity:** Analyze story tasks for implementability:
   - Check task clarity and actionability
   - Verify technical specifications completeness
   - Assess testing requirements coverage

### 5. Anti-Hallucination Verification

**MCP-Enhanced Source Verification:**

1. **Architecture Cross-Reference:** Compare story details against architecture:
   - Use `bmad://project/architecture` to verify technical claims
   - Check file paths and component specifications
   - Validate API and database references

2. **PRD Requirements Mapping:** Verify requirements traceability:
   - Use `bmad://project/prd` to confirm requirement coverage
   - Check acceptance criteria alignment
   - Validate business logic specifications

3. **Epic Consistency:** Use epic tasks to check consistency:
   - Compare similar stories for pattern consistency
   - Verify naming conventions and approaches
   - Check for contradictions with previous implementations

### 6. Quality and Completeness Assessment

**MCP-Enhanced Quality Checks:**

1. **Progress Context:** Use `bmad://project/progress` to assess project context:
   - Check overall project completion status
   - Understand current velocity and capacity
   - Assess story complexity relative to progress

2. **Epic Progress:** Use `bmad://epics/<epic_num>/progress`:
   - Verify story fits epic timeline
   - Check epic completion percentage
   - Assess story priority and sequencing

### 7. Generate Validation Report

**MCP-Enhanced Reporting:**

Provide a structured validation report with MCP data integration:

#### MCP Data Summary
- **Story ID**: Database ID and epic.story number
- **Creation Date**: When story was created
- **Current Status**: TODO/IN_PROGRESS/etc.
- **Epic Context**: Progress and related stories
- **Project Context**: Overall progress percentage

#### Template Compliance Issues
- Missing required fields in database record
- Incomplete story structure or metadata
- Missing task definitions or acceptance criteria

#### Critical Issues (Must Fix - Story Blocked)
- **Architecture Misalignment**: Technical details contradicting architecture docs
- **Missing Dependencies**: Required previous stories not completed
- **Resource Unavailability**: Referenced documents or configurations missing
- **Incomplete Requirements**: Essential details missing from PRD cross-reference

#### Should-Fix Issues (Important Quality Improvements)
- **Context Gaps**: Missing technical context from architecture
- **Testing Inadequacy**: Insufficient test specification
- **Task Sequencing**: Suboptimal implementation order
- **Documentation Gaps**: Missing references or explanations

#### Anti-Hallucination Findings
- **Unverified Claims**: Technical details not found in architecture docs
- **PRD Misalignment**: Requirements not matching PRD specifications  
- **Inconsistent Patterns**: Approaches differing from similar completed stories
- **Missing Source References**: Claims without traceable sources

#### MCP Data Insights
- **Epic Progress**: X% complete, Y stories remaining
- **Project Velocity**: Average completion time based on historical data
- **Dependency Status**: All prerequisite stories completed/blocked
- **Resource Availability**: All required documents accessible

#### Final Assessment
- **GO/NO-GO**: Implementation readiness decision
- **Implementation Readiness Score**: 1-10 based on MCP data analysis
- **Confidence Level**: High/Medium/Low with supporting MCP evidence
- **Recommended Actions**: Specific fixes based on MCP data analysis

## Enhanced Benefits

### Real-Time Context
- **Live Progress**: Access current project and epic status
- **Dependency Tracking**: Real-time status of prerequisite stories
- **Resource Validation**: Immediate verification of document availability

### Data-Driven Insights  
- **Pattern Analysis**: Compare against similar completed stories
- **Velocity Prediction**: Estimate implementation effort based on history
- **Quality Metrics**: Track validation patterns and success rates

### Comprehensive Cross-Reference
- **Architecture Alignment**: Automated cross-checking with architecture docs
- **Requirements Traceability**: Direct PRD requirement mapping
- **Epic Consistency**: Validation against epic context and progress

## MCP Requirements

If MCP tools are unavailable:
1. Display error: "MCP tools required for story validation"
2. Inform user that MCP server setup is needed for proper validation
3. Provide instructions for enabling MCP server
4. Do not proceed without MCP tools

This ensures comprehensive story validation through the MCP database.