
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit, LogOut, User, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubjectDashboardLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  subjectStaffData: any;
  children: React.ReactNode;
}

const SubjectDashboardLayout: React.FC<SubjectDashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  subjectStaffData,
  children
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',_'Roboto',_'Segoe_UI',_sans-serif]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 text-center">Subject Staff Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {user?.name} - {subjectStaffData?.post}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{subjectStaffData?.department_name}</p>
                <p className="text-xs text-gray-500">{subjectStaffData?.division_name}</p>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Common Documents */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Common Documents</CardTitle>
                <CardDescription className="text-gray-600">Quick access to frequently used documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Personal Documents
                  </h4>
                  <div className="pl-6 space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 text-gray-600 hover:text-blue-600">
                      <FileText className="h-3 w-3 mr-2" />
                      Profile Forms
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 text-gray-600 hover:text-blue-600">
                      <FileText className="h-3 w-3 mr-2" />
                      Leave Applications
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-teal-600" />
                    Official Documents
                  </h4>
                  <div className="pl-6 space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 text-gray-600 hover:text-teal-600">
                      <FileText className="h-3 w-3 mr-2" />
                      Report Templates
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm h-8 text-gray-600 hover:text-teal-600">
                      <FileText className="h-3 w-3 mr-2" />
                      Policy Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info Card */}
            {subjectStaffData && (
              <Card className="mt-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900">Assignment Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Post:</span>
                      <span className="text-blue-800">{subjectStaffData.post}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Department:</span>
                      <span className="text-blue-800">{subjectStaffData.department_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Division:</span>
                      <span className="text-teal-800">{subjectStaffData.division_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-white border rounded-lg p-1 mb-6">
                <TabsTrigger 
                  value="documents" 
                  className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                >
                  Division Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents" className="space-y-6">
                {children}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDashboardLayout;
