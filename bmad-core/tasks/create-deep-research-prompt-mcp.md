# Create Deep Research Prompt Task (MCP Enhanced)

## Purpose

MCP-enhanced research prompt generation with project context integration, real-time data validation, and structured research output templates.

## SEQUENTIAL Task Execution

### 0. MCP Availability and Project Context

**MCP Availability Check:**
- Verify MCP tools are available for context-aware research
- If MCP unavailable, fall back to generic prompt generation with warning
- If MCP available, use enhanced workflow with project data integration

**Project Context Analysis:**
1. Use `bmad_get_project_progress` to understand current project state
2. Use `bmad_query_epics` to identify research alignment opportunities
3. Use document queries to review existing research and documentation

### 1. Research Topic Definition and Scoping

**Interactive Research Scoping:**

```
Research Prompt Generation:
1. Research Topic: ${topic_description}
2. Research Purpose: [Market Analysis/Technical Investigation/Competitive Analysis/User Research]
3. Project Context: [How does this research support current project goals?]
4. Expected Output Format: [Report/Presentation/Data Analysis/Recommendations]
5. Timeline: [Research completion timeframe]
```

**MCP-Enhanced Context Integration:**
- Align research scope with current epic priorities
- Integrate existing project knowledge to avoid duplication
- Reference related documentation for context building

### 2. Generate Comprehensive Research Prompt

**MCP-Enhanced Research Prompt Creation:**

```markdown
# Deep Research Prompt: ${topic_title}

## Research Context
**Project Integration**: ${project_context_from_mcp}
**Current Epic Focus**: ${relevant_epic_context}
**Existing Knowledge**: ${related_document_summary}

## Research Objectives
${detailed_research_objectives}

## Research Questions
${structured_research_questions}

## Expected Deliverables
${output_specifications}

## Research Methodology
${recommended_research_approach}

## Success Criteria
${research_success_metrics}
```

### 3. Store and Link Research Prompt

**Store Research Prompt:** Use `bmad_create_document`:
```json
{
  "type": "research-prompt",
  "title": "Research Prompt - ${topic_title}",
  "content": "<research_prompt_markdown>",
  "metadata": {
    "research_type": "${research_type}",
    "target_epic": "${epic_num}",
    "expected_timeline": "${timeline}"
  }
}
```

## MCP Tools Reference

### Required Tools:
- `bmad_get_project_progress` - Project context for research alignment
- `bmad_query_epics` - Epic alignment for research focus
- `bmad_create_document` - Store research prompts and results
- Document queries - Review existing research and documentation

This MCP-enhanced approach ensures research prompts are contextually relevant to current project needs and properly integrated with existing project knowledge.