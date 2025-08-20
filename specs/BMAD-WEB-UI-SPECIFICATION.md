# BMAD Web UI Specification

**Version:** 1.0  
**Focus:** Task board with agent console  
**Goal:** Simple, functional interface for BMAD project management  

---

## Core Design Principles

1. **Task Board First** - Main interface is the kanban board
2. **Agent Console Prominent** - Right panel for real-time agent interaction
3. **Keep It Simple** - No over-engineering, focus on core workflows
4. **Real-Time Updates** - Live agent output and work item status changes

---

## Main Layout

### Desktop Layout (1200px+)
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: BMAD | Project Name | Sprint Status | User Menu         │
├─────────────────────────────────┬───────────────────────────────┤
│ Main Content Area (65%)         │ Agent Console Panel (35%)     │
│                                 │                               │
│ Task Board (Kanban)             │ Agent Tabs                    │
│ ┌─────┬─────┬─────┬─────┬─────┐ │ ┌─🤖──┬─👨‍💻──┬─🔍──┬─👨‍💼──┐   │
│ │Back │Ready│Prog │Rev. │Done │ │ │ SM  │ Dev │ QA │ PO  │      │
│ │log  │     │ress │     │     │ │ └─────┴─────┴────┴─────┘      │
│ │     │     │     │     │     │ │                               │
│ │📋   │⚡   │🔄   │🔍   │✅   │ │ Active Agent Console:         │
│ │Story│Story│Story│Story│Story│ │ ┌─────────────────────────────┐ │
│ │1.4  │1.3  │1.2  │1.1  │1.0  │ │ │ 🤖 SM Jordan - Story Prep  │ │
│ │     │     │     │     │     │ │ ├─────────────────────────────┤ │
│ │📋   │📋   │🔄   │     │✅   │ │ │ 15:42:20 > draft story-1.5 │ │
│ │Story│Story│Story│     │Story│ │ │ 15:42:25 ⚡ Loading context │ │
│ │2.1  │2.2  │2.3  │     │2.0  │ │ │ 15:42:30 ✓ Story created   │ │
│ │     │     │     │     │     │ │ │ 15:42:35 🎉 Ready for dev! │ │
│ └─────┴─────┴─────┴─────┴─────┘ │ ├─────────────────────────────┤ │
│                                 │ │ jordan@bmad:~$ help         │ │
│ [+ Add Story] [Filters] [Views] │ │ [Send] [History] [Clear]    │ │
│                                 │ └─────────────────────────────┘ │
└─────────────────────────────────┴───────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌─────────────────┐
│ BMAD | Sprint 2 │ 
├─────────────────┤
│ Tab Nav:        │
│ [📋Board] [🤖Agents] │
├─────────────────┤
│ Horizontal      │
│ Scrollable      │
│ Kanban:         │
│ ┌─────┬─────┬───│
│ │Back │Ready│...│
│ │📋1.4│⚡1.3│   │
│ │📋2.1│📋2.2│   │
│ └─────┴─────┴───│
├─────────────────┤
│ [Agent Console] │ ← Slides up
└─────────────────┘
```

---

## Component Specifications

### 1. Task Board (Kanban)

#### Column Structure
- **Backlog**: New stories waiting to be refined
- **Ready**: Stories ready for development  
- **In Progress**: Stories being actively worked on
- **Review**: Stories in QA/review phase
- **Done**: Completed stories

#### Story Card Design
```html
<div class="story-card" data-story-id="S-1.3">
  <div class="card-header">
    <span class="story-id">S-1.3</span>
    <span class="priority high">High</span>
  </div>
  <h4 class="story-title">Password Reset Flow</h4>
  <div class="card-meta">
    <span class="epic-label">Epic 1: User Mgmt</span>
    <span class="assignee">👨‍💻 Dev</span>
  </div>
  <div class="progress-bar" data-progress="75">
    <div class="progress-fill"></div>
    <span class="progress-text">75%</span>
  </div>
  <div class="card-actions">
    <button class="btn-sm start-agent">Start Dev</button>
    <button class="btn-sm view-details">Details</button>
  </div>
