
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Printer, RotateCcw, X } from 'lucide-react';

interface TokenSuccessModalProps {
  workflowResult: any;
  onNewEntry: () => void;
  onClose: () => void;
}

const TokenSuccessModal: React.FC<TokenSuccessModalProps> = ({
  workflowResult,
  onNewEntry,
  onClose
}) => {
  const { toast } = useToast();

  const printToken = () => {
    if (!workflowResult.tokenData) return;

    const tokenData = workflowResult.tokenData;
    const publicUser = workflowResult.publicUser;
    
    const printContent = `
      ================================
           DIVISIONAL SECRETARIAT
                KALMUNAI
      ================================
      
      TOKEN NUMBER: ${tokenData.token_number}
      
      Visitor: ${publicUser?.name || 'Walk-in Customer'}
      Queue Position: ${tokenData.queue_position}
      Estimated Wait: ${tokenData.estimated_wait_time} minutes
      
      Date & Time: ${new Date().toLocaleString()}
      
      Please wait for your number to
      be called.
      
      ================================
      Thank you for your patience
      ================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token ${tokenData.token_number}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                white-space: pre-line; 
                margin: 20px;
                text-align: center;
                font-size: 14px;
              }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "Token Printed",
      description: "Token has been sent to printer",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center relative">
          <button
            onClick={onClose}
            className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
          <CardTitle className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Success!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {workflowResult.tokenData ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-3xl font-bold text-green-800 mb-2">
                {workflowResult.tokenData.token_number}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Token Number</p>
              
              <div className="space-y-2 text-left">
                {workflowResult.publicUser && (
                  <p><strong>Visitor:</strong> {workflowResult.publicUser.name}</p>
                )}
                <p><strong>Queue Position:</strong> {workflowResult.tokenData.queue_position}</p>
                <p><strong>Estimated Wait:</strong> {workflowResult.tokenData.estimated_wait_time} minutes</p>
                <p><strong>Status:</strong> 
                  <Badge className="ml-2" variant="default">Active</Badge>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800">
                {workflowResult.type === 'new-entry' && 'New account created successfully!'}
                {workflowResult.type === 'scan-id' && 'Registry entry completed!'}
                {workflowResult.type === 'display-only' && 'Display system ready!'}
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            {workflowResult.tokenData && (
              <Button
                onClick={printToken}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Token
              </Button>
            )}
            <Button
              onClick={onNewEntry}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Entry
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenSuccessModal;
