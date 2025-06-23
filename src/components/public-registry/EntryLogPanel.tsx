import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';
import { RegistryEntry } from '@/services/registryApi';

interface EntryLogPanelProps {
  entries: RegistryEntry[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  onCheckOut?: (entryId: string | number) => void;
}

export const EntryLogPanel: React.FC<EntryLogPanelProps> = ({
  entries,
  searchQuery,
  onSearchChange,
  isLoading,
  onCheckOut,
}) => {
  const filteredEntries = entries.filter(entry =>
    entry.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.visitor_nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Entry Log Panel (Today)
          </span>
          <Badge variant="secondary">{filteredEntries.length} entries</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <Input
            placeholder="Search by name, NIC, or department..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading entries...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No entries found</div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{entry.visitor_name}</div>
                        <div className="text-sm text-gray-600">
                          NIC: {entry.visitor_nic.replace(/(.{3})(.*)(.{3})/, '$1***$3')}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {entry.department_name}
                            {entry.division_name && ` • ${entry.division_name}`}
                          </div>
                          {onCheckOut && entry.status === 'active' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onCheckOut(entry.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Purpose: {entry.purpose_of_visit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {new Date(entry.entry_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                        <Badge variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}>
                          {entry.visitor_type === 'new' ? 'New' : 'Existing'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryLogPanel;
