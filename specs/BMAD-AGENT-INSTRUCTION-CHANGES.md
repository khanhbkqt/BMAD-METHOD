# BMAD Agent Instruction Changes for MCP Database Integration

## Overview

This document details the specific instruction changes needed for each BMAD agent and workflow to integrate with the MCP database system for work items and sprints while keeping documents as markdown files.

---

## 1. Core Agent Changes

### 1.1 Scrum Master Agent (sm.md)

#### Current Dependencies:
```yaml
dependencies:
  tasks:
    - create-next-story.md
    - execute-checklist.md
    - correct-course.md
  templates:
    - story-tmpl.yaml
  checklists:
    - story-draft-checklist.md
```

#### **NEW: MCP-Enhanced Dependencies:**
```yaml
dependencies:
  # Add MCP tools for work item management
  mcp_tools:
    - bmad_work_item_query      # Find next story from database
    - bmad_work_item_read       # Get work item details with document refs  
    - bmad_work_item_create     # Create new work items
    - bmad_work_item_update     # Update work item status/details
    - bmad_sprint_progress      # Track sprint progress
    - bmad_sprint_manage_scope  # Manage sprint scope
  # Keep existing file-based dependencies
  tasks:
    - create-next-story.md      # Updated with MCP guidance
    - execute-checklist.md
    - correct-course.md
  templates:
    - story-tmpl.yaml
  checklists:
    - story-draft-checklist.md
```

#### **NEW: Updated Commands:**
```yaml
commands:
  # Enhanced existing commands
  - help: Show numbered list of commands including sprint management
  - draft: Execute create-next-story.md with MCP work item integration
  - story-checklist: Execute checklist with work item status updates
  
  # NEW sprint management commands
  - plan-sprint: Create and plan new sprint scope
  - scope-sprint: Add/remove work items from sprint scope  
  - track-sprint: View sprint progress and burndown
  - next-story: Query and select next story from sprint/backlog
  - update-story-status: Update work item status (draft→ready→in_progress→review→done)
  
  - exit: Say goodbye as the Scrum Master
```

#### **Core Principles Updates:**
```yaml
core_principles:
  # Keep existing
  - Rigorously follow create-next-story procedure to generate detailed user story
  - Ensure all information comes from PRD and Architecture to guide dev agent
  - You are NOT allowed to implement stories or modify code EVER!
  
  # ADD sprint management principles  
  - Manage sprint scope boundaries for focused AI agent work
  - Track work item progress through database status updates
  - Coordinate story creation within sprint capacity limits
  - Maintain work item hierarchy (Epic → Story → Task) integrity
```

### 1.2 Product Owner Agent (po.md)

#### **NEW: MCP-Enhanced Dependencies:**
```yaml
dependencies:
  # Add MCP tools for work item and sprint management
  mcp_tools:
    - bmad_work_item_query      # Query work items by filters
    - bmad_work_item_read       # Read work item with hierarchy
    - bmad_work_item_create     # Create epics and stories  
    - bmad_work_item_update     # Update priorities and status
    - bmad_sprint_create        # Create new sprints
    - bmad_sprint_manage_scope  # Manage sprint capacity and scope
    - bmad_import_from_documents # Import work items from existing docs
  # Keep existing file-based dependencies
  tasks:
    - execute-checklist.md
    - shard-doc.md             # Still shard markdown documents
    - correct-course.md
    - validate-next-story.md
  templates:
    - story-tmpl.yaml
  checklists:
    - po-master-checklist.md
    - change-checklist.md
```

#### **NEW: Updated Commands:**
```yaml
commands:
  # Enhanced existing commands
  - help: Show numbered list including sprint and work item commands
  - execute-checklist-po: Run checklist with work item validation
  - shard-doc: Shard documents and create work item references
  - validate-story-draft: Validate story and update work item status
  
  # NEW work item management commands
  - import-work-items: Import epics/stories from PRD into database
  - create-epic: Create epic work item with story breakdown
  - create-sprint: Create new sprint with capacity planning
  - manage-backlog: Prioritize and organize work item backlog
  - validate-sprint-scope: Ensure sprint scope aligns with capacity
  - track-project-progress: View overall project and sprint progress
  
  # Keep existing
  - doc-out: Output full document to current destination file
  - yolo: Toggle confirmations
  - exit: Exit
```

