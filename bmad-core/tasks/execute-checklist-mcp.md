# Execute Checklist Task (MCP Enhanced)

## Purpose

MCP-enhanced checklist execution with real-time validation, progress tracking, and automated artifact linking. This version uses MCP tools to validate checklist items against current project state and maintain audit trails of checklist completion.

## SEQUENTIAL Task Execution

### 0. MCP Availability and Checklist Preparation

**MCP Availability Check:**
- Verify MCP tools are available for checklist validation
- If MCP unavailable, fall back to manual checklist execution with warning
- If MCP available, use enhanced workflow with real-time validation

**Checklist Context Analysis:**
1. Use `bmad_get_project_progress` to understand current project state
2. Use `bmad_get_current_sprint` to get sprint context for relevant checklists
3. Use `bmad_query_tasks` and `bmad_query_epics` for entity-specific checklists

### 1. Checklist Initialization and Context Setup

**Checklist Selection and Loading:**

Interactive checklist selection:
```
Available Checklists:
1. story-draft-checklist.md - Story creation validation
2. story-dod-checklist.md - Story definition of done
3. pm-checklist.md - Product management validation
4. architect-checklist.md - Architecture review
5. po-master-checklist.md - Product owner validation
6. change-checklist.md - Change management process
7. sprint-completion-checklist.md - Sprint retrospective

Select checklist number: 
Entity Context (if applicable): [epic/story/sprint ID]
```

**Context-Aware Checklist Enhancement:**

Based on selected checklist and entity:
1. **Story Checklists:** Use `bmad_query_tasks` to get story details for validation
2. **Epic Checklists:** Use `bmad_query_epics` to get epic context
3. **Sprint Checklists:** Use `bmad_get_current_sprint` for sprint-specific validation
4. **Project Checklists:** Use `bmad_get_project_progress` for overall context

### 2. MCP-Enhanced Checklist Execution

**Real-Time Validation Checklist Processing:**

For each checklist item:

1. **Item Context Analysis:**
   - Parse checklist item requirements
   - Identify MCP queries needed for validation
   - Gather relevant project data automatically

2. **Automated Validation (Where Possible):**
   ```
   Checklist Item: "${checklist_item_text}"
   
   MCP Validation Status:
   - Data Retrieved: ✅/❌
   - Validation Result: ✅/❌/🔍 (needs review)
   - Evidence: ${mcp_data_summary}
   ```

3. **Interactive Validation (Where Required):**
   ```
   Checklist Item: "${checklist_item_text}"
   
   Current Project State: ${relevant_mcp_data}
   
   Manual Validation Required:
   - Review the above data
   - Confirm compliance: [Y/N]
   - Notes (if needed): ${user_notes}
   ```

4. **Progress Tracking:**
   - Track completion status for each item
   - Maintain validation evidence from MCP data
   - Record any issues or blockers identified

### 3. Checklist Validation Categories

**Automated MCP Validations:**

1. **Data Existence Checks:**
   - Story exists in system: `bmad_query_tasks`
   - Epic exists and has stories: `bmad_query_epics`
   - Sprint is active: `bmad_get_current_sprint`
   - Documents exist: Document queries

2. **Data Completeness Checks:**
   - Story has description: Validate via task query
   - Epic has priority set: Validate via epic query
   - Sprint has goal defined: Validate via sprint query
   - Required fields populated: Field-specific validation

3. **Relationship Validations:**
   - Story assigned to epic: Cross-reference validation
   - Story assigned to sprint: Sprint assignment check
   - Document links exist: Link validation queries
   - Dependencies properly set: Dependency validation

**Interactive MCP-Assisted Validations:**

1. **Quality Assessments:**
   - Story acceptance criteria quality (show current criteria from MCP)
   - Epic scope appropriateness (show epic details from MCP)
   - Sprint goal achievability (show sprint progress from MCP)

2. **Alignment Checks:**
   - Story aligns with epic goals (show both for comparison)
   - Epic aligns with project objectives (show project context)
   - Sprint scope matches capacity (show current sprint data)

