
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, ExternalLink, Settings } from 'lucide-react';

const TokenDisplayLauncher: React.FC = () => {
  const openDisplayWindow = () => {
    const displayWindow = window.open(
      '/display', 
      'TokenDisplay',
      'width=1920,height=1080,fullscreen=yes,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,directories=no,status=no'
    );
    
    if (displayWindow) {
      displayWindow.focus();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Monitor className="h-6 w-6" />
            Token Display System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Launch the public token display system for LED TV screens. This display shows current tokens 
            for all departments and automatically refreshes every 10 seconds.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Display Features</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Large, TV-optimized interface</li>
                <li>• Real-time token updates</li>
                <li>• Department-wise organization</li>
                <li>• Auto-refresh every 10 seconds</li>
                <li>• Current serving tokens highlighted</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Setup Instructions</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Connect PC to LED TV via HDMI</li>
                <li>• Open display in full-screen mode</li>
                <li>• Position TV for public viewing</li>
                <li>• Keep browser window always on top</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={openDisplayWindow}
              className="flex items-center gap-2"
              size="lg"
            >
              <ExternalLink className="h-5 w-5" />
              Launch Token Display
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/display', '_blank')}
              className="flex items-center gap-2"
            >
              <Settings className="h-5 w-5" />
              Open in New Tab
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            <p><strong>Tip:</strong> For best results, use Chrome or Firefox browser in full-screen mode (F11) on the display computer.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenDisplayLauncher;
