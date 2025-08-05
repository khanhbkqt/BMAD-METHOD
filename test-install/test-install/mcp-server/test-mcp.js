#!/usr/bin/env node

/**
 * Test script for BMAD MCP Server
 * Validates that the server correctly implements MCP protocol
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

class MCPTester {
  constructor() {
    this.testDir = null;
    this.serverProcess = null;
    this.requestId = 0;
  }

  async runTests() {
    console.log('🧪 Testing BMAD MCP Server...\n');
    
    try {
      await this.setupTestEnvironment();
      await this.startServer();
      await this.runMCPTests();
      
      console.log('\n✅ All MCP tests passed!');
      
    } catch (error) {
      console.error('\n❌ MCP tests failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    // Create temporary test directory
    this.testDir = path.join(os.tmpdir(), 'bmad-mcp-test-' + Date.now());
    await fs.ensureDir(this.testDir);
    
    console.log(`📁 Created test directory: ${this.testDir}`);
    
    // Change to test directory
    process.chdir(this.testDir);
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting MCP server...');
      
      const serverPath = path.join(__dirname, 'server.js');
      this.serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message.includes('BMAD MCP Server running')) {
          console.log('✅ MCP server started');
          resolve();
        } else if (message.includes('Failed to start')) {
          reject(new Error(message));
        }
      });

      this.serverProcess.on('error', reject);
      
      // Timeout if server doesn't start
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }

  async sendMCPRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      let responseBuffer = '';
      
      const onData = (data) => {
        responseBuffer += data.toString();
        
        try {
          const lines = responseBuffer.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.id === id) {
                this.serverProcess.stdout.removeListener('data', onData);
                resolve(response);
                return;
              }
            }
          }
        } catch (error) {
          // Incomplete JSON, continue buffering
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      // Send request
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error(`Request timeout for ${method}`));
      }, 5000);
    });
  }

  async runMCPTests() {
    console.log('🔧 Testing MCP capabilities...\n');
    
    // Test 1: List Tools
    console.log('1. Testing tools/list...');
    const toolsResponse = await this.sendMCPRequest('tools/list');
    
    if (!toolsResponse.result || !toolsResponse.result.tools) {
      throw new Error('Invalid tools/list response');
    }
    
    console.log(`   ✅ Found ${toolsResponse.result.tools.length} tools`);
    console.log(`   📋 Tools: ${toolsResponse.result.tools.map(t => t.name).join(', ')}`);
    
    // Test 2: List Resources
    console.log('\n2. Testing resources/list...');
    const resourcesResponse = await this.sendMCPRequest('resources/list');
    
    if (!resourcesResponse.result || !resourcesResponse.result.resources) {
      throw new Error('Invalid resources/list response');
    }
    
    console.log(`   ✅ Found ${resourcesResponse.result.resources.length} resources`);
    
    // Test 3: List Prompts
    console.log('\n3. Testing prompts/list...');
    const promptsResponse = await this.sendMCPRequest('prompts/list');
    
    if (!promptsResponse.result || !promptsResponse.result.prompts) {
      throw new Error('Invalid prompts/list response');
    }
    
    console.log(`   ✅ Found ${promptsResponse.result.prompts.length} prompts`);
    
    // Test 4: Create Epic (Tool Call)
    console.log('\n4. Testing tool call (bmad_create_epic)...');
    const createEpicResponse = await this.sendMCPRequest('tools/call', {
      name: 'bmad_create_epic',
      arguments: {
        epic_num: 1,
        title: 'Test Epic',
        description: 'A test epic for MCP validation'
      }
    });
    
    if (!createEpicResponse.result || !createEpicResponse.result.content) {
      throw new Error('Invalid tool call response');
    }
    
    console.log('   ✅ Successfully created epic via tool call');
    
    // Test 5: Create Story (Tool Call)
    console.log('\n5. Testing tool call (bmad_create_story)...');
    const createStoryResponse = await this.sendMCPRequest('tools/call', {
      name: 'bmad_create_story',
      arguments: {
        epic_num: 1,
        title: 'Test Story',
        description: 'A test story for MCP validation',
        assignee: 'dev'
      }
    });
    
    if (!createStoryResponse.result || !createStoryResponse.result.content) {
      throw new Error('Invalid story creation response');
    }
    
    console.log('   ✅ Successfully created story via tool call');
    
    // Test 6: Read Resource
    console.log('\n6. Testing resource read (project info)...');
    const projectInfoResponse = await this.sendMCPRequest('resources/read', {
      uri: 'bmad://project/info'
    });
    
    if (!projectInfoResponse.result || !projectInfoResponse.result.contents) {
      throw new Error('Invalid resource read response');
    }
    
    console.log('   ✅ Successfully read project info resource');
    
    // Test 7: Get Prompt
    console.log('\n7. Testing prompt get (bmad_create_story)...');
    const promptResponse = await this.sendMCPRequest('prompts/get', {
      name: 'bmad_create_story',
      arguments: { epic_num: 1 }
    });
    
    if (!promptResponse.result || !promptResponse.result.messages) {
      throw new Error('Invalid prompt response');
    }
    
    console.log('   ✅ Successfully retrieved story creation prompt');
    
    // Test 8: Query Tasks
    console.log('\n8. Testing task query...');
    const queryResponse = await this.sendMCPRequest('tools/call', {
      name: 'bmad_query_tasks',
      arguments: { epic_num: 1 }
    });
    
    if (!queryResponse.result || !queryResponse.result.content) {
      throw new Error('Invalid task query response');
    }
    
    const queryResult = JSON.parse(queryResponse.result.content[0].text);
    console.log(`   ✅ Found ${queryResult.count} tasks in Epic 1`);
    
    console.log('\n🎯 All MCP protocol tests completed successfully!');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('   ✅ Server stopped');
    }
    
    if (this.testDir) {
      await fs.remove(this.testDir);
      console.log('   ✅ Test directory cleaned');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MCPTester();
  
  tester.runTests()
    .then(() => {
      console.log('\n🎉 BMAD MCP Server is working correctly!');
      console.log('\n📖 Next steps:');
      console.log('   1. Add server to Claude Desktop MCP config');
      console.log('   2. Test with AI agents in Claude');
      console.log('   3. Update BMAD agents to use MCP tools');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = MCPTester;