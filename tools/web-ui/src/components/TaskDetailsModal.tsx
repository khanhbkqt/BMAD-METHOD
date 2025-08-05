import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { Task } from '../types';
import ReactMarkdown from 'react-markdown';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentLink {
  id: string;
  document_id: string;
  document_section?: string;
  link_purpose?: string;
  title: string;
  type: string;
  created_at: string;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  const queryClient = useQueryClient();

  const { data: documentLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['task-document-links', task?.id],
    queryFn: () => task ? api.getEntityDocumentLinks('task', task.id) : Promise.resolve({ links: [] }),
    enabled: !!task && isOpen,
  });

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentSections, setDocumentSections] = useState<any[]>([]);

  const { data: documentContent, isLoading: documentLoading } = useQuery({
    queryKey: ['document-content', selectedDocument?.document_id],
    queryFn: () => selectedDocument ? api.getDocument(selectedDocument.document_id) : null,
    enabled: !!selectedDocument,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['document-sections', selectedDocument?.document_id],
    queryFn: () => selectedDocument ? api.getDocumentSections(selectedDocument.document_id) : [],
    enabled: !!selectedDocument,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      api.updateTaskStatus(taskId, updates.status || task?.status || 'TODO'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-sprint-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-progress'] });
    },
  });

  const unlinkDocumentMutation = useMutation({
    mutationFn: ({ entity_type, entity_id, document_id, document_section }: any) =>
      api.unlinkEntityFromDocument({ entity_type, entity_id, document_id, document_section }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-document-links', task?.id] });
    },
  });

  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'gray';
      case 'IN_PROGRESS': return 'blue';
      case 'IN_REVIEW': return 'yellow';
      case 'DONE': return 'green';
      case 'BLOCKED': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'gray';
      case 'MEDIUM': return 'blue';
      case 'HIGH': return 'orange';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'prd': return '📋';
      case 'architecture': return '🏗️';
      case 'epic': return '📖';
      case 'meeting_notes': return '📝';
      case 'technical_spec': return '⚙️';
      default: return '📄';
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { status: newStatus }
    });
  };

  const handleUnlinkDocument = (link: DocumentLink) => {
    unlinkDocumentMutation.mutate({
      entity_type: 'task',
      entity_id: task.id,
      document_id: link.document_id,
      document_section: link.document_section
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: 'TODO', label: 'To Do', color: 'gray' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
    { value: 'IN_REVIEW', label: 'In Review', color: 'yellow' },
    { value: 'DONE', label: 'Done', color: 'green' },
    { value: 'BLOCKED', label: 'Blocked', color: 'red' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClose={onClose}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl font-bold">
                E{task.epic_num}.{task.story_num}: {task.title}
              </DialogTitle>
              <Badge variant={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            <DialogClose onClose={onClose} />
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>📅 Created: {formatDate(task.created_at)}</span>
            {task.updated_at !== task.created_at && (
              <span>✏️ Updated: {formatDate(task.updated_at)}</span>
            )}
            {task.assignee && (
              <span>👤 Assigned to: {task.assignee}</span>
            )}
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 mb-4">
          {[
            { id: 'details', label: 'Details', icon: '📝' },
            { id: 'documents', label: 'Documents', icon: '📄', count: documentLinks.links?.length },
            { id: 'history', label: 'History', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status Actions */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Status Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      disabled={task.status === status.value || updateTaskMutation.isPending}
                      className={`text-xs ${
                        task.status === status.value 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : status.color === 'green' 
                            ? 'bg-green-600 hover:bg-green-700'
                            : status.color === 'blue'
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : status.color === 'yellow'
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : status.color === 'red'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Task Description */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Description</h3>
                {task.description ? (
                  <div className="prose max-w-none text-sm">
                    <ReactMarkdown>{task.description}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm italic">No description provided</div>
                )}
              </Card>

              {/* Task Metadata */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Task Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Epic:</span>
                    <span className="ml-2 text-gray-600">Epic {task.epic_num}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Story:</span>
                    <span className="ml-2 text-gray-600">Story {task.story_num}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className="ml-2">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assignee:</span>
                    <span className="ml-2 text-gray-600">{task.assignee || 'Unassigned'}</span>
                  </div>
                  {task.estimated_hours && (
                    <div>
                      <span className="font-medium text-gray-700">Estimated Hours:</span>
                      <span className="ml-2 text-gray-600">{task.estimated_hours}h</span>
                    </div>
                  )}
                  {task.actual_hours && (
                    <div>
                      <span className="font-medium text-gray-700">Actual Hours:</span>
                      <span className="ml-2 text-gray-600">{task.actual_hours}h</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              {linksLoading ? (
                <div className="text-center text-gray-500 py-8">Loading document links...</div>
              ) : documentLinks.links?.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <div>No documents linked to this task</div>
                  <div className="text-sm mt-2">Link documents to provide context and requirements</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Document Links List */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Linked Documents ({documentLinks.links?.length})</h3>
                    {documentLinks.links?.map((link: DocumentLink) => (
                      <Card 
                        key={`${link.document_id}-${link.document_section || 'root'}`}
                        className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                          selectedDocument?.document_id === link.document_id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedDocument(link)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <span className="text-lg mt-0.5">{getDocumentIcon(link.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {link.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {link.type.toUpperCase()}
                                {link.document_section && (
                                  <span> • Section: {link.document_section}</span>
                                )}
                                {link.link_purpose && (
                                  <span> • {link.link_purpose}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Linked: {formatDate(link.created_at)}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkDocument(link);
                            }}
                            disabled={unlinkDocumentMutation.isPending}
                            className="text-xs bg-red-600 hover:bg-red-700 ml-2"
                          >
                            Unlink
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Document Content Preview */}
                  <div className="space-y-3">
                    {selectedDocument ? (
                      <>
                        <h3 className="font-medium text-gray-900">Document Preview</h3>
                        {documentLoading ? (
                          <div className="text-center text-gray-500 py-8">Loading document...</div>
                        ) : documentContent ? (
                          <Card className="p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getDocumentIcon(documentContent.type)}</span>
                                <div>
                                  <div className="font-medium text-gray-900">{documentContent.title}</div>
                                  <div className="text-xs text-gray-500">
                                    {documentContent.type.toUpperCase()} • Version {documentContent.version}
                                  </div>
                                </div>
                              </div>
                              
                              {selectedDocument.document_section && sections.length > 0 && (
                                <div className="border-t pt-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    Section: {selectedDocument.document_section}
                                  </div>
                                  {(() => {
                                    const section = sections.find(s => s.section_id === selectedDocument.document_section);
                                    return section ? (
                                      <div className="prose max-w-none text-sm bg-gray-50 p-3 rounded">
                                        <ReactMarkdown>{section.content}</ReactMarkdown>
                                      </div>
                                    ) : (
                                      <div className="text-gray-500 text-sm italic">Section not found</div>
                                    );
                                  })()}
                                </div>
                              )}
                              
                              {!selectedDocument.document_section && (
                                <div className="border-t pt-3">
                                  <div className="prose max-w-none text-sm">
                                    <ReactMarkdown>{documentContent.content || 'No content available.'}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ) : (
                          <div className="text-center text-gray-500 py-8">Document not found</div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">👈</div>
                        <div>Select a document to preview</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Task History</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <span className="font-medium">Task created</span>
                      <div className="text-gray-500">{formatDate(task.created_at)}</div>
                    </div>
                  </div>
                  {task.updated_at !== task.created_at && (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <span className="font-medium">Task updated</span>
                        <div className="text-gray-500">{formatDate(task.updated_at)}</div>
                      </div>
                    </div>
                  )}
                  <div className="text-center text-gray-500 text-sm italic py-4">
                    Detailed change history coming soon
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;