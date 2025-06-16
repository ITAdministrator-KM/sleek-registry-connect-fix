
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Download,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Upload,
  Eye,
  CreditCard,
  Timer,
  Settings
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import PublicLayout from './public/PublicLayout';
import PublicServiceCatalog from './public/PublicServiceCatalog';
import { ApiErrorHandler } from '@/services/errorHandler';

interface UserApplication {
  id: number;
  request_number: string;
  service_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  estimated_completion: string;
  fee_amount: number;
  payment_status: 'paid' | 'pending' | 'failed';
  progress_percentage: number;
}

interface TokenInfo {
  token_number: string;
  estimated_wait_time: number;
  queue_position: number;
  status: string;
  service_name: string;
  is_next: boolean;
}

const EnhancedPublicDashboard = () => {
  const { user } = useAuth('public');
  const [activeTab, setActiveTab] = useState('home');
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [activeToken, setActiveToken] = useState<TokenInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
    fetchActiveToken();
    
    // Real-time token updates
    const tokenInterval = setInterval(fetchActiveToken, 30000);
    return () => clearInterval(tokenInterval);
  }, []);

  const fetchApplications = async () => {
    try {
      // Mock data for demo purposes
      const mockApplications: UserApplication[] = [
        {
          id: 1,
          request_number: 'REQ001',
          service_name: 'Vehicle License Renewal',
          status: 'under_review',
          created_at: '2024-01-15T10:00:00Z',
          estimated_completion: '2024-01-22T17:00:00Z',
          fee_amount: 1500,
          payment_status: 'paid',
          progress_percentage: 65
        }
      ];
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchActiveToken = async () => {
    try {
      // Mock token data
      const mockToken: TokenInfo = {
        token_number: 'T042',
        estimated_wait_time: 15,
        queue_position: 3,
        status: 'waiting',
        service_name: 'Vehicle License Renewal',
        is_next: false
      };
      setActiveToken(mockToken);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">Public Services Portal</h2>
              <p className="text-blue-100 text-lg">Welcome, {user?.name || 'Citizen'}!</p>
              <p className="text-blue-200 text-sm">Access government services digitally</p>
            </div>

            {/* Active Token Banner */}
            {activeToken && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 text-white rounded-full px-3 py-1 font-bold">
                        {activeToken.token_number}
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{activeToken.service_name}</p>
                        <p className="text-sm text-blue-600">
                          Position: {activeToken.queue_position} | Wait: ~{activeToken.estimated_wait_time} min
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">❌ Cancel</Button>
                  </div>
                  <Progress value={((10 - activeToken.queue_position) / 10) * 100} className="mt-2" />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-green-800">25</p>
                      <p className="text-green-600 text-sm font-medium">Available Services</p>
                    </div>
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-blue-800">{applications.length}</p>
                      <p className="text-blue-600 text-sm font-medium">My Applications</p>
                    </div>
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-orange-800">
                        {activeToken ? activeToken.queue_position : 0}
                      </p>
                      <p className="text-orange-600 text-sm font-medium">Queue Position</p>
                    </div>
                    <Timer className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-purple-800">
                        {applications.filter(a => a.status === 'approved').length}
                      </p>
                      <p className="text-purple-600 text-sm font-medium">Completed</p>
                    </div>
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Access popular services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('services')}
                    className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <Search className="mr-3" size={20} />
                    🔍 Browse Services
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('applications')}
                    className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    <FileText className="mr-3" size={20} />
                    📋 My Applications
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
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Track your application status</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{app.service_name}</h4>
                            <Badge variant="outline">{app.status.replace('_', ' ')}</Badge>
                          </div>
                          <Progress value={app.progress_percentage} className="mb-2" />
                          <p className="text-xs text-gray-500">
                            Expected completion: {new Date(app.estimated_completion).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No applications yet</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setActiveTab('services')}
                      >
                        Browse Services
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'services':
        return <PublicServiceCatalog />;
      case 'applications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your service requests</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{app.service_name}</h3>
                            <p className="text-sm text-gray-500">#{app.request_number}</p>
                          </div>
                          <Badge variant="outline">{app.status.replace('_', ' ')}</Badge>
                        </div>
                        <Progress value={app.progress_percentage} className="mb-3" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expected:</span> {new Date(app.estimated_completion).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Fee:</span> Rs. {app.fee_amount}
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span> 
                            <Badge variant={app.payment_status === 'paid' ? 'default' : 'destructive'} className="ml-1">
                              {app.payment_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download size={14} className="mr-1" />
                            Download Receipt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Button onClick={() => setActiveTab('services')}>
                    Browse Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'documents':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Manage your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
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
              <CardDescription>System notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Notifications will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <PublicLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderMainContent()}
    </PublicLayout>
  );
};

export default EnhancedPublicDashboard;
