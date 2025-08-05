# Create Next Story Task (MCP Enhanced)

## Purpose

Enhanced story creation using MCP tools for structured data management and querying. This task uses MCP tools to track project state and provides real-time insights into story progress.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Check MCP Availability and Sprint Status

**MCP Availability Check:**
- Check if MCP tools are available for the current project
- If MCP unavailable, fall back to file-based operation with warning
- If MCP available, use MCP tools for enhanced workflow

**CRITICAL: Sprint Requirement Check:**
1. Use `bmad_get_current_sprint` to verify active sprint exists:
   - If NO active sprint: **STOP** and display error:
     ```
     ❌ ERROR: No Active Sprint Found
     
     Story creation requires an active sprint with defined goals.
     
     Next Steps:
     1. Run *start-sprint command to create a new sprint
     2. Define sprint goal and target stories
     3. Then return to create individual stories
     
     Reason: All stories must align with sprint goals for proper tracking.
     ```
   - If active sprint exists: Continue with story creation

2. Display current sprint context:
   ```
   🏃 Current Sprint: ${sprint_name}
   📅 Sprint Goal: ${sprint_goal}
   ⏰ Sprint Timeline: ${start_date} to ${end_date}
   📊 Sprint Progress: ${completed_stories}/${total_stories} stories
   ```

### 1. Identify Next Story for Preparation

#### 1.1 Query Tasks for Current Story Status

**MCP-Enhanced Approach:**

1. Use MCP tool `bmad_query_tasks` to check for incomplete tasks:
   - Query all tasks with status "TODO" or "IN_PROGRESS" 
   - If incomplete tasks found, alert user and ask to proceed or fix first
   - Use `bmad_get_project_progress` to get overview

2. Determine which epic to work on:
   - Ask user which epic number they want to work on
   - Use `bmad_query_tasks` with epic filter to see existing stories
   - Calculate next story number based on highest existing story in that epic

3. Interactive decision making:
   - If incomplete story found: Ask user "Fix this story first, or accept risk & override to create next?"
   - If proceeding: Select next sequential story in the current epic

**Example MCP Tool Usage:**
- `bmad_query_tasks`: `{"status": "TODO"}` - Get incomplete tasks
- `bmad_query_tasks`: `{"epic_num": 1}` - Get all stories in Epic 1  
- `bmad_get_project_progress`: `{}` - Get overall project status

**MCP Requirement:**
If MCP tools unavailable, inform user that MCP server is required for story creation

### 2. Gather Requirements and Context

#### 2.1 Retrieve Epic and Architecture Information

**MCP-Enhanced Approach:**

1. **Access PRD and Architecture:** Use MCP resources to get context documents:
   - `bmad://project/prd` - Get Product Requirements Document
   - `bmad://project/architecture` - Get System Architecture Document  
   - `bmad://project/info` - Get project metadata and overview

2. **Epic Information:** Look for epic documents or extract epic context from PRD:
   - Read relevant sections of PRD that correspond to the target epic
   - Extract epic-specific requirements and acceptance criteria

**Example MCP Resource Usage:**
- Access `bmad://project/prd` to read the full PRD
- Access `bmad://project/architecture` to read architecture constraints
- Access `bmad://project/info` to understand project structure

#### 2.2 Analyze Previous Story Context

**MCP-Enhanced Approach:**

1. **Get Completed Stories:** Use `bmad_query_tasks` to analyze previous work:
   - Query: `{"epic_num": <current_epic>, "status": "DONE"}` 
   - Review last completed story for implementation patterns
   - Extract lessons learned and technical decisions

2. **Epic Progress Analysis:** Use `bmad://epics/<epic_num>/progress` resource:
   - Get completion percentage and remaining work
   - Understand what components are already built
   - Identify dependencies and integration points

**Example Queries:**
- `bmad_query_tasks`: `{"epic_num": 1, "status": "DONE"}` - Get completed stories in Epic 1
- Access `bmad://epics/1/tasks` - Get all tasks in Epic 1
- Access `bmad://epics/1/progress` - Get Epic 1 progress statistics

### 3. Create Story with Enhanced Context

#### 3.1 Gather Story Information

**Interactive Story Creation Process:**

1. **Story Title:** Ask user for story title:
   ```
   Story ${currentEpicNum}.${nextStoryNum} title:
   ```

2. **Story Description:** Ask user for detailed description including:
   - User story format: "As a [user], I want [goal] so that [benefit]"
   - Acceptance criteria
   - Any special requirements or constraints

