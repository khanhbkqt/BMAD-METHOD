const BaseService = require('./BaseService');

/**
 * Task Service
 * Handles all task/story related operations with business logic
 */
class TaskService extends BaseService {
  constructor(storage, logger) {
    super(storage, logger);
    
    // Task status definitions
    this.TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'];
    this.PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
    this.DEFAULT_ASSIGNEE = 'dev';
  }

  /**
   * Create a new task with validation and business rules
   * @param {Object} taskData - Task creation data
   * @returns {Promise<Object>} Created task with metadata
   */
  async createTask(taskData) {
    return this.executeWithLogging(async () => {
      // Validate required fields
      this.validateRequired(taskData, ['title']);
      
      // Validate enums
      if (taskData.priority) {
        this.validateEnum(taskData.priority, this.PRIORITIES, 'priority');
      }
      if (taskData.status) {
        this.validateEnum(taskData.status, this.TASK_STATUSES, 'status');
      }

      // Sanitize inputs
      const sanitizedData = {
        title: this.sanitizeString(taskData.title),
        description: taskData.description ? this.sanitizeString(taskData.description) : null,
        status: taskData.status || 'TODO',
        assignee: taskData.assignee || this.DEFAULT_ASSIGNEE,
        priority: taskData.priority || 'MEDIUM',
        epic_num: taskData.epic_num || null,
        story_num: await this.getNextStoryNumber(taskData.epic_num)
      };

      // Business rule: Validate epic exists if epic_num provided
      if (sanitizedData.epic_num) {
        await this.validateEpicExists(sanitizedData.epic_num);
      }

      // Create task in database
      const task = await this.storage.createTask(sanitizedData);
      
      // Log creation
      this.logger.info(`Task created: ${task.id} - ${task.title}`);
      
      return this.createResponse(task, 'Task created successfully', {
        taskId: task.id,
        epicNum: task.epic_num,
        storyNum: task.story_num
      });
    }, 'createTask');
  }

  /**
   * Query tasks with filtering and pagination
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Filtered tasks with metadata
   */
  async queryTasks(filters = {}) {
    return this.executeWithLogging(async () => {
      // Validate filter values
      if (filters.status) {
        this.validateEnum(filters.status, this.TASK_STATUSES, 'status');
      }
      if (filters.priority) {
        this.validateEnum(filters.priority, this.PRIORITIES, 'priority');
      }

      // Sanitize string filters
      const sanitizedFilters = {
        ...filters,
        assignee: filters.assignee ? this.sanitizeString(filters.assignee) : undefined
      };

      // Query database
      const tasks = await this.storage.queryTasks(sanitizedFilters);
      
      // Calculate metadata
      const metadata = {
        total: tasks.length,
        statusBreakdown: this.getStatusBreakdown(tasks),
        priorityBreakdown: this.getPriorityBreakdown(tasks)
      };

      return this.createResponse(tasks, 'Tasks retrieved successfully', metadata);
    }, 'queryTasks');
  }

  /**
   * Update task status with business rules
   * @param {Object} updateData - Update data including task ID
   * @returns {Promise<Object>} Update result
   */
  async updateTaskStatus(updateData) {
    return this.executeWithLogging(async () => {
      this.validateRequired(updateData, ['id']);
      
      // Validate status transition if status is being updated
      if (updateData.status) {
        this.validateEnum(updateData.status, this.TASK_STATUSES, 'status');
        await this.validateStatusTransition(updateData.id, updateData.status);
      }

      // Sanitize inputs
      const sanitizedData = {
        id: parseInt(updateData.id),
        status: updateData.status,
        assignee: updateData.assignee ? this.sanitizeString(updateData.assignee) : undefined
      };

      // Update in database
      const result = await this.storage.updateTaskStatus(sanitizedData);
      
      if (result.changes === 0) {
        throw new Error(`Task not found: ${sanitizedData.id}`);
      }

      // Log update
      this.logger.info(`Task updated: ${sanitizedData.id} - Status: ${sanitizedData.status}`);
      
      return this.createResponse(null, 'Task updated successfully', {
        taskId: sanitizedData.id,
        changesApplied: result.changes
      });
    }, 'updateTaskStatus');
  }

