# Create Sprint Task (MCP Enhanced)

## Purpose

Sprint-centric workflow enforcement that ensures all story development happens within the context of a defined sprint with clear goals and story targets. This task creates structured sprints that guide the entire development process.

## CRITICAL WORKFLOW RULE

**NO STORY CREATION WITHOUT ACTIVE SPRINT**: All story development must happen within an active sprint context. This ensures proper goal alignment and progress tracking.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Check MCP Availability and Current Sprint Status

**MCP Availability Check:**
- Verify MCP tools are available for the current project
- If MCP unavailable, warn user and suggest MCP setup
- If MCP available, proceed with enhanced workflow

**Current Sprint Check:**
1. Use `bmad_get_current_sprint` to check for active sprint:
   - If active sprint exists: Ask user if they want to continue current sprint or start new one
   - If continuing: Show current sprint details and exit this task
   - If starting new: Ask user to confirm closing current sprint first

2. Use `bmad_get_project_progress` to understand current state:
   - Show overall project completion
   - Display any incomplete tasks that should be addressed

### 1. Sprint Planning and Goal Definition

#### 1.1 Gather Sprint Information

**Interactive Sprint Creation Process:**

1. **Sprint Name:** Ask user for sprint name:
   ```
   Sprint name (e.g., "User Authentication Sprint", "Core Features Sprint"):
   ```

2. **Sprint Goal:** Ask user for clear, measurable sprint goal:
   ```
   Sprint Goal - What specific outcome should this sprint achieve?
   (Example: "Complete user authentication system with registration, login, and password reset")
   ```

3. **Sprint Duration:** Ask user for sprint timeframe:
   ```
   Sprint duration:
   1. 1 Week Sprint
   2. 2 Week Sprint  
   3. 3 Week Sprint
   4. Custom duration
   ```

4. **Target Stories:** Ask user to define which stories/epics to include:
   ```
   Which Epic(s) should this sprint focus on?
   Available Epics: [List from bmad_query_epics]
   
   Target Epic Number(s): (e.g., "1" or "1,2")
   ```

#### 1.2 Analyze Epic and Story Context

**MCP-Enhanced Context Gathering:**

1. **Get Epic Information:** Use MCP to understand epic scope:
   - `bmad_query_epics` - Get all available epics
   - For each target epic: Use `bmad://epics/<num>/tasks` to see existing stories
   - Use `bmad://epics/<num>/progress` to understand completion status

2. **Story Planning:** Help user define story targets:
   - Show existing stories in target epic(s)
   - Calculate how many new stories are needed
   - Estimate sprint capacity based on story complexity

3. **Dependencies Analysis:** Use `bmad_query_tasks` to check:
   - Any blocked or in-progress tasks that need completion
   - Dependencies between epics that might affect sprint scope

#### 1.3 Define Sprint Scope and Stories

**Sprint Story Planning:**

1. **Story List Creation:** Work with user to define specific stories for sprint:
   ```
   Sprint Stories Plan:
   Epic ${epic_num}.${next_story} - [Story Title]
   Epic ${epic_num}.${next_story+1} - [Story Title]
   ...
   
   Total Estimated Stories: X
   Sprint Capacity Check: Does this seem achievable in ${duration}?
   ```

2. **Acceptance Criteria for Sprint:** Define sprint success criteria:
   - Which stories must be DONE for sprint success
   - Which stories are stretch goals
   - What deliverables should be ready for demo

### 2. Create Sprint via MCP Tools

#### 2.1 Sprint Creation

**MCP Tool Usage:**

1. **Create the Sprint:** Use `bmad_create_sprint` tool:
   ```json
   {
     "name": "<sprint_name>",
     "goal": "<detailed_sprint_goal>", 
     "start_date": "<YYYY-MM-DD>",
     "end_date": "<YYYY-MM-DD>",
     "target_epics": [1, 2],
     "story_targets": ["E1.3", "E1.4", "E2.1"],
     "success_criteria": "<what defines sprint success>"
   }
   ```

2. **Verify Sprint Creation:** Use `bmad_get_current_sprint` to confirm:
   - Sprint was created successfully
   - Sprint status is ACTIVE
   - All metadata is correct

#### 2.2 Sprint Documentation

**Enhanced Sprint Record:**

1. **Sprint Planning Document:** Create comprehensive sprint plan:
   - Sprint goal and success criteria
   - Target epic(s) and story breakdown
   - Timeline and milestones
   - Risk assessment and mitigation

2. **Store via MCP:** Use `bmad_create_document` to save sprint plan:
   ```json
   {
     "type": "sprint-plan",
     "title": "Sprint ${sprint_num} Plan - ${sprint_name}",
     "content": "<detailed_sprint_plan_markdown>",
     "metadata": {
       "sprint_id": "<sprint_id>",
       "target_epics": [1, 2],
       "duration_weeks": 2
     }
   }
   ```

### 3. Initialize Sprint Backlog

#### 3.1 Story Preparation

**Sprint Backlog Setup:**

1. **Identify Existing Stories:** Use `bmad_query_tasks` to find stories in target epics:
   - Filter by epic numbers defined in sprint scope
   - Show current status of each story
   - Prioritize which stories to include in sprint backlog

