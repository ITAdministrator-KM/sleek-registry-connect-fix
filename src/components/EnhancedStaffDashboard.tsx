
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Camera,
  Upload,
  ClipboardList,
  IdCard,
  Folder,
  Bell,
  UserPlus,
  Search,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import StaffLayout from './staff/StaffLayout';
import { ApiErrorHandler } from '@/services/errorHandler';

interface ServiceRequest {
  id: number;
  request_number: string;
  service_name: string;
  public_user_name: string;
  public_user_photo?: string;
  public_user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  department: string;
  documents_uploaded: number;
  required_documents: number;
}

interface StaffStats {
  todayRequests: number;
  pendingApprovals: number;
  completedToday: number;
  activeTokens: number;
  pendingByDepartment: Record<string, number>;
}

const EnhancedStaffDashboard = () => {
  const { user } = useAuth('staff');
  const [activeTab, setActiveTab] = useState('home');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<StaffStats>({
    todayRequests: 0,
    pendingApprovals: 0,
    completedToday: 0,
    activeTokens: 0,
    pendingByDepartment: {}
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceRequests();
    fetchStats();
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [serviceRequests, searchTerm, statusFilter]);

  const fetchServiceRequests = async () => {
    try {
      // Mock data with better error handling
      const mockRequests: ServiceRequest[] = [
        {
          id: 1,
          request_number: 'REQ001',
          service_name: 'Vehicle License Renewal',
          public_user_name: 'John Doe',
          public_user_photo: '/placeholder-avatar.jpg',
          public_user_id: 'PUB001',
          status: 'pending',
          created_at: new Date().toISOString(),
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          department: user?.department_name || 'Transport',
          documents_uploaded: 2,
          required_documents: 3
        },
        {
          id: 2,
          request_number: 'REQ002',
          service_name: 'Business Registration',
          public_user_name: 'Jane Smith',
          public_user_id: 'PUB002',
          status: 'under_review',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          department: user?.department_name || 'Administration',
          documents_uploaded: 3,
          required_documents: 3
        }
      ];
      setServiceRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      ApiErrorHandler.handleAuthError(error);
    }
  };

  const fetchStats = async () => {
    try {
      setStats({
        todayRequests: 15,
        pendingApprovals: 8,
        completedToday: 12,
        activeTokens: 24,
        pendingByDepartment: {
          'Transport': 5,
          'Administration': 3,
          'Social Services': 4
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      ApiErrorHandler.handleAuthError(error);
    }
  };

  const filterRequests = () => {
    let filtered = serviceRequests;

    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.public_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleBulkAction = (action: string) => {
    if (selectedRequests.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select requests to perform bulk actions",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bulk Action",
      description: `${action} applied to ${selectedRequests.length} requests`,
    });
    setSelectedRequests([]);
  };

  const handleRequestAction = (requestId: number, action: string) => {
    toast({
      title: "Action Completed",
      description: `Request ${action}d successfully`,
    });
  };

  const toggleRequestSelection = (requestId: number, shiftKey: boolean = false) => {
    if (shiftKey && selectedRequests.length > 0) {
      const lastSelected = selectedRequests[selectedRequests.length - 1];
      const currentIndex = filteredRequests.findIndex(req => req.id === requestId);
      const lastIndex = filteredRequests.findIndex(req => req.id === lastSelected);
      
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      
      const rangeIds = filteredRequests.slice(start, end + 1).map(req => req.id);
      setSelectedRequests(prev => [...new Set([...prev, ...rangeIds])]);
    } else {
      setSelectedRequests(prev => 
        prev.includes(requestId)
          ? prev.filter(id => id !== requestId)
          : [...prev, requestId]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const renderServiceRequests = () => (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-lg z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-blue-800 font-medium">
              {selectedRequests.length} request(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleBulkAction('approve')}
              >
                Approve All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('request_docs')}
              >
                Request Docs
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedRequests([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed View */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="pending" className="text-xs md:text-sm">
            Pending ({filteredRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs md:text-sm">
            Approved ({filteredRequests.filter(r => r.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="under_review" className="text-xs md:text-sm">
            Under Review ({filteredRequests.filter(r => r.status === 'under_review').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs md:text-sm">
            Rejected ({filteredRequests.filter(r => r.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'under_review', 'rejected'].map(status => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRequests.filter(req => req.status === status).map((request) => {
                const daysUntilDeadline = getDaysUntilDeadline(request.deadline);
                const isSelected = selectedRequests.includes(request.id);
                
                return (
                  <Card 
                    key={request.id} 
                    className={`transition-all cursor-pointer hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={(e) => toggleRequestSelection(request.id, e.shiftKey)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {request.public_user_photo ? (
                              <img 
                                src={request.public_user_photo} 
                                alt={request.public_user_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <UserPlus size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{request.public_user_name}</h3>
                            <p className="text-xs text-gray-500 truncate">ID: {request.public_user_id}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white shadow-lg">
                            <DropdownMenuItem onClick={() => handleRequestAction(request.id, 'approve')}>
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRequestAction(request.id, 'reject')}>
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRequestAction(request.id, 'request_docs')}>
                              Request Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{request.service_name}</h4>
                          <Badge className={`text-xs ${getPriorityColor(request.priority)}`} variant="outline">
                            {request.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600">#{request.request_number}</p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Documents: {request.documents_uploaded}/{request.required_documents}
                          </span>
                          <div className="flex items-center space-x-1">
                            {daysUntilDeadline <= 2 && (
                              <AlertTriangle size={12} className="text-red-500" />
                            )}
                            <span className={daysUntilDeadline <= 2 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              Due in {daysUntilDeadline} days
                            </span>
                          </div>
                        </div>

                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </Badge>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestAction(request.id, 'approve');
                            }}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestAction(request.id, 'request_docs');
                            }}
                          >
                            Request Docs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">Staff Dashboard</h2>
              <p className="text-emerald-100 text-lg">Welcome back, {user?.name}!</p>
              <p className="text-emerald-200 text-sm">{user?.department_name} • {user?.division_name}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-blue-800">{stats.todayRequests}</p>
                      <p className="text-blue-600 text-sm font-medium">Today's Requests</p>
                    </div>
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-orange-800">{stats.pendingApprovals}</p>
                      <p className="text-orange-600 text-sm font-medium">Pending Approvals</p>
                    </div>
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-green-800">{stats.completedToday}</p>
                      <p className="text-green-600 text-sm font-medium">Completed Today</p>
                    </div>
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-purple-800">{stats.activeTokens}</p>
                      <p className="text-purple-600 text-sm font-medium">Active Tokens</p>
                    </div>
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('id-cards')}
                    className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    <Camera className="mr-3" size={20} />
                    📱 ID Card Generator
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('service-requests')}
                    className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <ClipboardList className="mr-3" size={20} />
                    👤 Service Requests
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('documents')}
                    className="w-full justify-start h-12 bg-gradient-to-r from-purple-500 to-purple-600"
                  >
                    <Upload className="mr-3" size={20} />
                    📄 Upload Documents
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Summary</CardTitle>
                  <CardDescription>Your daily progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Requests Processed</span>
                      <span className="font-bold text-green-600">{stats.completedToday}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Approvals</span>
                      <span className="font-bold text-orange-600">{stats.pendingApprovals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Tokens</span>
                      <span className="font-bold text-blue-600">{stats.activeTokens}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'service-requests':
        return renderServiceRequests();
      case 'id-cards':
        return (
          <Card>
            <CardHeader>
              <CardTitle>ID Card Generator</CardTitle>
              <CardDescription>Generate and manage ID cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <IdCard size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">ID Card generator will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'documents':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Upload and manage documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Folder size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Document management will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>System notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bell size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Notifications will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return renderServiceRequests();
    }
  };

  return (
    <StaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderMainContent()}
    </StaffLayout>
  );
};

export default EnhancedStaffDashboard;
