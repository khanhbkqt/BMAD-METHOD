# Create Brownfield Story Task (MCP Enhanced)

## Purpose

Create a single user story for very small brownfield enhancements using MCP tools for real-time project integration. This MCP-enhanced version provides automated story numbering, sprint assignment, and existing system context awareness.

## When to Use This Task

**Use this task when:**

- The enhancement can be completed in a single story
- No new architecture or significant design is required
- The change follows existing patterns exactly
- Integration is straightforward with minimal risk
- Change is isolated with clear boundaries

**Use brownfield-create-epic-mcp when:**

- The enhancement requires 2-3 coordinated stories
- Some design work is needed
- Multiple integration points are involved

**Use the full brownfield PRD/Architecture process when:**

- The enhancement requires multiple coordinated stories
- Architectural planning is needed
- Significant integration work is required

## SEQUENTIAL Task Execution

### 0. MCP Availability and Sprint Requirement Check

**MCP Availability Check:**
- Verify MCP tools are available for the current project
- If MCP unavailable, fall back to file-based operation with warning
- If MCP available, use enhanced workflow with real-time integration

**CRITICAL: Sprint Requirement Check:**
1. Use `bmad_get_current_sprint` to verify active sprint exists:
   - If NO active sprint: **STOP** and display error:
     ```
     ❌ ERROR: No Active Sprint Found
     
     Story creation requires an active sprint with defined goals.
     
     Next Steps:
     1. Run SM agent *start-sprint command to create a new sprint
     2. Define sprint goal and capacity
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

### 1. Quick Project Assessment (MCP Enhanced)

**Current System Context Using MCP:**

1. **Project State Analysis:** Use `bmad_get_project_progress`:
   - [ ] Current project completion status understood
   - [ ] Active areas of development identified
   - [ ] Recent story patterns and conventions noted

2. **Epic Context Discovery:** Use `bmad_query_epics`:
   - [ ] Available epics for story assignment identified
   - [ ] Epic priorities and focus areas understood
   - [ ] Epic numbering and naming conventions noted

3. **Existing Story Patterns:** Use `bmad_query_tasks`:
   - [ ] Recent story formats and structures reviewed
   - [ ] Technology stack patterns identified from existing stories
   - [ ] Integration approaches used in similar stories noted

**Interactive Change Scope Definition:**

```
Brownfield Story Definition:
1. What specific functionality needs to be added or modified?
2. Which existing components/files will be touched?
3. What existing patterns should this change follow?
4. What is the success criteria for this change?
5. Which epic should this story belong to?
```

### 2. Epic Selection and Story Numbering

**MCP-Enhanced Epic Assignment:**

1. **Epic Selection:** Use interactive selection from available epics:
   ```
   Available Epics for Story Assignment:
   [List from bmad_query_epics with completion status]
   
   Select Epic Number for this story: 
   (or type 'new' to create a new epic first)
   ```

2. **Story Number Generation:** Use `bmad_get_next_story_number`:
   - Get next available story number for selected epic
   - Ensure proper story sequencing
   - Validate no conflicts with existing stories

### 3. Story Creation via MCP Tools

**MCP-Enhanced Story Creation:**

1. **Story Data Collection:**

Interactive story definition following brownfield patterns:

```
Story Information Required:
- Epic Number: ${selected_epic_num}
- Story Number: ${next_story_num} (auto-generated)
- Story Title: ${concise_story_title}
- Story Description: ${detailed_description_with_acceptance_criteria}
- Assignee: [dev/qa/sm/pm - default: dev]
- Priority: [HIGH/MEDIUM/LOW - default: MEDIUM]
```

2. **Enhanced Story Description Template:**

```markdown
# Story ${epic_num}.${story_num}: ${story_title}

## Brownfield Context
**Existing System Integration**: ${integration_description}
**Technology Stack**: ${relevant_tech_stack}
**Existing Patterns**: ${patterns_to_follow}

## User Story
As a ${user_type}
I want ${functionality}
So that ${business_value}

## Acceptance Criteria
${detailed_acceptance_criteria}

## Implementation Notes
**Files/Components to Modify**: ${file_list}
**Integration Points**: ${integration_points}
**Testing Approach**: ${testing_strategy}

