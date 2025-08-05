const BaseService = require('./BaseService');

/**
 * Project Service
 * Handles project-level operations and analytics
 */
class ProjectService extends BaseService {
  constructor(storage, logger) {
    super(storage, logger);
    this.taskService = null; // Will be injected to avoid circular dependencies
    this.sprintService = null;
  }

  /**
   * Set service dependencies (dependency injection)
   * @param {TaskService} taskService - Task service instance
   * @param {SprintService} sprintService - Sprint service instance
   */
  setDependencies(taskService, sprintService) {
    this.taskService = taskService;
    this.sprintService = sprintService;
  }

  /**
   * Get comprehensive project progress statistics
   * @returns {Promise<Object>} Project progress data
   */
  async getProjectProgress() {
    return this.executeWithLogging(async () => {
      // Get all tasks
      const allTasksResult = await this.taskService.queryTasks();
      const allTasks = allTasksResult.data;

      // Get current sprint info
      const currentSprintResult = await this.sprintService.getCurrentSprint();
      const currentSprint = currentSprintResult.data;

      // Calculate overall progress
      const progress = {
        overview: {
          totalTasks: allTasks.length,
          completedTasks: allTasks.filter(t => t.status === 'DONE').length,
          inProgressTasks: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
          blockedTasks: allTasks.filter(t => t.status === 'BLOCKED').length,
          todoTasks: allTasks.filter(t => t.status === 'TODO').length,
          completionPercentage: allTasks.length > 0 ? 
            Math.round((allTasks.filter(t => t.status === 'DONE').length / allTasks.length) * 100) : 0
        },
        
        byPriority: {
          HIGH: this.getTasksByPriority(allTasks, 'HIGH'),
          MEDIUM: this.getTasksByPriority(allTasks, 'MEDIUM'),
          LOW: this.getTasksByPriority(allTasks, 'LOW')
        },

        byEpic: await this.getProgressByEpic(allTasks),

        currentSprint: currentSprint ? {
          name: currentSprint.name,
          goal: currentSprint.goal,
          progress: currentSprint.progress,
          tasksInSprint: allTasks.filter(t => t.sprint_id === currentSprint.id).length
        } : null,

        velocity: await this.calculateVelocity(),
        
        timeline: await this.getProjectTimeline()
      };

      return this.createResponse(progress, 'Project progress calculated', {
        calculatedAt: new Date().toISOString(),
        projectHealth: this.assessProjectHealth(progress)
      });
    }, 'getProjectProgress');
  }

  /**
   * Get project information and metadata
   * @returns {Promise<Object>} Project information
   */
  async getProjectInfo() {
    return this.executeWithLogging(async () => {
      // Get basic project stats
      const allTasksResult = await this.taskService.queryTasks();
      const allTasks = allTasksResult.data;
      
      const allSprintsResult = await this.sprintService.getAllSprints();
      const allSprints = allSprintsResult.data;

      // Get epic count
      const epics = await this.storage.queryEpics();

      const info = {
        name: await this.getProjectName(),
        description: 'BMad Method Project',
        statistics: {
          totalTasks: allTasks.length,
          totalEpics: epics.length,
          totalSprints: allSprints.length,
          activeSprints: allSprints.filter(s => s.status === 'ACTIVE').length
        },
        
        configuration: {
          databasePath: this.storage.dbPath,
          createdAt: await this.getProjectCreationDate(),
          lastActivity: await this.getLastActivityDate()
        },

        health: {
          status: this.getProjectHealthStatus(allTasks),
          blockedTasks: allTasks.filter(t => t.status === 'BLOCKED').length,
          overdueItems: await this.getOverdueCount()
        }
      };

      return this.createResponse(info, 'Project information retrieved');
    }, 'getProjectInfo');
  }