2. **Mark Stories for Sprint:** For each story to include in sprint:
   - Use `bmad_update_task_status` to assign to current sprint
   - Set priority levels (HIGH/MEDIUM/LOW) based on sprint goals
   - Update assignee to appropriate agent (usually 'dev')

3. **Sprint Capacity Check:** Validate sprint scope:
   - Count total stories assigned to sprint
   - Estimate total effort based on story complexity
   - Confirm with user that scope is realistic

#### 3.2 Sprint Tracking Setup

**Progress Tracking Configuration:**

1. **Sprint Dashboard:** Set up sprint tracking:
   - Sprint goal and timeline visibility
   - Story completion tracking
   - Burndown/burnup chart preparation

2. **Sprint Metrics:** Define what to track:
   - Story completion rate
   - Sprint velocity (stories per week)
   - Goal achievement progress
   - Impediment tracking

### 4. Sprint Kickoff and Communication

#### 4.1 Sprint Summary

**Sprint Kickoff Information:**

1. **Display Sprint Details:**
   ```
   🏃 SPRINT CREATED SUCCESSFULLY 🏃
   
   Sprint: ${sprint_name}
   Goal: ${sprint_goal}
   Duration: ${start_date} to ${end_date}
   Target Epics: ${epic_list}
   
   Success Criteria:
   - ${criteria_1}  
   - ${criteria_2}
   
   Sprint Backlog: ${story_count} stories
   ${story_list}
   ```

2. **Next Steps Guidance:**
   ```
   ✅ Sprint is now ACTIVE
   ✅ Backlog is prepared  
   ✅ Stories are assigned
   
   Next Actions:
   1. Use *draft-mcp command to create detailed stories
   2. Begin development with dev agent
   3. Track progress via task board (sprint-filtered)
   4. Review sprint goal regularly
   ```

#### 4.2 Sprint Enforcement Rules

**Workflow Rules Activation:**

1. **Story Creation Rules:** From now on:
   - All new stories MUST be created within sprint context
   - Stories automatically assigned to current sprint
   - Story creation checks sprint capacity

2. **Sprint Boundary Enforcement:**
   - Task board shows only current sprint tasks
   - Progress tracking filtered to sprint scope
   - All agents aware of sprint context and goals

### 5. Integration with Story Creation

#### 5.1 Enhanced Story Creation Context

**Sprint-Aware Story Creation:**

When `create-next-story-mcp.md` is executed after sprint creation:

1. **Automatic Sprint Assignment:** New stories automatically get:
   - Current sprint ID assigned
   - Sprint goal context included in description
   - Priority aligned with sprint objectives

2. **Sprint Capacity Checks:** Before creating stories:
   - Check remaining sprint capacity
   - Warn if adding story might exceed sprint scope
   - Suggest moving to next sprint if current is full

3. **Goal Alignment Validation:** Each story gets:
   - Sprint goal context in story description
   - Acceptance criteria aligned with sprint success criteria
   - Clear connection to sprint deliverables

#### 5.2 Sprint Progress Integration

**Real-Time Sprint Tracking:**

1. **Sprint Dashboard Updates:** After sprint creation:
   - Task board filters to current sprint only
   - Progress charts show sprint-specific metrics
   - Goal achievement tracking activated

2. **Sprint-Aware Reporting:** All progress reports include:
   - Sprint timeline and goal progress
   - Story completion toward sprint success
   - Sprint velocity and burndown metrics

## Sprint Success Metrics

### Key Performance Indicators

1. **Goal Achievement:** Did sprint deliver on its stated goal?
2. **Story Completion:** What percentage of planned stories were completed?
3. **Sprint Velocity:** How many stories per week were completed?
4. **Quality Metrics:** Were stories completed to definition of done?

### Sprint Review Preparation

After sprint creation, prepare for sprint review:
1. Demo-ready deliverables from completed stories
2. Sprint goal achievement assessment  
3. Lessons learned and retrospective items
4. Input for next sprint planning

## MCP Tools Reference

### Required Tools:
- `bmad_create_sprint` - Create new sprint with goal and timeline
- `bmad_get_current_sprint` - Check for active sprint
- `bmad_update_task_status` - Assign stories to sprint
- `bmad_query_tasks` - Find stories for sprint backlog
- `bmad_query_epics` - Get epic information for sprint planning
- `bmad_create_document` - Store sprint plan documentation
- `bmad_get_project_progress` - Understand current project state

### Enhanced Resources:
- `bmad://sprints/current` - Current sprint details and progress
- `bmad://sprints/<id>/tasks` - Tasks assigned to specific sprint
- `bmad://sprints/<id>/progress` - Sprint-specific progress metrics
- `bmad://project/sprints` - All project sprints and history

## Critical Success Factors

1. **Clear Goal Definition:** Sprint goal must be specific and measurable
2. **Realistic Scope:** Sprint backlog must be achievable in timeframe
3. **Story Alignment:** All stories must contribute to sprint goal
4. **Team Commitment:** All agents understand and commit to sprint goal
5. **Progress Tracking:** Regular monitoring of sprint progress and goal achievement

This sprint-centric approach ensures that all development work is goal-oriented, time-boxed, and measurable, leading to more predictable and successful project outcomes.