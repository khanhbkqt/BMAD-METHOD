import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { api } from '../lib/api';

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const createSprintMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create sprint: ${error}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-sprint'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create sprint:', error);
    },
  });

  const handleClose = () => {
    setFormData({ name: '', goal: '', start_date: '', end_date: '' });
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Sprint name is required';
    if (!formData.goal.trim()) newErrors.goal = 'Sprint goal is required';
    
    // Date validation
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createSprintMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-generate sprint name based on current date
  const generateSprintName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const week = Math.ceil(now.getDate() / 7);
    return `Sprint ${year}-${month}-W${week}`;
  };

  // Auto-generate date range (2 weeks from today)
  const generateDateRange = () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, start_date: startDate, end_date: endDate }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sprint Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sprint Name *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Sprint 2024-Jan-W1"
              />
              <Button
                type="button"
                onClick={() => handleInputChange('name', generateSprintName())}
                className="bg-gray-600 hover:bg-gray-700 text-xs"
              >
                Auto-Generate
              </Button>
            </div>
            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>

          {/* Sprint Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sprint Goal *
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.goal ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What do you want to achieve in this sprint? Be specific about the main objectives and deliverables."
            />
            {errors.goal && <div className="text-red-500 text-sm mt-1">{errors.goal}</div>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
            </div>
          </div>

          <Button
            type="button"
            onClick={generateDateRange}
            className="w-full bg-gray-600 hover:bg-gray-700 text-sm"
          >
            📅 Set 2-Week Sprint (Today to +14 days)
          </Button>

          {/* Sprint Guidelines */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Sprint Planning Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose a clear, measurable goal that delivers value</li>
              <li>• Keep sprints between 1-4 weeks (2 weeks is recommended)</li>
              <li>• Focus on one main objective with supporting tasks</li>
              <li>• Ensure the goal aligns with your project milestones</li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              disabled={createSprintMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSprintMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createSprintMutation.isPending ? 'Creating...' : 'Create Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSprintModal;