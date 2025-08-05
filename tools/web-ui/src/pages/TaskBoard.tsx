import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, DragOverEvent } from '@dnd-kit/core';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CreateSprintModal from '../components/CreateSprintModal';
import AddStoryToSprintModal from '../components/AddStoryToSprintModal';
import { api } from '../lib/api';
import { Task } from '../types';

const DraggableTask: React.FC<{ 
  task: Task; 
  getPriorityColor: (priority: string) => string;
  onTaskClick: (task: Task) => void;
}> = ({ task, getPriorityColor, onTaskClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if currently dragging
    if (isDragging) return;
    
    // Stop propagation to prevent drag events
    e.stopPropagation();
    onTaskClick(task);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      {...listeners} 
      {...attributes}
      className={`p-4 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''} relative group`}
    >
      {/* Click overlay for opening modal */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center"
        onClick={handleClick}
      >
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium opacity-90">
          View Details
        </div>
      </div>
      <div className="space-y-2">
        <div className="font-medium text-gray-900">{task.title}</div>
        <div className="text-sm text-gray-600">
          Epic {task.epic_num} • Story {task.story_num}
        </div>
        {task.description && (
          <div className="text-sm text-gray-500 line-clamp-2">
            {task.description}
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          {task.assignee && (
            <div className="text-xs text-gray-500">
              {task.assignee}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const StoryGroup: React.FC<{
  storyKey: string;
  storyTasks: Task[];
  getPriorityColor: (priority: string) => string;
  onTaskClick: (task: Task) => void;
}> = ({ storyKey, storyTasks, getPriorityColor, onTaskClick }) => {
  const firstTask = storyTasks[0];
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-700 text-sm">
          📖 {storyKey}: {firstTask?.title || 'Untitled Story'}
        </div>
        <div className="text-xs text-gray-500">
          {storyTasks.length} task{storyTasks.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="space-y-2">
        {storyTasks.map((task) => (
          <DraggableTask key={task.id} task={task} getPriorityColor={getPriorityColor} onTaskClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
};

const DroppableColumn: React.FC<{ 
  column: { id: string; title: string; color: string }; 
  tasks: Task[];
  groupTasksByStory: (tasks: Task[]) => [string, Task[]][];
  getPriorityColor: (priority: string) => string;
  isOver: boolean;
  onTaskClick: (task: Task) => void;
}> = ({ column, tasks, groupTasksByStory, getPriorityColor, isOver, onTaskClick }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const storyGroups = groupTasksByStory(tasks);

  return (
    <div key={column.id} className="space-y-4">
      <div className={`p-4 rounded-lg ${column.color} ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        <h2 className="font-semibold text-gray-900">{column.title}</h2>
        <div className="text-sm text-gray-600">
          {tasks.length} tasks • {storyGroups.length} stories
        </div>
      </div>

      <div 
        ref={setNodeRef} 
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'border-2 border-transparent'
        }`}
      >
        {storyGroups.map(([storyKey, storyTasks]) => (
          <StoryGroup 
            key={storyKey}
            storyKey={storyKey}
            storyTasks={storyTasks}
            getPriorityColor={getPriorityColor}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};

const TaskBoard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentSprint, isLoading: sprintLoading } = useQuery({
    queryKey: ['current-sprint'],
    queryFn: () => api.getCurrentSprint(),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['current-sprint-tasks'],
    queryFn: () => api.getCurrentSprintTasks(),
    enabled: !!currentSprint,
  });

  const isLoading = sprintLoading || tasksLoading;

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-sprint-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-progress'] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const newStatus = over.id as string;
      updateTaskMutation.mutate({
        taskId: active.id as string,
        status: newStatus,
      });
    }
    
    setActiveTask(null);
    setOverId(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-gray-100' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'IN_REVIEW', title: 'In Review', color: 'bg-yellow-100' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100' },
    { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-100' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const groupTasksByStory = (statusTasks: Task[]) => {
    const grouped = statusTasks.reduce((acc, task) => {
      const storyKey = `E${task.epic_num}.${task.story_num}`;
      if (!acc[storyKey]) {
        acc[storyKey] = [];
      }
      acc[storyKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sprint data...</div>
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-0 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <div className="mt-8 p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800">
              <h2 className="text-lg font-semibold mb-2">No Active Sprint</h2>
              <p className="text-sm mb-4">
                A sprint must be created before you can manage tasks. Sprints provide goal-oriented focus and ensure proper story tracking.
              </p>
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={() => setIsCreateSprintModalOpen(true)}
              >
                Create Sprint
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
            <div className="mt-2 text-gray-600">
              <div className="flex items-center space-x-4">
                <span>🏃 <strong>{currentSprint.name}</strong></span>
                <span>📅 {currentSprint.start_date} to {currentSprint.end_date}</span>
                <span>🎯 {tasks.length} tasks</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setIsAddStoryModalOpen(true)}>Add Stories</Button>
            <Button 
              onClick={() => navigate(`/sprints/${currentSprint.id}`)}
              className="bg-green-600 hover:bg-green-700"
            >
              Manage Sprint
            </Button>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-1">Sprint Goal</h3>
          <p className="text-blue-800 text-sm">{currentSprint.goal}</p>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {columns.map((column) => (
            <DroppableColumn 
              key={column.id}
              column={column} 
              tasks={getTasksByStatus(column.id)} 
              groupTasksByStory={groupTasksByStory}
              getPriorityColor={getPriorityColor}
              isOver={overId === column.id}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <Card className="p-4 shadow-lg bg-white border-2 border-blue-300 rotate-3">
              <div className="space-y-2">
                <div className="font-medium text-gray-900">{activeTask.title}</div>
                <div className="text-sm text-gray-600">
                  Epic {activeTask.epic_num} • Story {activeTask.story_num}
                </div>
                {activeTask.description && (
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {activeTask.description}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={getPriorityColor(activeTask.priority)}>
                    {activeTask.priority}
                  </Badge>
                  {activeTask.assignee && (
                    <div className="text-xs text-gray-500">
                      {activeTask.assignee}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Details Modal */}
      <TaskDetailsModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />

      {/* Create Sprint Modal */}
      <CreateSprintModal 
        isOpen={isCreateSprintModalOpen}
        onClose={() => setIsCreateSprintModalOpen(false)}
      />

      {/* Add Story Modal */}
      {currentSprint && (
        <AddStoryToSprintModal 
          isOpen={isAddStoryModalOpen}
          onClose={() => setIsAddStoryModalOpen(false)}
          sprintId={currentSprint.id}
          sprintName={currentSprint.name}
        />
      )}
    </div>
  );
};

export default TaskBoard;