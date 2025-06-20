
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Tv, Users, AlertCircle } from 'lucide-react';

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
    const interval = setInterval(fetchCurrentTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-4xl font-bold animate-pulse">
          Loading Token Display...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          DIVISIONAL SECRETARIAT KALMUNAI
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-300 mb-4">
          TOKEN DISPLAY SYSTEM
        </h2>
        
        {/* Last Updated */}
        <div className="bg-slate-800 rounded-lg p-4 inline-block">
          <div className="flex items-center justify-center text-white text-lg font-semibold">
            <Clock className="mr-3" size={24} />
            <span>Last Updated: {lastUpdated.toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
          <div className="text-blue-300 text-sm mt-1">
            Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-600 rounded-lg p-4 text-center">
          <AlertCircle className="mx-auto mb-2" size={32} />
          <p className="text-red-200 text-xl font-semibold">{error}</p>
          <p className="text-red-300 text-sm mt-2">
            System will retry automatically. Last successful update: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Token Display Grid */}
      <div className="space-y-8">
        {departments.length === 0 ? (
          <div className="text-center">
            <div className="bg-slate-800 rounded-lg p-12">
              <h3 className="text-3xl font-bold text-gray-300 mb-4">No Active Tokens</h3>
              <p className="text-gray-400 text-lg">No tokens are currently being served.</p>
              <p className="text-sm text-gray-500 mt-2">Display updates automatically every 10 seconds</p>
            </div>
          </div>
        ) : (
          departments.map(department => (
            <div key={department.id} className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-3xl font-bold text-center text-blue-300 mb-6 border-b border-slate-600 pb-4">
                {department.name.toUpperCase()}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {department.divisions.map(division => (
                  <div key={division.id} className="bg-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-center text-white mb-4 bg-slate-600 rounded p-2">
                      {division.name}
                    </h3>
                    
                    {/* Current Serving Token */}
                    <div className="mb-4">
                      <div className="text-center text-sm font-semibold text-gray-300 mb-2">NOW SERVING</div>
                      {division.currentToken ? (
                        <div className="bg-green-600 text-white rounded-lg p-4 text-center animate-pulse">
                          <div className="text-5xl font-bold mb-2">
                            #{division.currentToken.token_number.toString().padStart(3, '0')}
                          </div>
                          <div className="text-sm">
                            Started: {formatTime(division.currentToken.created_at)}
                          </div>
                          {division.currentToken.called_at && (
                            <div className="text-xs mt-1">
                              Called: {formatTime(division.currentToken.called_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-600 text-gray-300 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold">---</div>
                          <div className="text-sm">Waiting for next customer</div>
                        </div>
                      )}
                    </div>

                    {/* Waiting Queue */}
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-300 mb-2">
                        WAITING: {division.totalWaiting}
                      </div>
                      {division.totalWaiting > 0 ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {division.waitingTokens.slice(0, 6).map(token => (
                            <div key={token.id} className="bg-yellow-600 text-black font-bold text-sm px-3 py-1 rounded">
                              #{token.token_number.toString().padStart(3, '0')}
                            </div>
                          ))}
                          {division.totalWaiting > 6 && (
                            <div className="bg-orange-600 text-white font-bold text-sm px-3 py-1 rounded">
                              +{division.totalWaiting - 6}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No tokens waiting</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p className="text-base mb-2">Please wait for your token number to be called</p>
        <p>Display refreshes automatically every 10 seconds</p>
        <p className="text-xs mt-2">
          System Time: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PublicTokenDisplay;