  /**
   * Generate project analytics and insights
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Project analytics
   */
  async getProjectAnalytics(options = {}) {
    return this.executeWithLogging(async () => {
      const dateRange = options.days || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);

      // Get recent tasks
      const allTasksResult = await this.taskService.queryTasks();
      const allTasks = allTasksResult.data;
      const recentTasks = allTasks.filter(t => 
        new Date(t.created_at) >= cutoffDate
      );

      const analytics = {
        productivity: {
          tasksCreatedLast30Days: recentTasks.length,
          tasksCompletedLast30Days: recentTasks.filter(t => t.status === 'DONE').length,
          averageCompletionTime: await this.calculateAverageCompletionTime(),
          productivityTrend: await this.calculateProductivityTrend(dateRange)
        },

        quality: {
          blockedTasksRatio: allTasks.length > 0 ? 
            (allTasks.filter(t => t.status === 'BLOCKED').length / allTasks.length * 100).toFixed(2) : 0,
          reworkRate: await this.calculateReworkRate(),
          defectRate: await this.calculateDefectRate()
        },

        efficiency: {
          cycleTime: await this.calculateCycleTime(),
          throughput: await this.calculateThroughput(dateRange),
          burndownRate: await this.calculateBurndownRate()
        },

        predictions: {
          estimatedCompletion: await this.predictProjectCompletion(),
          remainingEffort: await this.estimateRemainingEffort(),
          riskFactors: await this.identifyRiskFactors()
        }
      };

      return this.createResponse(analytics, 'Project analytics generated', {
        analysisDate: new Date().toISOString(),
        dateRange: `${dateRange} days`,
        dataPoints: allTasks.length
      });
    }, 'getProjectAnalytics');
  }

  /**
   * Export project data in various formats
   * @param {string} format - Export format (json, csv, summary)
   * @returns {Promise<Object>} Exported data
   */
  async exportProjectData(format = 'json') {
    return this.executeWithLogging(async () => {
      const allTasksResult = await this.taskService.queryTasks();
      const allSprintsResult = await this.sprintService.getAllSprints();
      const epics = await this.storage.queryEpics();

      const exportData = {
        exportDate: new Date().toISOString(),
        project: await this.getProjectInfo(),
        tasks: allTasksResult.data,
        sprints: allSprintsResult.data,
        epics: epics,
        progress: await this.getProjectProgress()
      };

      let formattedData;
      switch (format.toLowerCase()) {
        case 'csv':
          formattedData = this.formatAsCSV(exportData);
          break;
        case 'summary':
          formattedData = this.formatAsSummary(exportData);
          break;
        case 'json':
        default:
          formattedData = exportData;
          break;
      }

      return this.createResponse(formattedData, `Project data exported as ${format}`, {
        format: format,
        recordCount: {
          tasks: exportData.tasks.length,
          sprints: exportData.sprints.length,
          epics: exportData.epics.length
        }
      });
    }, 'exportProjectData');
  }

  // Private helper methods

  /**
   * Get tasks by priority with statistics
   * @param {Array} tasks - All tasks
   * @param {string} priority - Priority level
   * @returns {Object} Priority statistics
   */
  getTasksByPriority(tasks, priority) {
    const priorityTasks = tasks.filter(t => t.priority === priority);
    return {
      total: priorityTasks.length,
      completed: priorityTasks.filter(t => t.status === 'DONE').length,
      inProgress: priorityTasks.filter(t => t.status === 'IN_PROGRESS').length,
      blocked: priorityTasks.filter(t => t.status === 'BLOCKED').length,
      completionRate: priorityTasks.length > 0 ? 
        Math.round((priorityTasks.filter(t => t.status === 'DONE').length / priorityTasks.length) * 100) : 0
    };
  }

  /**
   * Get progress breakdown by epic
   * @param {Array} tasks - All tasks
   * @returns {Promise<Object>} Epic progress breakdown
   */
  async getProgressByEpic(tasks) {
    const epics = await this.storage.queryEpics();
    const epicProgress = {};

    for (const epic of epics) {
      const epicTasks = tasks.filter(t => t.epic_num === epic.epic_num);
      epicProgress[`epic_${epic.epic_num}`] = {
        title: epic.title || `Epic ${epic.epic_num}`,
        total: epicTasks.length,
        completed: epicTasks.filter(t => t.status === 'DONE').length,
        completionRate: epicTasks.length > 0 ? 
          Math.round((epicTasks.filter(t => t.status === 'DONE').length / epicTasks.length) * 100) : 0
      };
    }

    return epicProgress;
  }

  /**
   * Calculate project velocity (tasks completed per time period)
   * @returns {Promise<Object>} Velocity metrics
   */
  async calculateVelocity() {
    const allTasksResult = await this.taskService.queryTasks();
    const completedTasks = allTasksResult.data.filter(t => t.status === 'DONE');

    // Group by week
    const weeklyCompletion = {};
    completedTasks.forEach(task => {
      if (task.updated_at) {
        const week = this.getWeekKey(new Date(task.updated_at));
        weeklyCompletion[week] = (weeklyCompletion[week] || 0) + 1;
      }
    });

    const weeks = Object.keys(weeklyCompletion).sort();
    const velocities = Object.values(weeklyCompletion);
    
    return {
      averageWeeklyVelocity: velocities.length > 0 ? 
        Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length) : 0,
      last4WeeksAverage: velocities.slice(-4).length > 0 ?
        Math.round(velocities.slice(-4).reduce((a, b) => a + b, 0) / velocities.slice(-4).length) : 0,
      trend: this.calculateTrend(velocities.slice(-8))
    };
  }

  /**
   * Get project timeline milestones
   * @returns {Promise<Array>} Timeline events
   */
  async getProjectTimeline() {
    const allSprintsResult = await this.sprintService.getAllSprints();
    const sprints = allSprintsResult.data;

    return sprints.map(sprint => ({
      type: 'sprint',
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      progress: sprint.progress?.completionPercentage || 0
    })).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }

  /**
   * Assess overall project health
   * @param {Object} progress - Progress data
   * @returns {string} Health status
   */
  assessProjectHealth(progress) {
    const completionRate = progress.overview.completionPercentage;
    const blockedRatio = progress.overview.totalTasks > 0 ? 
      (progress.overview.blockedTasks / progress.overview.totalTasks) * 100 : 0;

    if (blockedRatio > 20) return 'CRITICAL';
    if (blockedRatio > 10 || completionRate < 30) return 'WARNING';
    if (completionRate > 70) return 'EXCELLENT';
    return 'GOOD';
  }

  /**
   * Additional helper methods for analytics
   */
  async getProjectName() {
    // Try to get from package.json or use default
    return 'BMad Method Project';
  }

  async getProjectCreationDate() {
    // Get earliest task creation date
    const allTasksResult = await this.taskService.queryTasks();
    const tasks = allTasksResult.data;
    
    if (tasks.length === 0) return new Date().toISOString();
    
    const earliest = tasks.reduce((min, task) => 
      new Date(task.created_at) < new Date(min.created_at) ? task : min
    );
    
    return earliest.created_at;
  }

  async getLastActivityDate() {
    const allTasksResult = await this.taskService.queryTasks();
    const tasks = allTasksResult.data;
    
    if (tasks.length === 0) return new Date().toISOString();
    
    const latest = tasks.reduce((max, task) => 
      new Date(task.updated_at || task.created_at) > new Date(max.updated_at || max.created_at) ? task : max
    );
    
    return latest.updated_at || latest.created_at;
  }

  getProjectHealthStatus(tasks) {
    const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) return 'UNKNOWN';
    if (blockedCount / totalTasks > 0.2) return 'CRITICAL';
    if (blockedCount / totalTasks > 0.1) return 'WARNING';
    return 'HEALTHY';
  }

  async getOverdueCount() {
    // This would require due dates on tasks - placeholder for now
    return 0;
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week}`;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'STABLE';
    
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const older = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 3);
    
    if (recent > older * 1.1) return 'IMPROVING';
    if (recent < older * 0.9) return 'DECLINING';
    return 'STABLE';
  }

  // Placeholder methods for advanced analytics
  async calculateAverageCompletionTime() { return 0; }
  async calculateProductivityTrend() { return 'STABLE'; }
  async calculateReworkRate() { return 0; }
  async calculateDefectRate() { return 0; }
  async calculateCycleTime() { return 0; }
  async calculateThroughput() { return 0; }
  async calculateBurndownRate() { return 0; }
  async predictProjectCompletion() { return null; }
  async estimateRemainingEffort() { return 0; }
  async identifyRiskFactors() { return []; }

  formatAsCSV(data) {
    // CSV formatting logic
    return 'CSV export not implemented yet';
  }

  formatAsSummary(data) {
    // Summary formatting logic
    return {
      projectName: data.project.data.name,
      totalTasks: data.tasks.length,
      completionRate: data.progress.data.overview.completionPercentage,
      currentSprint: data.progress.data.currentSprint?.name || 'None',
      generatedAt: data.exportDate
    };
  }
}

module.exports = ProjectService;