#### **Updated Core Principles:**
```yaml
core_principles:
  # Keep existing principles
  - Guardian of Quality & Completeness
  - Clarity & Actionability for Development  
  - Process Adherence & Systemization
  
  # ADD work item and sprint management principles
  - Work Item Hierarchy Stewardship - Maintain Epic → Story → Task relationships
  - Sprint Scope Governance - Ensure sprint boundaries align with capacity
  - Backlog Prioritization - Order work items by business value and dependencies
  - Cross-document Consistency - Ensure work items reference correct document sections
```

### 1.3 Development Agent (dev.md)

#### **NEW: MCP-Enhanced Dependencies:**
```yaml
dependencies:
  # Add MCP tools for work item tracking
  mcp_tools:
    - bmad_work_item_read       # Load assigned story/task details
    - bmad_work_item_update     # Update development progress and status
    - bmad_sprint_progress      # Check sprint context and progress
  # Keep existing file-based dependencies  
  tasks:
    - execute-checklist.md
    - validate-next-story.md
  checklists:
    - story-dod-checklist.md
```

#### **Updated develop-story Command:**
```yaml
commands:
  develop-story:
    # UPDATED process with MCP integration
    - order-of-execution: |
        Load work item details using MCP → Read story file from work item path →
        Implement task and subtasks → Write tests → Execute validations →
        Update work item status via MCP → Update story file sections →
        Repeat until complete
    - mcp-integration: |
        1. Use bmad_work_item_read(work_item_id) to get story details and file path
        2. Read story markdown file using existing file operations
        3. During development, update work item status: ready → in_progress → review
        4. Use bmad_work_item_update() to record progress and completion
        5. Maintain existing file-based development workflow
    - story-file-updates-ONLY:
        - CRITICAL: Update work item database AND story file Dev Agent Record sections
        - Keep existing file update restrictions - only modify authorized sections
    - completion: |
        All tasks marked [x] → Update work item status to "review" → 
        Run story-dod-checklist → Set work item status: "done" → HALT
```

### 1.4 Product Manager Agent (pm.md)

#### **NEW: MCP-Enhanced Dependencies:**
```yaml
dependencies:
  # Add MCP tools for epic and work item creation
  mcp_tools:
    - bmad_work_item_create     # Create epics during PRD creation
    - bmad_import_from_documents # Import work items from completed PRD
  # Keep all existing dependencies
  tasks:
    - create-doc.md
    - correct-course.md
    - create-deep-research-prompt.md
    - brownfield-create-epic.md    # Updated with MCP integration
    - brownfield-create-story.md   # Updated with MCP integration
    - execute-checklist.md
    - shard-doc.md
  templates:
    - prd-tmpl.yaml               # Updated to create work items
    - brownfield-prd-tmpl.yaml
  checklists:
    - pm-checklist.md
```

#### **Updated Commands:**
```yaml
commands:
  # Enhanced existing commands
  - create-prd: Create PRD and automatically generate work item structure
  - create-brownfield-prd: Create brownfield PRD with work item integration
  - create-brownfield-epic: Create epic work item with story breakdown
  - create-brownfield-story: Create story work item with document references
  - shard-prd: Shard PRD and link sections to work items
  
  # Keep existing
  - help: Show numbered list of commands
  - doc-out: Output full document
  - correct-course: Execute correct-course task
  - yolo: Toggle Yolo Mode  
  - exit: Exit
```

---

## 2. Task File Changes

### 2.1 create-next-story.md - Major Updates

#### **Current Process (File-based):**
```markdown
### 1. Identify Next Story for Preparation
- Based on prdSharded from config, locate epic files
- If devStoryLocation has story files, load highest story file
- Select next sequential story in current epic
```

