
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

      if (!response.token_number || !response.token_id) {
        throw new Error("Invalid response from server");
      }

      toast({
        title: "Token Generated",
        description: `Token #${response.token_number} for ${selectedDivision}`,
      });

      onTokenGenerated();
      printToken(response.token_number, selectedDepartment, selectedDivision);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
      console.error('Error generating token:', error);
    }
  };

  const printToken = (tokenNumber: number, department: string, division: string) => {
    const printContent = `
      ================================
           DIVISIONAL SECRETARIAT
                KALMUNAI
      ================================
      
      TOKEN NUMBER: ${tokenNumber.toString().padStart(3, '0')}
      
      Department: ${department}
      Division: ${division}
      
      Date & Time: ${new Date().toLocaleString()}
      
      Please wait for your number to
      be called.
      
      ================================
      Thank you for your patience
      ================================
    `;

    console.log('Printing token:', printContent);
    
    toast({
      title: "Token Printed",
      description: "Token sent to thermal printer",
    });
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
          Generate New Token
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
      </CardContent>
    </Card>
  );
};

export default TokenGenerator;
