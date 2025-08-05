import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import CreateSprintModal from '../components/CreateSprintModal';
import { api } from '../lib/api';

const Sprints: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ['sprints'],
    queryFn: () => api.getSprints(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'gray';
      case 'ACTIVE': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const handleSprintClick = (sprint: any) => {
    if (sprint?.id) {
      navigate(`/sprints/${sprint.id}`);
    } else {
      console.error('Sprint ID is missing:', sprint);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sprints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sprints</h1>
          <p className="mt-2 text-gray-600">
            Manage your sprint planning and execution
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Sprint</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sprints.map((sprint) => (
          <Card key={sprint.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sprint.name}
                </h3>
                <Badge variant={getStatusColor(sprint.status)}>
                  {sprint.status}
                </Badge>
              </div>

              {sprint.goal && (
                <div className="text-sm text-gray-600">
                  <strong>Goal:</strong> {sprint.goal}
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                {sprint.start_date && (
                  <div>
                    <strong>Start:</strong> {new Date(sprint.start_date).toLocaleDateString()}
                  </div>
                )}
                {sprint.end_date && (
                  <div>
                    <strong>End:</strong> {new Date(sprint.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleSprintClick(sprint)}
                >
                  Manage Sprint
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {sprints.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🏃</div>
                <div className="text-lg font-medium">No sprints yet</div>
                <div className="text-sm mb-4">
                  Create your first sprint to start organizing your work
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>Create Sprint</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      <CreateSprintModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default Sprints;