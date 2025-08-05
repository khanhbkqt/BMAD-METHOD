# Correct Course Task (MCP Enhanced)

## Purpose

MCP-enhanced change management providing real-time project state analysis and structured artifact updates. This version uses MCP tools to analyze current project state, assess change impacts, and track implementation of corrective actions with full audit trails.

## When to Use This Task

**Use this task when:**
- Project scope or requirements have changed
- Sprint goals need adjustment due to new information
- Epic priorities need rebalancing
- Technical constraints require scope modifications
- Stakeholder feedback requires project direction changes

## SEQUENTIAL Task Execution

### 0. MCP Availability and Project State Analysis

**MCP Availability Check:**
- Verify MCP tools are available for comprehensive change analysis
- If MCP unavailable, fall back to file-based operation with warning
- If MCP available, use enhanced workflow with real-time data

**Current Project State Assessment:**
1. Use `bmad_get_project_progress` to understand baseline:
   - Overall project completion status
   - Current sprint progress and goals
   - Epic completion rates and priorities
   - Recent velocity and progress patterns

2. Use `bmad_get_current_sprint` to assess sprint context:
   - Active sprint goals and timeline
   - Sprint progress and remaining capacity
   - Sprint-specific change impact potential

### 1. Initial Setup & Mode Selection (MCP Enhanced)

**Change Trigger Documentation:**

1. **Change Context Capture:**
   ```
   Change Analysis Initiation:
   - Change Trigger: ${change_description}
   - Reported Impact: ${perceived_impact}
   - Urgency Level: [HIGH/MEDIUM/LOW]
   - Scope of Change: [Epic/Sprint/Project/Technical]
   ```

2. **MCP-Enhanced Context Gathering:**
   - Use `bmad_query_epics` to review all epics that might be affected
   - Use `bmad_query_tasks` to identify stories that could be impacted
   - Use document queries to gather relevant PRD/Architecture context

**Interaction Mode Selection:**

Ask user for preferred analysis approach:
```
Change Analysis Mode Selection:
1. **Incremental (Recommended)**: Work through each impact area step-by-step with real-time MCP data validation
2. **Comprehensive Analysis**: Conduct full change impact assessment using all MCP data, then present consolidated recommendations

Select mode [1-2]: 
```

### 2. Execute Change Impact Analysis (MCP Enhanced)

**Section 1: Change Context Analysis**

Using MCP tools for comprehensive analysis:

1. **Epic Impact Assessment:** Use `bmad_query_epics` to analyze:
   - Which epics are directly affected by the change
   - Epic priorities and their alignment with the change
   - Epic completion status and remaining work

2. **Story Impact Assessment:** Use `bmad_query_tasks` to identify:
   - Stories that directly implement affected functionality
   - Stories that have dependencies on changed components
   - In-progress stories that might need modification

3. **Sprint Impact Assessment:** Use `bmad_get_current_sprint` to evaluate:
   - How change affects current sprint goals
   - Sprint capacity implications of the change
   - Sprint timeline impacts and adjustment needs

**Section 2: Artifact Conflict Analysis**

1. **Document Impact Assessment:** Use document queries to review:
   - PRD sections that need updates due to the change
   - Architecture decisions that might be affected
   - Technical specifications requiring modification

2. **Dependency Analysis:** Use MCP queries to identify:
   - Task dependencies that might be broken
   - Epic sequencing that might need adjustment
   - Sprint planning that requires reconsideration

**Section 3: Solution Path Evaluation**

Interactive analysis of potential solutions:

```
Change Resolution Options:
1. **Scope Adjustment**: Modify existing epics/stories to accommodate change
2. **Priority Rebalancing**: Shift epic/story priorities to address change
3. **Sprint Reallocation**: Move stories between sprints to manage impact
4. **Technical Pivot**: Adjust technical approach while maintaining goals
5. **Scope Reduction**: Remove lower-priority items to accommodate change
6. **Timeline Extension**: Extend sprint/project timeline for proper implementation

Recommended Approach: [Based on MCP data analysis]
Rationale: [Data-driven reasoning from MCP queries]
```

### 3. Draft Proposed Changes (MCP Enhanced)

**MCP-Assisted Change Drafting:**

1. **Epic Modifications:**
   - Use MCP data to identify which epics need updates
   - Draft specific epic description/priority changes
   - Propose epic story reallocation if needed

2. **Story Updates:**
   - Identify stories needing modification via `bmad_query_tasks`
   - Draft updated story descriptions/acceptance criteria
   - Propose story priority/assignee changes

3. **Sprint Adjustments:**
   - Use current sprint data to propose story reassignments
   - Draft sprint goal modifications if needed
   - Propose sprint timeline adjustments

