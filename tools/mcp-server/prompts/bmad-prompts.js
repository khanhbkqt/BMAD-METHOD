/**
 * BMAD Prompts - MCP Prompt implementations for BMAD workflows
 * These prompts provide structured templates for common BMAD operations
 */

class BMadPrompts {
  constructor(storage) {
    this.storage = storage;
  }

  async listPrompts() {
    return [
      {
        name: 'bmad_create_story',
        description: 'Guided workflow for creating a new story with proper context and acceptance criteria',
        arguments: [
          {
            name: 'epic_num',
            description: 'Epic number to create the story in',
            required: true
          },
          {
            name: 'context_type',
            description: 'Type of story context to include',
            required: false
          }
        ]
      },
      {
        name: 'bmad_review_sprint',
        description: 'Sprint review template with progress analysis and recommendations',
        arguments: [
          {
            name: 'sprint_id',
            description: 'Sprint ID to review (optional, defaults to active sprint)',
            required: false
          }
        ]
      },
      {
        name: 'bmad_plan_epic',
        description: 'Epic planning template for breaking down large features into stories',
        arguments: [
          {
            name: 'epic_num',
            description: 'Epic number to plan',
            required: true
          }
        ]
      },
      {
        name: 'bmad_project_status',
        description: 'Comprehensive project status report with insights and recommendations',
        arguments: []
      },
      {
        name: 'bmad_daily_standup',
        description: 'Daily standup template showing progress, blockers, and next steps',
        arguments: [
          {
            name: 'assignee',
            description: 'Team member to focus on (optional)',
            required: false
          }
        ]
      },
      {
        name: 'bmad_task_handoff',
        description: 'Task handoff template for transferring work between agents or team members',
        arguments: [
          {
            name: 'task_id',
            description: 'Task ID to hand off',
            required: true
          },
          {
            name: 'from_assignee',
            description: 'Current assignee',
            required: true
          },
          {
            name: 'to_assignee',
            description: 'New assignee',
            required: true
          }
        ]
      }
    ];
  }

