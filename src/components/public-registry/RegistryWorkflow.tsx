
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Scan, Ticket } from 'lucide-react';
import NewPublicEntryFlow from './NewPublicEntryFlow';
import ScanIDFlow from './ScanIDFlow';
import TokenGenerationFlow from './TokenGenerationFlow';

interface RegistryWorkflowProps {
  departments: any[];
  divisions: any[];
  onWorkflowComplete: (result: any) => void;
}

const RegistryWorkflow: React.FC<RegistryWorkflowProps> = ({
  departments,
  divisions,
  onWorkflowComplete
}) => {
  const [activeWorkflow, setActiveWorkflow] = useState<'new-entry' | 'scan-id' | 'token-gen'>('new-entry');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center text-blue-800">
          Public Visitor Registry
        </CardTitle>
        <p className="text-center text-gray-600">
          Modern reception desk management system
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeWorkflow} onValueChange={(value: any) => setActiveWorkflow(value)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="new-entry" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              New Public Entry
            </TabsTrigger>
            <TabsTrigger value="scan-id" className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              Scan ID
            </TabsTrigger>
            <TabsTrigger value="token-gen" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Token Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-entry">
            <NewPublicEntryFlow
              departments={departments}
              divisions={divisions}
              onComplete={onWorkflowComplete}
            />
          </TabsContent>

          <TabsContent value="scan-id">
            <ScanIDFlow
              departments={departments}
              divisions={divisions}
              onComplete={onWorkflowComplete}
            />
          </TabsContent>

          <TabsContent value="token-gen">
            <TokenGenerationFlow
              departments={departments}
              divisions={divisions}
              onComplete={onWorkflowComplete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RegistryWorkflow;
