const BaseService = require('./BaseService');

/**
 * Sprint Service
 * Handles sprint management with business logic and validation
 */
class SprintService extends BaseService {
  constructor(storage, logger) {
    super(storage, logger);
    
    this.SPRINT_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
  }

  /**
   * Create a new sprint with validation
   * @param {Object} sprintData - Sprint creation data
   * @returns {Promise<Object>} Created sprint
   */
  async createSprint(sprintData) {
    return this.executeWithLogging(async () => {
      // Validate required fields
      this.validateRequired(sprintData, ['name', 'goal']);
      
      // Validate dates
      if (sprintData.start_date && sprintData.end_date) {
        this.validateDateRange(sprintData.start_date, sprintData.end_date);
      }

      // Business rule: Only one active sprint at a time
      await this.validateNoActiveSprintExists();

      // Sanitize inputs
      const sanitizedData = {
        name: this.sanitizeString(sprintData.name),
        goal: this.sanitizeString(sprintData.goal),
        start_date: sprintData.start_date,
        end_date: sprintData.end_date,
        status: 'ACTIVE' // New sprints are always active
      };

      // Create sprint in database
      const sprint = await this.storage.createSprint(sanitizedData);
      
      // Log creation
      this.logger.info(`Sprint created: ${sprint.id} - ${sprint.name}`);
      
      return this.createResponse(sprint, 'Sprint created successfully', {
        sprintId: sprint.id,
        isActive: true
      });
    }, 'createSprint');
  }

  /**
   * Get current active sprint
   * @returns {Promise<Object>} Current active sprint or null
   */
  async getCurrentSprint() {
    return this.executeWithLogging(async () => {
      const sprints = await this.storage.querySprints({ status: 'ACTIVE' });
      
      if (sprints.length === 0) {
        return this.createResponse(null, 'No active sprint found');
      }

      // Should only be one active sprint
      const activeSprint = sprints[0];
      
      // Get sprint progress
      const progress = await this.getSprintProgress(activeSprint.id);
      
      return this.createResponse({
        ...activeSprint,
        progress: progress.data
      }, 'Active sprint retrieved', {
        sprintId: activeSprint.id,
        hasActiveSprint: true
      });
    }, 'getCurrentSprint');
  }

  /**
   * Get all sprints with optional filtering
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Filtered sprints
   */
  async getAllSprints(filters = {}) {
    return this.executeWithLogging(async () => {
      // Validate filters
      if (filters.status) {
        this.validateEnum(filters.status, this.SPRINT_STATUSES, 'status');
      }

      const sprints = await this.storage.querySprints(filters);
      
      // Add progress for each sprint
      const sprintsWithProgress = await Promise.all(
        sprints.map(async (sprint) => {
          const progress = await this.getSprintProgress(sprint.id);
          return {
            ...sprint,
            progress: progress.data
          };
        })
      );

      return this.createResponse(sprintsWithProgress, 'Sprints retrieved successfully', {
        total: sprints.length,
        activeCount: sprints.filter(s => s.status === 'ACTIVE').length
      });
    }, 'getAllSprints');
  }

  /**
   * Update sprint details
   * @param {Object} updateData - Sprint update data
   * @returns {Promise<Object>} Update result
   */
  async updateSprint(updateData) {
    return this.executeWithLogging(async () => {
      this.validateRequired(updateData, ['id']);
      
      // Validate status if being updated
      if (updateData.status) {
        this.validateEnum(updateData.status, this.SPRINT_STATUSES, 'status');
        await this.validateSprintStatusTransition(updateData.id, updateData.status);
      }

      // Validate dates if being updated
      if (updateData.start_date && updateData.end_date) {
        this.validateDateRange(updateData.start_date, updateData.end_date);
      }

      // Sanitize inputs
      const sanitizedData = {
        id: parseInt(updateData.id),
        name: updateData.name ? this.sanitizeString(updateData.name) : undefined,
        goal: updateData.goal ? this.sanitizeString(updateData.goal) : undefined,
        start_date: updateData.start_date,
        end_date: updateData.end_date,
        status: updateData.status
      };

      // Update in database
      const result = await this.storage.updateSprint(sanitizedData);
      
      if (result.changes === 0) {
        throw new Error(`Sprint not found: ${sanitizedData.id}`);
      }

      this.logger.info(`Sprint updated: ${sanitizedData.id}`);
      
      return this.createResponse(null, 'Sprint updated successfully', {
        sprintId: sanitizedData.id,
        changesApplied: result.changes
      });
    }, 'updateSprint');
  }