3. **Story Metadata:** Collect story properties:
   - Priority: High/Medium/Low  
   - Assignee: Usually 'dev'
   - Estimated hours (optional)

#### 3.2 Create Story Task via MCP Tools

**MCP Tool Usage:**

1. **Create the Story:** Use `bmad_create_story` tool:
   ```json
   {
     "epic_num": <current_epic_num>,
     "title": "<story_title>", 
     "description": "<detailed_description>",
     "assignee": "dev",
     "priority": "<HIGH/MEDIUM/LOW>"
   }
   ```

2. **Verify Creation:** Use `bmad_query_tasks` to confirm story was created:
   ```json
   {
     "epic_num": <current_epic_num>,
     "story_num": <next_story_num>
   }
   ```

**Enhanced Context Integration:**
- Include relevant PRD sections in description
- Reference architecture constraints and patterns
- Note dependencies on previous stories
- Add technical notes from architecture analysis

### 4. Generate Story Document (Optional)

**File-Based Compatibility:**

If your project still uses file-based story management, you can optionally create a markdown file using the story template:

1. Load `story-tmpl.yaml` template from templates directory
2. Populate with story data from MCP database  
3. Save to configured `devStoryLocation`

**Template Variables:**
- `epic_num`, `story_num`, `title`, `description`
- `status`, `assignee`, `priority`
- `acceptance_criteria`, `technical_notes`
- `created_date`

### 5. Update Sprint Planning (If Applicable)

**Sprint Management via MCP:**

1. **Check Active Sprint:** No specific MCP resource for sprints yet, but you can:
   - Ask user if there's an active sprint
   - If yes, note the sprint name for documentation

2. **Story Assignment:** The story is already created in TODO status and ready for dev assignment

3. **Capacity Planning:** Use project progress data to understand current workload

### 6. Summary and Next Steps

**Progress Summary via MCP Resources:**

1. **Display Story Creation Results:**
   - Show created story: `Epic ${epic_num}.${story_num} - ${title}`
   - Display task ID and status
   - Show assignee and priority

2. **Epic Progress Overview:** Use `bmad://epics/${epic_num}/progress` resource:
   - Show total stories in epic
   - Display completion percentage  
   - List remaining work

3. **Project Overview:** Use `bmad://project/progress` resource:
   - Show overall project completion
   - Display task breakdown by status

**Next Steps:**
1. Review story details with stakeholders  
2. Assign to development agent for implementation
3. Begin development workflow
4. Track progress via MCP tools

## Enhanced Benefits

### Real-time Insights
- **Progress tracking**: Use `bmad://project/progress` for live completion percentages
- **Dependency awareness**: Use `bmad_query_tasks` to see blocked or in-progress stories  
- **Resource allocation**: See which agents are working on what via task assignments

### Data Consistency  
- **Structured storage**: SQLite database handles data integrity
- **Audit trail**: Track who created/modified what and when via MCP tools
- **Status synchronization**: Real-time status updates via `bmad_update_task_status`

### Intelligent Planning
- **Context awareness**: Access PRD and architecture via MCP resources
- **Progress insights**: Epic and project progress via MCP resources  
- **Task management**: Structured task creation and querying via MCP tools

## MCP Tools Reference

### Available Tools:
- `bmad_create_story` - Create new story/task
- `bmad_update_task_status` - Update task status/assignee
- `bmad_create_epic` - Create new epic  
- `bmad_query_tasks` - Query tasks with filters
- `bmad_get_project_progress` - Get project statistics
- `bmad_create_document` - Create/update documents

### Available Resources:
- `bmad://project/info` - Project metadata
- `bmad://project/progress` - Real-time progress stats
- `bmad://project/prd` - Product Requirements Document
- `bmad://project/architecture` - System Architecture
- `bmad://tasks/all` - All tasks
- `bmad://tasks/todo` - TODO tasks  
- `bmad://tasks/in-progress` - Active tasks
- `bmad://epics/<num>/tasks` - Tasks in specific epic
- `bmad://epics/<num>/progress` - Epic progress stats

## MCP Requirements

If MCP tools are unavailable:
1. Display error: "MCP tools required for story creation"
2. Inform user that MCP server setup is needed for enhanced story management
3. Provide instructions for enabling MCP server
4. Do not proceed without MCP tools

This ensures proper story tracking and management through the MCP database.