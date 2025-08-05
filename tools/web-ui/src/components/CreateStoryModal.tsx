import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { api } from '../lib/api';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId?: string | null; // Optional sprint to auto-assign to
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, sprintId }) => {
  const [formData, setFormData] = useState({
    epic_num: 1,
    title: '',
    description: '',
    assignee: 'dev',
    priority: 'MEDIUM'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: epics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => api.getEpics(),
    enabled: isOpen,
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create story');
      const result = await response.json();
      
      // If sprintId provided, assign the story to that sprint
      if (sprintId && result.id) {
        const assignResponse = await fetch(`/api/tasks/${result.id}/sprint`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sprint_id: sprintId })
        });
        if (!assignResponse.ok) {
          console.warn('Failed to assign story to sprint');
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-sprint-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-progress'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create story:', error);
    },
  });

  const handleClose = () => {
    setFormData({
      epic_num: 1,
      title: '',
      description: '',
      assignee: 'dev',
      priority: 'MEDIUM'
    });
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Story title is required';
    if (!formData.description.trim()) newErrors.description = 'Story description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createStoryMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
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

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'gray' },
    { value: 'MEDIUM', label: 'Medium', color: 'blue' },
    { value: 'HIGH', label: 'High', color: 'orange' },
    { value: 'CRITICAL', label: 'Critical', color: 'red' },
  ];

  const assignees = [
    { value: 'dev', label: 'Developer', icon: '👨‍💻' },
    { value: 'qa', label: 'QA Engineer', icon: '🧪' },
    { value: 'sm', label: 'Scrum Master', icon: '📋' },
    { value: 'pm', label: 'Product Manager', icon: '📊' },
    { value: 'architect', label: 'Architect', icon: '🏗️' },
    { value: 'designer', label: 'Designer', icon: '🎨' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Create New Story</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Epic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Epic *
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {epics.length > 0 ? (
                epics.map((epic: any) => (
                  <Card
                    key={epic.epic_num}
                    className={`p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                      formData.epic_num === epic.epic_num ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleInputChange('epic_num', epic.epic_num)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Epic {epic.epic_num}: {epic.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{epic.description}</div>
                      </div>
                      <Badge variant={getPriorityColor(epic.priority)} className="text-xs">
                        {epic.priority}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-sm">No epics found. Stories will be added to Epic 1.</div>
                </div>
              )}
            </div>
          </div>

          {/* Story Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Implement user login functionality"
            />
            {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
          </div>

          {/* Story Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description & Acceptance Criteria *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`As a user, I want to be able to log in so that I can access my account.

**Acceptance Criteria:**
- [ ] User can enter email and password
- [ ] System validates credentials
- [ ] User is redirected to dashboard on success
- [ ] Error message shown for invalid credentials
- [ ] Password field is masked

**Additional Notes:**
- Use existing authentication service
- Follow current UI design patterns`}
            />
            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex space-x-2">
              {priorities.map((priority) => (
                <Button
                  key={priority.value}
                  type="button"
                  onClick={() => handleInputChange('priority', priority.value)}
                  className={`text-xs ${
                    formData.priority === priority.value
                      ? priority.color === 'gray' ? 'bg-gray-600 hover:bg-gray-700' :
                        priority.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                        priority.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                        priority.color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  {priority.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Assignee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <div className="grid grid-cols-2 gap-2">
              {assignees.map((assignee) => (
                <Card
                  key={assignee.value}
                  className={`p-2 cursor-pointer transition-colors hover:bg-blue-50 ${
                    formData.assignee === assignee.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleInputChange('assignee', assignee.value)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{assignee.icon}</span>
                    <span className="text-sm font-medium">{assignee.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              disabled={createStoryMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStoryMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createStoryMutation.isPending ? 'Creating...' : 'Create Story'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;