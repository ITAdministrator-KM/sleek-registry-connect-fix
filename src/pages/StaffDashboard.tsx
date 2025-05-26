
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Calendar, LogOut, Menu, X, Download, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('username');
    
    if (role !== 'staff') {
      navigate('/login');
      return;
    }
    
    if (user) {
      setUsername(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-xl transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
              alt="DSK Logo" 
              className="h-10 w-10 rounded-full"
            />
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">DSK Staff</h1>
                <p className="text-sm text-gray-500">Staff Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-3 bg-green-600 text-white rounded-lg">
                <FileText size={20} />
                {sidebarOpen && <span>Documents</span>}
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Users size={20} />
                {sidebarOpen && <span>Public Services</span>}
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Calendar size={20} />
                {sidebarOpen && <span>Appointments</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {username}</span>
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-green-100">Awaiting processing</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Completed Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18</div>
                  <p className="text-blue-100">Services completed</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">342</div>
                  <p className="text-purple-100">Services provided</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>Upload and manage department documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                    <Upload size={20} />
                    <span>Upload Document</span>
                  </Button>
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Download size={20} />
                    <span>Download Reports</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Your recent actions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <FileText className="text-green-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">Birth certificate processed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">Marriage registration completed</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Calendar className="text-purple-600" size={20} />
                      <div>
                        <p className="font-medium text-sm">Appointment scheduled</p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
