
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

const MyApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const publicUserId = localStorage.getItem('userId');
      if (!publicUserId) return;

      const response = await apiService.getServiceHistory(publicUserId, { limit: 50 });
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
        <Badge variant="outline" className="text-sm">
          {applications.length} Applications
        </Badge>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 text-center">
              You haven't submitted any service requests yet. Click on "Available Services" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app, index) => (
            <Card key={app.id || index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{app.service_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(app.status)}
                    <Badge className={getStatusColor(app.status)}>
                      {app.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Department:</span>
                    <p className="text-gray-900">{app.department_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Division:</span>
                    <p className="text-gray-900">{app.division_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Submitted:</span>
                    <p className="text-gray-900">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Reference ID:</span>
                    <p className="text-gray-900 font-mono">{app.id || 'REF-' + index}</p>
                  </div>
                </div>
                {app.details && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-600">Details:</span>
                    <p className="text-gray-900 mt-1">{app.details}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
