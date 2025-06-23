
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">Subject Management Dashboard</h1>
              <p className="text-blue-100">
                {user?.name} - {subjectStaffData?.post} | {subjectStaffData?.department_name} - {subjectStaffData?.division_name}
              </p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
                <CardDescription>Access your resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'documents' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => onTabChange('documents')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
              </CardContent>
            </Card>

            {subjectStaffData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Post:</span> {subjectStaffData.post}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span> {subjectStaffData.department_name}
                    </div>
                    <div>
                      <span className="font-medium">Division:</span> {subjectStaffData.division_name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDashboardLayout;
