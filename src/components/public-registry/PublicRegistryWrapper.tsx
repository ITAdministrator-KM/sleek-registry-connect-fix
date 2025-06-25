import React, { useState, useEffect } from 'react';
import PublicRegistryForm from './PublicRegistryForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/apiService';
import { useNavigate } from 'react-router-dom';

interface RegistryEntryCreateData {
  registry_id: string;
  visitor_id: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_phone: string;
  visitor_address: string;
  department_id: number;
  department_name: string;
  division_id: number;
  division_name: string;
  purpose_of_visit: string;
  remarks: string;
  entry_time: string;
  exit_time: string;
  status: 'active' | 'checked_out' | 'deleted';
}

const PublicRegistryWrapper: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const departmentsData = await apiService.getDepartments();
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const fetchDivisions = async () => {
    try {
      const divisionsData = await apiService.getDivisions();
      setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      toast({
        title: "Error",
        description: "Failed to load divisions. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      const entryData = {
        registry_id: `REG-${Date.now()}`,
        visitor_id: formData.visitor_id || 0,
        visitor_name: formData.visitor_name,
        visitor_nic: formData.visitor_nic,
        visitor_phone: formData.visitor_phone || '',
        visitor_address: formData.visitor_address,
        department_id: parseInt(formData.department_id),
        department_name: formData.department_name,
        division_id: parseInt(formData.division_id),
        division_name: formData.division_name,
        purpose_of_visit: formData.purpose_of_visit,
        remarks: formData.remarks || '',
        entry_time: new Date().toISOString(),
        exit_time: '',
        status: 'active' as const, // Use 'active' instead of 'completed'
      };

      console.log("entryData", entryData)
      // Simulate API call
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Visitor registered successfully!",
        });
        navigate('/staff/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/staff/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-800">
            Public Visitor Registry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PublicRegistryForm
            departments={departments}
            divisions={divisions}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRegistryWrapper;
