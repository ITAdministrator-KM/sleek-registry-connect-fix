
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, Ticket, Clock, Settings } from 'lucide-react';
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

      const { token_number } = response;
      
      if (!token_number) {
        throw new Error("Token generation failed - missing token number");
      }

      toast({
        title: "Token Generated ✅",
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

  const printTokenXP58 = (tokenNumber: number | string, department: string, division: string) => {
    const now = new Date();
    const tokenStr = tokenNumber.toString().padStart(3, '0');
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=300,height=300');
    
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Please allow popups for this site to print the token.",
        variant: "destructive",
      });
      return;
    }

    const content = `
      <!DOCTYPE html>
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
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 1mm;
            width: 56mm;
            background: white !important;
            color: black !important;
            text-align: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .header {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 2mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .logo {
            height: 15mm;
            max-width: 30%;
            object-fit: contain;
          }
          
          .header-text {
            flex-grow: 1;
            text-align: center;
          }
          
          .token-section {
            margin: 1.5mm 0;
            border: 1px solid black;
            padding: 1.5mm;
          }
          
          .token-number {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 1mm 0;
          }
          
          .division, .department {
            font-size: 9px;
            font-weight: bold;
            margin: 1mm 0;
            word-wrap: break-word;
          }
          
          .datetime {
            font-size: 9px;
            margin: 1mm 0;
            color: #222;
            font-weight: 500;
          }
          
          .footer {
            font-size: 9px;
            margin-top: 2mm;
            line-height: 1.2;
            color: #333;
            font-weight: 500;
          }
          
          .separator {
            border-top: 1px dashed #888;
            margin: 1mm 0;
          }
          
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body { 
              font-size: 9px;
              padding: 1mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
          <div class="header-text">
            <div>DS KALMUNAI</div>
            <div>TOKEN</div>
          </div>
        </div>
        
        <div class="separator"></div>
        
        <div class="token-section">
          <div class="token-number">${tokenStr}</div>
          <div class="department">${department}</div>
          <div class="division">${division}</div>
        </div>
        
        <div class="datetime">
          ${dateStr} ${timeStr}
        </div>
        
        <div class="separator"></div>
        
        <div class="footer">
          Thank you for visiting!<br>
          Please wait for your number to be called
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Close the window after printing
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 100);
              };
              
              // Fallback in case onafterprint doesn't work
              setTimeout(function() {
                if (!window.closed) {
                  window.close();
                }
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    try {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
      
      toast({
        title: "Printing...",
        description: "The token is being prepared for printing",
      });
      
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "An error occurred while preparing the print dialog",
        variant: "destructive",
      });
      
      // Close the window if it's still open
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
    }
  };

  const createXP58PrintableReceipt = (tokenNumber: string, division: string, date: string, time: string) => {
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
                font-size: 10px;
                line-height: 1.1;
                margin: 0;
                padding: 1mm;
                width: 56mm;
                background: white;
                color: black;
                text-align: center;
              }
              
              .header {
                font-weight: bold;
                font-size: 9px;
                margin-bottom: 2mm;
              }
              
              .token-section {
                margin: 2mm 0;
                border: 1px solid black;
                padding: 1mm;
              }
              
              .token-number {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 2px;
                margin: 1mm 0;
              }
              
              .division {
                font-size: 8px;
                font-weight: bold;
                margin: 1mm 0;
                word-wrap: break-word;
              }
              
              .datetime {
                font-size: 8px;
                margin: 0.5mm 0;
              }
              
              .footer {
                font-size: 7px;
                margin-top: 2mm;
                line-height: 1.2;
              }
              
              .separator {
                border-top: 1px dashed black;
                margin: 1mm 0;
              }
              
              @media print {
                body { 
                  font-size: 9px;
                  padding: 0.5mm;
                }
                .token-number {
                  font-size: 16px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              DIVISIONAL SECRETARIAT<br>
              KALMUNAI
            </div>
            
            <div class="separator"></div>
            
            <div class="token-section">
              <div style="font-size: 9px; font-weight: bold;">QUEUE TOKEN</div>
              <div class="token-number">NO: ${tokenNumber}</div>
            </div>
            
            <div class="division">${division.length > 25 ? division.substring(0, 22) + '...' : division}</div>
            
            <div class="datetime">${date} | ${time}</div>
            
            <div class="separator"></div>
            
            <div class="footer">
              Please wait for your<br>
              number to be called<br><br>
              Keep this token safe<br><br>
              DSK - Kalmunai
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 300);
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
          Token Generator - XP-58 Thermal Printer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="token-department-select" className="text-sm font-medium text-gray-700">Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="token-department-select" name="department" className="border-gray-300 focus:border-purple-500">
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
            <Label htmlFor="token-division-select" className="text-sm font-medium text-gray-700">Division</Label>
            <Select 
              value={selectedDivision} 
              onValueChange={setSelectedDivision}
              disabled={!selectedDepartment}
            >
              <SelectTrigger id="token-division-select" name="division" className="border-gray-300 focus:border-purple-500">
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
              XP-58 Printer Settings:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Paper: 58mm thermal paper</li>
              <li>• Format: Compact receipt (optimized)</li>
              <li>• Length: Single sheet (no overflow)</li>
              <li>• Print: Auto-cut after completion</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              Token Features:
            </h4>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Auto-reset: Daily at midnight</li>
              <li>• Contains: Division, date, time</li>
              <li>• Format: Professional receipt layout</li>
              <li>• Size: Standard thermal receipt</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenGenerator;
