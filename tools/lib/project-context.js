const path = require('path');
const fs = require('fs-extra');

class ProjectContext {
  static async discover() {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const dbPath = path.join(currentDir, '.bmad', 'project.db');
      if (await fs.pathExists(dbPath)) {
        return {
          id: path.basename(currentDir),
          name: path.basename(currentDir),
          dbPath: dbPath,
          rootDir: currentDir
        };
      }
      currentDir = path.dirname(currentDir);
    }
    
    throw new Error('No BMAD project found. Run "bmad-mcp-hub init" first.');
  }

  static async findDatabase() {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const dbPath = path.join(currentDir, '.bmad', 'project.db');
      if (await fs.pathExists(dbPath)) {
        return dbPath;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  static async isInProject() {
    try {
      await ProjectContext.discover();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { ProjectContext };