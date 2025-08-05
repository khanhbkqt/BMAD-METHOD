/**
 * BMAD Resources - MCP Resource implementations for BMAD data access
 * These resources allow AI agents to read project data and context
 */

class BMadResources {
  constructor(storage) {
    this.storage = storage;
  }

  async listResources() {
    // Get dynamic resource list based on current project state
    const project = await this.storage.getProject();
    const epics = await this.storage.listEpics();
    const documents = await this.storage.listDocuments();
    
    const resources = [
      // Project-level resources
      {
        uri: 'bmad://project/info',
        name: 'Project Information',
        description: 'Current project metadata and overview',
        mimeType: 'application/json'
      },
      {
        uri: 'bmad://project/progress',
        name: 'Project Progress',
        description: 'Real-time project progress and statistics',
        mimeType: 'application/json'
      },
      
      // Task resources
      {
        uri: 'bmad://tasks/all',
        name: 'All Tasks',
        description: 'Complete list of all tasks in the project',
        mimeType: 'application/json'
      },
      {
        uri: 'bmad://tasks/todo',
        name: 'TODO Tasks',
        description: 'Tasks that are ready to be worked on',
        mimeType: 'application/json'
      },
      {
        uri: 'bmad://tasks/in-progress',
        name: 'In Progress Tasks',
        description: 'Tasks currently being worked on',
        mimeType: 'application/json'
      },
      {
        uri: 'bmad://tasks/blocked',
        name: 'Blocked Tasks',
        description: 'Tasks that are blocked and need attention',
        mimeType: 'application/json'
      },
      
      // Epic resources
      {
        uri: 'bmad://epics/all',
        name: 'All Epics',
        description: 'Complete list of all epics in the project',
        mimeType: 'application/json'
      }
    ];

    // Add dynamic epic-specific resources
    for (const epic of epics) {
      resources.push({
        uri: `bmad://epics/${epic.epic_num}/tasks`,
        name: `Epic ${epic.epic_num} Tasks`,
        description: `All tasks in Epic ${epic.epic_num}: ${epic.title}`,
        mimeType: 'application/json'
      });
      
      resources.push({
        uri: `bmad://epics/${epic.epic_num}/progress`,
        name: `Epic ${epic.epic_num} Progress`,
        description: `Progress statistics for Epic ${epic.epic_num}`,
        mimeType: 'application/json'
      });
    }

    // Add document resources
    for (const doc of documents) {
      resources.push({
        uri: `bmad://documents/${doc.type}/${doc.id}`,
        name: `${doc.type.toUpperCase()}: ${doc.title}`,
        description: `${doc.type} document - ${doc.title}`,
        mimeType: doc.type === 'prd' || doc.type === 'architecture' ? 'text/markdown' : 'text/plain'
      });
    }

    // Add special document type resources
    const prdDocs = documents.filter(d => d.type === 'prd');
    if (prdDocs.length > 0) {
      resources.push({
        uri: 'bmad://project/prd',
        name: 'Product Requirements Document',
        description: 'Current PRD for the project',
        mimeType: 'text/markdown'
      });
    }

    const archDocs = documents.filter(d => d.type === 'architecture');
    if (archDocs.length > 0) {
      resources.push({
        uri: 'bmad://project/architecture',
        name: 'System Architecture',
        description: 'Current system architecture document',
        mimeType: 'text/markdown'
      });
    }

    return resources;
  }

  async readResource(uri) {
    // Parse bmad:// URIs manually since they're custom protocol
    if (!uri.startsWith('bmad://')) {
      throw new Error(`Invalid BMAD resource URI: ${uri}`);
    }
    
    const path = uri.replace('bmad://', '');
    const pathParts = path.split('/').filter(p => p);

    switch (pathParts[0]) {
      case 'project':
        return await this.readProjectResource(pathParts.slice(1));
      case 'tasks':
        return await this.readTaskResource(pathParts.slice(1));
      case 'epics':
        return await this.readEpicResource(pathParts.slice(1));
      case 'documents':
        return await this.readDocumentResource(pathParts.slice(1));
      default:
        throw new Error(`Unknown resource type: ${pathParts[0]}`);
    }
  }