  /**
   * Delete task with validation
   * @param {number} taskId - Task ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTask(taskId) {
    return this.executeWithLogging(async () => {
      const id = parseInt(taskId);
      if (isNaN(id)) {
        throw new Error('Invalid task ID');
      }

      // Check if task exists and get details for logging
      const existingTasks = await this.storage.queryTasks({ id });
      if (existingTasks.length === 0) {
        throw new Error(`Task not found: ${id}`);
      }

      // Business rule: Check if task can be deleted (e.g., not in DONE status)
      const task = existingTasks[0];
      if (task.status === 'DONE') {
        throw new Error('Cannot delete completed tasks');
      }

      // Delete from database
      const result = await this.storage.deleteTask(id);
      
      // Log deletion
      this.logger.info(`Task deleted: ${id} - ${task.title}`);
      
      return this.createResponse(null, 'Task deleted successfully', {
        taskId: id,
        taskTitle: task.title
      });
    }, 'deleteTask');
  }

  /**
   * Get tasks for current sprint
   * @returns {Promise<Object>} Current sprint tasks
   */
  async getCurrentSprintTasks() {
    return this.executeWithLogging(async () => {
      // Get current sprint from SprintService
      const sprintService = require('./SprintService');
      const currentSprint = await sprintService.getCurrentSprint();
      
      if (!currentSprint.data) {
        return this.createResponse([], 'No active sprint found');
      }

      // Query tasks for current sprint
      const tasks = await this.storage.queryTasks({ 
        sprint_id: currentSprint.data.id 
      });

      return this.createResponse(tasks, 'Current sprint tasks retrieved', {
        sprintId: currentSprint.data.id,
        sprintName: currentSprint.data.name,
        totalTasks: tasks.length
      });
    }, 'getCurrentSprintTasks');
  }

  // Private helper methods

  /**
   * Get next story number for an epic
   * @param {number} epicNum - Epic number
   * @returns {Promise<number>} Next story number
   */
  async getNextStoryNumber(epicNum) {
    if (!epicNum) return null;
    
    const existingTasks = await this.storage.queryTasks({ epic_num: epicNum });
    const storyNumbers = existingTasks
      .map(task => task.story_num)
      .filter(num => num !== null)
      .sort((a, b) => b - a);
    
    return storyNumbers.length > 0 ? storyNumbers[0] + 1 : 1;
  }

  /**
   * Validate that an epic exists
   * @param {number} epicNum - Epic number to validate
   * @throws {Error} If epic doesn't exist
   */
  async validateEpicExists(epicNum) {
    const epics = await this.storage.queryEpics({ epic_num: epicNum });
    if (epics.length === 0) {
      throw new Error(`Epic ${epicNum} does not exist`);
    }
  }

  /**
   * Validate status transition rules
   * @param {number} taskId - Task ID
   * @param {string} newStatus - New status
   * @throws {Error} If transition is invalid
   */
  async validateStatusTransition(taskId, newStatus) {
    const tasks = await this.storage.queryTasks({ id: taskId });
    if (tasks.length === 0) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const currentStatus = tasks[0].status;
    
    // Define invalid transitions
    const invalidTransitions = {
      'DONE': ['TODO', 'IN_PROGRESS'], // Can't go back to TODO/IN_PROGRESS from DONE
      'BLOCKED': ['DONE'] // Can't go directly from BLOCKED to DONE
    };

    if (invalidTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Calculate status breakdown for metadata
   * @param {Array} tasks - Task array
   * @returns {Object} Status breakdown
   */
  getStatusBreakdown(tasks) {
    return this.TASK_STATUSES.reduce((breakdown, status) => {
      breakdown[status] = tasks.filter(task => task.status === status).length;
      return breakdown;
    }, {});
  }

  /**
   * Calculate priority breakdown for metadata
   * @param {Array} tasks - Task array
   * @returns {Object} Priority breakdown
   */
  getPriorityBreakdown(tasks) {
    return this.PRIORITIES.reduce((breakdown, priority) => {
      breakdown[priority] = tasks.filter(task => task.priority === priority).length;
      return breakdown;
    }, {});
  }
}

module.exports = TaskService;