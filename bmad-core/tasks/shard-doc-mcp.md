# Shard Document Task (MCP Enhanced)

## Purpose

MCP-enhanced document sharding that breaks large documents into manageable, story-sized sections with automatic linking and context preservation. This version uses MCP tools to create structured document sections and maintain relationships between sharded content and development entities.

## SEQUENTIAL Task Execution

### 0. MCP Availability and Document Analysis

**MCP Availability Check:**
- Verify MCP tools are available for document management
- If MCP unavailable, fall back to manual sharding with warning
- If MCP available, use enhanced workflow with automated linking

**Document Context Analysis:**
1. Use document queries to identify the document to be sharded
2. Use `bmad_get_project_progress` to understand current project context
3. Use `bmad_query_epics` to identify relevant epics for section assignment

### 1. Document Selection and Analysis

**Interactive Document Selection:**

```
Document Sharding Process:
Available Documents for Sharding:
[List from document queries]

Select document to shard: 
Document Type: [PRD/Architecture/Technical Spec/Other]
Sharding Purpose: [Story Creation/Epic Planning/Development Reference]
```

**Document Structure Analysis:**

1. **Parse Document Sections:** Analyze document structure:
   - Identify major sections and subsections
   - Analyze content complexity and length
   - Identify natural breaking points for sharding

2. **Content Mapping:** Map content to development entities:
   - Identify sections that map to specific epics
   - Identify content that relates to specific stories
   - Mark sections requiring development attention

### 2. Sharding Strategy Definition

**MCP-Enhanced Sharding Plan:**

1. **Sharding Approach Selection:**
   ```
   Sharding Strategy Options:
   1. **Epic-Based Sharding**: One shard per epic with related content
   2. **Story-Sized Sharding**: Small shards suitable for individual story creation
   3. **Feature-Based Sharding**: Shards organized by functional areas
   4. **Timeline-Based Sharding**: Shards organized by development phases
   
   Select strategy [1-4]: 
   ```

2. **Shard Size and Scope Definition:**
   - Determine optimal shard size for development consumption
   - Define shard overlap strategy for context preservation
   - Plan shard naming and organization convention

3. **Epic and Story Alignment:**
   - Use `bmad_query_epics` to align shards with existing epics
   - Plan new epic creation if shards reveal new scope areas
   - Prepare shard-to-story mapping strategy

### 3. Document Sharding Execution

**MCP-Enhanced Sharding Process:**

1. **Create Shard Documents:** For each identified shard:

```json
{
  "type": "document-shard",
  "title": "${original_doc_title} - ${shard_name}",
  "content": "${shard_content_with_context}",
  "metadata": {
    "parent_document": "${original_doc_id}",
    "shard_index": ${shard_number},
    "total_shards": ${total_shard_count},
    "epic_alignment": "${target_epic_num}",
    "shard_type": "${shard_category}"
  }
}
```

2. **Enhanced Shard Content Structure:**

```markdown
# ${shard_title}

## Context from Parent Document
**Source Document**: ${parent_document_title}
**Related Sections**: ${related_section_references}
**Epic Alignment**: Epic ${epic_num} - ${epic_title}

## Shard Content
${extracted_content_with_enhancements}

## Development Context
**Implementation Priority**: ${priority_level}
**Estimated Stories**: ${estimated_story_count}
**Dependencies**: ${dependency_notes}
**Technical Considerations**: ${technical_notes}

## Story Creation Guidance
${guidance_for_story_creation_from_this_shard}

## Related Shards
- Previous: ${previous_shard_reference}
- Next: ${next_shard_reference}
- Related: ${related_shard_references}
```

3. **Automatic Shard Linking:** Link shards to project entities:

```json
{
  "entity_type": "epic",
  "entity_id": "${target_epic_id}",
  "document_id": "${shard_document_id}",
  "link_purpose": "shard-reference"
}
```

### 4. Shard Validation and Enhancement

**MCP-Enhanced Shard Quality Assurance:**

1. **Completeness Validation:**
   - Verify all original content is captured across shards
   - Check for gaps or overlaps in shard coverage
   - Validate context preservation across shard boundaries

2. **Development Readiness Assessment:**
   - Assess each shard's readiness for story creation
   - Identify shards needing additional context or clarification
   - Validate shard size appropriateness for development consumption

3. **Epic Alignment Validation:**
   - Use `bmad_query_epics` to confirm shard-epic alignments
   - Validate that shard content matches epic scope and goals
   - Identify shards that might require new epic creation

### 5. Shard Navigation and Management

**Enhanced Shard Organization:**

1. **Shard Index Creation:**

```markdown
# ${original_document_title} - Shard Index

## Sharding Overview
**Original Document**: ${original_doc_title}
**Sharding Date**: ${sharding_date}
**Total Shards**: ${total_count}
**Sharding Strategy**: ${strategy_used}

## Shard Directory
${shard_list_with_descriptions_and_links}

## Epic Mapping
${shard_to_epic_mapping_table}

## Development Status
${shard_development_progress_tracking}
```

2. **Store Shard Index:** Use `bmad_create_document`:
   ```json
   {
     "type": "shard-index",
     "title": "${original_doc_title} - Shard Index",
     "content": "<shard_index_markdown>",
     "metadata": {
       "parent_document": "${original_doc_id}",
       "shard_count": ${total_shards},
       "sharding_strategy": "${strategy}",
       "created_date": "${date}"
     }
   }
   ```

### 6. Shard Integration with Development Workflow

**Development-Ready Shard Handoff:**

1. **Story Creation Preparation:**
   - Mark shards ready for story creation
   - Provide story creation guidance for each shard
   - Link shards to appropriate agent workflows

2. **Epic Enhancement:**
   - Update existing epics with shard references
   - Create new epics if shards reveal new scope areas
   - Align epic priorities with shard development sequence

3. **Sprint Planning Integration:**
   - Prepare shards for sprint planning consumption
   - Estimate story creation effort from shard complexity
   - Plan shard-based development sequencing

**Shard Completion Summary:**

```
✅ DOCUMENT SHARDING COMPLETED

Original Document: ${original_document_title}
Shards Created: ${shard_count}
Epic Alignments: ${epic_alignment_count}
Development-Ready Shards: ${ready_shard_count}

Shard Index: ${shard_index_document_link}

Next Actions:
1. Use shards for story creation via SM agent
2. Reference shards during epic planning
3. Monitor shard-based development progress
4. Update shard status as stories are completed
```

## MCP Tools Reference

### Required Tools:
- `bmad_create_document` - Create individual shard documents and index
- `bmad_link_entity_to_document` - Link shards to epics and stories
- `bmad_query_epics` - Align shards with existing epics
- `bmad_get_project_progress` - Understand project context for sharding
- Document queries - Access and analyze source documents

### Enhanced Resources:
- `bmad://documents/shards` - All document shards and their relationships
- `bmad://epics/<num>/shards` - Shards associated with specific epics
- `bmad://shards/<id>/stories` - Stories created from specific shards

## Critical Success Factors

1. **Context Preservation:** Maintain sufficient context in each shard for development use
2. **Epic Alignment:** Ensure shards align with epic scope and development sequence
3. **Development Readiness:** Size and structure shards for optimal story creation
4. **Relationship Management:** Maintain clear links between shards and development entities
5. **Navigation Support:** Provide clear index and navigation between related shards

This MCP-enhanced approach ensures document sharding supports structured development workflows with proper tracking and relationship management throughout the development process.