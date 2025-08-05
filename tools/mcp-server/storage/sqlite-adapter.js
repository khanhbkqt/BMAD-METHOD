const { Database } = require('sqlite3');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

/**
 * SQLite storage adapter for BMAD MCP Server
 * Handles project data persistence and retrieval
 */
class BMadStorage {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async initialize() {
    // Find project database or create one
    this.dbPath = await this.findOrCreateDatabase();
    
    this.db = new Database(this.dbPath);
    
    // Enable foreign keys and WAL mode for better concurrency
    await this.run('PRAGMA foreign_keys = ON');
    await this.run('PRAGMA journal_mode = WAL');
    
    await this.setupTables();
  }

  async findOrCreateDatabase() {
    // Look for existing .bmad/project.db in current directory tree
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const dbPath = path.join(currentDir, '.bmad', 'project.db');
      if (await fs.pathExists(dbPath)) {
        return dbPath;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Create new database in current directory
    const bmadDir = path.join(process.cwd(), '.bmad');
    await fs.ensureDir(bmadDir);
    const dbPath = path.join(bmadDir, 'project.db');
    
    return dbPath;
  }

  async setupTables() {
    const tables = [
      // Project metadata
      `CREATE TABLE IF NOT EXISTS project_meta (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Documents (PRDs, Architecture, etc.)
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        status TEXT DEFAULT 'DRAFT',
        version INTEGER DEFAULT 1,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Epics
      `CREATE TABLE IF NOT EXISTS epics (
        id TEXT PRIMARY KEY,
        epic_num INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'TODO',
        priority TEXT DEFAULT 'MEDIUM',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Sprints
      `CREATE TABLE IF NOT EXISTS sprints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        goal TEXT,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'PLANNING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tasks/Stories
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        epic_id TEXT,
        sprint_id TEXT,
        epic_num INTEGER,
        story_num INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'TODO',
        assignee TEXT,
        priority TEXT DEFAULT 'MEDIUM',
        estimated_hours INTEGER,
        actual_hours INTEGER,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (epic_id) REFERENCES epics(id),
        FOREIGN KEY (sprint_id) REFERENCES sprints(id)
      )`,
      
      // Document links for many-to-many relationships
      `CREATE TABLE IF NOT EXISTS document_links (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        document_section TEXT,
        link_purpose TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        UNIQUE(entity_type, entity_id, document_id, document_section)
      )`,
      
      // Change tracking
      `CREATE TABLE IF NOT EXISTS changes (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        changed_by TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_epic_story ON tasks(epic_num, story_num)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee)',
      'CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)',
      'CREATE INDEX IF NOT EXISTS idx_document_links_entity ON document_links(entity_type, entity_id)',
      'CREATE INDEX IF NOT EXISTS idx_document_links_doc ON document_links(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_document_links_section ON document_links(document_id, document_section)',
      'CREATE INDEX IF NOT EXISTS idx_changes_entity ON changes(entity_type, entity_id)',
      'CREATE INDEX IF NOT EXISTS idx_epics_num ON epics(epic_num)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }

    // Initialize project if not exists
    await this.initializeProject();
  }

  async initializeProject() {
    const existing = await this.get('SELECT value FROM project_meta WHERE key = ?', ['name']);
    
    if (!existing) {
      const projectName = path.basename(process.cwd());
      await this.setProjectMeta('id', uuidv4());
      await this.setProjectMeta('name', projectName);
      await this.setProjectMeta('description', 'BMAD Project');
      await this.setProjectMeta('created_at', new Date().toISOString());
    }
  }

  // Project metadata operations
  async getProjectMeta(key) {
    const result = await this.get('SELECT value FROM project_meta WHERE key = ?', [key]);
    return result?.value;
  }

  async setProjectMeta(key, value) {
    await this.run(
      'INSERT OR REPLACE INTO project_meta (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [key, value]
    );
  }

  async getProject() {
    const rows = await this.all('SELECT key, value FROM project_meta');
    const project = {};
    rows.forEach(row => project[row.key] = row.value);
    return project;
  }

  // Document operations
  async createDocument(type, title, content, status = 'DRAFT') {
    const id = uuidv4();
    await this.run(
      'INSERT INTO documents (id, type, title, content, status) VALUES (?, ?, ?, ?, ?)',
      [id, type, title, content, status]
    );
    return { id, type, title, status };
  }

  async getDocument(id) {
    return await this.get('SELECT * FROM documents WHERE id = ?', [id]);
  }

  async listDocuments(type = null) {
    if (type) {
      return await this.all('SELECT * FROM documents WHERE type = ? ORDER BY updated_at DESC', [type]);
    }
    return await this.all('SELECT * FROM documents ORDER BY updated_at DESC');
  }

  async updateDocument(id, updates) {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      values.push(value);
    });
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      await this.run(
        `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  // Epic operations
  async createEpic(epicNum, title, description) {
    const id = uuidv4();
    await this.run(
      'INSERT INTO epics (id, epic_num, title, description) VALUES (?, ?, ?, ?)',
      [id, epicNum, title, description]
    );
    return { id, epicNum, title, description };
  }

  async getEpic(epicNum) {
    return await this.get('SELECT * FROM epics WHERE epic_num = ?', [epicNum]);
  }

  async listEpics() {
    return await this.all('SELECT * FROM epics ORDER BY epic_num');
  }

  // Task operations
  async createTask(epicNum, storyNum, title, description, assignee = null) {
    const id = uuidv4();
    
    // Find epic by number
    const epic = await this.get('SELECT id FROM epics WHERE epic_num = ?', [epicNum]);
    const epicId = epic?.id;
    
    await this.run(
      'INSERT INTO tasks (id, epic_id, epic_num, story_num, title, description, assignee) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, epicId, epicNum, storyNum, title, description, assignee]
    );
    
    return { id, epicNum, storyNum, title, description, assignee };
  }

  async getTask(id) {
    return await this.get('SELECT * FROM tasks WHERE id = ?', [id]);
  }

  async updateTask(id, updates) {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      values.push(value);
    });
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      await this.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  async queryTasks(filters = {}) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(',');
        query += ` AND status IN (${placeholders})`;
        params.push(...filters.status);
      } else {
        query += ' AND status = ?';
        params.push(filters.status);
      }
    }
    
    if (filters.epicNum) {
      query += ' AND epic_num = ?';
      params.push(filters.epicNum);
    }
    
    if (filters.assignee) {
      query += ' AND assignee = ?';
      params.push(filters.assignee);
    }
    
    if (filters.sprintId) {
      query += ' AND sprint_id = ?';
      params.push(filters.sprintId);
    }
    
    query += ' ORDER BY epic_num, story_num';
    return await this.all(query, params);
  }