  async readProjectResource(pathParts) {
    switch (pathParts[0]) {
      case 'info': {
        const project = await this.storage.getProject();
        const epics = await this.storage.listEpics();
        const sprints = await this.storage.listSprints();
        
        return {
          mimeType: 'application/json',
          text: JSON.stringify({
            ...project,
            epic_count: epics.length,
            sprint_count: sprints.length,
            epics: epics.map(e => ({
              epic_num: e.epic_num,
              title: e.title,
              status: e.status
            }))
          }, null, 2)
        };
      }
      
      case 'progress': {
        const progress = await this.storage.getProjectProgress();
        const project = await this.storage.getProject();
        
        const totalTasks = progress.totalTasks;
        const doneTasks = progress.byStatus.DONE || 0;
        const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        
        return {
          mimeType: 'application/json',
          text: JSON.stringify({
            project_name: project.name,
            total_tasks: totalTasks,
            completion_percentage: completionPercentage,
            task_breakdown: progress.byStatus,
            epic_breakdown: progress.byEpic,
            active_sprint: await this.storage.getActiveSprint()
          }, null, 2)
        };
      }
      
      case 'prd': {
        const prdDocs = await this.storage.listDocuments('prd');
        if (prdDocs.length === 0) {
          throw new Error('No PRD document found');
        }
        
        const prd = prdDocs[0]; // Get latest PRD
        return {
          mimeType: 'text/markdown',
          text: `# ${prd.title}\n\n**Status:** ${prd.status}\n**Last Updated:** ${prd.updated_at}\n\n${prd.content}`
        };
      }
      
      case 'architecture': {
        const archDocs = await this.storage.listDocuments('architecture');
        if (archDocs.length === 0) {
          throw new Error('No architecture document found');
        }
        
        const arch = archDocs[0]; // Get latest architecture
        return {
          mimeType: 'text/markdown',
          text: `# ${arch.title}\n\n**Status:** ${arch.status}\n**Last Updated:** ${arch.updated_at}\n\n${arch.content}`
        };
      }
      
      default:
        throw new Error(`Unknown project resource: ${pathParts[0]}`);
    }
  }

  async readTaskResource(pathParts) {
    switch (pathParts[0]) {
      case 'all': {
        const tasks = await this.storage.queryTasks();
        return {
          mimeType: 'application/json',
          text: JSON.stringify({
            total_count: tasks.length,
            tasks: tasks.map(this.formatTask)
          }, null, 2)
        };
      }
      
      case 'todo':
        return await this.getTasksByStatus('TODO');
      case 'in-progress':
        return await this.getTasksByStatus('IN_PROGRESS');
      case 'blocked':
        return await this.getTasksByStatus('BLOCKED');
      
      default:
        throw new Error(`Unknown task resource: ${pathParts[0]}`);
    }
  }

  async readEpicResource(pathParts) {
    if (pathParts[0] === 'all') {
      const epics = await this.storage.listEpics();
      const epicsWithTasks = [];
      
      for (const epic of epics) {
        const tasks = await this.storage.queryTasks({ epic_num: epic.epic_num });
        epicsWithTasks.push({
          ...epic,
          task_count: tasks.length,
          completed_tasks: tasks.filter(t => t.status === 'DONE').length,
          completion_percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0
        });
      }
      
      return {
        mimeType: 'application/json',
        text: JSON.stringify({
          total_epics: epics.length,
          epics: epicsWithTasks
        }, null, 2)
      };
    }
    
    // Epic-specific resources
    const epicNum = parseInt(pathParts[0]);
    if (isNaN(epicNum)) {
      throw new Error(`Invalid epic number: ${pathParts[0]}`);
    }
    
    const epic = await this.storage.getEpic(epicNum);
    if (!epic) {
      throw new Error(`Epic ${epicNum} not found`);
    }
    
    switch (pathParts[1]) {
      case 'tasks': {
        const tasks = await this.storage.queryTasks({ epic_num: epicNum });
        return {
          mimeType: 'application/json',
          text: JSON.stringify({
            epic: {
              epic_num: epic.epic_num,
              title: epic.title,
              description: epic.description,
              status: epic.status
            },
            task_count: tasks.length,
            tasks: tasks.map(this.formatTask)
          }, null, 2)
        };
      }
      
      case 'progress': {
        const tasks = await this.storage.queryTasks({ epic_num: epicNum });
        const statusBreakdown = {};
        tasks.forEach(task => {
          statusBreakdown[task.status] = (statusBreakdown[task.status] || 0) + 1;
        });
        
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        
        return {
          mimeType: 'application/json',
          text: JSON.stringify({
            epic: {
              epic_num: epic.epic_num,
              title: epic.title,
              status: epic.status
            },
            total_tasks: tasks.length,
            completed_tasks: completedTasks,
            completion_percentage: completionPercentage,
            status_breakdown: statusBreakdown,
            remaining_work: tasks.filter(t => ['TODO', 'IN_PROGRESS'].includes(t.status)).length
          }, null, 2)
        };
      }
      
      default:
        throw new Error(`Unknown epic resource: ${pathParts[1]}`);
    }
  }

  async readDocumentResource(pathParts) {
    const [type, id] = pathParts;
    
    const document = await this.storage.getDocument(id);
    if (!document) {
      throw new Error(`Document not found: ${id}`);
    }
    
    return {
      mimeType: type === 'prd' || type === 'architecture' ? 'text/markdown' : 'text/plain',
      text: `# ${document.title}\n\n**Type:** ${document.type}\n**Status:** ${document.status}\n**Version:** ${document.version}\n**Last Updated:** ${document.updated_at}\n\n${document.content}`
    };
  }

  async getTasksByStatus(status) {
    const tasks = await this.storage.queryTasks({ status });
    return {
      mimeType: 'application/json',
      text: JSON.stringify({
        status,
        count: tasks.length,
        tasks: tasks.map(this.formatTask)
      }, null, 2)
    };
  }

  formatTask(task) {
    return {
      id: task.id,
      epic_story: `${task.epic_num}.${task.story_num}`,
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  }
}

module.exports = BMadResources;