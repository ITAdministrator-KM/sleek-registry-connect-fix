
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Camera,
  Upload,
  Scan,
  Bell,
  CreditCard,
  UserPlus,
  ClipboardList,
  Eye,
  Download
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface DepartmentWidget {
  id: string;
  title: string;
  count: number;
  action: string;
  urgency: 'low' | 'medium' | 'high';
  icon: any;
  color: string;
}

interface ServiceRequest {
  id: number;
  request_number: string;
  service_name: string;
  public_user_name: string;
  status: string;
  created_at: string;
  priority: string;
}

const EnhancedStaffDashboard = () => {
  const { user } = useAuth('staff');
  const [departmentWidgets, setDepartmentWidgets] = useState<DepartmentWidget[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState({
    todayRequests: 0,
    pendingApprovals: 0,
    completedToday: 0,
    activeTokens: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadDepartmentData();
    fetchRecentRequests();
    fetchStats();
  }, [user]);

  const loadDepartmentData = () => {
    // Generate department-specific widgets based on user's department
    const departmentName = user?.department_name || 'General';
    
    let widgets: DepartmentWidget[] = [];
    
    switch (departmentName.toLowerCase()) {
      case 'social services':
        widgets = [
          {
            id: 'dry_rations',
            title: 'Pending Dry Ration Applications',
            count: 8,
            action: 'Review Now',
            urgency: 'high',
            icon: ClipboardList,
            color: 'bg-orange-500'
          },
          {
            id: 'scholarships',
            title: 'Scholarship Applications',
            count: 12,
            action: 'Process',
            urgency: 'medium',
            icon: FileText,
            color: 'bg-blue-500'
          }
        ];
        break;
      case 'accounts':
        widgets = [
          {
            id: 'invoices',
            title: 'Unpaid Invoices',
            count: 3,
            action: 'View List',
            urgency: 'high',
            icon: FileText,
            color: 'bg-red-500'
          },
          {
            id: 'payments',
            title: 'Pending Payments',
            count: 7,
            action: 'Process',
            urgency: 'medium',
            icon: CreditCard,
            color: 'bg-yellow-500'
          }
        ];
        break;
      case 'transport':
        widgets = [
          {
            id: 'vehicle_licenses',
            title: 'Vehicle License Renewals',
            count: 15,
            action: 'Approve All',
            urgency: 'medium',
            icon: FileText,
            color: 'bg-green-500'
          },
          {
            id: 'permits',
            title: 'Transport Permits',
            count: 5,
            action: 'Review',
            urgency: 'low',
            icon: ClipboardList,
            color: 'bg-purple-500'
          }
        ];
        break;
      default:
        widgets = [
          {
            id: 'general_requests',
            title: 'General Service Requests',
            count: 10,
            action: 'Process',
            urgency: 'medium',
            icon: ClipboardList,
            color: 'bg-blue-500'
          }
        ];
    }
    
    setDepartmentWidgets(widgets);
  };

  const fetchRecentRequests = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch('/backend/api/service-requests/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch('/backend/api/dashboard/staff-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleWidgetAction = (widgetId: string) => {
    toast({
      title: "Action Triggered",
      description: `Processing ${widgetId} action...`,
    });
    // Navigate to specific section or perform action
  };

  const handleQuickScan = async () => {
    try {
      // Trigger camera for ID card scanning
      toast({
        title: "Camera Ready",
        description: "Position ID card in camera view to auto-fill details",
      });
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try manual entry.",
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-3">Enhanced Staff Dashboard</h2>
        <p className="text-emerald-100 text-lg">Welcome back, {user?.name}!</p>
        <p className="text-emerald-200 text-sm">{user?.department_name} • {user?.division_name}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800">{stats.todayRequests}</p>
                <p className="text-blue-600 text-sm font-medium">Today's Requests</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-800">{stats.pendingApprovals}</p>
                <p className="text-orange-600 text-sm font-medium">Pending Approvals</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">{stats.completedToday}</p>
                <p className="text-green-600 text-sm font-medium">Completed Today</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-800">{stats.activeTokens}</p>
                <p className="text-purple-600 text-sm font-medium">Active Tokens</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department-Specific Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            Department Priority Actions
          </CardTitle>
          <CardDescription>High-priority tasks requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {departmentWidgets.map((widget) => {
            const IconComponent = widget.icon;
            return (
              <div
                key={widget.id}
                className={`p-4 rounded-lg border-l-4 ${getUrgencyColor(widget.urgency)} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${widget.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
                      <p className="text-sm text-gray-600">
                        {widget.count} items requiring attention
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={widget.urgency === 'high' ? 'destructive' : 'secondary'}>
                      {widget.urgency} priority
                    </Badge>
                    <Button 
                      onClick={() => handleWidgetAction(widget.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {widget.action}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-green-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used staff functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleQuickScan}
              className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Camera className="mr-3" size={20} />
              📱 Quick ID Scan & Auto-fill
            </Button>
            
            <Button 
              className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <UserPlus className="mr-3" size={20} />
              👤 Create Public Account
            </Button>
            
            <Button 
              className="w-full justify-start h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <CreditCard className="mr-3" size={20} />
              📇 Generate ID Card
            </Button>
            
            <Button 
              className="w-full justify-start h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Upload className="mr-3" size={20} />
              📄 Upload Documents
            </Button>
          </CardContent>
        </Card>

        {/* Recent Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-500" />
              Recent Service Requests
            </CardTitle>
            <CardDescription>Latest applications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.length > 0 ? (
                recentRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{request.service_name}</p>
                      <p className="text-xs text-gray-600">{request.public_user_name}</p>
                      <p className="text-xs text-gray-500">#{request.request_number}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent requests</p>
                </div>
              )}
            </div>
            
            {recentRequests.length > 5 && (
              <Button variant="outline" className="w-full mt-4">
                <Eye className="mr-2" size={16} />
                View All Requests
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-indigo-500" />
            Bulk Processing Tools
          </CardTitle>
          <CardDescription>Process multiple requests efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-sm">Bulk Approve</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Download className="h-6 w-6 text-blue-500" />
              <span className="text-sm">Export Reports</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Bell className="h-6 w-6 text-orange-500" />
              <span className="text-sm">Send Notifications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedStaffDashboard;
