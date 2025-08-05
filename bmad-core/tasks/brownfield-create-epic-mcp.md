# Create Brownfield Epic Task (MCP Enhanced)

## Purpose

Create a single epic for smaller brownfield enhancements using MCP tools for structured data management. This MCP-enhanced version provides real-time epic tracking, validation, and integration with existing project data.

## When to Use This Task

**Use this task when:**

- The enhancement can be completed in 1-3 stories
- No significant architectural changes are required
- The enhancement follows existing project patterns
- Integration complexity is minimal
- Risk to existing system is low

**Use the full brownfield PRD/Architecture process when:**

- The enhancement requires multiple coordinated stories
- Architectural planning is needed
- Significant integration work is required
- Risk assessment and mitigation planning is necessary

## SEQUENTIAL Task Execution

### 0. MCP Availability and Project State Check

**MCP Availability Check:**
- Verify MCP tools are available for the current project
- If MCP unavailable, fall back to file-based operation with warning
- If MCP available, use enhanced workflow with real-time data

**Project State Analysis:**
1. Use `bmad_get_project_progress` to understand current project state:
   - Review existing epics and their completion status
   - Identify available epic numbers for new epic
   - Assess project capacity and priorities

2. Use `bmad_query_epics` to get existing epic context:
   - Review naming patterns and conventions
   - Understand current epic scope and focus areas
   - Validate that new epic doesn't duplicate existing work

### 1. Project Analysis (MCP Enhanced)

**Existing Project Context Using MCP:**

1. **Project Overview:** Use `bmad_get_project_progress` to gather:
   - [ ] Project completion status and current focus
   - [ ] Active sprints and their goals
   - [ ] Recent epic completion patterns

2. **Technology Stack Discovery:** Use `bmad_query_tasks` to identify:
   - [ ] Current technology patterns from existing stories
   - [ ] Integration points mentioned in completed tasks
   - [ ] Development patterns and conventions

3. **Architecture Assessment:** Use existing documentation:
   - [ ] Review linked architecture documents via MCP
   - [ ] Identify current system boundaries and interfaces
   - [ ] Note existing integration patterns

**Enhancement Scope Definition:**

Interactive elicitation for enhancement details:

```
Enhancement Definition:
1. What specific functionality needs to be added or modified?
2. How does this enhancement integrate with existing features?
3. What existing components/services will be affected?
4. What are the success criteria for this enhancement?
```

### 2. Epic Creation via MCP Tools

**MCP-Enhanced Epic Creation:**

1. **Epic Number Selection:** Use `bmad_query_epics` to determine:
   - Next available epic number
   - Naming conventions to follow
   - Epic numbering sequence

2. **Epic Data Collection:**

Interactive epic definition:

```
Epic Information Required:
- Epic Number: [Next available from MCP query]
- Epic Title: [Enhancement name] - Brownfield Enhancement
- Description: [Detailed enhancement description]
- Priority: [HIGH/MEDIUM/LOW based on business impact]
- Estimated Stories: [1-3 stories for brownfield scope]
```

3. **Create Epic via MCP:** Use `bmad_create_epic` tool:
   ```json
   {
     "epic_num": <next_epic_number>,
     "title": "<enhancement_name> - Brownfield Enhancement",
     "description": "<detailed_description_with_scope>",
     "priority": "<priority_level>",
     "metadata": {
       "type": "brownfield",
       "estimated_stories": <story_count>,
       "integration_complexity": "low",
       "architectural_impact": "minimal"
     }
   }
   ```

4. **Verify Epic Creation:** Use `bmad_query_epics` to confirm:
   - Epic was created with correct number and title
   - Epic appears in project epic list
   - Epic metadata is properly stored

### 3. Epic Documentation and Context

**Enhanced Epic Documentation:**

1. **Epic Context Document:** Create comprehensive epic documentation:

```markdown
# Epic ${epic_num}: ${epic_title}

## Enhancement Overview
${detailed_description}

## Brownfield Context
- **Existing System Integration**: ${integration_points}
- **Technology Stack Alignment**: ${tech_stack_notes}
- **Risk Assessment**: Low - isolated enhancement
- **Estimated Complexity**: ${complexity_assessment}

## Success Criteria
${success_criteria_list}

## Estimated Story Breakdown
${story_breakdown_estimate}

## Integration Requirements
${integration_requirements}

## Acceptance Criteria
${epic_acceptance_criteria}
```

