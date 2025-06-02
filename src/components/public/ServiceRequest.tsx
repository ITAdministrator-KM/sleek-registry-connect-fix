
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Calendar, Clock, FileText, User } from 'lucide-react';

interface ServiceRequestProps {
  onServiceRequested: () => void;
}

const ServiceRequest: React.FC<ServiceRequestProps> = ({ onServiceRequested }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    department_id: '',
    division_id: '',
    service_name: '',
    description: '',
    preferred_date: '',
    preferred_time: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      fetchDivisions(parseInt(formData.department_id));
    }
  }, [formData.department_id]);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async (departmentId: number) => {
    try {
      const response = await apiService.getDivisions(departmentId);
      setDivisions(response);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department_id || !formData.division_id || !formData.service_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const publicUserId = localStorage.getItem('userId');
      
      // Create service request
      await apiService.addServiceHistory({
        public_user_id: publicUserId || '',
        department_id: parseInt(formData.department_id),
        division_id: parseInt(formData.division_id),
        service_name: formData.service_name,
        details: `${formData.description}\nPreferred Date: ${formData.preferred_date}\nPreferred Time: ${formData.preferred_time}`
      });

      // Generate token
      await apiService.createToken({
        department_id: parseInt(formData.department_id),
        division_id: parseInt(formData.division_id)
      });

      toast({
        title: "Service Requested Successfully",
        description: "Your service request has been submitted and a token has been generated.",
      });

      // Reset form
      setFormData({
        department_id: '',
        division_id: '',
        service_name: '',
        description: '',
        preferred_date: '',
        preferred_time: ''
      });

      onServiceRequested();
    } catch (error) {
      console.error('Error submitting service request:', error);
      toast({
        title: "Error",
        description: "Failed to submit service request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const serviceOptions = [
    'Birth Certificate',
    'Death Certificate',
    'Marriage Certificate',
    'NIC Application',
    'Police Certificate',
    'Character Certificate',
    'Income Certificate',
    'Residence Certificate',
    'Business Registration',
    'Land Certificate'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Request Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value, division_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="division">Division *</Label>
              <Select 
                value={formData.division_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}
                disabled={!formData.department_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.id.toString()}>
                      {div.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="service_name">Service Type *</Label>
            <Select 
              value={formData.service_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, service_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide additional details about your request"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferred_date">Preferred Date</Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="preferred_time">Preferred Time</Label>
              <Select 
                value={formData.preferred_time} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceRequest;
