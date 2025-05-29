
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardStats from './DashboardStats';
import TokenGenerator from './TokenGenerator';
import TokenList from './TokenList';

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

const TokenManagement = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTokenGenerated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Token Management</h3>
          <p className="text-gray-600 mt-2">Generate and manage service tokens</p>
        </div>
      </div>

      <TokenGenerator onTokenGenerated={handleTokenGenerated} />
      <TokenList refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default TokenManagement;
