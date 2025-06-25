
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/apiService';
import { tokenService } from '@/services/tokenService';
import RegistryWorkflow from './RegistryWorkflow';
import EntryLogDisplay from './EntryLogDisplay';
import TokenSuccessModal from './TokenSuccessModal';

const ModernPublicRegistry: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [registryEntries, setRegistryEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedWorkflow, setCompletedWorkflow] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptData, divData] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setDivisions(Array.isArray(divData) ? divData : []);
      
      await fetchRegistryEntries();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistryEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/index.php?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegistryEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registry entries:', error);
    }
  };

  const handleWorkflowComplete = async (result: any) => {
    console.log('Workflow completed:', result);
    
    if (result.autoGenerateToken) {
      try {
        const tokenResponse = await tokenService.generateToken({
          registry_id: result.registryData.data.id || result.registryData.data.registry_id,
          department_id: result.registryData.department_id || result.formData?.department_id,
          division_id: result.registryData.division_id || result.formData?.division_id,
          service_type: 'General Service',
          priority_level: 'normal'
        });

        setCompletedWorkflow({
          ...result,
          tokenData: tokenResponse
        });
      } catch (error) {
        console.error('Token generation failed:', error);
        toast({
          title: "Partial Success",
          description: "Registry entry created but token generation failed",
          variant: "destructive",
        });
      }
    } else {
      setCompletedWorkflow(result);
    }

    // Refresh entries
    fetchRegistryEntries();
  };

  const handleNewEntry = () => {
    setCompletedWorkflow(null);
  };

  if (completedWorkflow) {
    return (
      <TokenSuccessModal
        workflowResult={completedWorkflow}
        onNewEntry={handleNewEntry}
        onClose={() => setCompletedWorkflow(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegistryWorkflow
          departments={departments}
          divisions={divisions}
          onWorkflowComplete={handleWorkflowComplete}
        />
        
        <EntryLogDisplay
          entries={registryEntries}
          departments={departments}
          onRefresh={fetchRegistryEntries}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ModernPublicRegistry;
