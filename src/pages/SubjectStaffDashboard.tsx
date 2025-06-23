
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import SubjectDashboardLayout from '@/components/subject/SubjectDashboardLayout';
import DocumentManager from '@/components/subject/DocumentManager';
import { subjectService } from '@/services/subjectService';

const SubjectStaffDashboard = () => {
  const { user, loading, isAuthenticated } = useAuth(['subject_staff']);
  const [activeTab, setActiveTab] = useState('documents');
  const [subjectStaffData, setSubjectStaffData] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubjectStaffData();
    }
  }, [isAuthenticated, user]);

  const fetchSubjectStaffData = async () => {
    try {
      const response = await subjectService.getSubjectStaffData(user.id);
      setSubjectStaffData(response.data);
    } catch (error) {
      console.error('Error fetching subject staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentManager subjectStaffData={subjectStaffData} />;
      default:
        return <DocumentManager subjectStaffData={subjectStaffData} />;
    }
  };

  return (
    <SubjectDashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      subjectStaffData={subjectStaffData}
    >
      {renderContent()}
    </SubjectDashboardLayout>
  );
};

export default SubjectStaffDashboard;
