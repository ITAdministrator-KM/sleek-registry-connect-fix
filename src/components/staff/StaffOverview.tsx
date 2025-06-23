
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Ticket, ClipboardList, QrCode, Settings, AlertCircle } from 'lucide-react';

interface StaffOverviewProps {
  onCreateUser: () => void;
  onTabChange: (tab: string) => void;
  stats: {
    activeTokens: number;
    servedToday: number;
    waitingTokens: number;
    publicUsers: number;
  };
}

const StaffOverview: React.FC<StaffOverviewProps> = ({ onCreateUser, onTabChange, stats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-3">Staff Dashboard</h2>
        <p className="text-blue-100 text-lg">Manage public services efficiently</p>
        <div className="mt-4 text-blue-100 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used staff tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={onCreateUser} 
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="mr-3" size={20} />
              Create Public Account
            </Button>
            <Button 
              onClick={() => onTabChange('tokens')} 
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <Ticket className="mr-3" size={20} />
              Manage Tokens
            </Button>
            <Button 
              onClick={() => onTabChange('public-registry')} 
              className="w-full justify-start bg-purple-600 hover:bg-purple-700"
            >
              <ClipboardList className="mr-3" size={20} />
              Visitor Registry
            </Button>
            <Button 
              onClick={() => window.open('/display', '_blank')} 
              className="w-full justify-start bg-indigo-600 hover:bg-indigo-700"
            >
              <QrCode className="mr-3" size={20} />
              Open Token Display
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              Today's Summary
            </CardTitle>
            <CardDescription>Current operations overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Active Tokens</p>
                <p className="text-sm text-gray-600">{stats.activeTokens} in progress</p>
              </div>
              <Badge variant="secondary">{stats.activeTokens}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Completed</p>
                <p className="text-sm text-gray-600">{stats.servedToday} served today</p>
              </div>
              <Badge variant="secondary">{stats.servedToday}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-semibold">Waiting</p>
                <p className="text-sm text-gray-600">{stats.waitingTokens} in queue</p>
              </div>
              <Badge variant="secondary">{stats.waitingTokens}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffOverview;