  async getNextStoryNum(epicNum) {
    const result = await this.get(
      'SELECT MAX(story_num) as max_story FROM tasks WHERE epic_num = ?',
      [epicNum]
    );
    return (result?.max_story || 0) + 1;
  }

  // Sprint operations
  async createSprint(name, goal, startDate = null, endDate = null) {
    const id = uuidv4();
    await this.run(
      'INSERT INTO sprints (id, name, goal, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [id, name, goal, startDate, endDate]
    );
    return { id, name, goal, startDate, endDate };
  }

  async getActiveSprint() {
    return await this.get('SELECT * FROM sprints WHERE status = ? ORDER BY created_at DESC LIMIT 1', ['ACTIVE']);
  }

  async listSprints() {
    return await this.all('SELECT * FROM sprints ORDER BY created_at DESC');
  }

  async querySprints(filters = {}) {
    let query = 'SELECT * FROM sprints WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(',');
        query += ` AND status IN (${placeholders})`;
        params.push(...filters.status);
      } else {
        query += ' AND status = ?';
        params.push(filters.status);
      }
    }
    
    if (filters.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    return await this.all(query, params);
  }

  // Progress and analytics
  async getProjectProgress() {
    const total = await this.get('SELECT COUNT(*) as count FROM tasks');
    const byStatus = await this.all(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);
    
    const byEpic = await this.all(`
      SELECT epic_num, COUNT(*) as count
      FROM tasks 
      WHERE epic_num IS NOT NULL
      GROUP BY epic_num
      ORDER BY epic_num
    `);
    
    return {
      totalTasks: total.count,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      byEpic: byEpic.reduce((acc, row) => {
        acc[row.epic_num] = row.count;
        return acc;
      }, {})
    };
  }

  // Document section operations (parse on-the-fly)
  parseDocumentSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionOrder = 0;
    let lineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        const sectionId = title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentSection.content.trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          section_id: sectionId,
          section_title: title,
          section_level: level,
          section_order: sectionOrder++,
          start_line: i,
          content: '',
          parent_section_id: null
        };
        
        // Find parent section (previous section with lower level)
        for (let j = sections.length - 1; j >= 0; j--) {
          if (sections[j].section_level < level) {
            currentSection.parent_section_id = sections[j].section_id;
            break;
          }
        }
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += line + '\n';
      }
    }
    
    // Save last section
    if (currentSection) {
      currentSection.content = currentSection.content.trim();
      sections.push(currentSection);
    }
    
    return sections;
  }

  async getDocumentBySection(documentId, sectionId) {
    const document = await this.get('SELECT * FROM documents WHERE id = ?', [documentId]);
    
    if (!document || !document.content) {
      return null;
    }
    
    const sections = this.parseDocumentSections(document.content);
    const section = sections.find(s => s.section_id === sectionId);
    
    if (!section) {
      return null;
    }
    
    return {
      ...document,
      focused_section: section,
      section_content: section.content,
      sections: sections
    };
  }

  async getDocumentSections(documentId) {
    const document = await this.get('SELECT * FROM documents WHERE id = ?', [documentId]);
    
    if (!document || !document.content) {
      return [];
    }
    
    return this.parseDocumentSections(document.content);
  }

  async linkEntityToDocument(entityType, entityId, documentId, documentSection, linkPurpose = null) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    await this.run(
      `INSERT OR REPLACE INTO document_links (id, entity_type, entity_id, document_id, document_section, link_purpose) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, entityType, entityId, documentId, documentSection, linkPurpose]
    );
    
    return { id, entity_type: entityType, entity_id: entityId, document_id: documentId, document_section: documentSection };
  }

  async unlinkEntityFromDocument(entityType, entityId, documentId, documentSection = null) {
    const whereClause = documentSection 
      ? 'entity_type = ? AND entity_id = ? AND document_id = ? AND document_section = ?'
      : 'entity_type = ? AND entity_id = ? AND document_id = ?';
    const params = documentSection 
      ? [entityType, entityId, documentId, documentSection]
      : [entityType, entityId, documentId];
    
    await this.run(`DELETE FROM document_links WHERE ${whereClause}`, params);
  }

  async getEntityDocumentLinks(entityType, entityId) {
    return await this.all(
      `SELECT dl.*, d.title, d.type 
       FROM document_links dl 
       JOIN documents d ON dl.document_id = d.id 
       WHERE dl.entity_type = ? AND dl.entity_id = ?`,
      [entityType, entityId]
    );
  }

  async getEntitiesLinkedToDocument(documentId, sectionId = null) {
    const whereClause = sectionId 
      ? 'dl.document_id = ? AND dl.document_section = ?'
      : 'dl.document_id = ?';
    const params = sectionId ? [documentId, sectionId] : [documentId];
    
    const entities = {
      tasks: [],
      epics: [],
      sprints: []
    };
    
    // Get tasks with document links
    entities.tasks = await this.all(`
      SELECT t.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
      FROM tasks t 
      JOIN document_links dl ON dl.entity_type = 'task' AND dl.entity_id = t.id 
      WHERE ${whereClause}
    `, params);
    
    // Get epics with document links
    entities.epics = await this.all(`
      SELECT e.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
      FROM epics e 
      JOIN document_links dl ON dl.entity_type = 'epic' AND dl.entity_id = e.id 
      WHERE ${whereClause}
    `, params);
    
    // Get sprints with document links
    entities.sprints = await this.all(`
      SELECT s.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
      FROM sprints s 
      JOIN document_links dl ON dl.entity_type = 'sprint' AND dl.entity_id = s.id 
      WHERE ${whereClause}
    `, params);
    
    return entities;
  }

  // Database helpers
  async run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  async get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    if (this.db) {
      await new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

module.exports = BMadStorage;