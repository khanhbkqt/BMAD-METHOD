/**
 * BMAD Tools - MCP Tool implementations for BMAD operations
 * These tools allow AI agents to perform actions on BMAD projects
 */

class BMadTools {
  constructor(storage) {
    this.storage = storage;
  }

  async listTools() {
    return [
      {
        name: 'bmad_create_story',
        description: 'Create a new story in an epic with automatic story numbering',
        inputSchema: {
          type: 'object',
          properties: {
            epic_num: {
              type: 'integer',
              description: 'Epic number to add the story to'
            },
            title: {
              type: 'string', 
              description: 'Story title'
            },
            description: {
              type: 'string',
              description: 'Detailed story description with acceptance criteria'
            },
            assignee: {
              type: 'string',
              description: 'Agent or person assigned to this story (e.g., "dev", "qa")',
              enum: ['dev', 'qa', 'sm', 'pm', 'architect', 'designer']
            },
            priority: {
              type: 'string',
              description: 'Story priority level',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            document_id: {
              type: 'string',
              description: 'Document ID to link this story to (optional)'
            },
            document_section: {
              type: 'string',
              description: 'Specific section within the document (optional)'
            }
          },
          required: ['epic_num', 'title', 'description']
        }
      },
      {
        name: 'bmad_update_task_status',
        description: 'Update the status of a task/story',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'Task/story ID to update'
            },
            status: {
              type: 'string',
              description: 'New status for the task',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']
            },
            assignee: {
              type: 'string',
              description: 'New assignee (optional)',
              enum: ['dev', 'qa', 'sm', 'pm', 'architect', 'designer']
            },
            actual_hours: {
              type: 'integer',
              description: 'Hours spent on this task (optional)'
            }
          },
          required: ['task_id', 'status']
        }
      },
      {
        name: 'bmad_get_next_story_number',
        description: 'Get the next available story number for an epic',
        inputSchema: {
          type: 'object',
          properties: {
            epic_num: {
              type: 'integer',
              description: 'Epic number to get next story for'
            }
          },
          required: ['epic_num']
        }
      },
      {
        name: 'bmad_create_epic',
        description: 'Create a new epic for grouping related stories',
        inputSchema: {
          type: 'object',
          properties: {
            epic_num: {
              type: 'integer',
              description: 'Epic number (must be unique)'
            },
            title: {
              type: 'string',
              description: 'Epic title'
            },
            description: {
              type: 'string',
              description: 'Epic description and goals'
            },
            priority: {
              type: 'string',
              description: 'Epic priority level',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            }
          },
          required: ['epic_num', 'title', 'description']
        }
      },
      {
        name: 'bmad_query_epics',
        description: 'Query epics with optional filters to find specific epics',
        inputSchema: {
          type: 'object',
          properties: {
            priority: {
              type: 'string',
              description: 'Filter by epic priority',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
            },
            epic_num: {
              type: 'integer',
              description: 'Get specific epic by number'
            }
          }
        }
      },
      {
        name: 'bmad_query_tasks',
        description: 'Query tasks with filters to find specific stories',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              oneOf: [
                { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] },
                { type: 'array', items: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] } }
              ],
              description: 'Filter by task status (can be single status or array)'
            },
            epic_num: {
              type: 'integer',
              description: 'Filter by epic number'
            },
            assignee: {
              type: 'string',
              description: 'Filter by assignee',
              enum: ['dev', 'qa', 'sm', 'pm', 'architect', 'designer']
            },
            sprint_id: {
              type: 'string',
              description: 'Filter by sprint ID'
            }
          }
        }
      },
      {
        name: 'bmad_get_project_progress',
        description: 'Get overall project progress and statistics',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'bmad_create_document',
        description: 'Create or update a project document (PRD, Architecture, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Document type',
              enum: ['prd', 'architecture', 'epic', 'meeting_notes', 'technical_spec']
            },
            title: {
              type: 'string',
              description: 'Document title'
            },
            content: {
              type: 'string',
              description: 'Document content in markdown format'
            },
            status: {
              type: 'string',
              description: 'Document status',
              enum: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED']
            }
          },
          required: ['type', 'title', 'content']
        }
      },
      {
        name: 'bmad_create_sprint',
        description: 'Create a new sprint for project planning',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Sprint name (e.g., "Sprint 2024-Q1")'
            },
            goal: {
              type: 'string',
              description: 'Sprint goal and objectives'
            },
            start_date: {
              type: 'string',
              description: 'Sprint start date (YYYY-MM-DD format)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            end_date: {
              type: 'string',
              description: 'Sprint end date (YYYY-MM-DD format)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            }
          },
          required: ['name', 'goal']
        }
      },
      {
        name: 'bmad_get_current_sprint',
        description: 'Get the currently active sprint',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'bmad_update_sprint_status',
        description: 'Update sprint status (activate, complete, close)',
        inputSchema: {
          type: 'object',
          properties: {
            sprint_id: {
              type: 'string',
              description: 'Sprint ID to update'
            },
            status: {
              type: 'string',
              description: 'New sprint status',
              enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']
            },
            end_date: {
              type: 'string',
              description: 'Actual end date (for completion)',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$'
            },
            goal_achievement: {
              type: 'string',
              description: 'Goal achievement level for completed sprints',
              enum: ['FULLY_ACHIEVED', 'MOSTLY_ACHIEVED', 'PARTIALLY_ACHIEVED', 'MINIMALLY_ACHIEVED', 'NOT_ACHIEVED']
            },
            completion_rate: {
              type: 'string',
              description: 'Story completion percentage'
            },
            velocity: {
              type: 'string',
              description: 'Sprint velocity (stories per week)'
            },
            lessons_learned: {
              type: 'string',
              description: 'Retrospective summary and lessons learned'
            }
          },
          required: ['sprint_id', 'status']
        }
      },
      {
        name: 'bmad_assign_story_to_sprint',
        description: 'Assign a story/task to a specific sprint',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'Task/story ID to assign'
            },
            sprint_id: {
              type: 'string',
              description: 'Sprint ID to assign task to (null to remove from sprint)'
            }
          },
          required: ['task_id']
        }
      },
      {
        name: 'bmad_get_document_sections',
        description: 'Get all sections from a document by parsing its markdown content',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'Document ID to get sections from'
            }
          },
          required: ['document_id']
        }
      },
      {
        name: 'bmad_get_document_by_section',
        description: 'Get a document with focus on a specific section',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'Document ID'
            },
            section_id: {
              type: 'string',
              description: 'Section ID (e.g., "user-authentication", "system-architecture")'
            }
          },
          required: ['document_id', 'section_id']
        }
      },
      {
        name: 'bmad_link_entity_to_document',
        description: 'Link a task, epic, or sprint to a specific document section',
        inputSchema: {
          type: 'object',
          properties: {
            entity_type: {
              type: 'string',
              description: 'Type of entity to link',
              enum: ['task', 'epic', 'sprint']
            },
            entity_id: {
              type: 'string',
              description: 'ID of the entity to link'
            },
            document_id: {
              type: 'string',
              description: 'Document ID to link to'
            },
            document_section: {
              type: 'string',
              description: 'Specific section ID within the document (optional)'
            },
            link_purpose: {
              type: 'string',
              description: 'Purpose of the link (e.g., "requirements", "reference", "implementation")'
            }
          },
          required: ['entity_type', 'entity_id', 'document_id']
        }
      },
      {
        name: 'bmad_unlink_entity_from_document',
        description: 'Remove link between entity and document',
        inputSchema: {
          type: 'object',
          properties: {
            entity_type: {
              type: 'string',
              description: 'Type of entity to unlink',
              enum: ['task', 'epic', 'sprint']
            },
            entity_id: {
              type: 'string',
              description: 'ID of the entity to unlink'
            },
            document_id: {
              type: 'string',
              description: 'Document ID to unlink from'
            },
            document_section: {
              type: 'string',
              description: 'Specific section to unlink (optional - if not provided, removes all links to document)'
            }
          },
          required: ['entity_type', 'entity_id', 'document_id']
        }
      },
      {
        name: 'bmad_get_entity_document_links',
        description: 'Get all documents linked to a specific entity',
        inputSchema: {
          type: 'object',
          properties: {
            entity_type: {
              type: 'string',
              description: 'Type of entity',
              enum: ['task', 'epic', 'sprint']
            },
            entity_id: {
              type: 'string',
              description: 'ID of the entity'
            }
          },
          required: ['entity_type', 'entity_id']
        }
      },
      {
        name: 'bmad_get_entities_linked_to_document',
        description: 'Get all tasks, epics, and sprints linked to a document or section',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: {
              type: 'string',
              description: 'Document ID'
            },
            section_id: {
              type: 'string',
              description: 'Specific section ID (optional)'
            }
          },
          required: ['document_id']
        }
      }
    ];
  }

  async callTool(name, args) {
    switch (name) {
      case 'bmad_create_story':
        return await this.createStory(args);
      case 'bmad_update_task_status':
        return await this.updateTaskStatus(args);
      case 'bmad_get_next_story_number':
        return await this.getNextStoryNumber(args);
      case 'bmad_create_epic':
        return await this.createEpic(args);
      case 'bmad_query_epics':
        return await this.queryEpics(args);
      case 'bmad_query_tasks':
        return await this.queryTasks(args);
      case 'bmad_get_project_progress':
        return await this.getProjectProgress(args);
      case 'bmad_create_document':
        return await this.createDocument(args);
      case 'bmad_create_sprint':
        return await this.createSprint(args);
      case 'bmad_get_current_sprint':
        return await this.getCurrentSprint(args);
      case 'bmad_update_sprint_status':
        return await this.updateSprintStatus(args);
      case 'bmad_assign_story_to_sprint':
        return await this.assignStoryToSprint(args);
      case 'bmad_get_document_sections':
        return await this.getDocumentSections(args);
      case 'bmad_get_document_by_section':
        return await this.getDocumentBySection(args);
      case 'bmad_link_entity_to_document':
        return await this.linkEntityToDocument(args);
      case 'bmad_unlink_entity_from_document':
        return await this.unlinkEntityFromDocument(args);
      case 'bmad_get_entity_document_links':
        return await this.getEntityDocumentLinks(args);
      case 'bmad_get_entities_linked_to_document':
        return await this.getEntitiesLinkedToDocument(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async createStory(args) {
    const { epic_num, title, description, assignee, priority, document_id, document_section } = args;
    
    // Ensure epic exists
    let epic = await this.storage.getEpic(epic_num);
    if (!epic) {
      // Auto-create epic if it doesn't exist
      epic = await this.storage.createEpic(epic_num, `Epic ${epic_num}`, `Auto-created epic ${epic_num}`);
    }
    
    // Get next story number
    const storyNum = await this.storage.getNextStoryNum(epic_num);
    
    // Create the story
    const task = await this.storage.createTask(epic_num, storyNum, title, description, assignee);
    
    // Update priority if specified
    if (priority) {
      await this.storage.updateTask(task.id, { priority });
    }
    
    // Link to document if specified
    let docInfo = '';
    if (document_id) {
      await this.storage.linkEntityToDocument('task', task.id, document_id, document_section, 'requirements');
      docInfo = ` linked to document ${document_id}${document_section ? ` section "${document_section}"` : ''}`;
    }
    
    return {
      success: true,
      story: {
        id: task.id,
        epic_num,
        story_num: storyNum,
        title,
        description,
        status: 'TODO',
        assignee: assignee || null,
        priority: priority || 'MEDIUM'
      },
      message: `Created story ${epic_num}.${storyNum}: ${title}${docInfo}`
    };
  }

  async updateTaskStatus(args) {
    const { task_id, status, assignee, actual_hours } = args;
    
    // Verify task exists
    const task = await this.storage.getTask(task_id);
    if (!task) {
      throw new Error(`Task not found: ${task_id}`);
    }
    
    // Prepare updates
    const updates = { status };
    if (assignee) updates.assignee = assignee;
    if (actual_hours !== undefined) updates.actual_hours = actual_hours;
    
    // Update task
    await this.storage.updateTask(task_id, updates);
    
    // Get updated task
    const updatedTask = await this.storage.getTask(task_id);
    
    return {
      success: true,
      task: updatedTask,
      message: `Updated task ${task.epic_num}.${task.story_num} status to ${status}`
    };
  }

  async getNextStoryNumber(args) {
    const { epic_num } = args;
    
    const nextNum = await this.storage.getNextStoryNum(epic_num);
    
    return {
      epic_num,
      next_story_number: nextNum,
      message: `Next story number for Epic ${epic_num} is ${nextNum}`
    };
  }

  async createEpic(args) {
    const { epic_num, title, description, priority } = args;
    
    // Check if epic already exists
    const existing = await this.storage.getEpic(epic_num);
    if (existing) {
      throw new Error(`Epic ${epic_num} already exists`);
    }
    
    const epic = await this.storage.createEpic(epic_num, title, description);
    
    // Update priority if specified
    if (priority) {
      await this.storage.run(
        'UPDATE epics SET priority = ? WHERE id = ?',
        [priority, epic.id]
      );
    }
    
    return {
      success: true,
      epic: {
        id: epic.id,
        epic_num,
        title,
        description,
        status: 'TODO',
        priority: priority || 'MEDIUM'
      },
      message: `Created Epic ${epic_num}: ${title}`
    };
  }

  async queryEpics(args) {
    const { priority, epic_num } = args;
    
    let query = 'SELECT * FROM epics WHERE 1=1';
    const params = [];
    
    if (epic_num) {
      query += ' AND epic_num = ?';
      params.push(epic_num);
    }
    
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY epic_num';
    
    const epics = await this.storage.all(query, params);
    
    return {
      epics,
      count: epics.length,
      message: `Found ${epics.length} epic(s)`
    };
  }

  async queryTasks(args) {
    const tasks = await this.storage.queryTasks(args);
    
    return {
      tasks,
      count: tasks.length,
      filters: args,
      message: `Found ${tasks.length} tasks matching criteria`
    };
  }

  async getProjectProgress(args) {
    const progress = await this.storage.getProjectProgress();
    const project = await this.storage.getProject();
    const epics = await this.storage.listEpics();
    const sprints = await this.storage.listSprints();
    
    // Calculate completion percentages
    const totalTasks = progress.totalTasks;
    const doneTasks = progress.byStatus.DONE || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    return {
      project: {
        name: project.name,
        description: project.description,
        total_tasks: totalTasks,
        completion_percentage: completionPercentage
      },
      task_status: progress.byStatus,
      epics_summary: progress.byEpic,
      epic_count: epics.length,
      sprint_count: sprints.length,
      active_sprint: await this.storage.getActiveSprint(),
      message: `Project "${project.name}" is ${completionPercentage}% complete with ${totalTasks} total tasks`
    };
  }

  async createDocument(args) {
    const { type, title, content, status } = args;
    
    const document = await this.storage.createDocument(type, title, content, status);
    
    return {
      success: true,
      document,
      message: `Created ${type} document: ${title}`
    };
  }

  async createSprint(args) {
    const { name, goal, start_date, end_date } = args;
    
    // Check for existing active sprint
    const activeSprint = await this.storage.getActiveSprint();
    if (activeSprint) {
      throw new Error(`Cannot create sprint: Active sprint "${activeSprint.name}" already exists. Close it first.`);
    }
    
    const sprint = await this.storage.createSprint(name, goal, start_date, end_date);
    
    // Activate the sprint immediately
    await this.storage.run(
      'UPDATE sprints SET status = ? WHERE id = ?',
      ['ACTIVE', sprint.id]
    );
    
    return {
      success: true,
      sprint: {
        ...sprint,
        status: 'ACTIVE'
      },
      message: `Created and activated sprint: ${name}`
    };
  }

  async getCurrentSprint(args) {
    const sprint = await this.storage.getActiveSprint();
    
    if (!sprint) {
      return {
        sprint: null,
        message: 'No active sprint found'
      };
    }

    // Get sprint statistics
    const sprintTasks = await this.storage.queryTasks({ sprint_id: sprint.id });
    const completedTasks = sprintTasks.filter(task => task.status === 'DONE');
    
    return {
      sprint: {
        ...sprint,
        total_tasks: sprintTasks.length,
        completed_tasks: completedTasks.length,
        completion_rate: sprintTasks.length > 0 ? Math.round((completedTasks.length / sprintTasks.length) * 100) : 0
      },
      message: `Active sprint: ${sprint.name}`
    };
  }

  async updateSprintStatus(args) {
    const { sprint_id, status, end_date, goal_achievement, completion_rate, velocity, lessons_learned } = args;
    
    // Verify sprint exists
    const sprint = await this.storage.get('SELECT * FROM sprints WHERE id = ?', [sprint_id]);
    if (!sprint) {
      throw new Error(`Sprint not found: ${sprint_id}`);
    }
    
    // Prepare updates
    const updates = { status };
    if (end_date) updates.end_date = end_date;
    
    // For completed sprints, store additional metrics
    if (status === 'COMPLETED') {
      const metadata = {
        goal_achievement,
        completion_rate,
        velocity,
        lessons_learned
      };
      updates.metadata = JSON.stringify(metadata);
      
      // If no end_date provided, use current date
      if (!end_date) {
        updates.end_date = new Date().toISOString().split('T')[0];
      }
    }
    
    // Update sprint
    const fields = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);
    values.push(sprint_id);
    
    await this.storage.run(
      `UPDATE sprints SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    // Get updated sprint
    const updatedSprint = await this.storage.get('SELECT * FROM sprints WHERE id = ?', [sprint_id]);
    
    return {
      success: true,
      sprint: updatedSprint,
      message: `Updated sprint "${sprint.name}" status to ${status}`
    };
  }

  async assignStoryToSprint(args) {
    const { task_id, sprint_id } = args;
    
    // Verify task exists
    const task = await this.storage.getTask(task_id);
    if (!task) {
      throw new Error(`Task not found: ${task_id}`);
    }
    
    // If sprint_id provided, verify sprint exists
    if (sprint_id) {
      const sprint = await this.storage.get('SELECT * FROM sprints WHERE id = ?', [sprint_id]);
      if (!sprint) {
        throw new Error(`Sprint not found: ${sprint_id}`);
      }
    }
    
    // Update task sprint assignment
    await this.storage.updateTask(task_id, { sprint_id });
    
    // Get updated task
    const updatedTask = await this.storage.getTask(task_id);
    
    const message = sprint_id 
      ? `Assigned story ${task.epic_num}.${task.story_num} to sprint`
      : `Removed story ${task.epic_num}.${task.story_num} from sprint`;
    
    return {
      success: true,
      task: updatedTask,
      message
    };
  }

  async getDocumentSections(args) {
    const { document_id } = args;
    
    try {
      const sections = await this.storage.getDocumentSections(document_id);
      
      return {
        success: true,
        document_id,
        sections: sections,
        section_count: sections.length,
        message: `Found ${sections.length} sections in document`
      };
    } catch (error) {
      throw new Error(`Failed to get document sections: ${error.message}`);
    }
  }

  async getDocumentBySection(args) {
    const { document_id, section_id } = args;
    
    try {
      const documentWithSection = await this.storage.getDocumentBySection(document_id, section_id);
      
      if (!documentWithSection) {
        throw new Error(`Document ${document_id} or section ${section_id} not found`);
      }
      
      return {
        success: true,
        document: documentWithSection,
        message: `Retrieved document section: ${documentWithSection.focused_section.section_title}`
      };
    } catch (error) {
      throw new Error(`Failed to get document by section: ${error.message}`);
    }
  }

  async linkEntityToDocument(args) {
    const { entity_type, entity_id, document_id, document_section, link_purpose } = args;
    
    try {
      await this.storage.linkEntityToDocument(entity_type, entity_id, document_id, document_section, link_purpose);
      
      const entityName = entity_type === 'task' ? 'Story' : 
                         entity_type === 'epic' ? 'Epic' : 'Sprint';
      
      const sectionInfo = document_section ? ` section "${document_section}"` : '';
      
      return {
        success: true,
        entity_type,
        entity_id,
        document_id,
        document_section,
        link_purpose,
        message: `Linked ${entityName} ${entity_id} to document ${document_id}${sectionInfo}`
      };
    } catch (error) {
      throw new Error(`Failed to link entity to document: ${error.message}`);
    }
  }

  async unlinkEntityFromDocument(args) {
    const { entity_type, entity_id, document_id, document_section } = args;
    
    try {
      await this.storage.unlinkEntityFromDocument(entity_type, entity_id, document_id, document_section);
      
      const entityName = entity_type === 'task' ? 'Story' : 
                         entity_type === 'epic' ? 'Epic' : 'Sprint';
      
      const sectionInfo = document_section ? ` section "${document_section}"` : '';
      
      return {
        success: true,
        entity_type,
        entity_id,
        document_id,
        document_section,
        message: `Unlinked ${entityName} ${entity_id} from document ${document_id}${sectionInfo}`
      };
    } catch (error) {
      throw new Error(`Failed to unlink entity from document: ${error.message}`);
    }
  }

  async getEntityDocumentLinks(args) {
    const { entity_type, entity_id } = args;
    
    try {
      const links = await this.storage.getEntityDocumentLinks(entity_type, entity_id);
      
      const entityName = entity_type === 'task' ? 'Story' : 
                         entity_type === 'epic' ? 'Epic' : 'Sprint';
      
      return {
        success: true,
        entity_type,
        entity_id,
        links,
        link_count: links.length,
        message: `Found ${links.length} document links for ${entityName} ${entity_id}`
      };
    } catch (error) {
      throw new Error(`Failed to get entity document links: ${error.message}`);
    }
  }

  async getEntitiesLinkedToDocument(args) {
    const { document_id, section_id } = args;
    
    try {
      const entities = await this.storage.getEntitiesLinkedToDocument(document_id, section_id);
      
      const totalCount = entities.tasks.length + entities.epics.length + entities.sprints.length;
      const sectionInfo = section_id ? ` section "${section_id}"` : '';
      
      return {
        success: true,
        document_id,
        section_id,
        entities,
        summary: {
          total_entities: totalCount,
          tasks: entities.tasks.length,
          epics: entities.epics.length,
          sprints: entities.sprints.length
        },
        message: `Found ${totalCount} entities linked to document ${document_id}${sectionInfo}`
      };
    } catch (error) {
      throw new Error(`Failed to get entities linked to document: ${error.message}`);
    }
  }
}

module.exports = BMadTools;