#!/usr/bin/env node

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
let db;
function initDB() {
    const dbPath = path.join(process.cwd(), '.bmad', 'project.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to SQLite database');
        }
    });
}

// API Routes

// Get current active sprint
app.get('/api/sprints/current', (req, res) => {
    db.get(`SELECT * FROM sprints WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || null);
    });
});

// Get all sprints
app.get('/api/sprints', (req, res) => {
    db.all(`SELECT * FROM sprints WHERE id IS NOT NULL AND id != '' ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create new sprint
app.post('/api/sprints', (req, res) => {
    const { name, goal, start_date, end_date } = req.body;
    
    if (!name || !name.trim()) {
        res.status(400).json({ error: 'Sprint name is required' });
        return;
    }
    
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    if (!id) {
        res.status(500).json({ error: 'Failed to generate sprint ID' });
        return;
    }
    
    db.run(
        `INSERT INTO sprints (id, name, goal, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
        [id, name, goal, start_date, end_date],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, message: 'Sprint created' });
        }
    );
});

// Update sprint
app.put('/api/sprints/:id', (req, res) => {
    const { status, end_date, goal_achievement, completion_rate, velocity, lessons_learned } = req.body;
    const sprintId = req.params.id;
    
    // Prepare updates
    const updates = { status };
    if (end_date) updates.end_date = end_date;
    
    // For completed sprints, store additional metrics
    if (status === 'COMPLETED') {
        const metadata = {
            goal_achievement,
            completion_rate,
            velocity,
            lessons_learned
        };
        updates.metadata = JSON.stringify(metadata);
        
        // If no end_date provided, use current date
        if (!end_date) {
            updates.end_date = new Date().toISOString().split('T')[0];
        }
    }
    
    // Update sprint
    const fields = Object.keys(updates).map(key => `${key} = ?`);
    const values = Object.values(updates);
    values.push(sprintId);
    
    db.run(
        `UPDATE sprints SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Sprint updated', changes: this.changes });
        }
    );
});

// Assign task to sprint
app.put('/api/tasks/:id/sprint', (req, res) => {
    const { sprint_id } = req.body;
    const taskId = req.params.id;
    
    db.run(
        `UPDATE tasks SET sprint_id = ?, updated_at = datetime('now') WHERE id = ?`,
        [sprint_id, taskId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Task sprint assignment updated', changes: this.changes });
        }
    );
});

// Get all documents
app.get('/api/documents', (req, res) => {
    db.all(`SELECT * FROM documents ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get specific document
app.get('/api/documents/:id', (req, res) => {
    db.get(`SELECT * FROM documents WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

// Create new document
app.post('/api/documents', (req, res) => {
    const { type, title, content, status = 'DRAFT' } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    db.run(
        `INSERT INTO documents (id, type, title, content, status) VALUES (?, ?, ?, ?, ?)`,
        [id, type, title, content, status],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: id, message: 'Document created' });
        }
    );
});

// Update document
app.put('/api/documents/:id', (req, res) => {
    const { title, content, status, create_version } = req.body;
    
    if (create_version) {
        // Create new version by incrementing version number
        db.run(
            `UPDATE documents SET version = version + 1, title = ?, content = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
            [title, content, status, req.params.id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Document updated with new version', changes: this.changes });
            }
        );
    } else {
        // Update without version increment
        db.run(
            `UPDATE documents SET title = ?, content = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
            [title, content, status, req.params.id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Document updated', changes: this.changes });
            }
        );
    }
});

// Approve document
app.post('/api/documents/:id/approve', (req, res) => {
    db.run(
        `UPDATE documents SET status = 'APPROVED', updated_at = datetime('now') WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Document approved', changes: this.changes });
        }
    );
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
    db.run(
        `DELETE FROM documents WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Document deleted', changes: this.changes });
        }
    );
});

// Get all epics
app.get('/api/epics', (req, res) => {
    db.all(`SELECT * FROM epics ORDER BY epic_num`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create new epic
app.post('/api/epics', (req, res) => {
    const { epic_num, title, description, priority = 'MEDIUM' } = req.body;
    db.run(
        `INSERT INTO epics (epic_num, title, description, priority) VALUES (?, ?, ?, ?)`,
        [epic_num, title, description, priority],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Epic created' });
        }
    );
});

// Update epic
app.put('/api/epics/:id', (req, res) => {
    const { title, description, priority } = req.body;
    db.run(
        `UPDATE epics SET title = ?, description = ?, priority = ?, updated_at = datetime('now') WHERE id = ?`,
        [title, description, priority, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Epic updated', changes: this.changes });
        }
    );
});

// Delete epic
app.delete('/api/epics/:id', (req, res) => {
    db.run(
        `DELETE FROM epics WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Epic deleted', changes: this.changes });
        }
    );
});

// Get all tasks/stories
app.get('/api/tasks', (req, res) => {
    const { epic_num, status, sprint_id, current_sprint_only } = req.query;
    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params = [];
    
    if (epic_num) {
        query += ` AND epic_num = ?`;
        params.push(epic_num);
    }
    
    if (status) {
        query += ` AND status = ?`;
        params.push(status);
    }
    
    if (sprint_id) {
        query += ` AND sprint_id = ?`;
        params.push(sprint_id);
    }
    
    // Filter to current sprint only
    if (current_sprint_only === 'true') {
        query += ` AND sprint_id = (SELECT id FROM sprints WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1)`;
    }
    
    query += ` ORDER BY epic_num, story_num`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get project progress
app.get('/api/progress', (req, res) => {
    const progressQuery = `
        SELECT 
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
            COUNT(CASE WHEN status = 'TODO' THEN 1 END) as todo_tasks,
            ROUND(COUNT(CASE WHEN status = 'DONE' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_percentage
        FROM tasks
    `;
    
    db.get(progressQuery, (err, progress) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get epic progress
        const epicQuery = `
            SELECT 
                e.epic_num,
                e.title,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks,
                ROUND(COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) * 100.0 / COUNT(t.id), 2) as completion_percentage
            FROM epics e
            LEFT JOIN tasks t ON e.epic_num = t.epic_num
            GROUP BY e.epic_num, e.title
            ORDER BY e.epic_num
        `;
        
        db.all(epicQuery, (err, epics) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                overall: progress,
                epics: epics
            });
        });
    });
});

// Update task status
app.put('/api/tasks/:id/status', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    
    if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
    }
    
    db.run(
        `UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`,
        [status, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Task status updated', changes: this.changes });
        }
    );
});

// Create new task
app.post('/api/tasks', (req, res) => {
    const { epic_num, title, description, assignee, priority = 'MEDIUM', status = 'TODO' } = req.body;
    
    // Get next story number for epic
    db.get(
        `SELECT MAX(CAST(SUBSTR(id, INSTR(id, '-') + 1) AS INTEGER)) as max_story FROM tasks WHERE epic_num = ?`,
        [epic_num],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const nextStoryNum = (row.max_story || 0) + 1;
            const taskId = `E${epic_num}-${nextStoryNum}`;
            
            db.run(
                `INSERT INTO tasks (id, epic_num, title, description, assignee, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [taskId, epic_num, title, description, assignee, priority, status],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ id: taskId, message: 'Task created' });
                }
            );
        }
    );
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    const { title, description, assignee, priority, status } = req.body;
    db.run(
        `UPDATE tasks SET title = ?, description = ?, assignee = ?, priority = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
        [title, description, assignee, priority, status, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Task updated', changes: this.changes });
        }
    );
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    db.run(
        `DELETE FROM tasks WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Task deleted', changes: this.changes });
        }
    );
});

