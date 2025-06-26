
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StandardBlackWhiteIDCard } from '../id-card/StandardBlackWhiteIDCard';
import { apiService } from '@/services/apiService';
import { Printer, Download, ArrowRight } from 'lucide-react';

interface QRCodeIDCardGeneratorProps {
  user: any;
  onProceedToRegistry: () => void;
}

const QRCodeIDCardGenerator: React.FC<QRCodeIDCardGeneratorProps> = ({
  user,
  onProceedToRegistry
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Started",
      description: "ID card has been sent to printer",
    });
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      // Generate PDF download logic here
      toast({
        title: "Download Started",
        description: "ID card PDF is being generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Generated ID Card</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <StandardBlackWhiteIDCard
            user={user}
            onPrint={handlePrint}
            onDownload={handleDownload}
            showActions={true}
          />
          
          <div className="flex gap-4 mt-6">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print ID Card
            </Button>
            
            <Button onClick={handleDownload} disabled={isGenerating}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            
            <Button onClick={onProceedToRegistry} className="bg-blue-600 hover:bg-blue-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Proceed to Registry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeIDCardGenerator;
