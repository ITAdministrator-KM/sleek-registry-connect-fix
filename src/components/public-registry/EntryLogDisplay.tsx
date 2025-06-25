
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, Filter, RefreshCw } from 'lucide-react';

interface EntryLogDisplayProps {
  entries: any[];
  departments: any[];
  onRefresh: () => void;
  loading?: boolean;
}

const EntryLogDisplay: React.FC<EntryLogDisplayProps> = ({
  entries,
  departments,
  onRefresh,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.visitor_nic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.purpose_of_visit.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept ? entry.department_id.toString() === selectedDept : true;
    
    const entryDate = new Date(entry.entry_time).toISOString().split('T')[0];
    const matchesDate = dateFilter ? entryDate === dateFilter : true;
    
    return matchesSearch && matchesDept && matchesDate;
  });

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const exportData = filteredEntries.map(entry => ({
        Time: new Date(entry.entry_time).toLocaleTimeString(),
        Name: entry.visitor_name,
        NIC: entry.visitor_nic,
        Department: entry.department_name,
        Division: entry.division_name,
        Purpose: entry.purpose_of_visit,
        Status: entry.status
      }));

      if (format === 'csv') {
        const csvContent = [
          Object.keys(exportData[0]).join(','),
          ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registry_${dateFilter}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Export Successful",
        description: `Registry data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Entry Log Panel
            <Badge variant="secondary">{filteredEntries.length} entries</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={() => exportData('csv')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search by name, NIC, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading entries...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No entries found</div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{entry.visitor_name}</div>
                        <div className="text-sm text-gray-600">
                          NIC: {entry.visitor_nic.replace(/(.{3})(.*)(.{3})/, '$1***$3')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.department_name} {entry.division_name && `- ${entry.division_name}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          Purpose: {entry.purpose_of_visit}
                        </div>
                        {entry.remarks && (
                          <div className="text-sm text-gray-500">
                            Remarks: {entry.remarks}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(entry.entry_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                        <Badge 
                          variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {entry.visitor_type === 'new' ? 'New' : 'Existing'}
                        </Badge>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {entry.registry_id || entry.id}
                        </div>
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

export default EntryLogDisplay;