#### **NEW Process (MCP + Files):**
```markdown
### 0. MCP Integration - Query Work Items Instead of Files

**CRITICAL CHANGE**: Use MCP tools to find next story:

```python
# Query next story from current sprint OR next ready story
next_story = bmad_work_item_query(
    project_id=project_id,
    filters={
        "sprint_id": current_sprint_id,  # If sprint workflow active
        "status": ["draft", "ready"], 
        "item_type": "story"
    },
    sort_by="epic_id, priority, created_at"
)

# Get story details with document references
story_details = bmad_work_item_read(
    work_item_id=next_story["id"],
    include_document_refs=True
)
```

### 1. Identify Next Story Using MCP Work Items

**UPDATED METHOD**: 
- Use bmad_work_item_query instead of scanning story files
- Check work item status and sprint assignment
- Verify story is within current sprint scope (if sprint workflow active)
- Get document references from work item record

### 2. Gather Story Requirements Using Work Item References

**UPDATED METHOD**:
```python
# Get document paths from work item references instead of manual discovery
document_refs = story_details["document_references"]
epic_content = read_file(story_details["source_document_path"])
section_content = extract_section(epic_content, story_details["source_section"])

# Read architecture documents as before (still files)
arch_files = load_architecture_context_based_on_story_type(story_type)
```

### 5. Create Story File AND Update Work Item

**NEW STEP**: After creating story file, update work item:
```python
# Create story file as before
story_file_path = f"docs/stories/{epic_num}.{story_num}.story.md"
create_story_file(story_file_path, story_content)

# NEW: Update work item with file path and status
bmad_work_item_update(
    work_item_id=story_details["id"],
    updates={
        "story_file_path": story_file_path,
        "status": "ready",
        "dev_notes": {"context_assembled": True, "ready_for_dev": True}
    }
)
```
```

### 2.2 shard-doc.md - Enhanced with Work Item Integration

#### **NEW Section Added:**
```markdown
## Post-Sharding Work Item Integration

After successful document sharding, create work item references:

### Link Sharded Sections to Work Items

If work items exist for this document:
```python
# Find work items that reference this document
work_items = bmad_work_item_query(
    project_id=project_id,
    filters={"source_document_path": sharded_document_path}
)

# Update work items with sharded section references
for item in work_items:
    shard_path = f"{shard_destination}/{item['source_section']}.md"
    bmad_work_item_update(
        work_item_id=item["id"],
        updates={"source_document_path": shard_path}
    )
```

### Create Work Items from New Sharded Epics

If sharding revealed new epics not yet in work item database:
```python
# Create epic work items for newly discovered epic sections
for shard_file in epic_shard_files:
    bmad_work_item_create(
        project_id=project_id,
        item_type="epic",
        title=extract_title_from_shard(shard_file),
        source_document_path=shard_file,
        source_section="full-document"
    )
```
```

### 2.3 brownfield-create-epic.md - MCP Integration

#### **NEW Section at Beginning:**
```markdown
## MCP Work Item Integration

**CRITICAL**: This task now creates database work items in addition to documents.

### Pre-Task Setup
```python
# Check if project exists in work item database
project_record = get_or_create_project(project_path=current_project_path)
```

### Post-Epic Creation
```python  
# After creating epic document, create work item record
epic_work_item = bmad_work_item_create(
    project_id=project_record["id"],
    item_type="epic", 
    title=epic_title,
    description=epic_description,
    source_document_path=epic_document_path,
    status="draft"
)

# Create story work items for each story in epic
for story in epic_stories:
    bmad_work_item_create(
        project_id=project_record["id"],
        item_type="story",
        title=story["title"], 
        description=story["description"],
        parent_id=epic_work_item["id"],
        epic_id=epic_work_item["id"],
        source_document_path=epic_document_path,
        source_section=story["section_key"],
        status="draft"
    )
```
```

---

## 3. Workflow Changes

### 3.1 greenfield-fullstack.yaml - Add Sprint Management

#### **NEW Sequence Steps Added:**

```yaml
# After PO validation step, ADD:
- agent: po
  action: import_work_items_from_documents
  creates: work_item_database
  uses: bmad_import_from_documents
  notes: |
    Import epics and stories from completed PRD into work item database:
    - Parse PRD sections to create Epic work items
    - Create Story work items for each user story
    - Set document references to PRD sections
    - Create initial work item hierarchy

- agent: po  
  action: create_initial_sprint
  creates: sprint_record
  uses: bmad_sprint_create
  notes: |
    Create first development sprint:
    - Set sprint goal based on MVP objectives
    - Define initial scope boundaries
    - Prepare for story selection

- agent: sm
  action: plan_sprint_scope
  uses: bmad_sprint_manage_scope
  notes: |
    Plan first sprint scope:
    - Select stories from Epic 1 for sprint
    - Consider story dependencies and dev capacity
    - Set realistic sprint boundaries for AI development
    - Update work item sprint assignments

# UPDATED existing development cycle:
- agent: sm
  action: create_story_with_work_item_tracking
  creates: story.md
  uses: bmad_work_item_read, create-next-story task
  notes: |
    Enhanced story creation:
    - Query next story from sprint scope using MCP
    - Get work item details and document references
    - Create story file using existing process
    - Update work item status from "draft" to "ready"
    - Track story within sprint context

- agent: dev  
  action: implement_story_with_progress_tracking
  uses: bmad_work_item_read, bmad_work_item_update
  notes: |
    Development with work item tracking:
    - Load story using work item ID and file path
    - Update work item status: ready → in_progress → review
    - Implement using existing file-based development process
    - Track development progress in sprint context
    - Update work item with completion details

# ADD sprint completion step:
- agent: po
  action: complete_sprint_review
  uses: bmad_sprint_progress
  condition: all_sprint_stories_done
  notes: |
    Sprint completion:
    - Review completed work items
    - Update sprint status to "completed"
    - Plan next sprint if more work remains
    - Generate sprint retrospective insights
```

### 3.2 brownfield-fullstack.yaml - Enhanced Routing

#### **UPDATED Routing Section:**
```yaml
- step: routing_decision
  condition: based_on_classification
  routes:
    single_story:
      agent: pm
      uses: brownfield-create-story  # Now creates work item + document
      mcp_integration: |
        Creates both story document AND work item record:
        - Document for development context
        - Work item for status tracking and sprint management
      notes: "Create single story with database tracking. Can assign to sprint."
      
    small_feature:
      agent: pm
      uses: brownfield-create-epic   # Now creates work items + documents
      mcp_integration: |
        Creates epic and story work items:
        - Epic work item for feature grouping  
        - Story work items for each implementation piece
        - Maintains document references for context
      notes: "Create focused epic with work item hierarchy. Can be sprint-managed."
```

---

## 4. Expansion Pack Agent Changes

### 4.1 Game Development Agents

#### **Game SM Agent (game-sm.md) Updates:**
```yaml
# ADD to dependencies:
mcp_tools:
  - bmad_work_item_query      # Game-specific story queries
  - bmad_work_item_read       # Game story details  
  - bmad_work_item_create     # Create game work items
  - bmad_work_item_update     # Update game story status
  - bmad_sprint_manage_scope  # Game sprint management

# ADD to commands:
- plan-game-sprint: Plan sprint focused on game features (levels, mechanics)
- track-game-progress: Monitor game development progress with visual milestones
- create-level-story: Create story for specific game level development
- create-mechanic-story: Create story for game mechanic implementation

# UPDATE core principles to include:
- Game Sprint Scoping - Focus sprints on playable increments (levels, features)
- Game Milestone Tracking - Track progress through playable game states  
- Game Story Context - Ensure stories include game design document references
```

