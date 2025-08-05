/**
 * Service Container
 * Implements dependency injection and service lifecycle management
 * Following IoC (Inversion of Control) pattern for maintainable architecture
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.logger = console; // Default logger
  }

  /**
   * Set custom logger
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * Register a service with the container
   * @param {string} name - Service name
   * @param {Function} factory - Factory function to create service
   * @param {boolean} singleton - Whether service should be singleton
   */
  register(name, factory, singleton = true) {
    this.services.set(name, {
      factory,
      singleton,
      dependencies: []
    });
  }

  /**
   * Register service with dependencies
   * @param {string} name - Service name
   * @param {Function} factory - Factory function
   * @param {Array<string>} dependencies - Array of dependency service names
   * @param {boolean} singleton - Whether service should be singleton
   */
  registerWithDependencies(name, factory, dependencies = [], singleton = true) {
    this.services.set(name, {
      factory,
      singleton,
      dependencies
    });
  }

  /**
   * Get service instance
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  get(name) {
    const serviceDefinition = this.services.get(name);
    if (!serviceDefinition) {
      throw new Error(`Service not found: ${name}`);
    }

    // Return singleton if already created
    if (serviceDefinition.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Resolve dependencies
    const dependencies = serviceDefinition.dependencies.map(dep => this.get(dep));

    // Create service instance
    const instance = serviceDefinition.factory(...dependencies);

    // Store as singleton if needed
    if (serviceDefinition.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Initialize all services with cross-dependencies
   * This should be called after all services are registered
   */
  async initializeServices() {
    this.logger.info('Initializing service container...');

    // Get all service instances (this will create singletons)
    const serviceNames = Array.from(this.services.keys());
    const instances = {};

    for (const name of serviceNames) {
      instances[name] = this.get(name);
      this.logger.debug(`Service created: ${name}`);
    }

    // Setup cross-dependencies for services that need them
    this.setupCrossDependencies(instances);

    this.logger.info('Service container initialized successfully');
    return instances;
  }

  /**
   * Setup cross-dependencies between services
   * @param {Object} instances - Map of service instances
   */
  setupCrossDependencies(instances) {
    // Project service needs task and sprint services
    if (instances.projectService && instances.taskService && instances.sprintService) {
      instances.projectService.setDependencies(
        instances.taskService,
        instances.sprintService
      );
      this.logger.debug('Cross-dependencies set for ProjectService');
    }

    // Add other cross-dependency setups here as needed
  }

  /**
   * Get all registered service names
   * @returns {Array<string>} Service names
   */
  getRegisteredServices() {
    return Array.from(this.services.keys());
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean} Whether service is registered
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Create a child container with inherited services
   * @returns {ServiceContainer} Child container
   */
  createChild() {
    const child = new ServiceContainer();
    child.logger = this.logger;
    
    // Copy service definitions (not instances)
    for (const [name, definition] of this.services) {
      child.services.set(name, { ...definition });
    }

    return child;
  }

  /**
   * Health check for all services
   * @returns {Promise<Object>} Health status of all services
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    for (const name of this.getRegisteredServices()) {
      try {
        const service = this.get(name);
        
        // Check if service has a health check method
        if (typeof service.healthCheck === 'function') {
          health.services[name] = await service.healthCheck();
        } else {
          health.services[name] = { status: 'running', message: 'No health check method' };
        }
      } catch (error) {
        health.services[name] = { 
          status: 'error', 
          message: error.message 
        };
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * Graceful shutdown of all services
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down service container...');

    const shutdownPromises = [];

    for (const [name, instance] of this.singletons) {
      if (typeof instance.shutdown === 'function') {
        this.logger.debug(`Shutting down service: ${name}`);
        shutdownPromises.push(
          instance.shutdown().catch(error => {
            this.logger.error(`Error shutting down ${name}:`, error.message);
          })
        );
      }
    }

    await Promise.all(shutdownPromises);
    
    this.clear();
    this.logger.info('Service container shutdown complete');
  }
}

/**
 * Create and configure the main service container for BMad
 * @param {Object} storage - Storage adapter instance
 * @param {Object} logger - Logger instance
 * @returns {ServiceContainer} Configured container
 */
function createBMadServiceContainer(storage, logger = console) {
  const container = new ServiceContainer();
  container.setLogger(logger);

  // Register services with their dependencies
  container.register('storage', () => storage, true);

  container.registerWithDependencies(
    'taskService',
    (storage) => {
      const TaskService = require('./TaskService');
      return new TaskService(storage, logger);
    },
    ['storage'],
    true
  );

  container.registerWithDependencies(
    'sprintService',
    (storage) => {
      const SprintService = require('./SprintService');
      return new SprintService(storage, logger);
    },
    ['storage'],
    true
  );

  container.registerWithDependencies(
    'projectService',
    (storage) => {
      const ProjectService = require('./ProjectService');
      return new ProjectService(storage, logger);
    },
    ['storage'],
    true
  );

  // Register additional services here as they're created
  // Example:
  // container.registerWithDependencies(
  //   'epicService',
  //   (storage) => new EpicService(storage, logger),
  //   ['storage'],
  //   true
  // );

  return container;
}

module.exports = {
  ServiceContainer,
  createBMadServiceContainer
};