import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { Task } from '../types';

interface AddStoryToSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  sprintName: string;
}

const AddStoryToSprintModal: React.FC<AddStoryToSprintModalProps> = ({ 
  isOpen, 
  onClose, 
  sprintId, 
  sprintName 
}) => {
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Get all stories that are not already in this sprint
  const { data: availableStories = [], isLoading } = useQuery({
    queryKey: ['available-stories', sprintId],
    queryFn: async () => {
      const allTasks = await api.getTasks();
      const sprintTasks = await api.getTasks({ sprint_id: sprintId });
      const sprintTaskIds = new Set(sprintTasks.map((task: Task) => task.id));
      
      // Filter out tasks already in this sprint
      return allTasks.filter((task: Task) => !sprintTaskIds.has(task.id));
    },
    enabled: isOpen,
  });

  const addStoriesToSprintMutation = useMutation({
    mutationFn: async (storyIds: string[]) => {
      const promises = storyIds.map(storyId => 
        fetch(`/api/tasks/${storyId}/sprint`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sprint_id: sprintId })
        })
      );
      
      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(r => !r.ok);
      
      if (failedResponses.length > 0) {
        throw new Error(`Failed to add ${failedResponses.length} stories to sprint`);
      }
      
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['available-stories', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['current-sprint-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to add stories to sprint:', error);
    },
  });

  const handleClose = () => {
    setSelectedStories(new Set());
    setSearchTerm('');
    onClose();
  };

  const handleStoryToggle = (storyId: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
    } else {
      newSelected.add(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleAddStories = () => {
    if (selectedStories.size > 0) {
      addStoriesToSprintMutation.mutate(Array.from(selectedStories));
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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'gray';
      case 'IN_PROGRESS': return 'blue';
      case 'IN_REVIEW': return 'yellow';
      case 'DONE': return 'green';
      case 'BLOCKED': return 'red';
      default: return 'gray';
    }
  };

  // Filter stories based on search term
  const filteredStories = availableStories.filter((story: Task) =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `E${story.epic_num}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group stories by epic
  const storiesByEpic = filteredStories.reduce((acc: Record<string, Task[]>, story: Task) => {
    const epicKey = `E${story.epic_num}`;
    if (!acc[epicKey]) acc[epicKey] = [];
    acc[epicKey].push(story);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClose={handleClose}>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading available stories...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClose={handleClose}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Add Stories to {sprintName}
            </DialogTitle>
            <DialogClose onClose={handleClose} />
          </div>
          <div className="text-sm text-gray-600">
            Select existing stories to add to this sprint
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 pb-4">
          <input
            type="text"
            placeholder="Search stories by title, description, or epic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected Count */}
        {selectedStories.size > 0 && (
          <div className="px-6 pb-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-blue-800 font-medium">
                {selectedStories.size} stories selected
              </span>
            </div>
          </div>
        )}

        {/* Story List */}
        <div className="flex-1 overflow-y-auto px-6">
          {Object.entries(storiesByEpic).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(storiesByEpic).map(([epicKey, stories]) => (
                <div key={epicKey}>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                    📖 {epicKey} ({stories.length} stories)
                  </h3>
                  <div className="space-y-3">
                    {stories.map((story: Task) => (
                      <Card
                        key={story.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedStories.has(story.id)
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleStoryToggle(story.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                selectedStories.has(story.id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedStories.has(story.id) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="font-medium text-gray-900">{story.title}</div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              Story {story.story_num} • {story.assignee || 'Unassigned'}
                            </div>
                            {story.description && (
                              <div className="text-sm text-gray-500 line-clamp-2 mb-3">
                                {story.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <Badge variant={getPriorityColor(story.priority)} className="text-xs">
                              {story.priority}
                            </Badge>
                            <Badge variant={getTaskStatusColor(story.status)} className="text-xs">
                              {story.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <div className="text-lg font-medium mb-2">
                  {searchTerm ? 'No stories found' : 'No available stories'}
                </div>
                <div className="text-sm">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'All existing stories are already in this sprint'
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 px-6 border-t">
          <Button
            onClick={handleClose}
            disabled={addStoriesToSprintMutation.isPending}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddStories}
            disabled={selectedStories.size === 0 || addStoriesToSprintMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {addStoriesToSprintMutation.isPending 
              ? 'Adding...' 
              : `Add ${selectedStories.size} Stories`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStoryToSprintModal;