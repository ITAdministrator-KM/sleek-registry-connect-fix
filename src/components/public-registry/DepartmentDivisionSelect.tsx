import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface DepartmentDivisionSelectProps {
  departmentField: string;
  divisionField: string;
  label?: string;
  className?: string;
  required?: boolean;
}

export const DepartmentDivisionSelect: React.FC<DepartmentDivisionSelectProps> = ({
  departmentField,
  divisionField,
  label = 'Department & Division',
  className = '',
  required = false,
}) => {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState({
    departments: true,
    divisions: false,
  });

  const selectedDepartmentId = watch(departmentField);
  const selectedDivisionId = watch(divisionField);

  // Load departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await apiService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, departments: false }));
      }
    };

    fetchDepartments();
  }, []);

  // Load divisions when department changes
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!selectedDepartmentId) {
        setDivisions([]);
        setValue(divisionField, '');
        return;
      }

      setIsLoading(prev => ({ ...prev, divisions: true }));
      
      try {
        const data = await apiService.getDivisions(parseInt(selectedDepartmentId, 10));
        setDivisions(data);
        
        // Reset division if it's not in the new list
        if (selectedDivisionId && !data.some(d => d.id === parseInt(selectedDivisionId, 10))) {
          setValue(divisionField, '');
        }
      } catch (error) {
        console.error('Error loading divisions:', error);
        setDivisions([]);
      } finally {
        setIsLoading(prev => ({ ...prev, divisions: false }));
      }
    };

    fetchDivisions();
  }, [selectedDepartmentId, divisionField, selectedDivisionId, setValue]);

  const departmentError = errors[departmentField]?.message as string | undefined;
  const divisionError = errors[divisionField]?.message as string | undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center">
          <Label>{label}</Label>
          {required && <span className="ml-1 text-red-500">*</span>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Select */}
        <div className="space-y-1">
          <Select
            value={selectedDepartmentId || ''}
            onValueChange={(value) => {
              setValue(departmentField, value);
              setValue(divisionField, ''); // Reset division when department changes
            }}
            disabled={isLoading.departments}
          >
            <SelectTrigger className={departmentError ? 'border-red-500' : ''}>
              <SelectValue placeholder={
                isLoading.departments ? 'Loading departments...' : 'Select department'
              } />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {departmentError && (
            <p className="text-sm text-red-500">{departmentError}</p>
          )}
        </div>

        {/* Division Select */}
        <div className="space-y-1">
          <Select
            value={selectedDivisionId || ''}
            onValueChange={(value) => setValue(divisionField, value)}
            disabled={!selectedDepartmentId || isLoading.divisions || divisions.length === 0}
          >
            <SelectTrigger className={divisionError ? 'border-red-500' : ''}>
              <SelectValue 
                placeholder={
                  !selectedDepartmentId 
                    ? 'Select department first' 
                    : isLoading.divisions 
                      ? 'Loading divisions...' 
                      : divisions.length === 0
                        ? 'No divisions available'
                        : 'Select division (optional)'
                } 
              />
            </SelectTrigger>
            {divisions.length > 0 && (
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {divisions.map((div) => (
                  <SelectItem key={div.id} value={div.id.toString()}>
                    {div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
          {divisionError && (
            <p className="text-sm text-red-500">{divisionError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
