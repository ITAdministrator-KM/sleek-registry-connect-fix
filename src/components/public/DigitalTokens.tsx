
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Ticket, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const DigitalTokens = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await apiService.getTokens();
      setTokens(response);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'called': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'serving': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'called': return 'bg-orange-100 text-orange-800';
      case 'serving': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentToken = () => {
    return tokens.find(token => ['waiting', 'called', 'serving'].includes(token.status));
  };

  const currentToken = getCurrentToken();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Digital Tokens</h2>
        <Button 
          variant="outline" 
          onClick={fetchTokens}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {currentToken && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Ticket className="h-6 w-6" />
              Current Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  #{currentToken.token_number}
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Department:</strong> {currentToken.department_name}</p>
                  <p><strong>Division:</strong> {currentToken.division_name}</p>
                  <p><strong>Generated:</strong> {new Date(currentToken.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(currentToken.status)}
                  <Badge className={getStatusColor(currentToken.status)}>
                    {currentToken.status.toUpperCase()}
                  </Badge>
                </div>
                {currentToken.status === 'called' && (
                  <p className="text-orange-600 font-medium">Please proceed to the counter</p>
                )}
                {currentToken.status === 'serving' && (
                  <p className="text-blue-600 font-medium">Currently being served</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Token History</CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tokens Yet</h3>
              <p className="text-gray-500">
                Request a service to generate your first digital token.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.slice(0, 10).map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-gray-600">
                      #{token.token_number}
                    </div>
                    <div>
                      <p className="font-medium">{token.department_name}</p>
                      <p className="text-sm text-gray-600">{token.division_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(token.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(token.status)}
                    <Badge className={getStatusColor(token.status)}>
                      {token.status.toUpperCase()}
                    </Badge>
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

export default DigitalTokens;
