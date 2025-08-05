import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { api } from '../lib/api';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'prd',
    title: '',
    content: '',
    status: 'DRAFT'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const documentTypes = [
    { value: 'prd', label: 'Product Requirements Document (PRD)', icon: '📋', description: 'Define product features and requirements' },
    { value: 'architecture', label: 'Architecture Document', icon: '🏗️', description: 'System design and technical architecture' },
    { value: 'epic', label: 'Epic Document', icon: '📖', description: 'Large feature or initiative breakdown' },
    { value: 'meeting_notes', label: 'Meeting Notes', icon: '📝', description: 'Record of meetings and decisions' },
    { value: 'technical_spec', label: 'Technical Specification', icon: '⚙️', description: 'Detailed technical implementation guide' },
  ];

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create document:', error);
    },
  });

  const handleClose = () => {
    setFormData({ type: 'prd', title: '', content: '', status: 'DRAFT' });
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Document title is required';
    if (!formData.content.trim()) newErrors.content = 'Document content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createDocumentMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
- Scalability requirements

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Out of Scope
Items explicitly not included in this release.`,

      architecture: `# System Architecture Document

## Overview
High-level system description and purpose.

## Architecture Principles
- Principle 1
- Principle 2

## System Components
### Component 1
Description and responsibilities.

### Component 2
Description and responsibilities.

## Data Flow
Describe how data moves through the system.

## Technology Stack
- Frontend: 
- Backend: 
- Database: 
- Infrastructure: 

## Security Considerations
Key security measures and protocols.

## Scalability Plan
How the system will handle growth.`,

      epic: `# Epic: [Epic Name]

## Summary
Brief description of the epic and its value.

## Business Value
Why this epic is important to the business.

## User Impact
How this will affect end users.

## Stories
- [ ] Story 1: Brief description
- [ ] Story 2: Brief description
- [ ] Story 3: Brief description

## Acceptance Criteria
- [ ] Epic-level acceptance criteria

## Dependencies
- Internal dependencies
- External dependencies

## Risks and Assumptions
- Known risks
- Key assumptions`,

      meeting_notes: `# Meeting Notes - [Date]

## Attendees
- Name 1 (Role)
- Name 2 (Role)

## Agenda
1. Topic 1
2. Topic 2
3. Topic 3

## Discussion Points
### Topic 1
- Key points discussed
- Decisions made

### Topic 2
- Key points discussed
- Decisions made

## Action Items
- [ ] Action item 1 (Owner: Name, Due: Date)
- [ ] Action item 2 (Owner: Name, Due: Date)

## Next Meeting
Date, time, and focus areas.`,

      technical_spec: `# Technical Specification

## Overview
Brief technical overview of the implementation.

## Requirements
- Technical requirement 1
- Technical requirement 2

## Design
### High-Level Design
Architecture and component overview.

### Detailed Design
Specific implementation details.

## API Specification
### Endpoints
- \`GET /api/resource\` - Description
- \`POST /api/resource\` - Description

## Database Schema
Tables and relationships.

## Implementation Plan
1. Phase 1: Foundation
2. Phase 2: Core features
3. Phase 3: Integration

## Testing Strategy
- Unit tests
- Integration tests
- End-to-end tests

## Deployment
Deployment process and requirements.`
    };
    return templates[type] || '';
  };

  const selectedType = documentTypes.find(t => t.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 overflow-hidden">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Document Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                    formData.type === type.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`e.g., ${selectedType?.label} for User Authentication`}
            />
            {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
          </div>

          {/* Document Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content (Markdown) *
              </label>
              <Button
                type="button"
                onClick={() => handleInputChange('content', getDocumentTemplate(formData.type))}
                className="text-xs bg-gray-600 hover:bg-gray-700"
              >
                📝 Use Template
              </Button>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className={`flex-1 min-h-[300px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter document content in Markdown format..."
            />
            {errors.content && <div className="text-red-500 text-sm mt-1">{errors.content}</div>}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              disabled={createDocumentMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDocumentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createDocumentMutation.isPending ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentModal;