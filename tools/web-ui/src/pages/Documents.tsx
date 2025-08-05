import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { Document } from '../types';

const Documents: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    type: 'prd',
    title: '',
    content: '',
    status: 'DRAFT'
  });
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.getDocuments(),
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsEditing(false);
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof createFormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create document: ${error}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsCreating(false);
      setCreateFormData({ type: 'prd', title: '', content: '', status: 'DRAFT' });
    },
    onError: (error: any) => {
      console.error('Failed to create document:', error);
    },
  });

  const documentTypes = [
    { value: 'all', label: 'All Documents', icon: '📚', count: documents.length },
    { value: 'prd', label: 'PRDs', icon: '📋' },
    { value: 'architecture', label: 'Architecture', icon: '🏗️' },
    { value: 'epic', label: 'Epics', icon: '📖' },
    { value: 'meeting_notes', label: 'Meeting Notes', icon: '📝' },
    { value: 'technical_spec', label: 'Technical Specs', icon: '⚙️' },
    { value: 'sprint-plan', label: 'Sprint Plans', icon: '🏃' },
    { value: 'sprint-review', label: 'Sprint Reviews', icon: '📊' },
  ];

  // Update document type counts
  const typesWithCounts = documentTypes.map(type => ({
    ...type,
    count: type.value === 'all' 
      ? documents.length 
      : documents.filter(doc => doc.type === type.value).length
  }));

  const filteredDocuments = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === filterType);

  const getDocumentIcon = (type: string) => {
    const typeConfig = documentTypes.find(t => t.value === type);
    return typeConfig?.icon || '📄';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'IN_REVIEW': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const handleEditStart = () => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.title);
      setEditContent(selectedDoc.content || '');
      setIsEditing(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleEditSave = (createVersion = false) => {
    if (selectedDoc) {
      updateDocumentMutation.mutate({
        id: selectedDoc.id,
        data: {
          title: editTitle,
          content: editContent,
          create_version: createVersion
        }
      });
    }
  };

  const handleCreateDocument = () => {
    setIsCreating(true);
    setSelectedDoc(null);
    setIsEditing(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createFormData.title.trim() && createFormData.content.trim()) {
      createDocumentMutation.mutate(createFormData);
    }
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setCreateFormData({ type: 'prd', title: '', content: '', status: 'DRAFT' });
  };

  const getDocumentTemplate = (type: string) => {
    const templates: Record<string, string> = {
      prd: `# Product Requirements Document

## Overview
Brief description of the product or feature.

## Objectives
- Primary goal
- Secondary goals

## User Stories
- As a [user type], I want [functionality] so that [benefit]

## Requirements
### Functional Requirements
- Requirement 1
- Requirement 2

### Non-Functional Requirements
- Performance requirements
- Security requirements

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2`,

      architecture: `# System Architecture Document

## Overview
High-level system description and purpose.

## Architecture Principles
- Principle 1
- Principle 2

## System Components
### Component 1
Description and responsibilities.

## Data Flow
Describe how data moves through the system.

## Technology Stack
- Frontend: 
- Backend: 
- Database: 

## Security Considerations
Key security measures and protocols.`,

      epic: `# Epic: [Epic Name]

## Summary
Brief description of the epic and its value.

## Business Value
Why this epic is important to the business.

## Stories
- [ ] Story 1: Brief description
- [ ] Story 2: Brief description

## Acceptance Criteria
- [ ] Epic-level acceptance criteria

## Dependencies
- Internal dependencies
- External dependencies`,

      meeting_notes: `# Meeting Notes - [Date]

## Attendees
- Name 1 (Role)
- Name 2 (Role)

## Agenda
1. Topic 1
2. Topic 2

## Discussion Points
### Topic 1
- Key points discussed
- Decisions made

## Action Items
- [ ] Action item 1 (Owner: Name, Due: Date)
- [ ] Action item 2 (Owner: Name, Due: Date)`,

      technical_spec: `# Technical Specification

## Overview
Brief technical overview of the implementation.

## Requirements
- Technical requirement 1
- Technical requirement 2

## Design
### High-Level Design
Architecture and component overview.

## API Specification
### Endpoints
- \`GET /api/resource\` - Description
- \`POST /api/resource\` - Description

## Implementation Plan
1. Phase 1: Foundation
2. Phase 2: Core features
3. Phase 3: Integration`
    };
    return templates[type] || '';
  };

  // Update selected document when documents change
  useEffect(() => {
    if (selectedDoc && documents.length > 0) {
      const updated = documents.find(doc => doc.id === selectedDoc.id);
      if (updated) {
        setSelectedDoc(updated);
      }
    }
  }, [documents, selectedDoc]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="mt-1 text-gray-600">
              Project documentation and specifications
            </p>
          </div>
          <Button onClick={handleCreateDocument}>Create Document</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Document Types */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Document Types</h2>
            <div className="space-y-1">
              {typesWithCounts.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    filterType === type.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {type.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {filterType === 'all' ? 'All Documents' : typesWithCounts.find(t => t.value === filterType)?.label}
            </h3>
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                    selectedDoc?.id === doc.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-sm mt-0.5">{getDocumentIcon(doc.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          v{doc.version} • {new Date(doc.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusColor(doc.status)} className="text-xs">
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {isCreating ? (
            <>            
              {/* Create Document Form */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Create New Document</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  {/* Document Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Document Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'prd', label: 'PRD', icon: '📋', description: 'Product requirements' },
                        { value: 'architecture', label: 'Architecture', icon: '🏗️', description: 'System design' },
                        { value: 'epic', label: 'Epic', icon: '📖', description: 'Feature breakdown' },
                        { value: 'meeting_notes', label: 'Meeting Notes', icon: '📝', description: 'Meeting records' },
                        { value: 'technical_spec', label: 'Tech Spec', icon: '⚙️', description: 'Implementation guide' },
                      ].map((type) => (
                        <Card
                          key={type.value}
                          className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                            createFormData.type === type.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setCreateFormData(prev => ({ ...prev, type: type.value }))}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Document Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={createFormData.title}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter document title..."
                      required
                    />
                  </div>

                  {/* Document Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Content (Markdown)
                      </label>
                      <Button
                        type="button"
                        onClick={() => setCreateFormData(prev => ({ 
                          ...prev, 
                          content: getDocumentTemplate(prev.type),
                          title: prev.title || `New ${prev.type.toUpperCase()}`
                        }))}
                        className="text-xs bg-gray-600 hover:bg-gray-700"
                      >
                        📝 Use Template
                      </Button>
                    </div>
                    <textarea
                      value={createFormData.content}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="flex-1 min-h-[400px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter document content in Markdown format..."
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      type="button"
                      onClick={handleCreateCancel}
                      disabled={createDocumentMutation.isPending}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createDocumentMutation.isPending || !createFormData.title.trim() || !createFormData.content.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createDocumentMutation.isPending ? 'Creating...' : 'Create Document'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : selectedDoc ? (
            <>
              {/* Document Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getDocumentIcon(selectedDoc.type)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedDoc.title}
                      </h2>
                      <div className="text-sm text-gray-600 flex items-center space-x-3">
                        <span>{selectedDoc.type.toUpperCase()}</span>
                        <span>•</span>
                        <span>Version {selectedDoc.version}</span>
                        <span>•</span>
                        <span>Updated {new Date(selectedDoc.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(selectedDoc.status)}>
                      {selectedDoc.status}
                    </Badge>
                    {!isEditing ? (
                      <Button onClick={handleEditStart} className="text-sm">
                        Edit
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEditSave(false)}
                          disabled={updateDocumentMutation.isPending}
                          className="text-sm bg-gray-600 hover:bg-gray-700"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => handleEditSave(true)}
                          disabled={updateDocumentMutation.isPending}
                          className="text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Save as New Version
                        </Button>
                        <Button
                          onClick={handleEditCancel}
                          disabled={updateDocumentMutation.isPending}
                          className="text-sm bg-red-600 hover:bg-red-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content (Markdown)
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter document content in Markdown format..."
                      />
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                      <div className="prose max-w-none border border-gray-200 rounded-md p-4 bg-gray-50">
                        <ReactMarkdown>
                          {editContent || 'No content to preview.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <ReactMarkdown>
                      {selectedDoc.content || 'No content available.'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <div className="text-xl font-medium">Select a document</div>
                <div className="text-sm mt-2">
                  Choose a document from the sidebar to view and edit its content
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Documents;