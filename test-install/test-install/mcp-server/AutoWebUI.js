const { spawn } = require('child_process');
const path = require('path');

/**
 * Auto Web UI Manager
 * Automatically starts the web-ui dashboard when MCP server starts
 * Similar to Serena's auto-start dashboard pattern
 */
class AutoWebUI {
  constructor(logger = console, config = {}) {
    this.logger = logger;
    this.config = {
      enabled: config.enabled !== false, // Default enabled
      autoOpen: config.autoOpen !== false, // Default auto-open
      webUiPath: config.webUiPath || path.join(__dirname, '..', 'web-ui'),
      port: config.port || 5173,
      ...config
    };
    
    this.webUiProcess = null;
    this.isStarting = false;
  }

  /**
   * Start the web UI automatically when MCP server starts
   */
  async start() {
    if (!this.config.enabled) {
      this.logger.debug('Auto web UI disabled');
      return;
    }

    if (this.isStarting || this.webUiProcess) {
      return;
    }

    try {
      this.isStarting = true;
      this.logger.info('🎯 Auto-starting BMad Web UI Dashboard...');
      
      // Check if web-ui exists
      const fs = require('fs');
      if (!fs.existsSync(this.config.webUiPath)) {
        this.logger.warn('Web UI not found, skipping auto-start');
        return;
      }

      await this.startWebUI();
      
      // Auto-open browser after delay
      if (this.config.autoOpen) {
        setTimeout(() => this.openBrowser(), 3000);
      }

    } catch (error) {
      this.logger.error('Failed to auto-start web UI:', error.message);
    } finally {
      this.isStarting = false;
    }
  }

  async startWebUI() {
    return new Promise((resolve, reject) => {
      const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      
      this.webUiProcess = spawn(npmCommand, ['run', 'dev'], {
        cwd: this.config.webUiPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let started = false;

      this.webUiProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        if ((output.includes('Local:') || output.includes('ready')) && !started) {
          started = true;
          this.logger.info(`📊 Web UI auto-started: http://localhost:${this.config.port}`);
          resolve();
        }
      });

      this.webUiProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning')) {
          this.logger.debug(`Web UI: ${error.trim()}`);
        }
      });

      this.webUiProcess.on('exit', (code) => {
        this.webUiProcess = null;
      });

      this.webUiProcess.on('error', (error) => {
        this.webUiProcess = null;
        if (!started) reject(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!started) {
          started = true;
          resolve();
        }
      }, 8000);
    });
  }

  openBrowser() {
    const url = `http://localhost:${this.config.port}`;
    const { exec } = require('child_process');
    
    const command = process.platform === 'win32' 
      ? `start ${url}`
      : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;

    exec(command, (error) => {
      if (error) {
        this.logger.info(`📊 Web UI Dashboard: ${url}`);
      } else {
        this.logger.info(`📊 Web UI Dashboard opened: ${url}`);
      }
    });
  }

  async stop() {
    if (this.webUiProcess) {
      this.webUiProcess.kill('SIGTERM');
      this.webUiProcess = null;
    }
  }

  isRunning() {
    return this.webUiProcess !== null;
  }

  getUrl() {
    return `http://localhost:${this.config.port}`;
  }
}

module.exports = AutoWebUI;