  /**
   * Complete a sprint (close it and create summary)
   * @param {number} sprintId - Sprint ID to complete
   * @returns {Promise<Object>} Completion result with summary
   */
  async completeSprint(sprintId) {
    return this.executeWithLogging(async () => {
      const id = parseInt(sprintId);
      
      // Get sprint details
      const sprints = await this.storage.querySprints({ id });
      if (sprints.length === 0) {
        throw new Error(`Sprint not found: ${id}`);
      }

      const sprint = sprints[0];
      if (sprint.status !== 'ACTIVE') {
        throw new Error(`Cannot complete sprint with status: ${sprint.status}`);
      }

      // Get final progress
      const progress = await this.getSprintProgress(id);
      
      // Update sprint status
      await this.storage.updateSprint({
        id,
        status: 'COMPLETED',
        end_date: new Date().toISOString()
      });

      // Generate completion summary
      const summary = this.generateSprintSummary(sprint, progress.data);
      
      this.logger.info(`Sprint completed: ${id} - ${sprint.name}`);
      
      return this.createResponse(summary, 'Sprint completed successfully', {
        sprintId: id,
        completionDate: new Date().toISOString()
      });
    }, 'completeSprint');
  }

  /**
   * Get sprint progress statistics
   * @param {number} sprintId - Sprint ID
   * @returns {Promise<Object>} Sprint progress data
   */
  async getSprintProgress(sprintId) {
    return this.executeWithLogging(async () => {
      // Get all tasks in this sprint
      const tasks = await this.storage.queryTasks({ sprint_id: sprintId });
      
      const progress = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        blockedTasks: tasks.filter(t => t.status === 'BLOCKED').length,
        todoTasks: tasks.filter(t => t.status === 'TODO').length,
        completionPercentage: tasks.length > 0 ? 
          Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0
      };

      return this.createResponse(progress, 'Sprint progress calculated', {
        sprintId: sprintId
      });
    }, 'getSprintProgress');
  }

  /**
   * Add stories to current sprint
   * @param {Array<number>} storyIds - Array of story IDs to add
   * @returns {Promise<Object>} Add result
   */
  async addStoriesToCurrentSprint(storyIds) {
    return this.executeWithLogging(async () => {
      // Get current sprint
      const currentSprintResult = await this.getCurrentSprint();
      if (!currentSprintResult.data) {
        throw new Error('No active sprint to add stories to');
      }

      const sprintId = currentSprintResult.data.id;
      
      // Validate all story IDs exist
      const validStoryIds = [];
      for (const storyId of storyIds) {
        const tasks = await this.storage.queryTasks({ id: parseInt(storyId) });
        if (tasks.length > 0) {
          validStoryIds.push(parseInt(storyId));
        }
      }

      if (validStoryIds.length === 0) {
        throw new Error('No valid stories found to add');
      }

      // Add stories to sprint
      const results = await Promise.all(
        validStoryIds.map(storyId => 
          this.storage.updateTaskStatus({ id: storyId, sprint_id: sprintId })
        )
      );

      const addedCount = results.filter(r => r.changes > 0).length;
      
      this.logger.info(`Added ${addedCount} stories to sprint ${sprintId}`);
      
      return this.createResponse(null, `Added ${addedCount} stories to current sprint`, {
        sprintId,
        storiesAdded: addedCount,
        validStoryIds
      });
    }, 'addStoriesToCurrentSprint');
  }

  // Private helper methods

  /**
   * Validate date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @throws {Error} If date range is invalid
   */
  validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Validate no active sprint exists
   * @throws {Error} If active sprint exists
   */
  async validateNoActiveSprintExists() {
    const activeSprints = await this.storage.querySprints({ status: 'ACTIVE' });
    if (activeSprints.length > 0) {
      throw new Error(`Active sprint already exists: ${activeSprints[0].name}`);
    }
  }

  /**
   * Validate sprint status transition
   * @param {number} sprintId - Sprint ID
   * @param {string} newStatus - New status
   * @throws {Error} If transition is invalid
   */
  async validateSprintStatusTransition(sprintId, newStatus) {
    const sprints = await this.storage.querySprints({ id: sprintId });
    if (sprints.length === 0) {
      throw new Error(`Sprint not found: ${sprintId}`);
    }

    const currentStatus = sprints[0].status;
    
    // Define invalid transitions
    const invalidTransitions = {
      'COMPLETED': ['ACTIVE'], // Can't reactivate completed sprint
      'CANCELLED': ['ACTIVE', 'COMPLETED'] // Can't change cancelled sprint
    };

    if (invalidTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Generate sprint completion summary
   * @param {Object} sprint - Sprint data
   * @param {Object} progress - Progress data
   * @returns {Object} Sprint summary
   */
  generateSprintSummary(sprint, progress) {
    return {
      sprintName: sprint.name,
      sprintGoal: sprint.goal,
      duration: this.calculateSprintDuration(sprint.start_date, sprint.end_date),
      totalTasks: progress.totalTasks,
      completedTasks: progress.completedTasks,
      completionRate: progress.completionPercentage,
      blockedTasks: progress.blockedTasks,
      summary: `Sprint "${sprint.name}" completed with ${progress.completionPercentage}% completion rate (${progress.completedTasks}/${progress.totalTasks} tasks)`
    };
  }

  /**
   * Calculate sprint duration in days
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {number} Duration in days
   */
  calculateSprintDuration(startDate, endDate) {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

module.exports = SprintService;