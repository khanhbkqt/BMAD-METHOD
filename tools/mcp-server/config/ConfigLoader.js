const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Configuration Loader for BMad MCP Server
 * Handles loading and merging configuration from multiple sources
 */
class ConfigLoader {
  constructor() {
    this.config = null;
    this.configPaths = [
      path.join(__dirname, 'bmad-mcp-config.yaml'),
      path.join(process.cwd(), 'bmad-mcp-config.yaml'),
      path.join(process.cwd(), '.bmad', 'mcp-config.yaml')
    ];
  }

  /**
   * Load configuration from files and environment variables
   * @returns {Object} Merged configuration
   */
  load() {
    if (this.config) {
      return this.config;
    }

    // Start with default config
    this.config = this.getDefaultConfig();

    // Load from config files
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
          this.config = this.mergeConfig(this.config, fileConfig);
          console.log(`Loaded config from: ${configPath}`);
        } catch (error) {
          console.warn(`Failed to load config from ${configPath}:`, error.message);
        }
      }
    }

    // Override with environment variables
    this.applyEnvironmentOverrides();

    return this.config;
  }

  /**
   * Get default configuration
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {
      webui: {
        auto_start: true,
        auto_open: process.env.NODE_ENV !== 'production',
        port: 5173,
        enabled_modes: ['mcp', 'dual']
      },
      server: {
        rest_port: 3001,
        log_level: 'info',
        request_logging: false
      },
      database: {
        auto_create: true,
        filename: 'project.db',
        wal_mode: true
      },
      mcp: {
        name: 'bmad-unified-server',
        version: '2.0.0',
        description: 'Unified MCP/REST server for BMAD Method with service architecture'
      },
      development: {
        hot_reload: false,
        verbose_logging: false,
        auto_restart: false
      }
    };
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides() {
    // Web UI settings
    if (process.env.BMAD_AUTO_START_WEBUI !== undefined) {
      this.config.webui.auto_start = process.env.BMAD_AUTO_START_WEBUI === 'true';
    }
    
    if (process.env.BMAD_AUTO_OPEN_WEBUI !== undefined) {
      this.config.webui.auto_open = process.env.BMAD_AUTO_OPEN_WEBUI === 'true';
    }

    if (process.env.WEBUI_PORT) {
      this.config.webui.port = parseInt(process.env.WEBUI_PORT);
    }

    // Server settings
    if (process.env.PORT) {
      this.config.server.rest_port = parseInt(process.env.PORT);
    }

    if (process.env.LOG_LEVEL) {
      this.config.server.log_level = process.env.LOG_LEVEL.toLowerCase();
    }

    // Database settings
    if (process.env.DB_FILE) {
      this.config.database.filename = process.env.DB_FILE;
    }

    // Development settings
    if (process.env.NODE_ENV === 'development') {
      this.config.development.verbose_logging = true;
      this.config.server.request_logging = true;
    }
  }

  /**
   * Deep merge configuration objects
   * @param {Object} target - Target config
   * @param {Object} source - Source config to merge
   * @returns {Object} Merged config
   */
  mergeConfig(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfig(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get specific configuration section
   * @param {string} section - Config section name
   * @returns {Object} Configuration section
   */
  get(section) {
    const config = this.load();
    return section ? config[section] : config;
  }

  /**
   * Check if Web UI auto-start is enabled for current server mode
   * @param {string} serverMode - Current server mode
   * @returns {boolean} Whether to auto-start Web UI
   */
  shouldAutoStartWebUI(serverMode = 'dual') {
    const config = this.load();
    return config.webui.auto_start && 
           config.webui.enabled_modes.includes(serverMode);
  }

  /**
   * Check if Web UI should auto-open in browser
   * @returns {boolean} Whether to auto-open Web UI
   */
  shouldAutoOpenWebUI() {
    const config = this.load();
    return config.webui.auto_open;
  }

  /**
   * Get Web UI port
   * @returns {number} Web UI port
   */
  getWebUIPort() {
    const config = this.load();
    return config.webui.port;
  }

  /**
   * Get REST API port
   * @returns {number} REST API port
   */
  getRESTPort() {
    const config = this.load();
    return config.server.rest_port;
  }

  /**
   * Get log level
   * @returns {string} Log level
   */
  getLogLevel() {
    const config = this.load();
    return config.server.log_level;
  }

  /**
   * Generate Claude Desktop MCP configuration
   * @param {string} projectPath - Project directory path
   * @returns {Object} Claude Desktop MCP config
   */
  generateClaudeDesktopConfig(projectPath = process.cwd()) {
    const config = this.load();
    
    return {
      command: "npx",
      args: ["bmad-method-mcp", "unified-server", "--mode=mcp"],
      cwd: projectPath,
      env: {
        BMAD_AUTO_START_WEBUI: config.webui.auto_start.toString(),
        BMAD_AUTO_OPEN_WEBUI: config.webui.auto_open.toString(),
        LOG_LEVEL: config.server.log_level,
        WEBUI_PORT: config.webui.port.toString()
      }
    };
  }

  /**
   * Save current configuration to file
   * @param {string} filePath - File path to save config
   */
  save(filePath = path.join(process.cwd(), 'bmad-mcp-config.yaml')) {
    const config = this.load();
    const yamlStr = yaml.dump(config, {
      indent: 2,
      lineWidth: 80,
      noRefs: true
    });
    
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    console.log(`Configuration saved to: ${filePath}`);
  }

  /**
   * Reload configuration from files
   */
  reload() {
    this.config = null;
    return this.load();
  }

  /**
   * Get installation configuration for use by installers
   * @returns {Object} Installation configuration
   */
  getInstallationConfig() {
    const config = this.load();
    
    return {
      webui: {
        auto_start: config.webui.auto_start,
        auto_open: config.webui.auto_open,
        port: config.webui.port
      },
      server: {
        rest_port: config.server.rest_port,
        log_level: config.server.log_level
      },
      database: {
        filename: config.database.filename,
        auto_create: config.database.auto_create
      },
      mcp: {
        name: config.mcp.name,
        version: config.mcp.version
      }
    };
  }
}

// Export singleton instance
module.exports = new ConfigLoader();