4. **Document Updates:**
   - Identify specific document sections needing changes
   - Draft updated content for affected documentation
   - Propose new documentation if required

### 4. Generate "Sprint Change Proposal" with MCP Validation

**MCP-Enhanced Change Proposal:**

1. **Change Proposal Document Creation:**

```markdown
# Sprint Change Proposal - ${change_date}

## Change Trigger Summary
**Change Description**: ${change_description}
**Impact Scope**: ${impact_scope}
**Urgency**: ${urgency_level}

## Current Project State (MCP Data)
**Overall Progress**: ${project_completion}%
**Active Sprint**: ${sprint_name} (${sprint_progress}% complete)
**Affected Epics**: ${affected_epic_list}
**Impacted Stories**: ${impacted_story_count}

## Impact Analysis
${detailed_impact_analysis_from_mcp_data}

## Proposed Changes

### Epic Modifications
${epic_changes_with_current_vs_proposed}

### Story Updates
${story_changes_with_current_vs_proposed}

### Sprint Adjustments
${sprint_changes_with_timeline_impact}

### Documentation Updates
${document_changes_required}

## Implementation Plan
${step_by_step_implementation_approach}

## Risk Assessment
${identified_risks_and_mitigation}

## Success Metrics
${how_to_measure_change_success}
```

2. **Store Change Proposal:** Use `bmad_create_document`:
   ```json
   {
     "type": "change-proposal",
     "title": "Sprint Change Proposal - ${date}",
     "content": "<change_proposal_markdown>",
     "metadata": {
       "change_trigger": "<trigger_description>",
       "affected_epics": [epic_numbers],
       "affected_stories": [story_ids],
       "urgency": "<urgency_level>"
     }
   }
   ```

### 5. Change Implementation Tracking (MCP Enhanced)

**MCP-Assisted Implementation:**

1. **Change Execution Plan:**
   - Use MCP tools to implement approved changes systematically
   - Update epic priorities via `bmad_create_epic` or direct updates
   - Modify story assignments via `bmad_update_task_status`
   - Adjust sprint allocations via `bmad_assign_story_to_sprint`

2. **Implementation Validation:**
   - Use `bmad_get_project_progress` to verify changes are reflected
   - Use `bmad_get_current_sprint` to confirm sprint adjustments
   - Use `bmad_query_tasks` to validate story modifications

3. **Change Audit Trail:**
   - Link change proposal to affected entities via `bmad_link_entity_to_document`
   - Track change implementation progress
   - Document change outcomes and lessons learned

### 6. Change Communication and Handoff

**Change Implementation Summary:**

1. **Change Summary Display:**
   ```
   ✅ CHANGE PROPOSAL IMPLEMENTED
   
   Change: ${change_description}
   Affected Epics: ${epic_count}
   Modified Stories: ${story_count}
   Sprint Adjustments: ${sprint_changes}
   
   Implementation Status:
   ${implementation_progress_summary}
   ```

2. **Next Steps Guidance:**
   ```
   Post-Change Actions:
   1. Monitor sprint progress with new adjustments
   2. Validate change success via defined metrics
   3. Continue development with updated priorities
   4. Review change impact in next sprint retrospective
   ```

**Handoff Scenarios:**

1. **Fundamental Replanning Required:**
   - If changes require major architectural revision: Handoff to Architect
   - If changes require major scope revision: Handoff to PM
   - If changes require new requirements gathering: Handoff to Analyst

2. **Normal Development Continuation:**
   - Changes implemented and tracked via MCP
   - Development continues with updated context
   - Regular monitoring via sprint tracking tools

## MCP Tools Reference

### Required Tools:
- `bmad_get_project_progress` - Baseline project state analysis
- `bmad_get_current_sprint` - Sprint context and impact assessment
- `bmad_query_epics` - Epic impact analysis and modifications
- `bmad_query_tasks` - Story impact analysis and updates
- `bmad_update_task_status` - Implement story modifications
- `bmad_assign_story_to_sprint` - Adjust sprint allocations
- `bmad_create_document` - Store change proposals and outcomes
- `bmad_link_entity_to_document` - Connect changes to affected entities

### Enhanced Resources:
- `bmad://project/progress` - Real-time project completion status
- `bmad://sprints/current` - Current sprint detailed status
- `bmad://changes/history` - Historical change tracking

## Critical Success Factors

1. **Data-Driven Analysis:** Use MCP data for objective impact assessment
2. **Systematic Implementation:** Apply changes through structured MCP tool usage
3. **Audit Trail Maintenance:** Track all changes for future reference
4. **Stakeholder Communication:** Clear documentation of change rationale and impact
5. **Continuous Validation:** Monitor change success through ongoing MCP data analysis

This MCP-enhanced approach ensures that course corrections are data-driven, properly implemented, and fully tracked within the project management system.