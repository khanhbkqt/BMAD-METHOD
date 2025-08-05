#!/usr/bin/env node

/**
 * BMad Unified Server v2 - Well-Structured Service Architecture
 * Single service exposing both MCP transport for AI agents and REST API for web UI
 * Implements proper service layer with dependency injection and best practices
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const express = require('express');
const path = require('path');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const BMadStorage = require('./storage/sqlite-adapter.js');
const BMadResources = require('./resources/bmad-resources.js');
const BMadPrompts = require('./prompts/bmad-prompts.js');
const { createBMadServiceContainer } = require('./services/ServiceContainer.js');
const AutoWebUILauncher = require('./AutoWebUILauncher.js');
const configLoader = require('./config/ConfigLoader.js');

/**
 * Logger with different levels
 */
class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  debug(...args) {
    if (this.levels[this.level] <= 0) {
      console.log('\x1b[36m[DEBUG]\x1b[0m', ...args);
    }
  }

  info(...args) {
    if (this.levels[this.level] <= 1) {
      console.log('\x1b[32m[INFO]\x1b[0m', ...args);
    }
  }

  warn(...args) {
    if (this.levels[this.level] <= 2) {
      console.warn('\x1b[33m[WARN]\x1b[0m', ...args);
    }
  }

  error(...args) {
    if (this.levels[this.level] <= 3) {
      console.error('\x1b[31m[ERROR]\x1b[0m', ...args);
    }
  }
}

