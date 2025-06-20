import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Tv, Users } from 'lucide-react';

interface TokenDisplayData {
  id: number;
  token_number: number;
  status: 'active' | 'called' | 'serving' | 'completed';
  department_name: string;
  division_name: string;
  department_id: number;
  division_id: number;
  created_at: string;
  called_at?: string;
  position_in_queue: number;
}

interface DepartmentDisplay {
  id: number;
  name: string;
  divisions: DivisionDisplay[];
}

interface DivisionDisplay {
  id: number;
  name: string;
  currentToken?: TokenDisplayData;
  waitingTokens: TokenDisplayData[];
  totalWaiting: number;
}

const PublicTokenDisplay: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentDisplay[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentTokens = async () => {
    try {
      const response = await fetch('https://dskalmunai.lk/backend/api/display/current-tokens.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const responseData = data.data;
        if (responseData.tokens && Array.isArray(responseData.tokens)) {
          const organizedData = organizeTokensByDepartment(responseData.tokens);
          setDepartments(organizedData);
          
          // Update last updated time from server response or current time
          if (responseData.last_updated) {
            setLastUpdated(new Date(responseData.last_updated));
          } else {
            setLastUpdated(new Date());
          }
          
          setError(null);
        } else {
          throw new Error('Invalid response format - no tokens array');
        }
      } else {
        throw new Error(data.message || 'API returned error');
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const organizeTokensByDepartment = (tokens: TokenDisplayData[]): DepartmentDisplay[] => {
    const departmentMap = new Map<number, DepartmentDisplay>();

    tokens.forEach(token => {
      if (!departmentMap.has(token.department_id)) {
        departmentMap.set(token.department_id, {
          id: token.department_id,
          name: token.department_name,
          divisions: []
        });
      }

      const department = departmentMap.get(token.department_id)!;
      let division = department.divisions.find(d => d.id === token.division_id);

      if (!division) {
        division = {
          id: token.division_id,
          name: token.division_name,
          waitingTokens: [],
          totalWaiting: 0
        };
        department.divisions.push(division);
      }

      if (token.status === 'serving' || token.status === 'called') {
        division.currentToken = token;
      } else if (token.status === 'active') {
        division.waitingTokens.push(token);
      }
    });

    // Calculate total waiting for each division
    departmentMap.forEach(dept => {
      dept.divisions.forEach(div => {
        div.totalWaiting = div.waitingTokens.length;
        div.waitingTokens.sort((a, b) => a.position_in_queue - b.position_in_queue);
      });
    });

    return Array.from(departmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    fetchCurrentTokens();
    const interval = setInterval(fetchCurrentTokens, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'serving': return 'bg-green-500 text-white animate-pulse';
      case 'called': return 'bg-blue-500 text-white';
      case 'active': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-6xl font-bold animate-pulse">
          Loading Token Display...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-wide">
            DIVISIONAL SECRETARIAT
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-blue-200 tracking-wider">
            KALMUNAI
          </h2>
          <div className="flex items-center justify-center mt-4 text-xl md:text-2xl text-blue-100">
            <Tv className="mr-3" size={32} />
            <span className="font-semibold">TOKEN DISPLAY SYSTEM</span>
          </div>
        </div>

        {/* Last Updated - Enhanced visibility */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center text-white text-lg md:text-xl font-semibold">
            <Clock className="mr-3" size={28} />
            <span>Last Updated: {lastUpdated.toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
          <div className="text-blue-100 text-sm mt-1">
            Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-200 text-xl font-semibold">{error}</p>
          <p className="text-red-300 text-sm mt-2">
            System will retry automatically. Last successful update: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {departments.length === 0 ? (
          <div className="col-span-full text-center">
            <Card className="bg-white/95 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
              <CardContent className="p-12">
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No Active Tokens</h3>
                <p className="text-gray-500">No tokens are currently being served.</p>
                <p className="text-sm text-gray-400 mt-2">Display updates automatically every 10 seconds</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          departments.map(department => (
            <Card key={department.id} className="bg-white/95 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="text-2xl md:text-3xl font-black text-center tracking-wide">
                  {department.name.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {department.divisions.map(division => (
                  <div key={division.id} className="mb-6 last:mb-0">
                    <div className="bg-gray-100 rounded-lg p-4 mb-3">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">
                        {division.name}
                      </h3>
                      
                      {/* Current Serving Token */}
                      {division.currentToken ? (
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 mb-3 text-center animate-pulse">
                          <div className="text-white text-lg font-semibold mb-1">NOW SERVING</div>
                          <div className="text-white text-4xl md:text-6xl font-black mb-2">
                            #{division.currentToken.token_number.toString().padStart(3, '0')}
                          </div>
                          {division.currentToken.called_at && (
                            <div className="text-green-100 text-sm">
                              Called at: {formatTime(division.currentToken.called_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-300 rounded-lg p-4 mb-3 text-center">
                          <div className="text-gray-600 text-lg font-semibold">NO ACTIVE TOKEN</div>
                          <div className="text-gray-500 text-sm">Waiting for next customer</div>
                        </div>
                      )}

                      {/* Waiting Queue */}
                      {division.totalWaiting > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center justify-center mb-2">
                            <Users className="mr-2 text-yellow-600" size={20} />
                            <span className="text-yellow-800 font-bold text-lg">
                              {division.totalWaiting} Waiting
                            </span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            {division.waitingTokens.slice(0, 5).map(token => (
                              <Badge key={token.id} className="bg-yellow-500 text-black font-bold text-sm px-3 py-1">
                                #{token.token_number.toString().padStart(3, '0')}
                              </Badge>
                            ))}
                            {division.totalWaiting > 5 && (
                              <Badge className="bg-yellow-600 text-white font-bold text-sm px-3 py-1">
                                +{division.totalWaiting - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-white/60 text-lg">
        <p>Please wait for your token number to be called</p>
        <p className="text-sm mt-2">Display refreshes automatically every 10 seconds</p>
        <p className="text-xs mt-1 text-white/40">
          System Time: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PublicTokenDisplay;