// Approve task (change status from TODO to IN_PROGRESS)
app.post('/api/tasks/:id/approve', (req, res) => {
    db.run(
        `UPDATE tasks SET status = 'IN_PROGRESS', updated_at = datetime('now') WHERE id = ? AND status = 'TODO'`,
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Task approved', changes: this.changes });
        }
    );
});

// Get document sections
app.get('/api/documents/:id/sections', (req, res) => {
    const documentId = req.params.id;
    
    // Get document first
    db.get(`SELECT * FROM documents WHERE id = ?`, [documentId], (err, document) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        
        // Parse sections from content
        const sections = parseDocumentSections(document.content || '');
        res.json(sections);
    });
});

// Get document by section
app.get('/api/documents/:id/sections/:sectionId', (req, res) => {
    const { id: documentId, sectionId } = req.params;
    
    // Get document first
    db.get(`SELECT * FROM documents WHERE id = ?`, [documentId], (err, document) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        
        // Parse sections and find the requested one
        const sections = parseDocumentSections(document.content || '');
        const section = sections.find(s => s.section_id === sectionId);
        
        if (!section) {
            res.status(404).json({ error: 'Section not found' });
            return;
        }
        
        res.json({
            ...document,
            focused_section: section,
            section_content: section.content,
            sections: sections
        });
    });
});

// Get entities linked to document/section
app.get('/api/documents/:id/linked-entities', (req, res) => {
    const documentId = req.params.id;
    const sectionId = req.query.section;
    
    const entities = { tasks: [], epics: [], sprints: [] };
    let completed = 0;
    
    const checkComplete = () => {
        completed++;
        if (completed === 3) {
            const totalCount = entities.tasks.length + entities.epics.length + entities.sprints.length;
            res.json({
                document_id: documentId,
                section_id: sectionId,
                entities,
                summary: {
                    total_entities: totalCount,
                    tasks: entities.tasks.length,
                    epics: entities.epics.length,
                    sprints: entities.sprints.length
                }
            });
        }
    };
    
    const whereClause = sectionId 
        ? 'dl.document_id = ? AND dl.document_section = ?'
        : 'dl.document_id = ?';
    const params = sectionId ? [documentId, sectionId] : [documentId];
    
    // Get tasks with document links
    db.all(`
        SELECT t.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
        FROM tasks t 
        JOIN document_links dl ON dl.entity_type = 'task' AND dl.entity_id = t.id 
        WHERE ${whereClause}
    `, params, (err, tasks) => {
        if (!err) entities.tasks = tasks;
        checkComplete();
    });
    
    // Get epics with document links
    db.all(`
        SELECT e.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
        FROM epics e 
        JOIN document_links dl ON dl.entity_type = 'epic' AND dl.entity_id = e.id 
        WHERE ${whereClause}
    `, params, (err, epics) => {
        if (!err) entities.epics = epics;
        checkComplete();
    });
    
    // Get sprints with document links
    db.all(`
        SELECT s.*, dl.document_section, dl.link_purpose, dl.created_at as linked_at
        FROM sprints s 
        JOIN document_links dl ON dl.entity_type = 'sprint' AND dl.entity_id = s.id 
        WHERE ${whereClause}
    `, params, (err, sprints) => {
        if (!err) entities.sprints = sprints;
        checkComplete();
    });
});