class BMadUnifiedServer {
  constructor() {
    // Load configuration
    this.config = configLoader.load();
    
    // Initialize logger
    this.logger = new Logger(this.config.server.log_level);
    
    // MCP Server for AI agents
    this.mcpServer = new Server(
      {
        name: this.config.mcp.name,
        version: this.config.mcp.version,
        description: this.config.mcp.description,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Express server for REST API and Web UI
    this.expressApp = express();
    this.port = this.config.server.rest_port;
    
    // Service container and components
    this.serviceContainer = null;
    this.storage = null;
    this.resources = null;
    this.prompts = null;
    
    // Services
    this.taskService = null;
    this.sprintService = null;
    this.projectService = null;
    
    // Auto Web UI Launcher (like Serena's dashboard)
    this.webUILauncher = new AutoWebUILauncher(this.logger);
    this.webUILauncher.webUIPort = this.config.webui.port;
    this.webUILauncher.setEnabled(this.config.webui.auto_start);
    this.webUILauncher.setAutoOpen(this.config.webui.auto_open);
  }

  async initialize() {
    this.logger.info('🚀 Initializing BMad Unified Server v2...');
    
    // Initialize storage (single source of truth)
    this.storage = new BMadStorage();
    await this.storage.initialize();
    this.logger.info('✅ Database initialized');

    // Initialize service container with dependency injection
    this.serviceContainer = createBMadServiceContainer(this.storage, this.logger);
    const services = await this.serviceContainer.initializeServices();
    
    // Extract services from container
    this.taskService = services.taskService;
    this.sprintService = services.sprintService;
    this.projectService = services.projectService;
    this.logger.info('✅ Service layer initialized');

    // Initialize supporting components
    this.resources = new BMadResources(this.storage);
    this.prompts = new BMadPrompts(this.storage);
    this.logger.info('✅ MCP components initialized');

    // Setup servers
    await this.setupMCPServer();
    this.logger.info('✅ MCP server configured');

    await this.setupRESTAPI();
    this.logger.info('✅ REST API configured');

    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    // Auto-start Web UI when running in MCP mode (like Serena)
    const serverMode = process.env.BMAD_SERVER_MODE || 'dual';
    if (configLoader.shouldAutoStartWebUI(serverMode)) {
      this.logger.info('🌐 Auto-starting Web UI dashboard...');
      await this.webUILauncher.autoStartWebUI();
    }
  }

  async setupMCPServer() {
    // Register MCP tools with proper schemas
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'bmad_create_task',
            description: 'Create a new task/story in the project',
            inputSchema: {
              type: 'object',
              properties: {
                epic_num: { type: 'number', description: 'Epic number to assign task to' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Detailed task description' },
                assignee: { type: 'string', default: 'dev', description: 'Task assignee' },
                priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' }
              },
              required: ['title']
            }
          },
          {
            name: 'bmad_query_tasks',
            description: 'Query tasks with filters',
            inputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'] },
                assignee: { type: 'string' },
                epic_num: { type: 'number' },
                story_num: { type: 'number' },
                priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                sprint_id: { type: 'number' }
              }
            }
          },
          {
            name: 'bmad_update_task_status',
            description: 'Update task status and assignment',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Task ID' },
                status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'] },
                assignee: { type: 'string' }
              },
              required: ['id']
            }
          },
          {
            name: 'bmad_delete_task',
            description: 'Delete a task',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Task ID to delete' }
              },
              required: ['id']
            }
          },
          {
            name: 'bmad_get_project_progress',
            description: 'Get comprehensive project progress statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'bmad_create_sprint',
            description: 'Create a new sprint',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Sprint name' },
                goal: { type: 'string', description: 'Sprint goal' },
                start_date: { type: 'string', format: 'date-time' },
                end_date: { type: 'string', format: 'date-time' }
              },
              required: ['name', 'goal']
            }
          },
          {
            name: 'bmad_get_current_sprint',
            description: 'Get the current active sprint',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'bmad_complete_sprint',
            description: 'Complete the current sprint',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Sprint ID to complete' }
              },
              required: ['id']
            }
          },
          {
            name: 'bmad_get_project_analytics',
            description: 'Get project analytics and insights',
            inputSchema: {
              type: 'object',
              properties: {
                days: { type: 'number', default: 30, description: 'Days to analyze' }
              }
            }
          }
        ]
      };
    });

    // Register MCP tool execution with service layer
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          case 'bmad_create_task':
            result = await this.taskService.createTask(args);
            break;
          case 'bmad_query_tasks':
            result = await this.taskService.queryTasks(args);
            break;
          case 'bmad_update_task_status':
            result = await this.taskService.updateTaskStatus(args);
            break;
          case 'bmad_delete_task':
            result = await this.taskService.deleteTask(args.id);
            break;
          case 'bmad_get_project_progress':
            result = await this.projectService.getProjectProgress();
            break;
          case 'bmad_create_sprint':
            result = await this.sprintService.createSprint(args);
            break;
          case 'bmad_get_current_sprint':
            result = await this.sprintService.getCurrentSprint();
            break;
          case 'bmad_complete_sprint':
            result = await this.sprintService.completeSprint(args.id);
            break;
          case 'bmad_get_project_analytics':
            result = await this.projectService.getProjectAnalytics(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        this.logger.error(`MCP tool error (${name}):`, error.message);
        return {
          content: [
            {
              type: 'text', 
              text: JSON.stringify({
                success: false,
                error: {
                  message: error.message,
                  code: 'MCP_TOOL_ERROR',
                  timestamp: new Date().toISOString()
                }
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // Register MCP resources
    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'bmad://project/info',
            name: 'Project Information',
            description: 'Basic project metadata and configuration'
          },
          {
            uri: 'bmad://project/progress',
            name: 'Project Progress',
            description: 'Real-time project completion statistics'
          },
          {
            uri: 'bmad://project/analytics',
            name: 'Project Analytics',
            description: 'Advanced project analytics and insights'
          },
          {
            uri: 'bmad://tasks/all',
            name: 'All Tasks',
            description: 'Complete list of all project tasks'
          },
          {
            uri: 'bmad://tasks/todo',
            name: 'TODO Tasks',
            description: 'Tasks with TODO status'
          },
          {
            uri: 'bmad://tasks/in-progress',
            name: 'In Progress Tasks',
            description: 'Currently active tasks'
          },
          {
            uri: 'bmad://tasks/current-sprint',
            name: 'Current Sprint Tasks',
            description: 'Tasks in the active sprint'
          },
          {
            uri: 'bmad://sprints/current',
            name: 'Current Sprint',
            description: 'Active sprint details'
          },
          {
            uri: 'bmad://sprints/all',
            name: 'All Sprints',
            description: 'Complete list of all sprints'
          }
        ]
      };
    });

    // Register MCP resource reading with service layer
    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let result;
        
        switch (uri) {
          case 'bmad://project/info':
            result = await this.projectService.getProjectInfo();
            break;
          case 'bmad://project/progress':
            result = await this.projectService.getProjectProgress();
            break;
          case 'bmad://project/analytics':
            result = await this.projectService.getProjectAnalytics();
            break;
          case 'bmad://tasks/all':
            result = await this.taskService.queryTasks();
            break;
          case 'bmad://tasks/todo':
            result = await this.taskService.queryTasks({ status: 'TODO' });
            break;
          case 'bmad://tasks/in-progress':
            result = await this.taskService.queryTasks({ status: 'IN_PROGRESS' });
            break;
          case 'bmad://tasks/current-sprint':
            result = await this.taskService.getCurrentSprintTasks();
            break;
          case 'bmad://sprints/current':
            result = await this.sprintService.getCurrentSprint();
            break;
          case 'bmad://sprints/all':
            result = await this.sprintService.getAllSprints();
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        this.logger.error(`MCP resource error (${uri}):`, error.message);
        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
      }
    });
  }

  async setupRESTAPI() {
    // Middleware with proper error handling
    this.expressApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.static(path.join(__dirname, 'public')));

    // Request logging middleware
    this.expressApp.use((req, res, next) => {
      this.logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Task Management API
    this.expressApp.post('/api/tasks', this.asyncHandler(async (req, res) => {
      const result = await this.taskService.createTask(req.body);
      res.status(201).json(result);
    }));

    this.expressApp.get('/api/tasks', this.asyncHandler(async (req, res) => {
      const result = await this.taskService.queryTasks(req.query);
      res.json(result);
    }));

    this.expressApp.put('/api/tasks/:id', this.asyncHandler(async (req, res) => {
      const result = await this.taskService.updateTaskStatus({
        id: parseInt(req.params.id),
        ...req.body
      });
      res.json(result);
    }));

    this.expressApp.delete('/api/tasks/:id', this.asyncHandler(async (req, res) => {
      const result = await this.taskService.deleteTask(parseInt(req.params.id));
      res.json(result);
    }));

    this.expressApp.get('/api/tasks/current-sprint', this.asyncHandler(async (req, res) => {
      const result = await this.taskService.getCurrentSprintTasks();
      res.json(result);
    }));

    // Sprint Management API
    this.expressApp.post('/api/sprints', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.createSprint(req.body);
      res.status(201).json(result);
    }));

    this.expressApp.get('/api/sprints/current', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.getCurrentSprint();
      res.json(result);
    }));

    this.expressApp.get('/api/sprints', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.getAllSprints(req.query);
      res.json(result);
    }));

    this.expressApp.put('/api/sprints/:id', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.updateSprint({
        id: parseInt(req.params.id),
        ...req.body
      });
      res.json(result);
    }));

    this.expressApp.post('/api/sprints/:id/complete', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.completeSprint(parseInt(req.params.id));
      res.json(result);
    }));

    this.expressApp.get('/api/sprints/:id/progress', this.asyncHandler(async (req, res) => {
      const result = await this.sprintService.getSprintProgress(parseInt(req.params.id));
      res.json(result);
    }));

    // Project Management API
    this.expressApp.get('/api/progress', this.asyncHandler(async (req, res) => {
      const result = await this.projectService.getProjectProgress();
      res.json(result);
    }));

    this.expressApp.get('/api/project/info', this.asyncHandler(async (req, res) => {
      const result = await this.projectService.getProjectInfo();
      res.json(result);
    }));

    this.expressApp.get('/api/project/analytics', this.asyncHandler(async (req, res) => {
      const result = await this.projectService.getProjectAnalytics(req.query);
      res.json(result);
    }));

    this.expressApp.get('/api/project/export/:format', this.asyncHandler(async (req, res) => {
      const result = await this.projectService.exportProjectData(req.params.format);
      res.json(result);
    }));

    // Web UI status and control
    this.expressApp.get('/api/webui/status', this.asyncHandler(async (req, res) => {
      const status = this.webUILauncher.getStatus();
      res.json(status);
    }));

    this.expressApp.post('/api/webui/start', this.asyncHandler(async (req, res) => {
      await this.webUILauncher.autoStartWebUI();
      res.json({ success: true, message: 'Web UI start initiated' });
    }));

    this.expressApp.post('/api/webui/stop', this.asyncHandler(async (req, res) => {
      await this.webUILauncher.stopWebUI();
      res.json({ success: true, message: 'Web UI stopped' });
    }));

    // Health check with service container status
    this.expressApp.get('/health', this.asyncHandler(async (req, res) => {
      const containerHealth = await this.serviceContainer.healthCheck();
      const webUIStatus = this.webUILauncher.getStatus();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          mcp: 'running',
          rest: 'running',
          database: 'connected',
          webUI: webUIStatus
        },
        serviceContainer: containerHealth
      });
    }));

    // Global error handler
    this.expressApp.use((error, req, res, next) => {
      this.logger.error('REST API error:', error.message);
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REST_API_ERROR',
          timestamp: new Date().toISOString()
        }
      });
    });

    // 404 handler
    this.expressApp.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: `Endpoint not found: ${req.method} ${req.path}`,
          code: 'ENDPOINT_NOT_FOUND',
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  /**
   * Async handler wrapper for Express routes
   * @param {Function} fn - Async route handler
   * @returns {Function} Express middleware
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        if (this.serviceContainer) {
          await this.serviceContainer.shutdown();
        }
        
        if (this.autoWebUI) {
          await this.autoWebUI.stop();
        }
        
        if (this.storage) {
          await this.storage.close();
        }
        
        this.logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown:', error.message);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async startMCPServer() {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    this.logger.info('🔗 MCP server connected via stdio');
    
    // Web UI should already be started during initialization if enabled
  }

  async startRESTServer() {
    return new Promise((resolve) => {
      this.expressApp.listen(this.port, () => {
        this.logger.info(`🌐 REST API server running on http://localhost:${this.port}`);
        this.logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  async start() {
    await this.initialize();
    
    // Determine mode based on environment
    const mode = process.env.BMAD_SERVER_MODE || 'dual';
    
    switch (mode) {
      case 'mcp':
        this.logger.info('🎯 Starting in MCP-only mode');
        await this.startMCPServer();
        break;
      case 'rest':
        this.logger.info('🎯 Starting in REST-only mode');
        await this.startRESTServer();
        break;
      case 'dual':
      default:
        this.logger.info('🎯 Starting in dual mode (MCP + REST)');
        // Start REST server first, then MCP
        await this.startRESTServer();
        await this.startMCPServer();
        break;
    }
  }
}

// Start server
if (require.main === module) {
  const server = new BMadUnifiedServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = BMadUnifiedServer;