const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Dashboard Server for BMad MCP Server
 * Provides web-based monitoring and management interface
 * Similar to Serena MCP server's auto-start dashboard
 */
class DashboardServer {
  constructor(logger = console, port = 24282) {
    this.logger = logger;
    this.port = port;
    this.app = express();
    this.server = null;
    this.logs = [];
    this.stats = {
      activeSessions: 0,
      toolCalls: 0,
      startTime: new Date(),
      healthy: true
    };
    this.enabled = true;
  }

  /**
   * Initialize and start the dashboard server
   */
  async start() {
    if (!this.enabled) {
      this.logger.debug('Dashboard server disabled');
      return;
    }

    try {
      this.setupMiddleware();
      this.setupRoutes();
      
      await this.startServer();
      
      this.logger.info(`📊 Dashboard server started on http://localhost:${this.port}`);
      this.addLog('info', `Dashboard server started on port ${this.port}`);
      
      // Auto-open dashboard in browser if in development
      if (process.env.NODE_ENV !== 'production' && process.env.BMAD_AUTO_OPEN_DASHBOARD !== 'false') {
        this.openDashboard();
      }
      
    } catch (error) {
      this.logger.error('Failed to start dashboard server:', error.message);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS for local development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname)));

    // Request logging
    this.app.use((req, res, next) => {
      if (!req.path.startsWith('/api/dashboard')) {
        this.logger.debug(`Dashboard: ${req.method} ${req.path}`);
      }
      next();
    });
  }

  /**
   * Setup API routes for dashboard
   */
  setupRoutes() {
    // Serve dashboard HTML
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboard.html'));
    });

    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboard.html'));
    });

    // Dashboard API endpoints
    this.app.get('/api/dashboard/info', (req, res) => {
      res.json({
        name: 'BMad MCP Server',
        version: '2.0.0',
        port: this.port,
        pid: process.pid,
        uptime: Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000),
        startTime: this.stats.startTime.toISOString()
      });
    });

    this.app.get('/api/dashboard/stats', (req, res) => {
      res.json({
        ...this.stats,
        uptime: Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000),
        logCount: this.logs.length
      });
    });

    this.app.get('/api/dashboard/logs', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const logs = this.logs.slice(-limit);
      res.json({ logs });
    });

    this.app.get('/api/dashboard/logs/export', (req, res) => {
      const logText = this.logs.map(log => 
        `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="bmad-mcp-logs-${new Date().toISOString().split('T')[0]}.txt"`);
      res.send(logText);
    });

    this.app.post('/api/dashboard/logs/clear', (req, res) => {
      this.logs = [];
      this.addLog('info', 'Logs cleared via dashboard');
      res.json({ success: true, message: 'Logs cleared' });
    });

    this.app.post('/api/dashboard/shutdown', (req, res) => {
      this.addLog('warn', 'Shutdown requested via dashboard');
      res.json({ success: true, message: 'Shutdown initiated' });
      
      // Graceful shutdown with delay
      setTimeout(() => {
        this.logger.info('Dashboard shutdown requested - terminating server');
        process.exit(0);
      }, 2000);
    });

    // Health check
    this.app.get('/api/dashboard/health', (req, res) => {
      res.json({
        healthy: this.stats.healthy,
        uptime: Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start the Express server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      // Try the preferred port first, then find available port
      const tryPort = (port) => {
        this.server = this.app.listen(port, (error) => {
          if (error) {
            if (error.code === 'EADDRINUSE' && port < this.port + 10) {
              // Try next port
              tryPort(port + 1);
            } else {
              reject(error);
            }
          } else {
            this.port = port;
            resolve();
          }
        });
      };

      tryPort(this.port);
    });
  }

  /**
   * Add log entry to dashboard logs
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   */
  addLog(level, message) {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level: level,
      message: message,
      id: Date.now()
    };

    this.logs.push(logEntry);

    // Keep only last 500 logs to prevent memory issues
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }

  /**
   * Update dashboard statistics
   * @param {Object} updates - Stats to update
   */
  updateStats(updates) {
    Object.assign(this.stats, updates);
  }

  /**
   * Increment tool call counter
   */
  incrementToolCalls() {
    this.stats.toolCalls++;
  }

  /**
   * Update active sessions count
   * @param {number} count - Number of active sessions
   */
  setActiveSessions(count) {
    this.stats.activeSessions = count;
  }

  /**
   * Set server health status
   * @param {boolean} healthy - Whether server is healthy
   */
  setHealthy(healthy) {
    this.stats.healthy = healthy;
    if (!healthy) {
      this.addLog('error', 'Server health check failed');
    }
  }

  /**
   * Auto-open dashboard in default browser
   */
  openDashboard() {
    const url = `http://localhost:${this.port}`;
    const open = require('child_process').exec;
    
    // Cross-platform browser opening
    const command = process.platform === 'win32' 
      ? `start ${url}`
      : process.platform === 'darwin'
      ? `open ${url}`
      : `xdg-open ${url}`;

    open(command, (error) => {
      if (error) {
        this.logger.debug('Could not auto-open dashboard:', error.message);
      } else {
        this.addLog('info', 'Dashboard opened in browser');
      }
    });
  }

  /**
   * Stop the dashboard server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.addLog('info', 'Dashboard server stopping');
        this.server.close(() => {
          this.logger.info('📊 Dashboard server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Enable or disable the dashboard
   * @param {boolean} enabled - Whether to enable dashboard
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get dashboard URL
   * @returns {string} Dashboard URL
   */
  getUrl() {
    return `http://localhost:${this.port}`;
  }

  /**
   * Check if dashboard is running
   * @returns {boolean} Whether dashboard is running
   */
  isRunning() {
    return this.server && this.server.listening;
  }
}

module.exports = DashboardServer;