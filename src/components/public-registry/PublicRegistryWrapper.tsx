
import React, { useState, useEffect } from 'react';
import PublicRegistryForm from './PublicRegistryForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/apiService';
import { tokenService } from '@/services/tokenService';
import { useNavigate } from 'react-router-dom';

interface RegistryEntryCreateData {
  registry_id: string;
  visitor_id: number;
  visitor_name: string;
  visitor_nic: string;
  visitor_phone: string;
  visitor_address: string;
  department_id: string;
  department_name: string;
  division_id: string;
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
  const [generatedToken, setGeneratedToken] = useState<any>(null);
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
      
      let finalVisitorId = formData.visitor_id;
      let finalVisitorData = {
        visitor_name: formData.visitor_name,
        visitor_nic: formData.visitor_nic,
        visitor_phone: formData.visitor_phone || '',
        visitor_address: formData.visitor_address
      };

      // If it's a new visitor, create public user account first
      if (!formData.visitor_id || formData.visitor_id === 0) {
        try {
          const newPublicUser = await apiService.createPublicUser({
            name: formData.visitor_name,
            nic: formData.visitor_nic,
            mobile: formData.visitor_phone || '',
            address: formData.visitor_address,
            department_id: parseInt(formData.department_id),
            division_id: parseInt(formData.division_id),
            username: `visitor_${Date.now()}`,
            password: 'temp123', // Temporary password
            status: 'active' as const,
          });
          
          finalVisitorId = newPublicUser.id;
          
          toast({
            title: "Success",
            description: `New public account created with ID: ${newPublicUser.public_id}`,
          });
        } catch (error) {
          console.error('Error creating public user:', error);
          // Continue with visitor_id = 0 if public user creation fails
          finalVisitorId = 0;
        }
      }

      // Create registry entry
      const registryData = {
        visitor_id: finalVisitorId,
        visitor_name: finalVisitorData.visitor_name,
        visitor_nic: finalVisitorData.visitor_nic,
        visitor_phone: finalVisitorData.visitor_phone,
        visitor_address: finalVisitorData.visitor_address,
        department_id: formData.department_id.toString(),
        department_name: formData.department_name,
        division_id: formData.division_id.toString(),
        division_name: formData.division_name,
        purpose_of_visit: formData.purpose_of_visit,
        remarks: formData.remarks || '',
        entry_time: new Date().toISOString(),
        exit_time: '',
        status: 'active' as const,
      };

      console.log("Creating registry entry:", registryData);

      const registryResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/create-entry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(registryData)
      });

      if (!registryResponse.ok) {
        throw new Error(`Registry creation failed: ${registryResponse.status}`);
      }

      const registryResult = await registryResponse.json();
      
      if (registryResult.status !== 'success') {
        throw new Error(registryResult.message || 'Failed to create registry entry');
      }

      const registryId = registryResult.data.id || registryResult.data.registry_id;

      // Generate token automatically
      try {
        console.log("Generating token for registry:", registryId);
        
        const tokenResponse = await tokenService.generateToken({
          registry_id: registryId,
          department_id: formData.department_id.toString(),
          division_id: formData.division_id.toString(),
          service_type: 'General Service',
          priority_level: 'normal'
        });

        setGeneratedToken({
          ...tokenResponse,
          visitor_name: finalVisitorData.visitor_name,
          department_name: formData.department_name,
          division_name: formData.division_name,
          registry_id: registryId
        });

        toast({
          title: "Success",
          description: `Visitor registered successfully! Token ${tokenResponse.token_number} generated.`,
        });

      } catch (tokenError) {
        console.error('Token generation failed:', tokenError);
        toast({
          title: "Partial Success",
          description: "Visitor registered but token generation failed. Entry recorded successfully.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register visitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setGeneratedToken(null);
    navigate('/staff/dashboard');
  };

  const handleNewEntry = () => {
    setGeneratedToken(null);
  };

  const printToken = () => {
    if (!generatedToken) return;

    const printContent = `
      ================================
           DIVISIONAL SECRETARIAT
                KALMUNAI
      ================================
      
      TOKEN NUMBER: ${generatedToken.token_number}
      
      Visitor: ${generatedToken.visitor_name}
      Department: ${generatedToken.department_name}
      Division: ${generatedToken.division_name}
      
      Queue Position: ${generatedToken.queue_position}
      Estimated Wait: ${generatedToken.estimated_wait_time} minutes
      
      Date & Time: ${new Date().toLocaleString()}
      
      Please wait for your number to
      be called.
      
      ================================
      Thank you for your patience
      ================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token ${generatedToken.token_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                white-space: pre-line; 
                margin: 20px;
                text-align: center;
                font-size: 14px;
              }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "Token Printed",
      description: "Token has been sent to printer",
    });
  };

  if (generatedToken) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-3xl font-bold text-green-800 mb-2">
                {generatedToken.token_number}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Token Number</p>
              
              <div className="space-y-2 text-left">
                <p><strong>Visitor:</strong> {generatedToken.visitor_name}</p>
                <p><strong>Department:</strong> {generatedToken.department_name}</p>
                <p><strong>Division:</strong> {generatedToken.division_name}</p>
                <p><strong>Queue Position:</strong> {generatedToken.queue_position}</p>
                <p><strong>Estimated Wait:</strong> {generatedToken.estimated_wait_time} minutes</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={printToken}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Print Token
              </button>
              <button
                onClick={handleNewEntry}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Register New Visitor
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-800">
            Public Visitor Registry
          </CardTitle>
          <p className="text-center text-gray-600">
            Register visitors and generate tokens automatically
          </p>
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
