
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Monitor, RefreshCw, Users, Clock } from 'lucide-react';
import { apiService } from '@/services/apiService';

const TokenDisplayManager: React.FC = () => {
  const [tokenData, setTokenData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tokens, depts] = await Promise.all([
        apiService.getTokens(),
        apiService.getDepartments()
      ]);
      
      setTokenData(tokens);
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTokensByDepartment = () => {
    const grouped = departments.map(dept => {
      const deptTokens = tokenData.filter(token => 
        token.department_id === dept.id && 
        ['waiting', 'called', 'serving'].includes(token.status)
      );
      
      return {
        ...dept,
        tokens: deptTokens,
        currentToken: deptTokens.find(t => t.status === 'serving')?.token_number || 'None',
        waitingCount: deptTokens.filter(t => t.status === 'waiting').length,
        nextToken: deptTokens.find(t => t.status === 'waiting')?.token_number || 'None'
      };
    });
    
    return grouped;
  };

  const departmentTokens = getTokensByDepartment();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading token display...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="w-6 h-6" />
          Token Display Management
        </h2>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentTokens.map((dept) => (
          <Card key={dept.id} className="border-2">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg">{dept.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dept.currentToken}
                  </div>
                  <p className="text-sm text-gray-600">Currently Serving</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">
                      {dept.nextToken}
                    </div>
                    <p className="text-xs text-gray-500">Next Token</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-xl font-semibold text-orange-600">
                        {dept.waitingCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Waiting</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Badge variant="outline" className="w-full justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Updated: {new Date().toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TokenDisplayManager;
