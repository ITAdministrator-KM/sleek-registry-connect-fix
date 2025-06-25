
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { tokenService } from '@/services/tokenService';
import { Ticket, Clock, Users, RefreshCw } from 'lucide-react';

interface TokenGenerationFlowProps {
  departments: any[];
  divisions: any[];
  onComplete: (result: any) => void;
}

const TokenGenerationFlow: React.FC<TokenGenerationFlowProps> = ({
  departments,
  divisions,
  onComplete
}) => {
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDiv, setSelectedDiv] = useState('');
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDept && selectedDiv) {
      fetchQueueStatus();
    }
  }, [selectedDept, selectedDiv]);

  const fetchQueueStatus = async () => {
    try {
      setRefreshing(true);
      const status = await tokenService.getQueueStatus(selectedDept, selectedDiv);
      setQueueStatus(status);
    } catch (error) {
      console.error('Error fetching queue status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedDiv('');
    setQueueStatus(null);
  };

  const handleGenerateManualToken = async () => {
    if (!selectedDept || !selectedDiv) {
      toast({
        title: "Selection Required",
        description: "Please select department and division",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create a temporary registry entry for manual token
      const registryResult = await fetch(`${import.meta.env.VITE_API_URL || 'https://dskalmunai.lk/backend/api'}/registry/create-entry.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          visitor_id: 0,
          visitor_name: 'Walk-in Customer',
          visitor_nic: 'N/A',
          visitor_phone: '',
          visitor_address: '',
          department_id: selectedDept,
          division_id: selectedDiv,
          purpose_of_visit: 'General Service',
          remarks: 'Manual token generation',
          entry_time: new Date().toISOString(),
          status: 'active'
        })
      });

      if (registryResult.ok) {
        const registryData = await registryResult.json();
        
        const tokenResponse = await tokenService.generateToken({
          registry_id: registryData.data.id || registryData.data.registry_id,
          department_id: selectedDept,
          division_id: selectedDiv,
          service_type: 'General Service',
          priority_level: 'normal'
        });

        onComplete({
          type: 'manual-token',
          tokenData: tokenResponse,
          registryData
        });

        toast({
          title: "Token Generated",
          description: `Token ${tokenResponse.token_number} created successfully`,
        });

        // Refresh queue status
        fetchQueueStatus();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Select Department</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {departments.map((dept) => (
              <Button
                key={dept.id}
                variant={selectedDept === dept.id.toString() ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleDepartmentSelect(dept.id.toString())}
              >
                {dept.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Select Division</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {divisions
              .filter(div => div.department_id.toString() === selectedDept)
              .map((div) => (
                <Button
                  key={div.id}
                  variant={selectedDiv === div.id.toString() ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedDiv(div.id.toString())}
                  disabled={!selectedDept}
                >
                  {div.name}
                </Button>
              ))}
          </div>
        </div>
      </div>

      {queueStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Queue Status
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchQueueStatus}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{queueStatus.tokens_waiting}</div>
                <div className="text-sm text-gray-600">Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStatus.tokens_served}</div>
                <div className="text-sm text-gray-600">Served</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{queueStatus.total_tokens_issued}</div>
                <div className="text-sm text-gray-600">Total Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStatus.estimated_wait_time}</div>
                <div className="text-sm text-gray-600">Est. Wait (min)</div>
              </div>
            </div>
            
            {queueStatus.current_serving_token && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    Now Serving: {queueStatus.current_serving_token}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleGenerateManualToken}
          disabled={!selectedDept || !selectedDiv || loading}
          className="flex-1"
        >
          <Ticket className="w-4 h-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Manual Token'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => onComplete({ type: 'display-only' })}
          className="flex-1"
        >
          <Clock className="w-4 h-4 mr-2" />
          View Display System
        </Button>
      </div>
    </div>
  );
};

export default TokenGenerationFlow;
