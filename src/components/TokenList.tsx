import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService, Token as ApiToken } from '@/services/api';

interface Token {
  id: string;
  tokenNumber: number;
  department: string;
  departmentId: number;
  division: string;
  divisionId: number;
  timestamp: string;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
}

interface TokenListProps {
  refreshTrigger: number;
}

const TokenList = ({ refreshTrigger }: TokenListProps) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayTokens();
  }, [refreshTrigger]);

  const fetchTodayTokens = async () => {
    try {
      setIsLoading(true);
      const apiTokens = await apiService.getTokens();
      
      const formattedTokens: Token[] = Array.isArray(apiTokens) ? apiTokens.map(token => ({
        id: token.id.toString(),
        tokenNumber: token.token_number,
        department: token.department_name || 'Unknown',
        departmentId: token.department_id,
        division: token.division_name || 'Unknown',
        divisionId: token.division_id,
        timestamp: new Date(token.created_at).toLocaleString(),
        status: token.status
      })) : [];
      
      setTokens(formattedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTokenStatus = async (tokenId: string, status: 'called' | 'completed') => {
    try {
      await apiService.updateTokenStatus(parseInt(tokenId), status);
      
      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId ? { ...token, status } : token
        )
      );
      
      toast({
        title: "Success",
        description: `Token #${tokens.find(t => t.id === tokenId)?.tokenNumber} ${status}`,
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

  const printToken = (token: Token) => {
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

    console.log('Printing token:', printContent);
    
    toast({
      title: "Token Printed",
      description: "Token sent to thermal printer",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-100 text-green-800 border-green-200';
      case 'called': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'serving': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-md">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
        <CardTitle className="text-blue-800">Today's Tokens</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {tokens.length > 0 ? (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 bg-white">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-xl text-gray-800">
                      #{token.tokenNumber.toString().padStart(3, '0')}
                    </span>
                    <Badge className={`${getStatusColor(token.status)} border`}>
                      {token.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mt-1">
                    {token.department} - {token.division}
                  </p>
                  <p className="text-xs text-gray-500">{token.timestamp}</p>
                </div>
                <div className="flex space-x-2">
                  {token.status === 'waiting' && (
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => updateTokenStatus(token.id, 'called')}
                    >
                      Call
                    </Button>
                  )}
                  {token.status === 'called' && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => updateTokenStatus(token.id, 'completed')}
                    >
                      Complete
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
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tokens generated today</p>
            <p className="text-gray-400 text-sm mt-2">Generate your first token using the form above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenList;
