export interface Task {
  id: string
  epic_num: number
  title: string
  description: string
  assignee?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'
  created_at: string
  updated_at: string
  estimated_hours?: number
  actual_hours?: number
}

export interface Epic {
  id: number
  epic_num: number
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  created_at: string
  updated_at: string
}

export interface Document {
  id: number
  type: 'prd' | 'architecture' | 'epic' | 'meeting_notes' | 'technical_spec'
  title: string
  content: string
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string
}

export interface Sprint {
  id: number
  name: string
  goal: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface ProjectProgress {
  overall: {
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    todo_tasks: number
    completion_percentage: number
  }
  epics: Array<{
    epic_num: number
    title: string
    total_tasks: number
    completed_tasks: number
    completion_percentage: number
  }>
}

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']
export type DocumentType = Document['type']
export type DocumentStatus = Document['status']