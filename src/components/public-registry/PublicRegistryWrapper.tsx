
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { PublicRegistryForm } from './PublicRegistryForm';
import { EntryLogPanel } from './EntryLogPanel';
import type { RegistryEntry as LocalRegistryEntry } from './types';
import { registryApiService } from '@/services/registryApi';

// Define a more flexible type for the API response
interface ApiRegistryEntry {
  id: number | string;
  visitor_id?: number | string;
  visitor_name?: string;
  visitor_nic?: string;
  visitor_phone?: string;
  visitor_address?: string;
  department_id?: number | string;
  department_name?: string;
  division_id?: number | string;
  division_name?: string;
  purpose_of_visit?: string;
  remarks?: string;
  entry_time?: string;
  exit_time?: string;
  status?: 'active' | 'completed' | 'cancelled' | string;
  created_at?: string;
  updated_at?: string;
  registry_id?: number | string;
  visitor_type?: string;
  // Add any other fields that might come from the API
  [key: string]: any;
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, UserPlus } from 'lucide-react';

// Helper function to map API registry entry to local registry entry
const mapApiEntryToLocal = (entry: ApiRegistryEntry): LocalRegistryEntry => {
  // Ensure numeric IDs are properly converted from strings if needed
  const toNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val, 10) || 0;
    return 0;
  };

  // Map the API entry to our local entry structure
  const mapped: LocalRegistryEntry = {
    id: toNumber(entry.id),
    visitor_id: toNumber(entry.visitor_id || entry.id),
    visitor_name: entry.visitor_name || '',
    visitor_nic: entry.visitor_nic || '',
    department_id: toNumber(entry.department_id || 0),
    purpose_of_visit: entry.purpose_of_visit || '',
    check_in: entry.entry_time || new Date().toISOString(),
    status: (entry.status as 'active' | 'completed' | 'cancelled') || 'active',
    created_at: entry.created_at || new Date().toISOString(),
    updated_at: entry.updated_at || new Date().toISOString(),
    // Optional fields
    ...(entry.visitor_phone && { visitor_phone: entry.visitor_phone }),
    ...(entry.visitor_address && { visitor_address: entry.visitor_address }),
    ...(entry.department_name && { department_name: entry.department_name }),
    ...(entry.division_id && { division_id: toNumber(entry.division_id) }),
    ...(entry.division_name && { division_name: entry.division_name }),
    ...(entry.remarks && { remarks: entry.remarks }),
    ...(entry.check_out && { check_out: entry.check_out }),
    ...(entry.registry_id && { registry_id: String(entry.registry_id) })
  };

  // Add any additional fields that might be needed
  if (entry.registry_id) {
    // Ensure registry_id is a string to match API expectations
    mapped.registry_id = String(entry.registry_id);
  }
  if (entry.entry_time) {
    mapped.entry_time = entry.entry_time;
  }
  if (entry.exit_time) {
    mapped.exit_time = entry.exit_time;
  }
  if (entry.visitor_type) {
    mapped.visitor_type = entry.visitor_type;
  }

  return mapped;
};

