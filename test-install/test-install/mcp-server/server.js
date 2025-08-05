#!/usr/bin/env node

/**
 * BMAD MCP Server - Model Context Protocol implementation
 * Provides tools, resources, and prompts for AI agents working with BMAD projects
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
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

class BMadMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'bmad-mcp-server',
        version: '1.0.0',
        description: 'MCP server for BMAD (Breakthrough Method of Agile AI-driven Development)',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.storage = null;
    this.tools = null;
    this.resources = null;
    this.prompts = null;
  }

  async initialize() {
    // Initialize storage
    this.storage = new BMadStorage();
    await this.storage.initialize();

    // Initialize components
    this.tools = new BMadTools(this.storage);
    this.resources = new BMadResources(this.storage);
    this.prompts = new BMadPrompts(this.storage);

    // Set up MCP handlers
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.tools.listTools();
      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.tools.callTool(name, args);
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
              text: `Error executing tool ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.resources.listResources();
      return { resources };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        const content = await this.resources.readResource(uri);
        return {
          contents: [
            {
              uri,
              mimeType: content.mimeType || 'text/plain',
              text: content.text
            }
          ]
        };
      } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
      }
    });
  }

  setupPromptHandlers() {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = await this.prompts.listPrompts();
      return { prompts };
    });

    // Get prompt content
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const prompt = await this.prompts.getPrompt(name, args);
        return {
          description: prompt.description,
          messages: prompt.messages
        };
      } catch (error) {
        throw new Error(`Failed to get prompt ${name}: ${error.message}`);
      }
    });
  }

  async start() {
    console.error('BMAD MCP Server starting...');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('BMAD MCP Server running on stdio');
  }

  async stop() {
    if (this.storage) {
      await this.storage.close();
    }
  }
}

// CLI entry point
if (require.main === module) {
  const server = new BMadMCPServer();
  
  // Initialize and start server
  server.initialize()
    .then(() => server.start())
    .catch((error) => {
      console.error('Failed to start BMAD MCP Server:', error);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Shutting down BMAD MCP Server...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down BMAD MCP Server...');
    await server.stop();
    process.exit(0);
  });
}

module.exports = BMadMCPServer;