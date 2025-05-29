
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Ticket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService } from '@/services/api';

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  department_id: number;
}

interface TokenGeneratorProps {
  onTokenGenerated: () => void;
}

const TokenGenerator = ({ onTokenGenerated }: TokenGeneratorProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const generateToken = async () => {
    if (!selectedDepartment || !selectedDivision) {
      toast({
        title: "Error",
        description: "Please select both department and division",
        variant: "destructive",
      });
      return;
    }

    try {
      const department = departments.find(d => d.name === selectedDepartment);
      const division = divisions.find(d => d.name === selectedDivision);

      if (!department || !division) {
        throw new Error("Invalid department or division selected");
      }

      const response = await apiService.createToken({
        department_id: department.id,
        division_id: division.id
      });

      if (!response || typeof response !== 'object') {
        throw new Error("Invalid response from server");
      }

      const { token_number, token_id } = response;
      
      if (!token_number || !token_id) {
        throw new Error("Token generation failed - missing token details");
      }

      toast({
        title: "Token Generated",
        description: `Token #${token_number} for ${selectedDivision}`,
      });

      onTokenGenerated();
      printTokenXP58(token_number, selectedDepartment, selectedDivision);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
      console.error('Error generating token:', error);
    }
  };

  // XP-58 thermal printer format (58mm width)
  const printTokenXP58 = (tokenNumber: number, department: string, division: string) => {
    const now = new Date();
    const tokenStr = tokenNumber.toString().padStart(3, '0');
    
    // XP-58 specific formatting - 32 characters per line at standard font
    const printContent = `
${centerText('DIVISIONAL SECRETARIAT', 32)}
${centerText('KALMUNAI', 32)}
${'='.repeat(32)}

${centerText('TOKEN NUMBER', 32)}
${centerText(tokenStr, 32)}

Division: ${division.length > 22 ? division.substring(0, 19) + '...' : division}
Date: ${now.toLocaleDateString()}
Time: ${now.toLocaleTimeString()}

${'='.repeat(32)}
${centerText('Please wait for your', 32)}
${centerText('number to be called', 32)}
${'='.repeat(32)}

${centerText('Thank you', 32)}
    `;

    // For actual thermal printer integration, you would send this to the printer driver
    // For now, we'll simulate by logging and creating a download
    console.log('XP-58 Thermal Print Content:', printContent);
    
    // Create downloadable receipt format
    createPrintableReceipt(printContent, tokenStr);
    
    toast({
      title: "Token Printed",
      description: "Token formatted for XP-58 thermal printer",
    });
  };

  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const createPrintableReceipt = (content: string, tokenNumber: string) => {
    // Create a printable HTML version that matches thermal printer output
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token ${tokenNumber}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                width: 58mm;
                background: white;
              }
              pre {
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              @media print {
                body { 
                  font-size: 10px;
                  width: 58mm;
                  margin: 0;
                  padding: 5px;
                }
              }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getFilteredDivisions = () => {
    if (!selectedDepartment) return [];
    const department = departments.find(d => d.name === selectedDepartment);
    if (!department) return [];
    return divisions.filter(d => d.department_id === department.id);
  };

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
        <CardTitle className="flex items-center text-purple-800">
          <Ticket className="mr-2" size={20} />
          Generate Token (XP-58 Format)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="border-gray-300 focus:border-purple-500">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Division</label>
            <Select 
              value={selectedDivision} 
              onValueChange={setSelectedDivision}
              disabled={!selectedDepartment}
            >
              <SelectTrigger className="border-gray-300 focus:border-purple-500">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredDivisions().map((division) => (
                  <SelectItem key={division.id} value={division.name}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={generateToken}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all duration-200"
              disabled={!selectedDepartment || !selectedDivision}
            >
              <Printer className="mr-2" size={16} />
              Generate & Print
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">XP-58 Thermal Printer Info:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Paper width: 58mm</li>
            <li>• Auto-cut after printing</li>
            <li>• Token numbers reset daily at midnight</li>
            <li>• Supports USB and Bluetooth connectivity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenGenerator;
