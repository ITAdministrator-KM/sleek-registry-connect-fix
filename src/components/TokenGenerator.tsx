
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Ticket, Clock, MapPin } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
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
      setIsGenerating(true);
      
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
      console.error('Error generating token:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate token",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Enhanced XP-58 thermal printer format (58mm width) with better formatting
  const printTokenXP58 = (tokenNumber: number, department: string, division: string) => {
    const now = new Date();
    const tokenStr = tokenNumber.toString().padStart(3, '0');
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // XP-58 optimized formatting - 32 characters per line at standard font
    const printContent = `
${centerText('═══════════════════════════════', 32)}
${centerText('DIVISIONAL SECRETARIAT', 32)}
${centerText('KALMUNAI', 32)}
${centerText('═══════════════════════════════', 32)}

${centerText('QUEUE TOKEN', 32)}

${centerText('█ █ █ █ █ █ █ █ █ █ █', 32)}
${centerText(`TOKEN NO: ${tokenStr}`, 32)}
${centerText('█ █ █ █ █ █ █ █ █ █ █', 32)}

Division: ${division.length > 22 ? division.substring(0, 19) + '...' : division}
Department: ${department.length > 20 ? department.substring(0, 17) + '...' : department}

Date: ${dateStr}
Time: ${timeStr}

${centerText('─────────────────────────────', 32)}
${centerText('Please wait for your', 32)}
${centerText('number to be called', 32)}
${centerText('Keep this token safe', 32)}
${centerText('─────────────────────────────', 32)}

${centerText('Thank you for visiting', 32)}
${centerText('DSK - Kalmunai', 32)}

${centerText('═══════════════════════════════', 32)}
    `;

    // Create optimized printable receipt for XP-58
    createXP58PrintableReceipt(printContent, tokenStr, division, dateStr, timeStr);
    
    toast({
      title: "Token Ready for Print",
      description: "Token formatted for XP-58 thermal printer (58mm)",
    });
  };

  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const createXP58PrintableReceipt = (content: string, tokenNumber: string, division: string, date: string, time: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token ${tokenNumber} - ${division}</title>
            <style>
              @page {
                size: 58mm auto;
                margin: 0;
              }
              
              body {
                font-family: 'Courier New', monospace;
                font-size: 11px;
                line-height: 1.1;
                margin: 0;
                padding: 2mm;
                width: 54mm;
                background: white;
                color: black;
                text-align: left;
              }
              
              .receipt-container {
                width: 100%;
                max-width: 54mm;
              }
              
              .center {
                text-align: center;
              }
              
              .token-number {
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                margin: 2mm 0;
                letter-spacing: 2px;
              }
              
              .division-name {
                font-size: 10px;
                font-weight: bold;
                margin: 1mm 0;
              }
              
              .datetime {
                font-size: 9px;
                margin: 0.5mm 0;
              }
              
              .separator {
                text-align: center;
                margin: 1mm 0;
                font-size: 10px;
              }
              
              .footer {
                text-align: center;
                font-size: 9px;
                margin-top: 2mm;
              }
              
              pre {
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: inherit;
                font-size: inherit;
              }
              
              @media print {
                body { 
                  font-size: 10px;
                  padding: 1mm;
                }
                .token-number {
                  font-size: 14px;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="separator">═══════════════════════════════</div>
              <div class="center" style="font-weight: bold;">DIVISIONAL SECRETARIAT</div>
              <div class="center" style="font-weight: bold;">KALMUNAI</div>
              <div class="separator">═══════════════════════════════</div>
              
              <div class="center" style="margin: 3mm 0; font-weight: bold;">QUEUE TOKEN</div>
              
              <div class="center">█ █ █ █ █ █ █ █ █ █ █</div>
              <div class="token-number">TOKEN NO: ${tokenNumber}</div>
              <div class="center">█ █ █ █ █ █ █ █ █ █ █</div>
              
              <div class="division-name">Division: ${division}</div>
              <div class="datetime">Date: ${date}</div>
              <div class="datetime">Time: ${time}</div>
              
              <div class="separator">─────────────────────────────</div>
              <div class="center">Please wait for your</div>
              <div class="center">number to be called</div>
              <div class="center">Keep this token safe</div>
              <div class="separator">─────────────────────────────</div>
              
              <div class="footer">Thank you for visiting</div>
              <div class="footer" style="font-weight: bold;">DSK - Kalmunai</div>
              
              <div class="separator">═══════════════════════════════</div>
            </div>
            
            <script>
              window.onload = function() {
                // Auto print after 500ms delay
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
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
          Token Generator (XP-58 Thermal Printer)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label htmlFor="department-select" className="text-sm font-medium text-gray-700">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="department-select" className="border-gray-300 focus:border-purple-500">
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
            <label htmlFor="division-select" className="text-sm font-medium text-gray-700">Division</label>
            <Select 
              value={selectedDivision} 
              onValueChange={setSelectedDivision}
              disabled={!selectedDepartment}
            >
              <SelectTrigger id="division-select" className="border-gray-300 focus:border-purple-500">
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
              disabled={!selectedDepartment || !selectedDivision || isGenerating}
            >
              <Printer className="mr-2" size={16} />
              {isGenerating ? 'Generating...' : 'Generate & Print'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Printer className="mr-1 h-4 w-4" />
              XP-58 Printer Info:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Paper width: 58mm thermal paper</li>
              <li>• Auto-cut after printing</li>
              <li>• High contrast black/white output</li>
              <li>• USB and Bluetooth connectivity</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              Token Features:
            </h4>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Auto-reset daily at midnight</li>
              <li>• Department and division details</li>
              <li>• Date and time stamp</li>
              <li>• Professional thermal receipt format</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenGenerator;
