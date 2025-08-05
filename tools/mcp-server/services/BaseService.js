/**
 * Base Service Class
 * Provides common functionality and patterns for all services
 */
class BaseService {
  constructor(storage, logger = console) {
    this.storage = storage;
    this.logger = logger;
  }

  /**
   * Validate required fields in data object
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - List of required field names
   * @throws {Error} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Sanitize string input to prevent injection attacks
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>\"'&]/g, '');
  }

  /**
   * Validate enum values
   * @param {*} value - Value to validate
   * @param {Array} allowedValues - Array of allowed values
   * @param {string} fieldName - Field name for error message
   * @throws {Error} If value not in allowed values
   */
  validateEnum(value, allowedValues, fieldName) {
    if (value && !allowedValues.includes(value)) {
      throw new Error(`Invalid ${fieldName}: ${value}. Allowed values: ${allowedValues.join(', ')}`);
    }
  }

  /**
   * Wrap async operations with error handling and logging
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name for logging
   * @returns {Promise<*>} Operation result
   */
  async executeWithLogging(operation, operationName) {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Starting ${operationName}`);
      const result = await operation();
      const duration = Date.now() - startTime;
      this.logger.debug(`Completed ${operationName} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed ${operationName} after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Create standardized response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Standardized response
   */
  createResponse(data, message = 'Success', metadata = {}) {
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Create standardized error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {*} details - Additional error details
   * @returns {Object} Standardized error response
   */
  createErrorResponse(message, code = 'GENERAL_ERROR', details = null) {
    return {
      success: false,
      error: {
        message,
        code,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = BaseService;