import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { tokenService, QueueStatus } from '@/services/tokenService';
import { apiService, Token } from '@/services/apiService';
import { Printer, RefreshCw, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

const TokenManagement = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDivisions(selectedDepartment);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedDivision) {
      fetchTokensAndQueue();
    }
  }, [selectedDepartment, selectedDivision, refreshTrigger]);

  const fetchDepartments = async () => {
    try {
      const data = await apiService.getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedDepartment(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    }
  };

  const fetchDivisions = async (departmentId: string) => {
    try {
      const data = await apiService.getDivisions(parseInt(departmentId));
      setDivisions(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedDivision(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
      toast({
        title: "Error",
        description: "Failed to load divisions",
        variant: "destructive",
      });
    }
  };

  const fetchTokensAndQueue = async () => {
    if (!selectedDepartment || !selectedDivision) return;

    setIsLoading(true);
    try {
      const [tokenResponse, queueData] = await Promise.all([
        tokenService.getTokens({
          department_id: selectedDepartment,
          division_id: selectedDivision,
          date: new Date().toISOString().split('T')[0],
          limit: 50
        }),
        tokenService.getQueueStatus(selectedDepartment, selectedDivision)
      ]);

      setTokens(tokenResponse.tokens);
      setQueueStatus(queueData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const callNextToken = async () => {
    if (!selectedDepartment || !selectedDivision) {
      toast({
        title: "Error",
        description: "Please select department and division",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await tokenService.getNextToken(selectedDepartment, selectedDivision);
      
      if (result.token_id) {
        toast({
          title: "Token Called",
          description: `Token ${result.token_number} has been called`,
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "No Tokens",
          description: "No tokens waiting in queue",
        });
      }
    } catch (error) {
      console.error('Error calling next token:', error);
      toast({
        title: "Error",
        description: "Failed to call next token",
        variant: "destructive",
      });
    }
  };

  const completeToken = async (tokenId: string, tokenNumber: string) => {
    try {
      await tokenService.completeToken(tokenId, 'Service completed');
      toast({
        title: "Token Completed",
        description: `Token ${tokenNumber} has been marked as served`,
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error completing token:', error);
      toast({
        title: "Error",
        description: "Failed to complete token",
        variant: "destructive",
      });
    }
  };

  const cancelToken = async (tokenId: string, tokenNumber: string) => {
    try {
      await tokenService.cancelToken(tokenId, 'Cancelled by staff');
      toast({
        title: "Token Cancelled",
        description: `Token ${tokenNumber} has been cancelled`,
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error cancelling token:', error);
      toast({
        title: "Error",
        description: "Failed to cancel token",
        variant: "destructive",
      });
    }
  };

  const startServing = async (tokenId: string, tokenNumber: string) => {
    try {
      await tokenService.startServingToken(tokenId);
      toast({
        title: "Service Started",
        description: `Started serving token ${tokenNumber}`,
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error starting service:', error);
      toast({
        title: "Error",
        description: "Failed to start serving token",
        variant: "destructive",
      });
    }
  };

  const printToken = (token: Token) => {
    const printContent = `
      ================================
           DIVISIONAL SECRETARIAT
                KALMUNAI
      ================================
      
      TOKEN NUMBER: ${token.token_number}
      
      Visitor: ${token.visitor_name || 'N/A'}
      Department: ${token.department_name || 'N/A'}
      Division: ${token.division_name || 'N/A'}
      Status: ${token.status.toUpperCase()}
      
      Generated: ${new Date(token.created_at).toLocaleString()}
      Queue Position: ${token.queue_position}
      
      ================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token ${token.token_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                white-space: pre-line; 
                margin: 20px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'called': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'serving': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'served': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'vip': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Token Management</h3>
          <p className="text-gray-600 mt-2">Manage service tokens and queue</p>
        </div>
        <Button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Department and Division Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!selectedDepartment}
              >
                <option value="">Select Division</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id.toString()}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Status */}
      {queueStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
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
                <div className="text-2xl font-bold text-orange-600">{queueStatus.average_service_time}min</div>
                <div className="text-sm text-gray-600">Avg. Service Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{queueStatus.estimated_wait_time}min</div>
                <div className="text-sm text-gray-600">Est. Wait Time</div>
              </div>
            </div>
            {queueStatus.current_serving_token && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <p className="font-medium">Currently Serving: <span className="text-orange-600">{queueStatus.current_serving_token}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Token Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={callNextToken}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!selectedDepartment || !selectedDivision}
          >
            <Phone size={16} className="mr-2" />
            Call Next Token
          </Button>
        </CardContent>
      </Card>

      {/* Active Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No tokens for today</p>
              <p className="text-gray-400 text-sm mt-2">Tokens will appear here once visitors register</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 bg-white">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-bold text-xl text-gray-800">
                        #{token.token_number}
                      </span>
                      <Badge className={`${getStatusColor(token.status)} border`}>
                        {token.status.toUpperCase()}
                      </Badge>
                      {token.priority_level !== 'normal' && (
                        <Badge className={getPriorityColor(token.priority_level)}>
                          {token.priority_level.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {token.visitor_name || 'Unknown Visitor'} - {token.purpose_of_visit || 'General Service'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated: {new Date(token.created_at).toLocaleString()} | 
                      Position: {token.queue_position} | 
                      Wait: {token.total_wait_minutes || 0} min
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {token.status === 'waiting' && (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => callNextToken()}
                      >
                        Call
                      </Button>
                    )}
                    {token.status === 'called' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => startServing(token.id, token.token_number)}
                        >
                          Start Service
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => completeToken(token.id, token.token_number)}
                        >
                          <CheckCircle size={14} />
                        </Button>
                      </>
                    )}
                    {token.status === 'serving' && (
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => completeToken(token.id, token.token_number)}
                      >
                        Complete
                      </Button>
                    )}
                    {['waiting', 'called'].includes(token.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => cancelToken(token.id, token.token_number)}
                      >
                        <XCircle size={14} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      onClick={() => printToken(token)}
                    >
                      <Printer size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenManagement;
