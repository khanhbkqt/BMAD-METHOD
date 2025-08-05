import axios from 'axios'
import type { Task, Epic, Document, Sprint, ProjectProgress } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Sprint API
export const sprintApi = {
  getCurrent: () => api.get<Sprint | null>('/sprints/current'),
  getAll: () => api.get<Sprint[]>('/sprints'),
  create: (data: Omit<Sprint, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ id: number; message: string }>('/sprints', data),
}

// Task API
export const taskApi = {
  getAll: (params?: { epic_num?: number; status?: string; sprint_id?: string; current_sprint_only?: boolean }) =>
    api.get<Task[]>('/tasks', { params }),
  getCurrentSprint: () =>
    api.get<Task[]>('/tasks', { params: { current_sprint_only: true } }),
  create: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ id: string; message: string }>('/tasks', data),
  update: (id: string, data: Partial<Task>) =>
    api.put<{ message: string; changes: number }>(`/tasks/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string; changes: number }>(`/tasks/${id}`),
  updateStatus: (id: string, status: Task['status']) =>
    api.put<{ message: string; changes: number }>(`/tasks/${id}/status`, { status }),
  approve: (id: string) =>
    api.post<{ message: string; changes: number }>(`/tasks/${id}/approve`),
}

// Epic API
export const epicApi = {
  getAll: () => api.get<Epic[]>('/epics'),
  create: (data: Omit<Epic, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ id: number; message: string }>('/epics', data),
  update: (id: number, data: Partial<Epic>) =>
    api.put<{ message: string; changes: number }>(`/epics/${id}`, data),
  delete: (id: number) =>
    api.delete<{ message: string; changes: number }>(`/epics/${id}`),
}

// Document API
export const documentApi = {
  getAll: () => api.get<Document[]>('/documents'),
  getById: (id: number) => api.get<Document>(`/documents/${id}`),
  create: (data: Omit<Document, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ id: number; message: string }>('/documents', data),
  update: (id: number, data: Partial<Document> & { create_version?: boolean }) =>
    api.put<{ message: string; changes: number }>(`/documents/${id}`, data),
  delete: (id: number) =>
    api.delete<{ message: string; changes: number }>(`/documents/${id}`),
  approve: (id: number) =>
    api.post<{ message: string; changes: number }>(`/documents/${id}/approve`),
  getSections: (id: number) =>
    api.get<any[]>(`/documents/${id}/sections`),
  getBySection: (id: number, sectionId: string) =>
    api.get<any>(`/documents/${id}/sections/${sectionId}`),
  getLinkedEntities: (id: number, section?: string) =>
    api.get<any>(`/documents/${id}/linked-entities`, { params: { section } }),
}

// Progress API
export const progressApi = {
  get: () => api.get<ProjectProgress>('/progress'),
}

// Entity linking API
export const linkingApi = {
  linkEntity: (data: { entity_type: string; entity_id: string; document_id: string; document_section?: string; link_purpose?: string }) =>
    api.post<{ message: string; link_id: string; changes: number }>('/link-entity', data),
  unlinkEntity: (data: { entity_type: string; entity_id: string; document_id: string; document_section?: string }) =>
    api.delete<{ message: string; changes: number }>('/unlink-entity', { data }),
  getEntityLinks: (entity_type: string, entity_id: string) =>
    api.get<{ entity_type: string; entity_id: string; links: any[]; link_count: number; message: string }>(`/entities/${entity_type}/${entity_id}/document-links`),
}

// Convenience API object for components
export const clientApi = {
  getProjectProgress: () => progressApi.get().then(res => res.data),
  getTasks: (params?: { epic_num?: number; status?: string; sprint_id?: string; current_sprint_only?: boolean }) => taskApi.getAll(params).then(res => res.data),
  getCurrentSprintTasks: () => taskApi.getCurrentSprint().then(res => res.data),
  getCurrentSprint: () => sprintApi.getCurrent().then(res => res.data),
  getSprints: () => sprintApi.getAll().then(res => res.data),
  getEpics: () => epicApi.getAll().then(res => res.data),
  getDocuments: () => documentApi.getAll().then(res => res.data),
  getDocument: (id: number) => documentApi.getById(id).then(res => res.data),
  updateDocument: (id: number, data: any) => documentApi.update(id, data).then(res => res.data),
  updateTaskStatus: (id: string, status: string) => taskApi.updateStatus(id, status).then(res => res.data),
  getDocumentSections: (id: number) => documentApi.getSections(id).then(res => res.data),
  getDocumentBySection: (id: number, sectionId: string) => documentApi.getBySection(id, sectionId).then(res => res.data),
  getDocumentLinkedEntities: (id: number, section?: string) => documentApi.getLinkedEntities(id, section).then(res => res.data),
  linkEntityToDocument: (data: any) => linkingApi.linkEntity(data).then(res => res.data),
  unlinkEntityFromDocument: (data: any) => linkingApi.unlinkEntity(data).then(res => res.data),
  getEntityDocumentLinks: (entity_type: string, entity_id: string) => linkingApi.getEntityLinks(entity_type, entity_id).then(res => res.data),
}

// For backward compatibility
export { clientApi as api }