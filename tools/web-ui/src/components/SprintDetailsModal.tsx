import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/Dialog';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import CreateStoryModal from './CreateStoryModal';
import TaskDetailsModal from './TaskDetailsModal';
import { api } from '../lib/api';
import { Task } from '../types';

interface SprintDetailsModalProps {
  sprint: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const SprintDetailsModal: React.FC<SprintDetailsModalProps> = ({ sprint, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'analytics'>('overview');
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sprintTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['sprint-tasks', sprint?.id],
    queryFn: () => sprint ? api.getTasks({ sprint_id: sprint.id }) : Promise.resolve([]),
    enabled: !!sprint && isOpen,
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({ sprintId, updates }: { sprintId: string; updates: any }) => {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update sprint: ${error}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['current-sprint'] });
    },
  });

  const assignTaskToSprintMutation = useMutation({
    mutationFn: async ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) => {
      const response = await fetch(`/api/tasks/${taskId}/sprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprint_id: sprintId })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to assign task: ${error}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprint?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (!sprint) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'gray';
      case 'ACTIVE': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
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

  const handleStatusChange = (newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'COMPLETED') {
      updates.end_date = new Date().toISOString().split('T')[0];
    }
    
    updateSprintMutation.mutate({
      sprintId: sprint.id,
      updates
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate sprint statistics
  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter((task: Task) => task.status === 'DONE').length;
  const inProgressTasks = sprintTasks.filter((task: Task) => task.status === 'IN_PROGRESS').length;
  const todoTasks = sprintTasks.filter((task: Task) => task.status === 'TODO').length;
  const blockedTasks = sprintTasks.filter((task: Task) => task.status === 'BLOCKED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by epic
  const tasksByEpic = sprintTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    const epicKey = `E${task.epic_num}`;
    if (!acc[epicKey]) acc[epicKey] = [];
    acc[epicKey].push(task);
    return acc;
  }, {});

  const statusOptions = [
    { value: 'PLANNING', label: 'Planning', color: 'gray' },
    { value: 'ACTIVE', label: 'Active', color: 'blue' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0" onClose={onClose}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DialogTitle className="text-2xl font-bold">
                🏃 {sprint.name}
              </DialogTitle>
              <Badge variant={getStatusColor(sprint.status)} className="text-sm px-3 py-1">
                {sprint.status}
              </Badge>
            </div>
            <DialogClose onClose={onClose} />
          </div>
          <div className="flex items-center space-x-8 text-sm text-gray-600 mt-3">
            <span className="flex items-center space-x-2">
              <span>📅</span>
              <span>{sprint.start_date ? formatDate(sprint.start_date) : 'No start date'}</span>
            </span>
            {sprint.end_date && (
              <span className="flex items-center space-x-2">
                <span>🏁</span>
                <span>{formatDate(sprint.end_date)}</span>
              </span>
            )}
            <span className="flex items-center space-x-2">
              <span>📊</span>
              <span>{completionRate}% Complete</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🎯</span>
              <span>{totalTasks} Tasks</span>
            </span>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'stories', label: 'Stories', icon: '📝', count: totalTasks },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center space-x-3">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Sprint Status Management */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Sprint Status</h3>
                <div className="flex space-x-3 mb-6">
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      disabled={sprint.status === status.value || updateSprintMutation.isPending}
                      className={`px-4 py-2 text-sm font-medium ${
                        sprint.status === status.value 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : status.color === 'green' 
                            ? 'bg-green-600 hover:bg-green-700'
                            : status.color === 'blue'
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : status.color === 'red'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
                {updateSprintMutation.isPending && (
                  <div className="text-blue-600 text-sm">Updating sprint status...</div>
                )}
              </Card>

              {/* Sprint Goal */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Sprint Goal</h3>
                <p className="text-gray-700 text-base leading-relaxed">{sprint.goal || 'No goal defined'}</p>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{totalTasks}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Tasks</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{completedTasks}</div>
                  <div className="text-sm text-gray-600 font-medium">Completed</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{inProgressTasks}</div>
                  <div className="text-sm text-gray-600 font-medium">In Progress</div>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{completionRate}%</div>
                  <div className="text-sm text-gray-600 font-medium">Complete</div>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Recent Tasks</h3>
                <div className="space-y-3">
                  {sprintTasks.slice(0, 5).map((task: Task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-base">{task.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Epic {task.epic_num} • Story {task.story_num}
                        </div>
                      </div>
                      <Badge variant={getTaskStatusColor(task.status)} className="text-sm">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  {sprintTasks.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <div className="text-lg font-medium mb-2">No tasks in this sprint</div>
                      <div className="text-sm mb-4">Add stories to start planning your sprint work</div>
                      <Button 
                        onClick={() => setIsCreateStoryModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Add First Story
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'stories' && (
            <div className="space-y-6">
              {/* Add Story Button */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 text-xl">Sprint Stories ({totalTasks})</h3>
                <Button 
                  onClick={() => setIsCreateStoryModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  Add Story
                </Button>
              </div>

              {/* Stories by Epic */}
              {Object.entries(tasksByEpic).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(tasksByEpic).map(([epicKey, tasks]) => (
                    <Card key={epicKey} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 text-lg">📖 {epicKey}</h4>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {tasks.length} stories
                        </span>
                      </div>
                      <div className="space-y-4">
                        {tasks.map((task: Task) => (
                          <div 
                            key={task.id}
                            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-base mb-1">{task.title}</div>
                              <div className="text-sm text-gray-600 mb-2">
                                Story {task.story_num} • {task.assignee || 'Unassigned'}
                              </div>
                              {task.description && (
                                <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                              <Badge variant={getPriorityColor(task.priority)} className="text-sm">
                                {task.priority}
                              </Badge>
                              <Badge variant={getTaskStatusColor(task.status)} className="text-sm">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-6xl mb-6">📝</div>
                    <div className="text-xl font-medium mb-3">No stories in this sprint</div>
                    <div className="text-base mb-6 leading-relaxed">
                      Add stories to start planning your sprint work
                    </div>
                    <Button 
                      onClick={() => setIsCreateStoryModalOpen(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-base"
                    >
                      Add First Story
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Progress Overview */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-6 text-lg">Sprint Progress</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-700">Overall Progress</span>
                    <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Task Status Breakdown */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-6 text-lg">Task Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-base text-gray-700 flex items-center space-x-2">
                        <span>📋</span>
                        <span>Todo</span>
                      </span>
                      <span className="text-lg font-bold text-gray-900">{todoTasks}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-base text-blue-700 flex items-center space-x-2">
                        <span>🔄</span>
                        <span>In Progress</span>
                      </span>
                      <span className="text-lg font-bold text-blue-900">{inProgressTasks}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-base text-green-700 flex items-center space-x-2">
                        <span>✅</span>
                        <span>Done</span>
                      </span>
                      <span className="text-lg font-bold text-green-900">{completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-base text-red-700 flex items-center space-x-2">
                        <span>🚫</span>
                        <span>Blocked</span>
                      </span>
                      <span className="text-lg font-bold text-red-900">{blockedTasks}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sprint Timeline */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-6 text-lg">Sprint Timeline</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-base text-blue-700 font-medium">Start Date:</span>
                    <span className="text-base font-bold text-blue-900">
                      {sprint.start_date ? formatDate(sprint.start_date) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-base text-green-700 font-medium">End Date:</span>
                    <span className="text-base font-bold text-green-900">
                      {sprint.end_date ? formatDate(sprint.end_date) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-base text-purple-700 font-medium">Duration:</span>
                    <span className="text-base font-bold text-purple-900">
                      {sprint.start_date && sprint.end_date ? (
                        `${Math.ceil((new Date(sprint.end_date).getTime() - new Date(sprint.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                      ) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Create Story Modal */}
      <CreateStoryModal 
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        sprintId={sprint?.id}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal 
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </Dialog>
  );
};

export default SprintDetailsModal;