  async getPrompt(name, args = {}) {
    switch (name) {
      case 'bmad_create_story':
        return await this.createStoryPrompt(args);
      case 'bmad_review_sprint':
        return await this.reviewSprintPrompt(args);
      case 'bmad_plan_epic':
        return await this.planEpicPrompt(args);
      case 'bmad_project_status':
        return await this.projectStatusPrompt(args);
      case 'bmad_daily_standup':
        return await this.dailyStandupPrompt(args);
      case 'bmad_task_handoff':
        return await this.taskHandoffPrompt(args);
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  async createStoryPrompt(args) {
    const { epic_num, context_type = 'full' } = args;
    
    // Get epic context
    const epic = await this.storage.getEpic(epic_num);
    const epicTasks = epic ? await this.storage.queryTasks({ epic_num }) : [];
    const nextStoryNum = await this.storage.getNextStoryNum(epic_num);
    
    // Get project context
    const project = await this.storage.getProject();
    const prdDocs = await this.storage.listDocuments('prd');
    const archDocs = await this.storage.listDocuments('architecture');
    
    let contextSection = '';
    if (context_type === 'full') {
      contextSection = `
## Project Context
- **Project**: ${project.name}
- **PRD Available**: ${prdDocs.length > 0 ? 'Yes' : 'No'}
- **Architecture Doc**: ${archDocs.length > 0 ? 'Yes' : 'No'}

## Epic Context
${epic ? `
- **Epic ${epic.epic_num}**: ${epic.title}
- **Description**: ${epic.description}
- **Current Stories**: ${epicTasks.length}
- **Completed**: ${epicTasks.filter(t => t.status === 'DONE').length}
` : `
- **Epic ${epic_num}**: Not yet created (will be auto-created)
- **This will be the first story in this epic**
`}

## Previous Stories Context
${epicTasks.length > 0 ? 
  epicTasks.slice(-3).map(task => 
    `- **${task.epic_num}.${task.story_num}**: ${task.title} (${task.status})`
  ).join('\n') 
  : '- No previous stories in this epic'}
`;
    }

    return {
      description: `Create a new story ${epic_num}.${nextStoryNum} with proper context and acceptance criteria`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Create Story ${epic_num}.${nextStoryNum}

I need to create a new story in Epic ${epic_num}. Please help me create a comprehensive story with:

1. **Clear Title**: Concise but descriptive
2. **Detailed Description**: What needs to be built and why
3. **Acceptance Criteria**: Specific, testable conditions for completion
4. **Technical Context**: Any architectural or implementation considerations
5. **Dependencies**: Other stories or external factors this depends on

${contextSection}

## Story Creation Guidelines

**Title Format**: Should be action-oriented (e.g., "Create user authentication API", "Add payment processing")

**Description Should Include**:
- User/business value
- Functional requirements
- Any UI/UX considerations
- Integration points
- Data requirements

**Acceptance Criteria Format**:
- Given [context]
- When [action]
- Then [expected result]

**Technical Notes**:
- Architecture patterns to follow
- Technology choices
- Performance requirements
- Security considerations

Please create the story following this structure and use the bmad_create_story tool to save it.`
          }
        }
      ]
    };
  }

  async reviewSprintPrompt(args) {
    const { sprint_id } = args;
    
    const sprint = sprint_id ? 
      await this.storage.get('SELECT * FROM sprints WHERE id = ?', [sprint_id]) :
      await this.storage.getActiveSprint();
    
    if (!sprint) {
      throw new Error('No sprint found for review');
    }
    
    const sprintTasks = await this.storage.queryTasks({ sprint_id: sprint.id });
    const progress = await this.storage.getProjectProgress();
    
    const completedTasks = sprintTasks.filter(t => t.status === 'DONE');
    const inProgressTasks = sprintTasks.filter(t => t.status === 'IN_PROGRESS');
    const blockedTasks = sprintTasks.filter(t => t.status === 'BLOCKED');
    
    return {
      description: `Sprint review for ${sprint.name}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Sprint Review: ${sprint.name}

## Sprint Overview
- **Goal**: ${sprint.goal}
- **Start Date**: ${sprint.start_date || 'Not set'}
- **End Date**: ${sprint.end_date || 'Not set'}
- **Status**: ${sprint.status}

## Sprint Metrics
- **Total Tasks**: ${sprintTasks.length}
- **Completed**: ${completedTasks.length}
- **In Progress**: ${inProgressTasks.length}
- **Blocked**: ${blockedTasks.length}
- **Completion Rate**: ${sprintTasks.length > 0 ? Math.round((completedTasks.length / sprintTasks.length) * 100) : 0}%

## Completed Stories
${completedTasks.length > 0 ? 
  completedTasks.map(task => 
    `- ✅ **${task.epic_num}.${task.story_num}**: ${task.title}`
  ).join('\n')
  : '- No stories completed this sprint'}

## In Progress
${inProgressTasks.length > 0 ?
  inProgressTasks.map(task => 
    `- 🔄 **${task.epic_num}.${task.story_num}**: ${task.title} (${task.assignee || 'Unassigned'})`
  ).join('\n')
  : '- No stories in progress'}

## Blocked Items
${blockedTasks.length > 0 ?
  blockedTasks.map(task => 
    `- 🚫 **${task.epic_num}.${task.story_num}**: ${task.title} (${task.assignee || 'Unassigned'})`
  ).join('\n')
  : '- No blocked stories'}

## Review Questions

Please analyze this sprint data and provide insights on:

1. **Sprint Goal Achievement**: How well did we meet the sprint goal?
2. **Velocity Analysis**: Is our completion rate on track?
3. **Blocker Resolution**: What can we do about blocked items?
4. **Process Improvements**: What went well and what could be better?
5. **Next Sprint Planning**: What should be priorities for the next sprint?

Use the available bmad tools to get additional context as needed.`
          }
        }
      ]
    };
  }

  async planEpicPrompt(args) {
    const { epic_num } = args;
    
    const epic = await this.storage.getEpic(epic_num);
    const existingTasks = epic ? await this.storage.queryTasks({ epic_num }) : [];
    const project = await this.storage.getProject();
    
    return {
      description: `Epic planning session for Epic ${epic_num}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Epic Planning: Epic ${epic_num}

## Current Epic Status
${epic ? `
- **Title**: ${epic.title}
- **Description**: ${epic.description}
- **Status**: ${epic.status}
- **Existing Stories**: ${existingTasks.length}
` : `
- **Epic ${epic_num}**: Not yet created
- **This is a new epic planning session**
`}

## Epic Planning Framework

An epic should be broken down into deliverable stories that:
1. **Provide incremental value**
2. **Can be completed in 1-3 days**
3. **Have clear acceptance criteria**
4. **Build upon each other logically**

## Planning Steps

### 1. Epic Definition
${epic ? 'Review and refine the current epic definition:' : 'Define the epic:'}
- **Business Value**: What problem does this solve?
- **User Impact**: Who benefits and how?
- **Success Criteria**: How will we know when it's complete?
- **Scope Boundaries**: What's included and excluded?

### 2. Story Decomposition
Break down the epic into logical stories:
- **Foundation Stories**: Basic setup, models, infrastructure
- **Core Feature Stories**: Main functionality
- **Integration Stories**: Connecting with other systems
- **Polish Stories**: UI improvements, error handling, edge cases

### 3. Story Prioritization
Order stories by:
- **Dependencies**: What must come first?
- **Risk**: Tackle unknowns early
- **Value**: High-impact features first
- **Effort**: Mix of quick wins and larger features

### 4. Estimation
Consider for each story:
- **Complexity**: Technical difficulty
- **Unknowns**: Research or learning required
- **Dependencies**: External factors
- **Testing**: Validation requirements

## Current Project Context
- **Project**: ${project.name}
- **Total Epics**: ${(await this.storage.listEpics()).length}
- **Total Stories**: ${(await this.storage.queryTasks()).length}

Please help me plan this epic by:
1. Defining or refining the epic scope
2. Breaking it down into stories
3. Sequencing the stories logically
4. Identifying any dependencies or risks

Use the bmad_create_epic and bmad_create_story tools as we work through this planning session.`
          }
        }
      ]
    };
  }

  async projectStatusPrompt(args) {
    const project = await this.storage.getProject();
    const progress = await this.storage.getProjectProgress();
    const epics = await this.storage.listEpics();
    const sprints = await this.storage.listSprints();
    const activeSprint = await this.storage.getActiveSprint();
    
    const totalTasks = progress.totalTasks;
    const completionPercentage = totalTasks > 0 ? 
      Math.round(((progress.byStatus.DONE || 0) / totalTasks) * 100) : 0;
    
    return {
      description: 'Comprehensive project status report',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Project Status Report: ${project.name}

## Project Overview
- **Name**: ${project.name}
- **Description**: ${project.description || 'No description available'}
- **Overall Progress**: ${completionPercentage}% complete
- **Total Tasks**: ${totalTasks}

## Progress Breakdown
${Object.entries(progress.byStatus).map(([status, count]) => 
  `- **${status}**: ${count} tasks`
).join('\n')}

## Epic Summary
- **Total Epics**: ${epics.length}
${Object.entries(progress.byEpic).map(([epicNum, count]) => {
  const epic = epics.find(e => e.epic_num == epicNum);
  return `- **Epic ${epicNum}**: ${count} tasks ${epic ? `(${epic.title})` : ''}`;
}).join('\n')}

## Sprint Information
- **Total Sprints**: ${sprints.length}
- **Active Sprint**: ${activeSprint ? activeSprint.name : 'None'}
${activeSprint ? `- **Sprint Goal**: ${activeSprint.goal}` : ''}

## Key Insights Request

Please analyze this project status and provide insights on:

1. **Health Assessment**: Is the project on track?
2. **Velocity Trends**: How is our completion rate?
3. **Bottleneck Analysis**: Where are we getting stuck?
4. **Resource Allocation**: Are tasks distributed well?
5. **Risk Factors**: What could impact delivery?
6. **Recommendations**: What actions should we take?

## Next Steps Analysis

Consider:
- **Priority Tasks**: What should be worked on next?
- **Blocked Items**: What needs unblocking?
- **Sprint Planning**: What should go in the next sprint?
- **Epic Management**: Any epics need attention?

Use bmad_query_tasks and other tools to get detailed data for your analysis.`
          }
        }
      ]
    };
  }

  async dailyStandupPrompt(args) {
    const { assignee } = args;
    
    const allTasks = await this.storage.queryTasks();
    const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS');
    const blockedTasks = allTasks.filter(t => t.status === 'BLOCKED');
    const recentlyCompleted = allTasks.filter(t => 
      t.status === 'DONE' && 
      new Date(t.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const focusTasks = assignee ? 
      allTasks.filter(t => t.assignee === assignee) :
      allTasks;
    
    return {
      description: assignee ? `Daily standup for ${assignee}` : 'Team daily standup',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Daily Standup ${assignee ? `- ${assignee}` : '- Team'}

## Yesterday's Completed Work
${recentlyCompleted.length > 0 ?
  recentlyCompleted
    .filter(t => !assignee || t.assignee === assignee)
    .map(task => `- ✅ **${task.epic_num}.${task.story_num}**: ${task.title}`)
    .join('\n')
  : '- No tasks completed yesterday'}

## Today's In Progress Work
${inProgressTasks.length > 0 ?
  inProgressTasks
    .filter(t => !assignee || t.assignee === assignee)
    .map(task => `- 🔄 **${task.epic_num}.${task.story_num}**: ${task.title}`)
    .join('\n')
  : '- No tasks currently in progress'}

## Blockers and Issues
${blockedTasks.length > 0 ?
  blockedTasks
    .filter(t => !assignee || t.assignee === assignee)
    .map(task => `- 🚫 **${task.epic_num}.${task.story_num}**: ${task.title}`)
    .join('\n')
  : '- No current blockers'}

## Team Overview
${!assignee ? `
- **Total Active Work**: ${inProgressTasks.length} tasks
- **Team Blockers**: ${blockedTasks.length} tasks
- **Recent Completions**: ${recentlyCompleted.length} tasks

### Work Distribution
${['dev', 'qa', 'sm', 'pm'].map(role => {
  const roleTasks = allTasks.filter(t => t.assignee === role && ['TODO', 'IN_PROGRESS'].includes(t.status));
  return `- **${role}**: ${roleTasks.length} active tasks`;
}).join('\n')}
` : ''}

## Standup Questions

Please provide updates on:

1. **What was accomplished yesterday?**
2. **What's planned for today?**
3. **Any blockers or impediments?**
4. **Any help needed from team members?**
5. **Are we on track for sprint goals?**

${assignee ? 
  `Focus on ${assignee}'s work and any cross-team dependencies.` :
  'Consider overall team coordination and sprint progress.'
}

Use bmad tools to get additional task details or update statuses as needed.`
          }
        }
      ]
    };
  }

  async taskHandoffPrompt(args) {
    const { task_id, from_assignee, to_assignee } = args;
    
    const task = await this.storage.getTask(task_id);
    if (!task) {
      throw new Error(`Task not found: ${task_id}`);
    }
    
    const epic = await this.storage.getEpic(task.epic_num);
    
    return {
      description: `Task handoff from ${from_assignee} to ${to_assignee}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Task Handoff: ${task.epic_num}.${task.story_num}

## Task Information
- **Title**: ${task.title}
- **Epic**: ${epic ? epic.title : `Epic ${task.epic_num}`}
- **Current Status**: ${task.status}
- **From**: ${from_assignee}
- **To**: ${to_assignee}

## Task Description
${task.description}

## Handoff Checklist

### Current Progress
- [ ] What work has been completed?
- [ ] What files/components were created or modified?
- [ ] What testing has been done?
- [ ] Are there any temporary workarounds in place?

### Technical Context
- [ ] What approach is being taken?
- [ ] Any architectural decisions made?
- [ ] Dependencies on other systems/components?
- [ ] Performance or security considerations?

### Outstanding Work
- [ ] What still needs to be done?
- [ ] Any known issues or edge cases?
- [ ] Acceptance criteria remaining?
- [ ] Testing requirements?

### Knowledge Transfer
- [ ] Code walkthrough completed?
- [ ] Documentation updated?
- [ ] Access permissions transferred?
- [ ] Tools and environments setup?

### Next Steps
- [ ] Immediate next actions defined?
- [ ] Timeline expectations set?
- [ ] Communication plan established?
- [ ] Handback criteria agreed upon?

## Handoff Notes

Please provide details for each section above. Consider:

1. **Technical State**: Exactly where is the implementation?
2. **Context**: Why were certain decisions made?
3. **Blockers**: What was preventing progress?
4. **Recommendations**: Best path forward?

Once the handoff is complete, use bmad_update_task_status to assign the task to ${to_assignee}.

## Task Metadata
- **Task ID**: ${task_id}
- **Created**: ${task.created_at}
- **Last Updated**: ${task.updated_at}
- **Priority**: ${task.priority}
- **Estimated Hours**: ${task.estimated_hours || 'Not estimated'}
- **Actual Hours**: ${task.actual_hours || 'Not tracked'}`
          }
        }
      ]
    };
  }
}

module.exports = BMadPrompts;