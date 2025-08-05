#!/usr/bin/env node

/**
 * BMAD Unified Server - MCP + REST API Service
 * Single service exposing both MCP transport for AI agents and REST API for web UI
 * Unified SQLite database as single source of truth
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
const BMadTools = require('./tools/bmad-tools.js');
const BMadResources = require('./resources/bmad-resources.js');
const BMadPrompts = require('./prompts/bmad-prompts.js');

class BMadUnifiedServer {
  constructor() {
    // MCP Server for AI agents
    this.mcpServer = new Server(
      {
        name: 'bmad-unified-server',
        version: '1.0.0',
        description: 'Unified MCP/REST server for BMAD Method',
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
    this.port = process.env.PORT || 3001;
    
    // Shared components
    this.storage = null;
    this.tools = null;
    this.resources = null;
    this.prompts = null;
  }

  async initialize() {
    console.log('🚀 Initializing BMad Unified Server...');
    
    // Initialize shared storage (single source of truth)
    this.storage = new BMadStorage();
    await this.storage.initialize();
    console.log('✅ Database initialized');

    // Initialize shared components with unified storage
    this.tools = new BMadTools(this.storage);
    this.resources = new BMadResources(this.storage);
    this.prompts = new BMadPrompts(this.storage);
    console.log('✅ MCP components initialized');

    // Setup MCP Server
    await this.setupMCPServer();
    console.log('✅ MCP server configured');

    // Setup REST API
    await this.setupRESTAPI();
    console.log('✅ REST API configured');
  }

  async setupMCPServer() {
    // Register MCP tools
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'bmad_create_task',
            description: 'Create a new task/story in the project',
            inputSchema: {
              type: 'object',
              properties: {
                epic_num: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                assignee: { type: 'string', default: 'dev' },
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
                status: { type: 'string' },
                assignee: { type: 'string' },
                epic_num: { type: 'number' },
                story_num: { type: 'number' },
                priority: { type: 'string' }
              }
            }
          },
          {
            name: 'bmad_update_task_status',
            description: 'Update task status and assignment',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                status: { type: 'string' },
                assignee: { type: 'string' }
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
                name: { type: 'string' },
                goal: { type: 'string' },
                start_date: { type: 'string' },
                end_date: { type: 'string' }
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
          }
        ]
      };
    });

    // Register MCP tool execution
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        switch (name) {
          case 'bmad_create_task':
            result = await this.tools.createTask(args);
            break;
          case 'bmad_query_tasks':
            result = await this.tools.queryTasks(args);
            break;
          case 'bmad_update_task_status':
            result = await this.tools.updateTaskStatus(args);
            break;
          case 'bmad_get_project_progress':
            result = await this.tools.getProjectProgress(args);
            break;
          case 'bmad_create_sprint':
            result = await this.tools.createSprint(args);
            break;
          case 'bmad_get_current_sprint':
            result = await this.tools.getCurrentSprint(args);
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
        return {
          content: [
            {
              type: 'text', 
              text: `Error: ${error.message}`
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
            uri: 'bmad://sprints/current',
            name: 'Current Sprint',
            description: 'Active sprint details'
          }
        ]
      };
    });

    // Register MCP resource reading
    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        const result = await this.resources.readResource(uri);
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
        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
      }
    });
  }

  async setupRESTAPI() {
    // Middleware
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
    this.expressApp.use(express.json());
    this.expressApp.use(express.static(path.join(__dirname, 'public')));

    // REST API Routes - Mirror MCP tools as HTTP endpoints
    
    // Task Management
    this.expressApp.post('/api/tasks', async (req, res) => {
      try {
        const result = await this.tools.createTask(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.expressApp.get('/api/tasks', async (req, res) => {
      try {
        const result = await this.tools.queryTasks(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.expressApp.put('/api/tasks/:id', async (req, res) => {
      try {
        const result = await this.tools.updateTaskStatus({
          id: parseInt(req.params.id),
          ...req.body
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Sprint Management
    this.expressApp.post('/api/sprints', async (req, res) => {
      try {
        const result = await this.tools.createSprint(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.expressApp.get('/api/sprints/current', async (req, res) => {
      try {
        const result = await this.tools.getCurrentSprint({});
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.expressApp.get('/api/sprints', async (req, res) => {
      try {
        const result = await this.tools.queryTasks({ type: 'sprints' });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Project Progress
    this.expressApp.get('/api/progress', async (req, res) => {
      try {
        const result = await this.tools.getProjectProgress({});
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Resource endpoints
    this.expressApp.get('/api/resources/:resourcePath(*)', async (req, res) => {
      try {
        const uri = `bmad://${req.params.resourcePath}`;
        const result = await this.resources.readResource(uri);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check
    this.expressApp.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          mcp: 'running',
          rest: 'running',
          database: 'connected'
        }
      });
    });
  }

  async startMCPServer() {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.log('🔗 MCP server connected via stdio');
  }

  async startRESTServer() {
    return new Promise((resolve) => {
      this.expressApp.listen(this.port, () => {
        console.log(`🌐 REST API server running on http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
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
        console.log('🎯 Starting in MCP-only mode');
        await this.startMCPServer();
        break;
      case 'rest':
        console.log('🎯 Starting in REST-only mode');
        await this.startRESTServer();
        break;
      case 'dual':
      default:
        console.log('🎯 Starting in dual mode (MCP + REST)');
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
  server.start().catch(console.error);
}

module.exports = BMadUnifiedServer;