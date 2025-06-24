
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TokenData {
  id: number;
  token_number: string;
  status: 'active' | 'called' | 'serving' | 'completed';
  department_name: string;
  division_name: string;
  department_id: number;
  division_id: number;
  position_in_queue: number;
  created_at: string;
  called_at?: string;
}

interface TokenStats {
  total_tokens_today: number;
  waiting_tokens: number;
  serving_tokens: number;
  completed_tokens: number;
}

interface DepartmentData {
  id: number;
  name: string;
  total_tokens: number;
  waiting_tokens: number;
  serving_tokens: number;
}

const TokenDisplayTV: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [stats, setStats] = useState<TokenStats>({
    total_tokens_today: 0,
    waiting_tokens: 0,
    serving_tokens: 0,
    completed_tokens: 0
  });
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 5000); // Update every 5 seconds
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchTokenData = async () => {
    try {
      const response = await fetch('/backend/api/display/current-tokens.php');
      const data = await response.json();
      
      if (data.success) {
        setTokens(data.data.tokens || []);
        setStats(data.data.statistics || stats);
        setDepartments(data.data.departments || []);
        setLastUpdated(data.data.last_updated || '');
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'serving': return 'bg-green-500 text-white';
      case 'called': return 'bg-yellow-500 text-white';
      case 'active': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'serving': return 'SERVING';
      case 'called': return 'CALLED';
      case 'active': return 'WAITING';
      default: return status.toUpperCase();
    }
  };

  const groupedTokens = tokens.reduce((acc, token) => {
    const key = `${token.department_name}-${token.division_name}`;
    if (!acc[key]) {
      acc[key] = {
        department: token.department_name,
        division: token.division_name,
        tokens: []
      };
    }
    acc[key].tokens.push(token);
    return acc;
  }, {} as Record<string, { department: string; division: string; tokens: TokenData[] }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-8 mb-4">
          <img src="/emblem.svg" alt="Government Emblem" className="h-16 w-16" />
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">
              DIVISIONAL SECRETARIAT KALMUNAI
            </h1>
            <h2 className="text-3xl font-semibold text-blue-200">
              TOKEN DISPLAY SYSTEM
            </h2>
          </div>
          <img src="/logo.svg" alt="DS Logo" className="h-16 w-16" />
        </div>
        
        <div className="flex justify-between items-center text-xl">
          <div className="text-blue-200">
            Current Time: <span className="font-bold text-white">{currentTime}</span>
          </div>
          <div className="text-blue-200">
            Last Updated: <span className="font-bold text-white">{new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">{stats.total_tokens_today}</div>
            <div className="text-blue-200 text-lg">Total Tokens Today</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.waiting_tokens}</div>
            <div className="text-blue-200 text-lg">Waiting</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">{stats.serving_tokens}</div>
            <div className="text-blue-200 text-lg">Being Served</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{stats.completed_tokens}</div>
            <div className="text-blue-200 text-lg">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Department Tokens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(groupedTokens).map(([key, group]) => (
          <Card key={key} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-white">
                {group.department} - {group.division}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-white">
                      {token.token_number}
                    </div>
                    <div className="text-sm text-blue-200">
                      Queue: #{token.position_in_queue}
                    </div>
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${getStatusColor(token.status)}`}>
                    {getStatusText(token.status)}
                  </Badge>
                </div>
              ))}
              
              {group.tokens.length === 0 && (
                <div className="text-center py-8 text-blue-200">
                  No active tokens for this department
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tokens.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl text-blue-200 mb-4">No Active Tokens</div>
          <div className="text-xl text-blue-300">All departments are currently clear</div>
        </div>
      )}
    </div>
  );
};

export default TokenDisplayTV;
