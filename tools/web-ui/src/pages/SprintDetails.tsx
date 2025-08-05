import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import AddStoryToSprintModal from '../components/AddStoryToSprintModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { api } from '../lib/api';
import { Task } from '../types';

const SprintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'analytics'>('overview');
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sprint, isLoading: sprintLoading } = useQuery({
    queryKey: ['sprint', id],
    queryFn: () => api.getSprints().then(sprints => sprints.find((s: any) => s.id === id)),
    enabled: !!id,
  });

  const { data: sprintTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['sprint-tasks', id],
    queryFn: () => sprint ? api.getTasks({ sprint_id: sprint.id }) : Promise.resolve([]),
    enabled: !!sprint,
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
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      queryClient.invalidateQueries({ queryKey: ['current-sprint'] });
    },
  });

  const isLoading = sprintLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sprint...</div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">🏃</div>
          <div className="text-lg font-medium">Sprint not found</div>
          <div className="text-sm mb-4">The sprint you're looking for doesn't exist.</div>
          <Button onClick={() => navigate('/sprints')}>
            Back to Sprints
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/sprints')}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  ← Back to Sprints
                </Button>
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    🏃 {sprint.name}
                  </h1>
                  <Badge variant={getStatusColor(sprint.status)} className="text-base px-4 py-2">
                    {sprint.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-8 text-base text-gray-600 mt-4">
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
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📋' },
              { id: 'stories', label: 'Stories', icon: '📝', count: totalTasks },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Sprint Status Management */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-6 text-xl">Sprint Status</h3>
              <div className="flex space-x-4 mb-6">
                {statusOptions.map((status) => (
                  <Button
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    disabled={sprint.status === status.value || updateSprintMutation.isPending}
                    className={`px-6 py-3 text-base font-medium ${
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
                <div className="text-blue-600">Updating sprint status...</div>
              )}
            </Card>

            {/* Sprint Goal */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-4 text-xl">Sprint Goal</h3>
              <p className="text-gray-700 text-lg leading-relaxed">{sprint.goal || 'No goal defined'}</p>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <Card className="p-8 text-center">
                <div className="text-4xl font-bold text-gray-900 mb-3">{totalTasks}</div>
                <div className="text-base text-gray-600 font-medium">Total Tasks</div>
              </Card>
              <Card className="p-8 text-center">
                <div className="text-4xl font-bold text-green-600 mb-3">{completedTasks}</div>
                <div className="text-base text-gray-600 font-medium">Completed</div>
              </Card>
              <Card className="p-8 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-3">{inProgressTasks}</div>
                <div className="text-base text-gray-600 font-medium">In Progress</div>
              </Card>
              <Card className="p-8 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-3">{completionRate}%</div>
                <div className="text-base text-gray-600 font-medium">Complete</div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-6 text-xl">Recent Tasks</h3>
              <div className="space-y-4">
                {sprintTasks.slice(0, 5).map((task: Task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-lg">{task.title}</div>
                      <div className="text-base text-gray-500 mt-1">
                        Epic {task.epic_num} • Story {task.story_num}
                      </div>
                    </div>
                    <Badge variant={getTaskStatusColor(task.status)} className="text-base">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {sprintTasks.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-6">📝</div>
                    <div className="text-xl font-medium mb-4">No tasks in this sprint</div>
                    <div className="text-base mb-6">Add stories to start planning your sprint work</div>
                    <Button 
                      onClick={() => setIsAddStoryModalOpen(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-lg"
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
          <div className="space-y-8">
            {/* Add Story Button */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 text-2xl">Sprint Stories ({totalTasks})</h3>
              <Button 
                onClick={() => setIsAddStoryModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-lg"
              >
                Add Stories
              </Button>
            </div>

            {/* Stories by Epic */}
            {Object.entries(tasksByEpic).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(tasksByEpic).map(([epicKey, tasks]) => (
                  <Card key={epicKey} className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-semibold text-gray-900 text-xl">📖 {epicKey}</h4>
                      <span className="text-base text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                        {tasks.length} stories
                      </span>
                    </div>
                    <div className="space-y-6">
                      {tasks.map((task: Task) => (
                        <div 
                          key={task.id}
                          className="flex items-start justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-lg mb-2">{task.title}</div>
                            <div className="text-base text-gray-600 mb-3">
                              Story {task.story_num} • {task.assignee || 'Unassigned'}
                            </div>
                            {task.description && (
                              <div className="text-base text-gray-500 line-clamp-3 leading-relaxed">
                                {task.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 ml-6 flex-shrink-0">
                            <Badge variant={getPriorityColor(task.priority)} className="text-base">
                              {task.priority}
                            </Badge>
                            <Badge variant={getTaskStatusColor(task.status)} className="text-base">
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
              <Card className="p-16 text-center">
                <div className="text-gray-500">
                  <div className="text-8xl mb-8">📝</div>
                  <div className="text-2xl font-medium mb-4">No stories in this sprint</div>
                  <div className="text-lg mb-8 leading-relaxed">
                    Add stories to start planning your sprint work
                  </div>
                  <Button 
                    onClick={() => setIsAddStoryModalOpen(true)}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-lg"
                  >
                    Add Stories
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-8 text-xl">Sprint Progress</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Overall Progress</span>
                  <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            {/* Task Status Breakdown */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-8 text-xl">Task Status Breakdown</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-lg text-gray-700 flex items-center space-x-3">
                      <span>📋</span>
                      <span>Todo</span>
                    </span>
                    <span className="text-xl font-bold text-gray-900">{todoTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-lg text-blue-700 flex items-center space-x-3">
                      <span>🔄</span>
                      <span>In Progress</span>
                    </span>
                    <span className="text-xl font-bold text-blue-900">{inProgressTasks}</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="text-lg text-green-700 flex items-center space-x-3">
                      <span>✅</span>
                      <span>Done</span>
                    </span>
                    <span className="text-xl font-bold text-green-900">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <span className="text-lg text-red-700 flex items-center space-x-3">
                      <span>🚫</span>
                      <span>Blocked</span>
                    </span>
                    <span className="text-xl font-bold text-red-900">{blockedTasks}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sprint Timeline */}
            <Card className="p-8">
              <h3 className="font-semibold text-gray-900 mb-8 text-xl">Sprint Timeline</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-lg text-blue-700 font-medium">Start Date:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {sprint.start_date ? formatDate(sprint.start_date) : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-lg text-green-700 font-medium">End Date:</span>
                  <span className="text-lg font-bold text-green-900">
                    {sprint.end_date ? formatDate(sprint.end_date) : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-lg text-purple-700 font-medium">Duration:</span>
                  <span className="text-lg font-bold text-purple-900">
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

      {/* Add Story Modal */}
      {sprint && (
        <AddStoryToSprintModal 
          isOpen={isAddStoryModalOpen}
          onClose={() => setIsAddStoryModalOpen(false)}
          sprintId={sprint.id}
          sprintName={sprint.name}
        />
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal 
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
};

export default SprintDetails;