</div>
```

#### Drag & Drop Behavior
- Stories can be dragged between columns
- Drop zones highlight when dragging
- Status updates automatically via MCP
- Real-time updates across all users

### 2. Agent Console Panel

#### Tab Structure
```html
<div class="agent-console">
  <!-- Agent Tabs -->
  <div class="agent-tabs">
    <button class="agent-tab active" data-agent="sm">
      <span class="agent-icon">🤖</span>
      <span class="agent-name">SM</span>
      <span class="status-dot active"></span>
    </button>
    <button class="agent-tab" data-agent="dev">
      <span class="agent-icon">👨‍💻</span>
      <span class="agent-name">Dev</span>
      <span class="status-dot working"></span>
    </button>
    <button class="agent-tab" data-agent="qa">
      <span class="agent-icon">🔍</span>
      <span class="agent-name">QA</span>
      <span class="status-dot idle"></span>
    </button>
    <button class="agent-tab" data-agent="po">
      <span class="agent-icon">👨‍💼</span>
      <span class="agent-name">PO</span>
      <span class="status-dot offline"></span>
    </button>
  </div>

  <!-- Active Console -->
  <div class="console-content">
    <div class="console-header">
      <h3>🤖 SM Jordan - Story Creation</h3>
      <div class="console-controls">
        <button class="btn-icon">⚙️</button>
        <button class="btn-icon">📋</button>
        <button class="btn-icon">🔄</button>
      </div>
    </div>

    <div class="console-output">
      <div class="output-line">
        <span class="timestamp">15:42:20</span>
        <span class="command">> draft story-1.5</span>
      </div>
      <div class="output-line system">
        <span class="timestamp">15:42:25</span>
        <span class="text">⚡ Loading architecture context...</span>
      </div>
      <div class="output-line success">
        <span class="timestamp">15:42:30</span>
        <span class="text">✓ Story file created: docs/stories/1.5.story.md</span>
      </div>
      <div class="output-line success">
        <span class="timestamp">15:42:35</span>
        <span class="text">🎉 Story "API Integration" ready for dev!</span>
      </div>
    </div>

    <div class="console-input">
      <div class="input-group">
        <span class="prompt">jordan@bmad:~$ </span>
        <input type="text" class="command-input" placeholder="Enter command...">
        <button class="btn-primary">Send</button>
      </div>
      <div class="quick-commands">
        <button class="cmd-btn">help</button>
        <button class="cmd-btn">draft</button>
        <button class="cmd-btn">next-story</button>
        <button class="cmd-btn">plan-sprint</button>
      </div>
    </div>
  </div>
</div>
```

### 3. Header Navigation

```html
<header class="app-header">
  <div class="header-left">
    <div class="logo">BMAD</div>
    <div class="project-info">
      <h1>MyProject</h1>
      <span class="sprint-status">Sprint 2 • Day 5/14 • 75% complete</span>
    </div>
  </div>
  
  <nav class="header-nav">
    <a href="/" class="nav-link active">Board</a>
    <a href="/reports" class="nav-link">Reports</a>
    <a href="/settings" class="nav-link">Settings</a>
  </nav>
  
  <div class="header-right">
    <button class="notifications">🔔 <span class="badge">3</span></button>
    <div class="user-menu">
      <span class="user-avatar">👤</span>
      <span class="user-name">Admin</span>
    </div>
  </div>