export const PublicRegistryWrapper: React.FC = () => {
  // State for storing registry entries using our local type
  const [registryEntries, setRegistryEntries] = useState<LocalRegistryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch registry entries
  const fetchRegistryEntries = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch entries from the API
      const response = await registryApiService.getRegistryEntries({
        date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      
      // Handle different response formats
      const apiEntries = (response as any)?.data?.data || response || [];
      
      // Ensure entries is an array and map to local type
      const mappedEntries = Array.isArray(apiEntries) 
        ? apiEntries.map((entry: any) => {
            // Map the API entry to our local RegistryEntry type
            const mappedEntry: LocalRegistryEntry = {
              id: Number(entry.id),
              visitor_id: Number(entry.visitor_id || entry.id || 0),
              visitor_name: String(entry.visitor_name || ''),
              visitor_nic: String(entry.visitor_nic || ''),
              department_id: Number(entry.department_id || 0),
              purpose_of_visit: String(entry.purpose_of_visit || ''),
              check_in: String(entry.entry_time || entry.check_in || new Date().toISOString()),
              status: (entry.status === 'completed' || entry.status === 'cancelled') 
                ? entry.status 
                : 'active',
              created_at: String(entry.created_at || new Date().toISOString()),
              updated_at: String(entry.updated_at || new Date().toISOString())
            };
            
            // Add optional fields if they exist
            if (entry.visitor_phone) mappedEntry.visitor_phone = String(entry.visitor_phone);
            if (entry.visitor_address) mappedEntry.visitor_address = String(entry.visitor_address);
            if (entry.department_name) mappedEntry.department_name = String(entry.department_name);
            if (entry.division_id) mappedEntry.division_id = Number(entry.division_id);
            if (entry.division_name) mappedEntry.division_name = String(entry.division_name);
            if (entry.remarks) mappedEntry.remarks = String(entry.remarks);
            if (entry.exit_time || entry.check_out) {
              mappedEntry.check_out = String(entry.exit_time || entry.check_out);
            }
            if (entry.registry_id) {
              mappedEntry.registry_id = String(entry.registry_id);
            }
            
            return mappedEntry;
          })
        : [];
      
      setRegistryEntries(mappedEntries);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registry entries",
        variant: "destructive",
      });
      setRegistryEntries([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Refresh the entries list
  const handleRefresh = useCallback(() => {
    fetchRegistryEntries();
  }, [fetchRegistryEntries]);
  
  // Type guard to check if an entry is a LocalRegistryEntry
  const isLocalRegistryEntry = (entry: any): entry is LocalRegistryEntry => {
    return (
      entry && 
      typeof entry.id === 'number' &&
      typeof entry.visitor_name === 'string' &&
      typeof entry.visitor_nic === 'string' &&
      typeof entry.department_id === 'number' &&
      typeof entry.purpose_of_visit === 'string' &&
      typeof entry.check_in === 'string' &&
      typeof entry.status === 'string' &&
      typeof entry.created_at === 'string' &&
      typeof entry.updated_at === 'string'
    );
  };

  // Handle successful form submission
  const handleSuccess = useCallback(() => {
    fetchRegistryEntries();
    toast({
      title: "Success",
      description: "Visitor registered successfully",
    });
  }, [fetchRegistryEntries, toast]);

  // Handle export
  const exportData = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      const blob = await registryApiService.exportRegistryData({
        date: new Date().toISOString().split('T')[0],
        format
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registry_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Registry data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle check out
  const handleCheckOut = useCallback(async (entryId: string | number) => {
    try {
      const entry = registryEntries.find(e => e.id === Number(entryId));
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Create a new entry with the same data but marked as checked_out
      const checkOutData = {
        // Required fields for a new entry
        visitor_id: entry.visitor_id,
        visitor_name: entry.visitor_name,
        visitor_nic: entry.visitor_nic,
        department_id: entry.department_id,
        purpose_of_visit: entry.purpose_of_visit,
        check_in: entry.check_in,
        status: 'checked_out' as const, // Use checked_out instead of completed
        // Required field with a default value
        visitor_type: 'existing' as const, // Default to 'existing' for check-outs
        // Add the check-out time
        exit_time: new Date().toISOString(),
        // Include optional fields
        ...(entry.visitor_phone && { visitor_phone: entry.visitor_phone }),
        ...(entry.visitor_address && { visitor_address: entry.visitor_address }),
        ...(entry.department_name && { department_name: entry.department_name }),
        ...(entry.division_id && { division_id: entry.division_id }),
        ...(entry.division_name && { division_name: entry.division_name }),
        ...(entry.remarks && { remarks: entry.remarks }),
        // Ensure registry_id is a string if it exists
        ...(entry.registry_id && { registry_id: String(entry.registry_id) })
      };
      
      // Create a new entry with the checked_out status
      await registryApiService.createRegistryEntry(checkOutData);
      
      toast({
        title: "Success",
        description: "Visitor checked out successfully",
      });
      fetchRegistryEntries();
    } catch (error) {
      console.error('Error checking out visitor:', error);
      toast({
        title: "Error",
        description: "Failed to check out visitor",
        variant: "destructive",
      });
    }
  }, [fetchRegistryEntries, registryEntries, toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Public Visitor Registry</h1>
        <div className="flex gap-2">
          <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchRegistryEntries} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Register New Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PublicRegistryForm 
              onSuccess={handleSuccess}
              departments={[]} // The form will fetch its own departments if empty
            />
          </CardContent>
        </Card>

        {/* Entry Log Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Visitor Logs</h2>
            <div className="flex gap-2">
              <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <EntryLogPanel 
            entries={registryEntries.map(entry => ({
              ...entry,
              // Ensure registry_id is a string to match API type
              registry_id: entry.registry_id ? String(entry.registry_id) : undefined,
              // Map any other fields that might have type mismatches
              entry_time: entry.check_in,
              exit_time: entry.check_out || undefined,
              // Ensure visitor_type matches the expected type
              visitor_type: (entry.visitor_type === 'new' || entry.visitor_type === 'existing') 
                ? entry.visitor_type 
                : 'existing',
              // Map status to match API's expected values
              status: (() => {
                switch(entry.status) {
                  case 'completed':
                    return 'checked_out' as const;
                  case 'cancelled':
                    return 'deleted' as const;
                  case 'active':
                  default:
                    return 'active' as const;
                }
              })(),
              // Ensure all IDs are numbers for the API type
              id: Number(entry.id),
              visitor_id: Number(entry.visitor_id),
              department_id: Number(entry.department_id),
              ...(entry.division_id && { division_id: Number(entry.division_id) })
            }))}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={loading}
            onCheckOut={handleCheckOut}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicRegistryWrapper;