// Link entity to document section
app.post('/api/link-entity', (req, res) => {
    const { entity_type, entity_id, document_id, document_section, link_purpose } = req.body;
    
    if (!['task', 'epic', 'sprint'].includes(entity_type)) {
        res.status(400).json({ error: 'Invalid entity type' });
        return;
    }
    
    const { v4: uuidv4 } = require('uuid');
    const linkId = uuidv4();
    
    db.run(
        `INSERT OR REPLACE INTO document_links (id, entity_type, entity_id, document_id, document_section, link_purpose) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [linkId, entity_type, entity_id, document_id, document_section, link_purpose || 'reference'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const entityName = entity_type === 'task' ? 'Story' : 
                             entity_type === 'epic' ? 'Epic' : 'Sprint';
            const sectionInfo = document_section ? ` section "${document_section}"` : '';
            
            res.json({ 
                message: `Linked ${entityName} ${entity_id} to document ${document_id}${sectionInfo}`,
                link_id: linkId,
                changes: this.changes 
            });
        }
    );
});

// Unlink entity from document
app.delete('/api/unlink-entity', (req, res) => {
    const { entity_type, entity_id, document_id, document_section } = req.body;
    
    if (!['task', 'epic', 'sprint'].includes(entity_type)) {
        res.status(400).json({ error: 'Invalid entity type' });
        return;
    }
    
    const whereClause = document_section 
        ? 'entity_type = ? AND entity_id = ? AND document_id = ? AND document_section = ?'
        : 'entity_type = ? AND entity_id = ? AND document_id = ?';
    const params = document_section 
        ? [entity_type, entity_id, document_id, document_section]
        : [entity_type, entity_id, document_id];
    
    db.run(`DELETE FROM document_links WHERE ${whereClause}`, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const entityName = entity_type === 'task' ? 'Story' : 
                         entity_type === 'epic' ? 'Epic' : 'Sprint';
        const sectionInfo = document_section ? ` section "${document_section}"` : '';
        
        res.json({
            message: `Unlinked ${entityName} ${entity_id} from document ${document_id}${sectionInfo}`,
            changes: this.changes
        });
    });
});

// Get document links for an entity
app.get('/api/entities/:type/:id/document-links', (req, res) => {
    const { type: entity_type, id: entity_id } = req.params;
    
    if (!['task', 'epic', 'sprint'].includes(entity_type)) {
        res.status(400).json({ error: 'Invalid entity type' });
        return;
    }
    
    db.all(`
        SELECT dl.*, d.title, d.type 
        FROM document_links dl 
        JOIN documents d ON dl.document_id = d.id 
        WHERE dl.entity_type = ? AND dl.entity_id = ?
    `, [entity_type, entity_id], (err, links) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const entityName = entity_type === 'task' ? 'Story' : 
                         entity_type === 'epic' ? 'Epic' : 'Sprint';
        
        res.json({
            entity_type,
            entity_id,
            links,
            link_count: links.length,
            message: `Found ${links.length} document links for ${entityName} ${entity_id}`
        });
    });
});

// Helper function to parse document sections
function parseDocumentSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionOrder = 0;
    
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

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initDB();
app.listen(PORT, () => {
    console.log(`BMAD WebUI API running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/sprints/current  - Get current sprint');
    console.log('  POST /api/sprints          - Create sprint');
    console.log('  GET  /api/documents        - List all documents');
    console.log('  POST /api/documents        - Create document');
    console.log('  PUT  /api/documents/:id    - Update document');
    console.log('  POST /api/documents/:id/approve - Approve document');
    console.log('  GET  /api/epics            - List all epics');
    console.log('  POST /api/epics            - Create epic');
    console.log('  PUT  /api/epics/:id        - Update epic');
    console.log('  GET  /api/tasks            - List all tasks/stories');
    console.log('  POST /api/tasks            - Create task');
    console.log('  PUT  /api/tasks/:id        - Update task');
    console.log('  POST /api/tasks/:id/approve - Approve task');
    console.log('  GET  /api/progress         - Get project progress');
});