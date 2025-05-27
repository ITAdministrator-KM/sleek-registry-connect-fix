import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, RefreshCw, Ticket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface Token {
  id: string;
  tokenNumber: number;
  department: string;
  departmentId: number;
  division: string;
  divisionId: number;
  timestamp: string;
  status: 'active' | 'called' | 'completed';
}

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

const TokenManagement = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
    fetchTodayTokens();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch divisions",
        variant: "destructive",
      });
      console.error('Error fetching divisions:', error);
    }
  };

  const fetchTodayTokens = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const apiTokens = await apiService.getTokens(today);
      
      const formattedTokens: Token[] = apiTokens.map(token => ({
        id: token.id.toString(),
        tokenNumber: token.token_number,
        department: token.department_name,
        departmentId: token.department_id,
        division: token.division_name,
        divisionId: token.division_id,
        timestamp: new Date(token.created_at).toLocaleString(),
        status: token.status
      }));
      
      setTokens(formattedTokens);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch today's tokens",
        variant: "destructive",
      });
      console.error('Error fetching tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = async () => {
    if (!selectedDepartment || !selectedDivision) {
      toast({
        title: "Error",
        description: "Please select both department and division",
        variant: "destructive",
      });
      return;
    }

    try {
      const department = departments.find(d => d.name === selectedDepartment);
      const division = divisions.find(d => d.name === selectedDivision);

      if (!department || !division) {
        throw new Error("Invalid department or division selected");
      }

      const response = await apiService.createToken({
        department_id: department.id,
        division_id: division.id
      });

      toast({
        title: "Token Generated",
        description: `Token #${response.token_number} for ${selectedDivision}`,
      });

      // Refresh tokens list
      await fetchTodayTokens();

      // Print the token
      const newToken: Token = {
        id: response.token_id.toString(),
        tokenNumber: response.token_number,
        department: selectedDepartment,
        departmentId: department.id,
        division: selectedDivision,
        divisionId: division.id,
        timestamp: new Date().toLocaleString(),
        status: 'active'
      };
      
      printToken(newToken);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
      console.error('Error generating token:', error);
    }
  };

  const printToken = (token: Token) => {
    // Simulate thermal printer output
    const printContent = `
      ================================
           DIVISIONAL SECRETARIAT
                KALMUNAI
      ================================
      
      TOKEN NUMBER: ${token.tokenNumber.toString().padStart(3, '0')}
      
      Department: ${token.department}
      Division: ${token.division}
      
      Date & Time: ${token.timestamp}
      
      Please wait for your number to
      be called.
      
      ================================
      Thank you for your patience
      ================================
    `;

    // In a real application, this would send to thermal printer
    console.log('Printing token:', printContent);
    
    toast({
      title: "Token Printed",
      description: "Token sent to XP-58 thermal printer",
    });
  };

  const updateTokenStatus = async (tokenId: string, status: 'called' | 'completed') => {
    try {
      await apiService.updateToken({
        id: parseInt(tokenId),
        status
      });
      
      // Update local state
      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId ? { ...token, status } : token
        )
      );
      
      toast({
        title: "Token Updated",
        description: `Token status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update token status",
        variant: "destructive",
      });
      console.error('Error updating token:', error);
    }
  };

  const getFilteredDivisions = () => {
    if (!selectedDepartment) return [];
    const department = departments.find(d => d.name === selectedDepartment);
    if (!department) return [];
    return divisions.filter(d => d.department_id === department.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Token Management</h3>
          <p className="text-gray-600 mt-2">Generate and manage service tokens</p>
        </div>
      </div>

      {/* Token Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="mr-2" size={20} />
            Generate New Token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Division</label>
              <Select 
                value={selectedDivision} 
                onValueChange={setSelectedDivision}
                disabled={!selectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredDivisions().map((division) => (
                    <SelectItem key={division.id} value={division.name}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateToken}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedDepartment || !selectedDivision}
              >
                <Printer className="mr-2" size={16} />
                Generate & Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length > 0 ? (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">
                        #{token.tokenNumber.toString().padStart(3, '0')}
                      </span>
                      <Badge className={getStatusColor(token.status)}>
                        {token.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {token.department} - {token.division}
                    </p>
                    <p className="text-xs text-gray-500">{token.timestamp}</p>
                  </div>
                  <div className="flex space-x-2">
                    {token.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTokenStatus(token.id, 'called')}
                      >
                        Call
                      </Button>
                    )}
                    {token.status === 'called' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTokenStatus(token.id, 'completed')}
                        className="text-green-600 hover:text-green-700"
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printToken(token)}
                    >
                      <Printer size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No tokens generated today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenManagement;