#### **Game Developer Agent Updates:**
```yaml
# ADD to dependencies:
mcp_tools:
  - bmad_work_item_read       # Load game story with design doc references
  - bmad_work_item_update     # Update game implementation progress

# UPDATE develop-story command:
develop-story:
  - game-specific-process: |
      Load game story via MCP → Read game design documents → 
      Implement game feature → Test gameplay → Update work item status →
      Capture gameplay screenshots/videos for progress tracking
```

### 4.2 Infrastructure DevOps Agent

#### **Infra DevOps Platform Agent Updates:**
```yaml  
# ADD to dependencies:
mcp_tools:
  - bmad_work_item_query      # Infrastructure work item queries
  - bmad_work_item_read       # Infrastructure story details
  - bmad_work_item_update     # Infrastructure deployment progress
  - bmad_sprint_manage_scope  # Infrastructure sprint management

# ADD infrastructure-specific commands:
- plan-infrastructure-sprint: Plan sprint for infrastructure deployments
- track-deployment-progress: Monitor infrastructure story completion
- create-infrastructure-epic: Create infrastructure modernization epics
- validate-infrastructure-story: Validate infrastructure changes against requirements
```

---

## 5. Configuration File Changes

### 5.1 core-config.yaml Updates

#### **ADD Database Configuration:**
```yaml
# Existing configuration stays the same
markdownExploder: true
prd:
  prdFile: docs/prd.md
  prdSharded: true
  prdShardedLocation: docs/prd
architecture:
  architectureFile: docs/architecture.md
  architectureSharded: true  
  architectureShardedLocation: docs/architecture
devLoadAlwaysFiles:
  - docs/architecture/coding-standards.md
  - docs/architecture/tech-stack.md
  - docs/architecture/source-tree.md
devStoryLocation: docs/stories

# NEW: Work Item and Sprint Configuration
workItems:
  enabled: true
  database_connection: "postgresql://localhost/bmad_db"
  sync_with_files: true
  track_progress: true

sprints:
  enabled: true
  scope_based_workflow: true
  capacity_tracking: true  
  default_capacity_points: 40
  sprint_length_days: 14

# NEW: MCP Tool Configuration  
mcp_tools:
  enabled: true
  auto_import_from_documents: true
  work_item_status_tracking: true
  sprint_progress_monitoring: true
```

---

## 6. Migration Impact Summary

### 6.1 Agents with MAJOR Changes:
1. **Scrum Master (sm.md)** - Gains sprint management and work item querying
2. **Product Owner (po.md)** - Gains work item creation and backlog management  
3. **Development (dev.md)** - Gains work item progress tracking
4. **Product Manager (pm.md)** - Enhanced with work item creation during PRD

### 6.2 Agents with MINOR Changes:
1. **Analyst (analyst.md)** - Minimal changes, mainly project setup
2. **Architect (architect.md)** - Mainly document reference updates
3. **QA (qa.md)** - Work item status updates during review
4. **UX Expert (ux-expert.md)** - Minimal changes

### 6.3 Tasks with MAJOR Changes:
1. **create-next-story.md** - Complete rewrite to use MCP work item queries
2. **brownfield-create-epic.md** - Add work item creation after document creation
3. **brownfield-create-story.md** - Add work item creation
4. **shard-doc.md** - Add work item reference updates after sharding

### 6.4 Workflows with MAJOR Changes:
1. **All greenfield workflows** - Add sprint management sequence
2. **All brownfield workflows** - Enhanced routing with work item creation
3. **Game development workflows** - Game-specific sprint and milestone tracking

### 6.5 Benefits of These Changes:
- **Enhanced tracking**: Work items provide status visibility throughout development
- **Sprint management**: AI agents work within defined scope boundaries  
- **Progress monitoring**: Real-time visibility into project progress
- **Hierarchy management**: Clear Epic → Story → Task relationships
- **Context preservation**: Work items reference exact document sections
- **Backward compatibility**: Existing file-based workflows continue to work

The changes maintain BMAD's core philosophy while adding powerful work management capabilities through the MCP database integration.