## Definition of Done
- [ ] Functionality implemented following existing patterns
- [ ] Integration with existing system verified
- [ ] Existing functionality unaffected
- [ ] Code follows project conventions
- [ ] Testing completed and passing
- [ ] Documentation updated if needed
```

3. **Create Story via MCP:** Use `bmad_create_story` tool:
   ```json
   {
     "epic_num": <epic_number>,
     "title": "<story_title>",
     "description": "<enhanced_story_description_markdown>",
     "assignee": "dev",
     "priority": "<priority_level>",
     "document_id": "<optional_linked_document>",
     "document_section": "<optional_section_reference>"
   }
   ```

4. **Auto-assign to Current Sprint:** Use `bmad_assign_story_to_sprint`:
   ```json
   {
     "task_id": "<created_story_id>",
     "sprint_id": "<current_sprint_id>"
   }
   ```

### 4. Story Validation and Enhancement

**MCP-Enhanced Story Validation:**

1. **Story Completeness Check:**
   - [ ] Story has clear acceptance criteria
   - [ ] Integration points are identified
   - [ ] Implementation approach is defined
   - [ ] Success criteria are measurable

2. **Brownfield Validation:**
   - [ ] Existing system impact is minimal and controlled
   - [ ] Story follows established patterns
   - [ ] Integration approach is low-risk
   - [ ] Change boundaries are well-defined

3. **Sprint Alignment Check:** Use current sprint context:
   - [ ] Story aligns with sprint goal
   - [ ] Story fits within sprint capacity
   - [ ] Story priority matches sprint focus

### 5. Story Documentation and Tracking

**Enhanced Story Documentation:**

1. **Story Context Capture:** Store additional brownfield context:
   - Existing system touchpoints
   - Integration requirements
   - Pattern compliance notes
   - Risk assessment summary

2. **Link to Related Documentation:** If relevant documents exist:
   ```json
   {
     "entity_type": "task",
     "entity_id": "<story_id>",
     "document_id": "<relevant_document_id>",
     "document_section": "<relevant_section>",
     "link_purpose": "implementation-reference"
   }
   ```

### 6. Story Handoff and Tracking Setup

**Story Handoff Summary:**

1. **Story Creation Confirmation:**
   ```
   ✅ BROWNFIELD STORY CREATED SUCCESSFULLY
   
   Story: E${epic_num}.${story_num} - ${story_title}
   Epic: ${epic_title}
   Sprint: ${current_sprint_name}
   Priority: ${priority}
   Assignee: ${assignee}
   
   Integration Points: ${integration_summary}
   ```

2. **Next Steps Guidance:**
   ```
   Next Actions:
   1. Story is assigned to current sprint: ${sprint_name}
   2. Story appears in task board for development
   3. Dev agent can validate and begin implementation
   4. Progress tracked via sprint dashboard
   ```

**Real-Time Tracking Setup:**

1. **Sprint Integration:** Story automatically appears in:
   - Current sprint task board
   - Sprint progress tracking
   - Epic completion metrics

2. **Progress Monitoring:** Story status updates via:
   - `bmad_update_task_status` for status changes
   - Sprint velocity tracking
   - Epic completion progress

## MCP Tools Reference

### Required Tools:
- `bmad_create_story` - Create story with automatic numbering
- `bmad_get_next_story_number` - Get next story number for epic
- `bmad_assign_story_to_sprint` - Assign story to current sprint
- `bmad_get_current_sprint` - Verify sprint context
- `bmad_query_epics` - Get available epics for assignment
- `bmad_query_tasks` - Review existing story patterns
- `bmad_get_project_progress` - Understand current project state

### Enhanced Resources:
- `bmad://sprints/current/tasks` - Current sprint stories
- `bmad://epics/<num>/tasks` - Stories within specific epic
- `bmad://project/progress` - Overall project completion status

## Critical Success Factors

1. **Sprint Context:** Story created within active sprint framework
2. **Epic Alignment:** Story properly assigned to relevant epic
3. **Integration Awareness:** Clear understanding of existing system touchpoints
4. **Pattern Compliance:** Story follows established project patterns
5. **Scope Control:** Story scope is focused and achievable in single development session

This MCP-enhanced approach ensures brownfield stories are properly integrated with project tracking, automatically assigned to sprints, and prepared for efficient development execution.