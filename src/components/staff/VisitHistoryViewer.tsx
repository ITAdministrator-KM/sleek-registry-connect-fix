
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, FileText, X } from 'lucide-react';
import { apiService } from '@/services/apiService';

interface VisitHistoryViewerProps {
  user: any;
  onClose: () => void;
}

const VisitHistoryViewer: React.FC<VisitHistoryViewerProps> = ({ user, onClose }) => {
  const [visitHistory, setVisitHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVisitHistory();
  }, [user.id]);

  const fetchVisitHistory = async () => {
    try {
      setIsLoading(true);
      // Fetch registry entries for this user
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/index.php?public_user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisitHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching visit history:', error);
      toast({
        title: "Error",
        description: "Failed to load visit history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Visit History - {user.name}
          </CardTitle>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Public ID: {user.public_id || user.public_user_id} | NIC: {user.nic}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading visit history...</p>
          </div>
        ) : visitHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No visit history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitHistory.map((visit: any) => (
              <div key={visit.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{visit.purpose_of_visit}</h4>
                    <p className="text-sm text-gray-600">{visit.department_name}</p>
                    {visit.division_name && (
                      <p className="text-sm text-gray-500">{visit.division_name}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(visit.status)}>
                    {visit.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(visit.entry_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(visit.entry_time).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>Registry Entry</span>
                  </div>
                </div>
                
                {visit.remarks && (
                  <div className="mt-2 p-2 bg-white rounded text-sm">
                    <strong>Remarks:</strong> {visit.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitHistoryViewer;
