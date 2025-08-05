const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');

class MCPClient extends EventEmitter {
  constructor(dbPath) {
    super();
    this.dbPath = dbPath;
    this.hubProcess = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.connected = false;
  }

  async connect() {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const hubCliPath = path.join(__dirname, '..', 'mcp-hub', 'cli.js');
      
      this.hubProcess = spawn('node', [hubCliPath, 'start'], {
        cwd: path.dirname(this.dbPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.hubProcess.stdout.setEncoding('utf8');
      this.hubProcess.stderr.setEncoding('utf8');
      
      let buffer = '';
      this.hubProcess.stdout.on('data', (chunk) => {
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              this.handleResponse(response);
            } catch (error) {
              console.error('Failed to parse MCP response:', line, error);
            }
          }
        }
      });

      // Log stderr for debugging
      this.hubProcess.stderr.on('data', (chunk) => {
        const message = chunk.toString().trim();
        if (message.includes('MCP Hub server started')) {
          this.connected = true;
          resolve();
        } else {
          console.error('MCP Hub stderr:', message);
        }
      });

      this.hubProcess.on('error', (error) => {
        this.connected = false;
        reject(error);
      });

      this.hubProcess.on('exit', (code) => {
        this.connected = false;
        console.error(`MCP Hub process exited with code ${code}`);
      });

      // Timeout if server doesn't start
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('MCP Hub startup timeout'));
        }
      }, 10000);
    });
  }

  async call(method, params = {}) {
    if (!this.connected) {
      await this.connect();
    }

    const id = ++this.requestId;
    const request = { id, method, params };
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.hubProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP request timeout for method: ${method}`));
        }
      }, 30000);
    });
  }

  handleResponse(response) {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id);
      this.pendingRequests.delete(response.id);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    }
  }

  // Project Management
  async createProject(name, description = '') {
    return await this.call('createProject', { name, description });
  }

  async getProject() {
    return await this.call('getProject');
  }

  // Document Management
  async createDocument(type, title, content, status = 'DRAFT') {
    return await this.call('createDocument', { type, title, content, status });
  }

  async updateDocument(id, content, status) {
    return await this.call('updateDocument', { id, content, status });
  }

  async getDocument(id) {
    return await this.call('getDocument', { id });
  }

  async listDocuments(type = null) {
    return await this.call('listDocuments', { type });
  }

  // Epic Management
  async createEpic(epicNum, title, description) {
    return await this.call('createEpic', { epicNum, title, description });
  }

  // Task Management
  async createTask(epicNum, storyNum, title, description, assignee = null) {
    return await this.call('createTask', { epicNum, storyNum, title, description, assignee });
  }

  async getTasks(filters = {}) {
    return await this.call('getTasks', { filters });
  }

  async updateTaskStatus(id, status, assignee = null) {
    return await this.call('updateTaskStatus', { id, status, assignee });
  }

  async getNextStory(epicNum) {
    return await this.call('getNextStory', { epicNum });
  }

  // Sprint Management
  async createSprint(name, goal, startDate = null, endDate = null) {
    return await this.call('createSprint', { name, goal, startDate, endDate });
  }

  async getActiveSprint() {
    return await this.call('getActiveSprint');
  }

  async getSprints() {
    return await this.call('getSprints');
  }

  // Convenience Methods
  async queryTasks(options = {}) {
    const filters = {};
    
    if (options.epic) filters.epicNum = options.epic;
    if (options.status) filters.status = options.status;
    if (options.assignee) filters.assignee = options.assignee;
    if (options.sprint) filters.sprintId = options.sprint;
    
    return await this.getTasks(filters);
  }

  async getIncompleteTasks() {
    return await this.getTasks({ 
      status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] 
    });
  }

  async getTasksByEpic(epicNum) {
    return await this.getTasks({ epicNum });
  }

  async disconnect() {
    if (this.hubProcess) {
      this.hubProcess.kill();
      this.hubProcess = null;
      this.connected = false;
    }
  }
}

module.exports = { MCPClient };