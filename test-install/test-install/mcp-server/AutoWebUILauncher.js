const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Auto Web UI Launcher for BMad MCP Server
 * Automatically starts the web UI when MCP server connects to Claude Desktop
 * Similar to Serena's auto-dashboard feature
 */
class AutoWebUILauncher {
  constructor(logger = console) {
    this.logger = logger;
    this.webUIProcess = null;
    this.webUIPort = 5173; // Default Vite dev server port
    this.enabled = true;
    this.autoOpen = process.env.BMAD_AUTO_OPEN_WEBUI !== 'false';
  }

  /**
   * Start the web UI automatically when MCP server initializes
   */
  async autoStartWebUI() {
    if (!this.enabled) {
      this.logger.debug('Auto Web UI launch disabled');
      return;
    }

    try {
      // Check if web UI is already running
      if (await this.isWebUIRunning()) {
        this.logger.info('🌐 Web UI already running, skipping auto-start');
        return;
      }

      // Find web UI directory
      const webUIPath = this.findWebUIPath();
      if (!webUIPath) {
        this.logger.warn('Web UI directory not found, skipping auto-start');
        return;
      }

      // Start web UI in background
      await this.startWebUIProcess(webUIPath);
      
      // Auto-open in browser if enabled
      if (this.autoOpen) {
        setTimeout(() => {
          this.openWebUI();
        }, 3000); // Wait 3 seconds for web UI to start
      }

    } catch (error) {
      this.logger.error('Failed to auto-start Web UI:', error.message);
    }
  }

  /**
   * Find the web UI directory relative to MCP server
   */
  findWebUIPath() {
    const possiblePaths = [
      path.join(__dirname, '..', 'web-ui'),           // tools/mcp-server/../web-ui  
      path.join(__dirname, '..', '..', 'web-ui'),     // project root web-ui
      path.join(process.cwd(), 'web-ui'),             // current directory web-ui
      path.join(process.cwd(), 'tools', 'web-ui'),    // tools/web-ui from project root
    ];

    for (const webUIPath of possiblePaths) {
      if (fs.existsSync(webUIPath) && fs.existsSync(path.join(webUIPath, 'package.json'))) {
        this.logger.debug(`Found Web UI at: ${webUIPath}`);
        return webUIPath;
      }
    }

    return null;
  }

  /**
   * Start the web UI development server
   */
  async startWebUIProcess(webUIPath) {
    return new Promise((resolve, reject) => {
      this.logger.info('🚀 Auto-starting Web UI...');

      // Determine if we need to install dependencies first
      const nodeModulesPath = path.join(webUIPath, 'node_modules');
      const needsInstall = !fs.existsSync(nodeModulesPath);

      let command, args;
      
      if (needsInstall) {
        this.logger.info('📦 Installing Web UI dependencies...');
        command = 'npm';
        args = ['install'];
      } else {
        command = 'npm';
        args = ['run', 'dev'];
      }

      // Start the process
      this.webUIProcess = spawn(command, args, {
        cwd: webUIPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          PORT: this.webUIPort.toString(),
          BROWSER: 'none' // Prevent auto-opening multiple browsers
        }
      });

      let isResolved = false;

      // Handle process output
      this.webUIProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.logger.debug(`Web UI: ${output.trim()}`);

        // Check for successful startup indicators
        if (output.includes('Local:') || output.includes('localhost') || output.includes('ready')) {
          if (!isResolved && !needsInstall) {
            this.logger.info(`✅ Web UI started on http://localhost:${this.webUIPort}`);
            isResolved = true;
            resolve();
          }
        }

        // If we just finished installing, start dev server
        if (needsInstall && (output.includes('added') || output.includes('packages'))) {
          this.logger.info('📦 Dependencies installed, starting dev server...');
          this.webUIProcess.kill();
          
          // Start dev server
          this.webUIProcess = spawn('npm', ['run', 'dev'], {
            cwd: webUIPath,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
            env: {
              ...process.env,
              PORT: this.webUIPort.toString(),
              BROWSER: 'none'
            }
          });

          // Re-attach listeners
          this.setupProcessListeners(resolve, reject);
        }
      });

      this.setupProcessListeners(resolve, reject);

      // Timeout for startup
      setTimeout(() => {
        if (!isResolved) {
          this.logger.info('✅ Web UI startup initiated (backgrounded)');
          resolve();
        }
      }, needsInstall ? 30000 : 10000); // Longer timeout if installing
    });
  }

  /**
   * Setup process event listeners
   */
  setupProcessListeners(resolve, reject) {
    this.webUIProcess.stderr.on('data', (data) => {
      const error = data.toString();
      // Filter out common non-error messages
      if (!error.includes('ExperimentalWarning') && 
          !error.includes('DeprecationWarning') &&
          !error.includes('punycode')) {
        this.logger.debug(`Web UI error: ${error.trim()}`);
      }
    });

    this.webUIProcess.on('error', (error) => {
      this.logger.error('Web UI process error:', error.message);
      reject(error);
    });

    this.webUIProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        this.logger.warn(`Web UI process exited with code ${code}`);
      }
      this.webUIProcess = null;
    });
  }

  /**
   * Check if web UI is already running
   */
  async isWebUIRunning() {
    return new Promise((resolve) => {
      const http = require('http');
      
      const req = http.request({
        hostname: 'localhost',
        port: this.webUIPort,
        path: '/',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Open web UI in default browser
   */
  openWebUI() {
    const url = `http://localhost:${this.webUIPort}`;
    const { exec } = require('child_process');
    
    // Cross-platform browser opening
    const command = process.platform === 'win32' 
      ? `start ${url}`
      : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;

    exec(command, (error) => {
      if (error) {
        this.logger.debug('Could not auto-open Web UI:', error.message);
        this.logger.info(`🌐 Web UI available at: ${url}`);
      } else {
        this.logger.info('🌐 Web UI opened in browser');
      }
    });
  }

  /**
   * Stop the web UI process
   */
  async stopWebUI() {
    if (this.webUIProcess) {
      this.logger.info('🛑 Stopping Web UI...');
      
      return new Promise((resolve) => {
        this.webUIProcess.on('exit', () => {
          this.logger.info('✅ Web UI stopped');
          this.webUIProcess = null;
          resolve();
        });

        // Try graceful shutdown first
        this.webUIProcess.kill('SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (this.webUIProcess) {
            this.webUIProcess.kill('SIGKILL');
            this.webUIProcess = null;
            resolve();
          }
        }, 5000);
      });
    }
  }

  /**
   * Enable or disable auto-start
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Enable or disable auto-open browser
   */
  setAutoOpen(autoOpen) {
    this.autoOpen = autoOpen;
  }

  /**
   * Get web UI URL
   */
  getWebUIUrl() {
    return `http://localhost:${this.webUIPort}`;
  }

  /**
   * Check if web UI process is running
   */
  isProcessRunning() {
    return this.webUIProcess !== null && !this.webUIProcess.killed;
  }

  /**
   * Get web UI status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      processRunning: this.isProcessRunning(),
      url: this.getWebUIUrl(),
      port: this.webUIPort,
      autoOpen: this.autoOpen
    };
  }
}

module.exports = AutoWebUILauncher;