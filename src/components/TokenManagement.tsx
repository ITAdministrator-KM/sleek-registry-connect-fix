
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, RefreshCw, Ticket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Token {
  id: string;
  tokenNumber: number;
  department: string;
  division: string;
  timestamp: string;
  status: 'active' | 'called' | 'completed';
}

const TokenManagement = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [currentTokenNumbers, setCurrentTokenNumbers] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  // Sample departments and divisions
  const departments = [
    {
      id: 1,
      name: 'Health Services',
      divisions: ['Primary Health Care', 'Maternal Care', 'Vaccination']
    },
    {
      id: 2,
      name: 'Education',
      divisions: ['School Registration', 'Scholarships', 'Certificates']
    },
    {
      id: 3,
      name: 'Civil Registration',
      divisions: ['Birth Registration', 'Marriage Registration', 'Death Registration']
    }
  ];

  // Initialize token numbers (reset daily)
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('tokenDate');
    
    if (savedDate !== today) {
      // Reset tokens for new day
      const initialTokens: {[key: string]: number} = {};
      departments.forEach(dept => {
        dept.divisions.forEach(div => {
          const key = `${dept.name}-${div}`;
          initialTokens[key] = 0;
        });
      });
      setCurrentTokenNumbers(initialTokens);
      localStorage.setItem('tokenDate', today);
      localStorage.setItem('tokenNumbers', JSON.stringify(initialTokens));
    } else {
      // Load existing tokens for today
      const savedTokens = localStorage.getItem('tokenNumbers');
      if (savedTokens) {
        setCurrentTokenNumbers(JSON.parse(savedTokens));
      }
    }
  }, []);

  const generateToken = () => {
    if (!selectedDepartment || !selectedDivision) {
      toast({
        title: "Error",
        description: "Please select both department and division",
        variant: "destructive",
      });
      return;
    }

    const key = `${selectedDepartment}-${selectedDivision}`;
    const newTokenNumber = (currentTokenNumbers[key] || 0) + 1;
    
    const newToken: Token = {
      id: Date.now().toString(),
      tokenNumber: newTokenNumber,
      department: selectedDepartment,
      division: selectedDivision,
      timestamp: new Date().toLocaleString(),
      status: 'active'
    };

    setTokens(prev => [newToken, ...prev]);
    
    const updatedNumbers = {
      ...currentTokenNumbers,
      [key]: newTokenNumber
    };
    setCurrentTokenNumbers(updatedNumbers);
    localStorage.setItem('tokenNumbers', JSON.stringify(updatedNumbers));

    toast({
      title: "Token Generated",
      description: `Token #${newTokenNumber} for ${selectedDivision}`,
    });

    // Auto-print simulation
    printToken(newToken);
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

  const updateTokenStatus = (tokenId: string, status: 'called' | 'completed') => {
    setTokens(prev => 
      prev.map(token => 
        token.id === tokenId ? { ...token, status } : token
      )
    );
    
    toast({
      title: "Token Updated",
      description: `Token status changed to ${status}`,
    });
  };

  const resetDailyTokens = () => {
    const initialTokens: {[key: string]: number} = {};
    departments.forEach(dept => {
      dept.divisions.forEach(div => {
        const key = `${dept.name}-${div}`;
        initialTokens[key] = 0;
      });
    });
    
    setCurrentTokenNumbers(initialTokens);
    setTokens([]);
    localStorage.setItem('tokenNumbers', JSON.stringify(initialTokens));
    localStorage.setItem('tokenDate', new Date().toDateString());
    
    toast({
      title: "Tokens Reset",
      description: "All token numbers reset to start from 1",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredDivisions = () => {
    const dept = departments.find(d => d.name === selectedDepartment);
    return dept ? dept.divisions : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Token Management</h3>
          <p className="text-gray-600 mt-2">Generate and manage service tokens</p>
        </div>
        <Button 
          onClick={resetDailyTokens}
          variant="outline"
          className="text-red-600 hover:text-red-700"
        >
          <RefreshCw className="mr-2" size={16} />
          Reset Daily Tokens
        </Button>
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
                    <SelectItem key={division} value={division}>
                      {division}
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

      {/* Current Token Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>Current Token Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="space-y-2">
                <h4 className="font-semibold text-gray-800">{dept.name}</h4>
                {dept.divisions.map((division) => {
                  const key = `${dept.name}-${division}`;
                  const currentNumber = currentTokenNumbers[key] || 0;
                  
                  return (
                    <div key={division} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{division}</span>
                      <Badge variant="outline">
                        #{currentNumber.toString().padStart(3, '0')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ))}
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
              {tokens.slice(0, 10).map((token) => (
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
