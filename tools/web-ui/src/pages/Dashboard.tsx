import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { api } from '../lib/api';
import { Task } from '../types';

const Dashboard: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['project-progress'],
    queryFn: api.getProjectProgress,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  });

  if (progressLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project data...</div>
      </div>
    );
  }

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your BMAD Method project progress and tasks
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">
              {progress?.overall?.total_tasks || 0}
            </div>
            <div className="ml-2 text-sm text-gray-600">Total Tasks</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-600">
              {progress?.overall?.completed_tasks || 0}
            </div>
            <div className="ml-2 text-sm text-gray-600">Completed</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress?.overall?.in_progress_tasks || 0}
            </div>
            <div className="ml-2 text-sm text-gray-600">In Progress</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-orange-600">
              {progress?.overall?.todo_tasks || 0}
            </div>
            <div className="ml-2 text-sm text-gray-600">To Do</div>
          </div>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {tasks?.slice(0, 5).map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{task.title}</div>
                <div className="text-sm text-gray-600">
                  Epic {task.epic_num} • Story {task.story_num}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge variant={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Task Details Modal */}
      <TaskDetailsModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Dashboard;