</header>
```

---

## User Interactions

### Core Workflows

#### 1. Starting Work on a Story
1. User sees "Ready" story on board
2. Clicks "Start Dev" button on story card
3. Dev agent tab becomes active
4. Agent console shows initialization
5. Story moves to "In Progress" column
6. Progress updates appear in real-time

#### 2. Agent Command Interaction
1. User clicks on agent tab (e.g., SM)
2. Console shows agent status and recent output
3. User types command: "draft story-1.6"
4. Formatted output streams in real-time
5. Success/error states clearly indicated
6. Quick command buttons for common actions

#### 3. Managing Work Flow
1. User drags story from "Ready" to "In Progress"
2. System prompts: "Start agent for this story?"
3. If yes, appropriate agent launches automatically
4. Story card updates with agent assignment
5. Progress tracking begins

### Real-Time Features

#### Live Updates
- **Agent Status**: Dots show active/working/idle/offline
- **Story Progress**: Progress bars update as agents work
- **Console Output**: Real-time streaming of agent commands
- **Status Changes**: Stories move between columns automatically

#### WebSocket Events
```javascript
// Status updates
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  
  switch(type) {
    case 'agent_status_changed':
      updateAgentTab(data.agentId, data.status);
      break;
    case 'story_progress_updated':
      updateStoryCard(data.storyId, data.progress);
      break;
    case 'agent_output':
      appendToConsole(data.agentId, data.output);
      break;
    case 'work_item_moved':
      moveStoryCard(data.storyId, data.newColumn);
      break;
  }
};
```

---

## Visual Design

### Color Scheme
```css
:root {
  /* Primary Colors */
  --primary: #2563eb;
  --primary-light: #3b82f6;
  --primary-dark: #1d4ed8;
  
  /* Status Colors */
  --status-backlog: #6b7280;
  --status-ready: #06b6d4;
  --status-progress: #f59e0b;
  --status-review: #ec4899;
  --status-done: #10b981;
  
  /* Agent Status */
  --agent-active: #10b981;
  --agent-working: #f59e0b;
  --agent-idle: #6b7280;
  --agent-offline: #9ca3af;
  
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #e2e8f0;
  
  /* Text */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
}
```

### Typography
```css
:root {
  --font-primary: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
}
```

### Component Styles
```css
/* Story Cards */
.story-card {
  background: var(--bg-primary);
  border: 1px solid var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s ease;
}

.story-card:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Agent Console */
.console-output {
  background: #1e293b;
  color: #e2e8f0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: 16px;
  height: 300px;
  overflow-y: auto;
  border-radius: 8px;
}

.output-line {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.timestamp {
  color: #64748b;
  margin-right: 8px;
}

.output-line.success .text {
  color: #10b981;
}

.output-line.error .text {
  color: #ef4444;
}
```

---

## Technical Implementation

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Real-time**: WebSockets
- **Build**: Vite

### API Integration
```typescript
// MCP Service calls
export const mcpService = {
  async getWorkItems(projectId: string) {
    return fetch(`/api/projects/${projectId}/work-items`);
  },
  
  async updateWorkItemStatus(workItemId: string, status: string) {
    return fetch(`/api/work-items/${workItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  
  async startAgent(agentType: string, projectPath: string) {
    return fetch(`/api/agents/${agentType}/start`, {
      method: 'POST',
      body: JSON.stringify({ projectPath })
    });
  },
  
  async sendAgentCommand(agentId: string, command: string) {
    return fetch(`/api/agents/${agentId}/command`, {
      method: 'POST', 
      body: JSON.stringify({ command })
    });
  }
};
```

### WebSocket Connection
```typescript
export const useWebSocket = (projectId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/project/${projectId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
    };
    
    setSocket(ws);
    return () => ws.close();
  }, [projectId]);
  
  return socket;
};
```

---

## Success Metrics

### User Experience Goals
- **Task visibility**: Users can see work status at a glance
- **Agent control**: Easy to start/stop agents and send commands  
- **Real-time feedback**: Live updates on agent progress
- **Mobile accessibility**: Works on tablets and phones

### Performance Targets
- **Page load**: < 2 seconds
- **Real-time latency**: < 500ms for status updates
- **Agent command response**: < 1 second to show in console
- **Drag & drop responsiveness**: < 100ms visual feedback

### Key Features Delivered
1. ✅ Task board as main interface
2. ✅ Tabbed agent console with real-time output
3. ✅ Drag & drop work item management
4. ✅ Live agent status and progress tracking
5. ✅ Mobile-responsive design
6. ✅ WebSocket real-time updates

---

This specification focuses on the core requirements: a task board main interface with an agent console panel, keeping the design simple and functional without over-engineering.