### 4. Checklist Results and Documentation

**MCP-Enhanced Results Summary:**

1. **Checklist Completion Report:**
   ```markdown
   # Checklist Execution Report - ${checklist_name}
   
   ## Execution Context
   - **Date**: ${execution_date}
   - **Entity**: ${entity_type} ${entity_id}
   - **Executor**: ${agent_name}
   - **MCP Data Used**: ${mcp_queries_executed}
   
   ## Results Summary
   - **Total Items**: ${total_items}
   - **Passed**: ${passed_count} ✅
   - **Failed**: ${failed_count} ❌
   - **Needs Attention**: ${attention_count} 🔍
   - **Not Applicable**: ${na_count} ⚪
   
   ## Detailed Results
   ${item_by_item_results_with_mcp_evidence}
   
   ## Action Items
   ${identified_action_items}
   
   ## MCP Data Evidence
   ${relevant_mcp_data_snapshots}
   ```

2. **Store Checklist Results:** Use `bmad_create_document`:
   ```json
   {
     "type": "checklist-results",
     "title": "Checklist Results - ${checklist_name} - ${date}",
     "content": "<checklist_report_markdown>",
     "metadata": {
       "checklist_type": "<checklist_name>",
       "entity_type": "<entity_type>",
       "entity_id": "<entity_id>",
       "pass_rate": <percentage>,
       "execution_date": "<date>"
     }
   }
   ```

### 5. Action Item Tracking and Follow-up

**MCP-Enhanced Action Item Management:**

1. **Action Item Creation:**
   For each failed or attention-required checklist item:
   ```json
   {
     "epic_num": <relevant_epic>,
     "title": "Checklist Action: ${item_description}",
     "description": "Address checklist item: ${item_text}\n\nEvidence: ${mcp_evidence}\n\nRequired Action: ${action_description}",
     "assignee": "${responsible_agent}",
     "priority": "HIGH"
   }
   ```

2. **Link Action Items to Original Entity:**
   ```json
   {
     "entity_type": "task",
     "entity_id": "<action_item_id>",
     "document_id": "<checklist_results_doc_id>",
     "link_purpose": "checklist-followup"
   }
   ```

### 6. Checklist Integration and Continuous Improvement

**Checklist Pattern Analysis:**

1. **Common Issue Identification:**
   - Analyze historical checklist results
   - Identify recurring failure patterns
   - Suggest process improvements

2. **Checklist Effectiveness Tracking:**
   - Track checklist completion rates over time
   - Monitor action item resolution rates
   - Identify checklist items that need refinement

**Integration with Development Flow:**

1. **Pre-Development Checklists:**
   - Validate story readiness before development
   - Ensure epic completeness before story creation
   - Confirm sprint readiness before sprint start

2. **Post-Development Checklists:**
   - Validate story completion before marking done
   - Ensure epic closure criteria met
   - Confirm sprint success criteria achieved

## MCP Tools Reference

### Required Tools:
- `bmad_query_tasks` - Validate story-related checklist items
- `bmad_query_epics` - Validate epic-related checklist items
- `bmad_get_current_sprint` - Validate sprint-related checklist items
- `bmad_get_project_progress` - Validate project-level checklist items
- `bmad_create_document` - Store checklist results and reports
- `bmad_create_story` - Create action items for failed checklist items
- `bmad_link_entity_to_document` - Link results to relevant entities

### Enhanced Resources:
- `bmad://checklists/history` - Historical checklist execution data
- `bmad://checklists/patterns` - Common failure pattern analysis
- `bmad://project/quality-metrics` - Quality metrics derived from checklists

## Critical Success Factors

1. **Real-Time Validation:** Use MCP data for objective checklist validation
2. **Evidence-Based Results:** Maintain clear evidence trail from MCP queries
3. **Action Item Creation:** Convert failures into trackable action items
4. **Continuous Improvement:** Analyze patterns for process enhancement
5. **Integration:** Embed checklists into natural development workflow

This MCP-enhanced approach ensures checklists are validated against real project data, results are properly documented, and follow-up actions are tracked through the project management system.