
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Search, Calendar, FileText, Filter } from 'lucide-react';

interface ServiceHistoryItem {
  id: number;
  service_name: string;
  department_name: string;
  division_name: string;
  details: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

const ServiceHistory = () => {
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ServiceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, statusFilter, dateFilter]);

  const fetchServiceHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await apiService.getServiceHistory(userId);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching service history:', error);
      toast({
        title: "Error",
        description: "Failed to load service history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.division_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(item =>
        new Date(item.created_at).toISOString().split('T')[0] === dateFilter
      );
    }

    setFilteredHistory(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
          <CardDescription>Track your service requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            {/* Service History List */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No service history found</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{item.service_name}</h3>
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusLabel(item.status)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Department:</span> {item.department_name}
                            </div>
                            <div>
                              <span className="font-medium">Division:</span> {item.division_name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span className="font-medium">Requested:</span> 
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            {item.updated_at && (
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                <span className="font-medium">Updated:</span> 
                                {new Date(item.updated_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          {item.details && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm text-gray-700">{item.details}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceHistory;