2. **Store Epic Documentation:** Use `bmad_create_document` to save:
   ```json
   {
     "type": "epic-specification",
     "title": "Epic ${epic_num} Specification - ${epic_title}",
     "content": "<epic_documentation_markdown>",
     "metadata": {
       "epic_num": <epic_number>,
       "document_type": "brownfield-epic",
       "created_by": "pm"
     }
   }
   ```

3. **Link Epic to Documentation:** Use `bmad_link_entity_to_document`:
   ```json
   {
     "entity_type": "epic",
     "entity_id": "<epic_id>",
     "document_id": "<document_id>",
     "link_purpose": "specification"
   }
   ```

### 4. Sprint Integration and Planning

**Sprint-Aware Epic Planning:**

1. **Current Sprint Assessment:** Use `bmad_get_current_sprint`:
   - If active sprint exists: Assess if epic fits current sprint goals
   - If no active sprint: Note that sprint creation may be needed
   - If sprint full: Plan for next sprint inclusion

2. **Epic Prioritization:** Based on current project state:
   - Review other pending epics via `bmad_query_epics`
   - Assess relative priority and urgency
   - Determine optimal timing for epic execution

3. **Story Planning Preparation:**
   - Identify first story to be created from this epic
   - Prepare story breakdown for upcoming story creation
   - Set expectations for story complexity and dependencies

### 5. Epic Validation and Handoff

**Epic Validation:**

1. **Epic Completeness Check:**
   - [ ] Epic has clear scope and boundaries
   - [ ] Integration points are identified
   - [ ] Success criteria are measurable
   - [ ] Story breakdown is realistic

2. **Project Alignment Validation:**
   - [ ] Epic aligns with project goals
   - [ ] Epic doesn't conflict with existing work
   - [ ] Epic scope is appropriate for brownfield approach
   - [ ] Epic timeline fits project constraints

**Handoff to Story Creation:**

1. **Epic Summary Display:**
   ```
   ✅ BROWNFIELD EPIC CREATED SUCCESSFULLY
   
   Epic ${epic_num}: ${epic_title}
   Priority: ${priority}
   Estimated Stories: ${story_count}
   Integration Complexity: Low
   
   Success Criteria:
   ${success_criteria_summary}
   ```

2. **Next Steps Guidance:**
   ```
   Next Actions:
   1. Use SM agent *draft-mcp command to create first story
   2. Ensure active sprint exists for story assignment
   3. Begin development with focused scope
   4. Track epic progress via task board
   ```

### 6. Epic Progress Tracking Setup

**MCP-Enhanced Tracking:**

1. **Epic Metrics Definition:**
   - Story completion rate within epic
   - Epic goal achievement progress
   - Integration milestone tracking
   - Quality metrics for brownfield enhancement

2. **Progress Monitoring Setup:**
   - Epic appears in project progress reports
   - Story creation filtered by epic number
   - Epic completion tracking via MCP queries

## MCP Tools Reference

### Required Tools:
- `bmad_create_epic` - Create epic with metadata and tracking
- `bmad_query_epics` - Get existing epics and numbering
- `bmad_get_project_progress` - Understand current project state
- `bmad_create_document` - Store epic documentation
- `bmad_link_entity_to_document` - Connect epic to its documentation
- `bmad_get_current_sprint` - Check sprint context for planning

### Enhanced Resources:
- `bmad://project/epics` - All project epics and their status
- `bmad://epics/<num>/progress` - Specific epic progress tracking
- `bmad://epics/<num>/stories` - Stories associated with epic

## Critical Success Factors

1. **Clear Scope Definition:** Epic scope must be focused and achievable
2. **Integration Awareness:** Understanding of existing system touchpoints
3. **Risk Management:** Brownfield-appropriate risk assessment
4. **Story Readiness:** Clear preparation for story creation process
5. **Project Alignment:** Epic fits within overall project goals and timeline

This MCP-enhanced approach ensures that brownfield epics are properly tracked, integrated with existing project data, and set up for successful story development and completion.